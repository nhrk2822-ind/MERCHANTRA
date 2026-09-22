// Pure format validation for Permanent Product IDs — deliberately
// separate from ProductIdService.h, which pulls in <pqxx/pqxx> for
// generateNextId(). Keeping this pqxx-free means format validation
// can be unit tested (see tests/backend/) without linking Postgres at
// all, and any future caller that only needs to validate a string
// doesn't need to drag in the DB library.

#pragma once

#include <regex>
#include <string>

namespace merchantra {

struct ProductIdFormat {
    // Returns true if the given string matches the MCH-P-NNNNNN format
    // (does NOT check whether it exists in the database).
    static bool isValidFormat(const std::string &permanentProductId) {
        static const std::regex pattern(R"(^MCH-P-\d{6}$)");
        return std::regex_match(permanentProductId, pattern);
    }
};

}  // namespace merchantra