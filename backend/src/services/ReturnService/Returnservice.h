
// Orchestrates the return flow: request -> receive -> AI risk
// assessment -> inspection decision -> (maybe) restock.
//
// The AI never auto-approves a restock or auto-flags a customer as
// fraudulent — it produces a risk score; a human (inspector) makes the
// RESTOCK / DAMAGED_WRITE_OFF / FLAG_FOR_REVIEW call. See the
// architecture doc: "AI should ASSIST humans."
 
#pragma once
 
#include <pqxx/pqxx>
#include <string>
 
namespace merchantra {
 
struct ReturnInspectionInput {
    int returnId;
    int inspectorId;
    std::string conditionNotes;
    std::string imagesRef;
    std::string decision;  // "RESTOCK" | "DAMAGED_WRITE_OFF" | "FLAG_FOR_REVIEW" — inspector's call
};
 
struct ReturnService {
    // Opens a return request. Records RETURN_REQUESTED on the timeline.
    static int requestReturn(pqxx::work &txn,
                              int orderItemId,
                              const std::string &permanentProductId,
                              const std::string &reason,
                              int actorUserId);
 
    // Marks a return as physically received at the warehouse, calls
    // AIClientService::assessReturnRisk for context (shown to the
    // inspector, not used to auto-decide), and records RETURN_RECEIVED.
    static void markReceived(pqxx::work &txn, int returnId, int actorUserId);
 
    // Records the inspector's decision. If decision == "RESTOCK", adds
    // the item back to inventory via InventoryService. Records
    // RETURN_INSPECTED (and RESTOCKED if applicable) on the timeline.
    static void inspect(pqxx::work &txn, const ReturnInspectionInput &input);
};
 
}  // namespace merchantra
 
