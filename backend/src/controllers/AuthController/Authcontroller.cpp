#include "AuthController.h"

#include "../../auth/AuthUtils.h"
#include "../../database/Database.h"

#include <cstdlib>
#include <stdexcept>
#include <string>

namespace merchantra {

// ============================================================
// REGISTER
// ============================================================

void AuthController::registerUser(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback) {

    try {
        auto json = req->getJsonObject();

        if (!json) {
            Json::Value response;
            response["message"] = "Invalid JSON body";

            auto resp =
                drogon::HttpResponse::newHttpJsonResponse(response);
            resp->setStatusCode(drogon::k400BadRequest);
            callback(resp);
            return;
        }

        std::string name = (*json)["name"].asString();
        std::string email = (*json)["email"].asString();
        std::string password = (*json)["password"].asString();
        std::string role = (*json)["role"].asString();

        if (name.empty() ||
            email.empty() ||
            password.empty() ||
            role.empty()) {

            Json::Value response;
            response["message"] =
                "Name, email, password and role are required";

            auto resp =
                drogon::HttpResponse::newHttpJsonResponse(response);
            resp->setStatusCode(drogon::k400BadRequest);
            callback(resp);
            return;
        }

        // Hash password
        std::string passwordHash =
            AuthUtils::hashPassword(password);

        auto conn = Database::getConnection();
        pqxx::work txn(*conn);

        // --------------------------------------------------------
        // Find role ID
        // --------------------------------------------------------

        auto roleResult = txn.exec_params(
            "SELECT id FROM roles "
            "WHERE UPPER(name) = UPPER($1)",
            role);

        if (roleResult.empty()) {

            Json::Value response;
            response["message"] = "Invalid role";

            auto resp =
                drogon::HttpResponse::newHttpJsonResponse(response);
            resp->setStatusCode(drogon::k400BadRequest);

            txn.abort();
            callback(resp);
            return;
        }

        int roleId =
            roleResult[0]["id"].as<int>();

        // --------------------------------------------------------
        // Check if email already exists
        // --------------------------------------------------------

        auto existingUser = txn.exec_params(
            "SELECT id FROM users WHERE email = $1",
            email);

        if (!existingUser.empty()) {

            Json::Value response;
            response["message"] =
                "User with this email already exists";

            auto resp =
                drogon::HttpResponse::newHttpJsonResponse(response);
            resp->setStatusCode(drogon::k409Conflict);

            txn.abort();
            callback(resp);
            return;
        }

        // --------------------------------------------------------
        // Insert user
        // --------------------------------------------------------

        auto result = txn.exec_params(
            "INSERT INTO users "
            "(name, email, password_hash, role_id) "
            "VALUES ($1, $2, $3, $4) "
            "RETURNING id",
            name,
            email,
            passwordHash,
            roleId);

        int userId =
            result[0]["id"].as<int>();

        txn.commit();

        Json::Value response;
        response["message"] =
            "User registered successfully";
        response["user_id"] = userId;
        response["role_id"] = roleId;
        response["role"] = role;

        auto resp =
            drogon::HttpResponse::newHttpJsonResponse(response);

        resp->setStatusCode(drogon::k201Created);

        callback(resp);

    } catch (const std::exception &e) {

        Json::Value response;
        response["message"] =
            std::string("Registration failed: ") + e.what();

        auto resp =
            drogon::HttpResponse::newHttpJsonResponse(response);

        resp->setStatusCode(
            drogon::k500InternalServerError);

        callback(resp);
    }
}


// ============================================================
// LOGIN
// ============================================================

void AuthController::login(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback) {

    try {
        auto json = req->getJsonObject();

        if (!json) {
            Json::Value response;
            response["message"] = "Invalid JSON body";

            auto resp =
                drogon::HttpResponse::newHttpJsonResponse(response);

            resp->setStatusCode(
                drogon::k400BadRequest);

            callback(resp);
            return;
        }

        std::string email =
            (*json)["email"].asString();

        std::string password =
            (*json)["password"].asString();

        if (email.empty() || password.empty()) {

            Json::Value response;
            response["message"] =
                "Email and password are required";

            auto resp =
                drogon::HttpResponse::newHttpJsonResponse(response);

            resp->setStatusCode(
                drogon::k400BadRequest);

            callback(resp);
            return;
        }

        auto conn = Database::getConnection();
        pqxx::work txn(*conn);

        // --------------------------------------------------------
        // Find user + role
        // --------------------------------------------------------

        auto result = txn.exec_params(
            "SELECT "
            "u.id, "
            "u.name, "
            "u.email, "
            "u.password_hash, "
            "u.is_active, "
            "r.name AS role "
            "FROM users u "
            "JOIN roles r ON r.id = u.role_id "
            "WHERE u.email = $1",
            email);

        txn.commit();

        if (result.empty()) {

            Json::Value response;
            response["message"] =
                "Invalid email or password";

            auto resp =
                drogon::HttpResponse::newHttpJsonResponse(response);

            resp->setStatusCode(
                drogon::k401Unauthorized);

            callback(resp);
            return;
        }

        auto row = result[0];

        int userId =
            row["id"].as<int>();

        std::string name =
            row["name"].as<std::string>();

        std::string userEmail =
            row["email"].as<std::string>();

        std::string passwordHash =
            row["password_hash"].as<std::string>();

        bool isActive =
            row["is_active"].as<bool>();

        std::string role =
            row["role"].as<std::string>();

        // --------------------------------------------------------
        // Check active status
        // --------------------------------------------------------

        if (!isActive) {

            Json::Value response;
            response["message"] =
                "User account is inactive";

            auto resp =
                drogon::HttpResponse::newHttpJsonResponse(response);

            resp->setStatusCode(
                drogon::k403Forbidden);

            callback(resp);
            return;
        }

        // --------------------------------------------------------
        // Verify password
        // --------------------------------------------------------

        if (!AuthUtils::verifyPassword(
                password,
                passwordHash)) {

            Json::Value response;
            response["message"] =
                "Invalid email or password";

            auto resp =
                drogon::HttpResponse::newHttpJsonResponse(response);

            resp->setStatusCode(
                drogon::k401Unauthorized);

            callback(resp);
            return;
        }

        // --------------------------------------------------------
        // JWT secret
        // --------------------------------------------------------

        const char *secretEnv =
            std::getenv("JWT_SECRET");

        if (!secretEnv ||
            std::string(secretEnv).empty()) {

            throw std::runtime_error(
                "JWT_SECRET is not configured");
        }

        std::string jwtSecret =
            secretEnv;

        // --------------------------------------------------------
        // Generate JWT
        // --------------------------------------------------------

        std::string token =
            AuthUtils::issueToken(
                userId,
                role,
                jwtSecret,
                60);

        // --------------------------------------------------------
        // Response
        // --------------------------------------------------------

        Json::Value user;

        user["id"] = userId;
        user["name"] = name;
        user["email"] = userEmail;
        user["role"] = role;

        Json::Value response;

        response["message"] =
            "Login successful";

        response["token"] =
            token;

        response["user"] =
            user;

        auto resp =
            drogon::HttpResponse::newHttpJsonResponse(response);

        callback(resp);

    } catch (const std::exception &e) {

        Json::Value response;
        response["message"] =
            std::string("Login failed: ") + e.what();

        auto resp =
            drogon::HttpResponse::newHttpJsonResponse(response);

        resp->setStatusCode(
            drogon::k500InternalServerError);

        callback(resp);
    }
}


// ============================================================
// ME
// ============================================================

void AuthController::me(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback) {

    try {

        // IMPORTANT:
        // AuthFilter stores user_id in request ATTRIBUTES.
        // Therefore we must NOT use getParameter().
        int userId =
            req->getAttributes()->get<int>("user_id");

        auto conn =
            Database::getConnection();

        pqxx::work txn(*conn);

        // --------------------------------------------------------
        // Get current user
        // --------------------------------------------------------

        auto result = txn.exec_params(
            "SELECT "
            "u.id, "
            "u.name, "
            "u.email, "
            "r.name AS role "
            "FROM users u "
            "JOIN roles r ON r.id = u.role_id "
            "WHERE u.id = $1 "
            "AND u.is_active = TRUE",
            userId);

        txn.commit();

        if (result.empty()) {

            Json::Value response;
            response["message"] =
                "User information not available";

            auto resp =
                drogon::HttpResponse::newHttpJsonResponse(response);

            resp->setStatusCode(
                drogon::k404NotFound);

            callback(resp);
            return;
        }

        auto row =
            result[0];

        Json::Value user;

        user["id"] =
            row["id"].as<int>();

        user["name"] =
            row["name"].as<std::string>();

        user["email"] =
            row["email"].as<std::string>();

        user["role"] =
            row["role"].as<std::string>();

        Json::Value response;

        response["user"] =
            user;

        auto resp =
            drogon::HttpResponse::newHttpJsonResponse(response);

        callback(resp);

    } catch (const std::exception &e) {

        Json::Value response;

        response["message"] =
            std::string(
                "Failed to get user information: ") +
            e.what();

        auto resp =
            drogon::HttpResponse::newHttpJsonResponse(response);

        resp->setStatusCode(
            drogon::k500InternalServerError);

        callback(resp);
    }
}

} // namespace merchantra