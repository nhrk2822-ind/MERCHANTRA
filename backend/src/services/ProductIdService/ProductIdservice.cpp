#include "ProductIdService.h"

#include <iomanip>
#include <sstream>

namespace merchantra {

namespace {
constexpr const char *PREFIX = "MCH-P-";
constexpr int SUFFIX_WIDTH = 6;  // MCH-P-000125
}  // namespace

std::string ProductIdService::generateNextId(pqxx::work &txn) {
    // FOR UPDATE locks the matching row(s) until the caller commits or
    // rolls back txn — so a second concurrent call blocks here instead
    // of reading the same max suffix and generating a duplicate ID.
    auto result = txn.exec(
        "SELECT permanent_product_id FROM products "
        "WHERE permanent_product_id LIKE 'MCH-P-%' "
        "ORDER BY permanent_product_id DESC LIMIT 1 FOR UPDATE");

    int nextNumber = 1;
    if (!result.empty()) {
        std::string lastId = result[0][0].as<std::string>();
        std::string suffix = lastId.substr(std::string(PREFIX).size());
        nextNumber = std::stoi(suffix) + 1;
    }

    std::ostringstream oss;
    oss << PREFIX << std::setw(SUFFIX_WIDTH) << std::setfill('0') << nextNumber;
    return oss.str();
}

}  // namespace merchantra