#include "Authcontroller.h"

#include "../../database/Database.h"
#include "../../auth/AuthUtils.h"

#include <pqxx/pqxx>

namespace merchantra {

void AuthController::registerUser(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback)
{
    try {

        auto json = req->getJsonObject();

        if (!json) {
            Json::Value error;
            error["message"] = "Invalid JSON request";

            auto resp =
                drogon::HttpResponse::newHttpJsonResponse(error);

            resp->setStatusCode(
                drogon::k400BadRequest
            );

            callback(resp);
            return;
        }

        if (!json->isMember("name") ||
            !json->isMember("email") ||
            !json->isMember("password")) {

            Json::Value error;
            error["message"] =
                "name, email and password are required";

            auto resp =
                drogon::HttpResponse::newHttpJsonResponse(error);

            resp->setStatusCode(
                drogon::k400BadRequest
            );

            callback(resp);
            return;
        }

        std::string name =
            (*json)["name"].asString();

        std::string email =
            (*json)["email"].asString();

        std::string password =
            (*json)["password"].asString();

        auto conn = Database::getConnection();

        pqxx::work txn(*conn);

        auto existing = txn.exec_params(
            "SELECT id FROM users WHERE email = $1",
            email
        );

        if (!existing.empty()) {

            Json::Value error;
            error["message"] =
                "User with this email already exists";

            auto resp =
                drogon::HttpResponse::newHttpJsonResponse(error);

            resp->setStatusCode(
                drogon::k409Conflict
            );

            callback(resp);
            return;
        }

        /*
         * NOTE:
         * This assumes AuthUtils has a function named hashPassword().
         * If your AuthUtils uses a different function name,
         * we will adjust it after seeing AuthUtils.h.
         */

        std::string passwordHash =
            AuthUtils::hashPassword(password);

        auto result = txn.exec_params(
            "INSERT INTO users "
            "(name, email, password_hash) "
            "VALUES ($1, $2, $3) "
            "RETURNING id",
            name,
            email,
            passwordHash
        );

        txn.commit();

        Json::Value response;

        response["message"] =
            "User registered successfully";

        if (!result.empty()) {
            response["user_id"] =
                result[0]["id"].as<int>();
        }

        auto resp =
            drogon::HttpResponse::newHttpJsonResponse(response);

        resp->setStatusCode(
            drogon::k201Created
        );

        callback(resp);

    }
    catch (const std::exception &e) {

        Json::Value error;

        error["message"] = e.what();

        auto resp =
            drogon::HttpResponse::newHttpJsonResponse(error);

        resp->setStatusCode(
            drogon::k500InternalServerError
        );

        callback(resp);
    }
}


void AuthController::login(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback)
{
    try {

        auto json = req->getJsonObject();

        if (!json) {

            Json::Value error;
            error["message"] =
                "Invalid JSON request";

            auto resp =
                drogon::HttpResponse::newHttpJsonResponse(error);

            resp->setStatusCode(
                drogon::k400BadRequest
            );

            callback(resp);
            return;
        }

        if (!json->isMember("email") ||
            !json->isMember("password")) {

            Json::Value error;

            error["message"] =
                "email and password are required";

            auto resp =
                drogon::HttpResponse::newHttpJsonResponse(error);

            resp->setStatusCode(
                drogon::k400BadRequest
            );

            callback(resp);
            return;
        }

        std::string email =
            (*json)["email"].asString();

        std::string password =
            (*json)["password"].asString();

        auto conn =
            Database::getConnection();

        pqxx::work txn(*conn);

        auto result = txn.exec_params(
            "SELECT id, name, email, password_hash "
            "FROM users "
            "WHERE email = $1",
            email
        );

        if (result.empty()) {

            Json::Value error;

            error["message"] =
                "Invalid email or password";

            auto resp =
                drogon::HttpResponse::newHttpJsonResponse(error);

            resp->setStatusCode(
                drogon::k401Unauthorized
            );

            callback(resp);
            return;
        }

        auto row = result[0];

        std::string storedHash =
            row["password_hash"].as<std::string>();

        /*
         * NOTE:
         * This assumes AuthUtils has verifyPassword().
         */

        bool valid =
            AuthUtils::verifyPassword(
                password,
                storedHash
            );

        if (!valid) {

            Json::Value error;

            error["message"] =
                "Invalid email or password";

            auto resp =
                drogon::HttpResponse::newHttpJsonResponse(error);

            resp->setStatusCode(
                drogon::k401Unauthorized
            );

            callback(resp);
            return;
        }

        txn.commit();

        Json::Value response;

        response["message"] =
            "Login successful";

        response["user"]["id"] =
            row["id"].as<int>();

        response["user"]["name"] =
            row["name"].as<std::string>();

        response["user"]["email"] =
            row["email"].as<std::string>();

        /*
         * JWT generation depends on your existing
         * AuthUtils implementation.
         *
         * For now this endpoint returns the authenticated
         * user information without inventing a JWT API.
         */

        auto resp =
            drogon::HttpResponse::newHttpJsonResponse(response);

        callback(resp);

    }
    catch (const std::exception &e) {

        Json::Value error;

        error["message"] = e.what();

        auto resp =
            drogon::HttpResponse::newHttpJsonResponse(error);

        resp->setStatusCode(
            drogon::k500InternalServerError
        );

        callback(resp);
    }
}


void AuthController::me(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback)
{
    try {

        /*
         * AuthFilter is expected to validate the JWT
         * before this controller is called.
         *
         * The exact attribute/key used by your AuthFilter
         * must match your existing implementation.
         */

        auto userId = req->getParameter("user_id");

        if (userId.empty()) {

            Json::Value error;

            error["message"] =
                "User information not available";

            auto resp =
                drogon::HttpResponse::newHttpJsonResponse(error);

            resp->setStatusCode(
                drogon::k401Unauthorized
            );

            callback(resp);
            return;
        }

        auto conn =
            Database::getConnection();

        pqxx::work txn(*conn);

        auto result = txn.exec_params(
            "SELECT id, name, email "
            "FROM users "
            "WHERE id = $1",
            userId
        );

        txn.commit();

        if (result.empty()) {

            Json::Value error;

            error["message"] =
                "User not found";

            auto resp =
                drogon::HttpResponse::newHttpJsonResponse(error);

            resp->setStatusCode(
                drogon::k404NotFound
            );

            callback(resp);
            return;
        }

        auto row = result[0];

        Json::Value response;

        response["id"] =
            row["id"].as<int>();

        response["name"] =
            row["name"].as<std::string>();

        response["email"] =
            row["email"].as<std::string>();

        auto resp =
            drogon::HttpResponse::newHttpJsonResponse(response);

        callback(resp);

    }
    catch (const std::exception &e) {

        Json::Value error;

        error["message"] = e.what();

        auto resp =
            drogon::HttpResponse::newHttpJsonResponse(error);

        resp->setStatusCode(
            drogon::k500InternalServerError
        );

        callback(resp);
    }
}

} // namespace merchantra