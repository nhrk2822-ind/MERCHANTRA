#include "Database.h"

#include <stdexcept>

namespace merchantra {

std::string Database::connectionString_;

std::string Database::buildConnectionString(const Config &config) {
    return "host=" + config.dbHost +
           " port=" + std::to_string(config.dbPort) +
           " dbname=" + config.dbName +
           " user=" + config.dbUser +
           " password=" + config.dbPassword;
}

void Database::init(const Config &config) {
    connectionString_ = buildConnectionString(config);

    // Fail fast: if we can't reach Postgres at startup, better to crash
    // here with a clear error than to fail later on the first request.
    try {
        pqxx::connection testConn(connectionString_);
        if (!testConn.is_open()) {
            throw std::runtime_error("Failed to open PostgreSQL connection");
        }
    } catch (const std::exception &e) {
        throw std::runtime_error(std::string("Database::init failed: ") + e.what());
    }
}

std::shared_ptr<pqxx::connection> Database::getConnection() {
    if (connectionString_.empty()) {
        throw std::runtime_error("Database::init must be called before getConnection");
    }
    // NOTE: this opens a fresh connection per call for now. Swap this for
    // a real pool (e.g. a small free-list of pqxx::connection) once
    // request volume in Phase 1 testing shows it's needed.
    return std::make_shared<pqxx::connection>(connectionString_);
}

}  // namespace merchantra