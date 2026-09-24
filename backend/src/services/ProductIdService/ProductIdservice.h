// Generates and validates Permanent Product IDs (format: MCH-P-000125).
//
// This is the ONLY place in the codebase that should construct a
// permanent_product_id string. ProductController calls this instead of
// formatting the ID itself, so the format can change in one place if
// it ever needs to.
//
// Format validation itself lives in ProductIdFormat.h (pqxx-free, so
// it's unit-testable without linking Postgres) — isValidFormat here
// just delegates to it, for backward-compatible call sites that
// already say ProductIdService::isValidFormat(...).

#pragma once

#include <pqxx/pqxx>
#include <string>

#include "ProductIdFormat.h"

namespace merchantra {

struct ProductIdService {
    // Generates the next unused Permanent Product ID.
    // Takes the CALLER's transaction so the "find max suffix" row lock
    // and the caller's INSERT happen atomically in one transaction —
    // this must NOT open or commit its own transaction, or the lock
    // protecting against duplicate IDs is released too early.
    static std::string generateNextId(pqxx::work &txn);

    // Delegates to ProductIdFormat::isValidFormat — kept here so
    // existing callers of ProductIdService::isValidFormat don't need
    // to change.
    static bool isValidFormat(const std::string &permanentProductId) {
        return ProductIdFormat::isValidFormat(permanentProductId);
    }
};

}  // namespace merchantra