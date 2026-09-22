#include "Config.h"

#include <cstdlib>
#include <stdexcept>

namespace merchantra {

namespace {
std::string envOr(const char *key, const std::string &fallback) {
    const char *value = std::getenv(key);
    return value ? std::string(value) : fallback;
}

int envOrInt(const char *key, int fallback) {
    const char *value = std::getenv(key);
    return value ? std::atoi(value) : fallback;
}
}  // namespace

Config Config::instance_;
bool Config::initialized_ = false;

void Config::set(const Config &config) {
    instance_ = config;
    initialized_ = true;
}

const Config &Config::instance() {
    if (!initialized_) {
        throw std::runtime_error("Config::instance() called before Config::set() — "
                                  "call Config::set(Config::loadFromEnv()) in main.cpp first");
    }
    return instance_;
}

Config Config::loadFromEnv() {
    Config config;

    config.serverHost = envOr("SERVER_HOST", config.serverHost);
    config.serverPort = envOrInt("SERVER_PORT", config.serverPort);

    config.dbHost = envOr("DB_HOST", config.dbHost);
    config.dbPort = envOrInt("DB_PORT", config.dbPort);
    config.dbName = envOr("DB_NAME", config.dbName);
    config.dbUser = envOr("DB_USER", config.dbUser);
    config.dbPassword = envOr("DB_PASSWORD", config.dbPassword);

    config.jwtSecret = envOr("JWT_SECRET", config.jwtSecret);
    config.jwtExpiryMinutes = envOrInt("JWT_EXPIRY_MINUTES", config.jwtExpiryMinutes);

    config.aiServiceBaseUrl = envOr("AI_SERVICE_BASE_URL", config.aiServiceBaseUrl);

    return config;
}

}  // namespace merchantra