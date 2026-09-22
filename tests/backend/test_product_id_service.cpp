// Minimal standalone test — no test framework, no DB connection, and
// (deliberately) no pqxx dependency at all. ProductIdFormat.h was
// extracted specifically so this could be true — see its header
// comment. generateNextId() needs a live DB transaction and isn't
// covered here — that belongs in an integration test once the stack
// is actually running (see docs/db-schema.md for setup).
//
// Build standalone:
//   g++ -std=c++17 tests/backend/test_product_id_service.cpp -o test_product_id
//   ./test_product_id

#include <cassert>
#include <iostream>

#include "../../backend/src/services/ProductIdService/ProductIdFormat.h"

using merchantra::ProductIdFormat;

int main() {
    int passed = 0;
    int failed = 0;

    auto check = [&](bool condition, const std::string &description) {
        if (condition) {
            std::cout << "  PASS: " << description << "\n";
            passed++;
        } else {
            std::cout << "  FAIL: " << description << "\n";
            failed++;
        }
    };

    std::cout << "ProductIdFormat::isValidFormat\n";
    check(ProductIdFormat::isValidFormat("MCH-P-000125"), "accepts a well-formed ID");
    check(ProductIdFormat::isValidFormat("MCH-P-000000"), "accepts all-zero suffix");
    check(!ProductIdFormat::isValidFormat("MCH-P-12"), "rejects short suffix");
    check(!ProductIdFormat::isValidFormat("MCH-P-0001255"), "rejects long suffix");
    check(!ProductIdFormat::isValidFormat("mch-p-000125"), "rejects lowercase prefix");
    check(!ProductIdFormat::isValidFormat("MCH-Q-000125"), "rejects wrong letter");
    check(!ProductIdFormat::isValidFormat(""), "rejects empty string");
    check(!ProductIdFormat::isValidFormat("MCH-P-00012A"), "rejects non-digit in suffix");

    std::cout << "\n" << passed << " passed, " << failed << " failed\n";
    return failed == 0 ? 0 : 1;
}