#pragma once

#include <pqxx/pqxx>
#include <string>

namespace merchantra {

struct ReturnInspectionInput {
    int returnId;
    int inspectorId;
    std::string conditionNotes;
    std::string imagesRef;
    std::string decision;
};

struct ReturnService {

    static int requestReturn(
        pqxx::work &txn,
        int orderItemId,
        const std::string &permanentProductId,
        const std::string &reason,
        int actorUserId
    );

    static void markReceived(
        pqxx::work &txn,
        int returnId,
        int actorUserId
    );

    static void inspect(
        pqxx::work &txn,
        const ReturnInspectionInput &input
    );
};

} // namespace merchantra