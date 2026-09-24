// Central config for the MERCHANTRA backend.
//
// Values come from environment variables (see .env.example at repo root
// once added). Nothing here should be hardcoded in controllers/services —
// they should all read from a Config instance instead.

#pragma once

#include <string>

namespace merchantra {

struct Config {
    // Server
    std::string serverHost = "0.0.0.0";
    int serverPort = 8080;

    // PostgreSQL
    std::string dbHost = "localhost";
    int dbPort = 5432;
    std::string dbName = "merchantra";
    std::string dbUser = "merchantra";
    std::string dbPassword;

    // Auth
    std::string jwtSecret;
    int jwtExpiryMinutes = 60;

    // AI service (Person 2's FastAPI service — never called from the
    // frontend directly, only from AIClientService in this backend)
    std::string aiServiceBaseUrl = "http://localhost:9000";

    // Loads values from environment variables, falling back to the
    // defaults above when a variable isn't set. Call once at startup,
    // then pass the result to Config::set() so the rest of the app
    // reads via Config::instance() instead of reloading env vars.
    static Config loadFromEnv();

    // App-level singleton access. main.cpp calls set() once right after
    // loadFromEnv(); everything else (AuthFilter, AuthController, ...)
    // calls instance() instead of loadFromEnv() to avoid re-reading
    // environment variables on every single request.
    static void set(const Config &config);
    static const Config &instance();

private:
    static Config instance_;
    static bool initialized_;
};

}  // namespace merchantra