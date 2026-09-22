// PostgreSQL connection access for the MERCHANTRA backend.
//
// Every service (ProductService, InventoryService, etc.) gets its DB
// connection through this â€” nobody opens a raw pqxx::connection
// themselves. This keeps connection pooling and config in one place.

#pragma once

#include <memory>
#include <pqxx/pqxx>

#include "../config/Config.h"

namespace merchantra {

class Database {
public:
    // Initializes the connection pool from config. Call once at startup,
    // right after Config::loadFromEnv().
    static void init(const Config &config);

    // Returns a connection from the pool. Caller uses it for one
    // request/transaction and lets it go out of scope when done.
    static std::shared_ptr<pqxx::connection> getConnection();

private:
    static std::string buildConnectionString(const Config &config);
    static std::string connectionString_;
};

}  // namespace merchantra