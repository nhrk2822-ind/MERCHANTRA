
// Orchestrates the Smart Station packing pipeline: barcode match ->
// quantity check -> AI visual verification -> final PASS/FAIL/REVIEW.
//
// This is where the three checks from the architecture doc come
// together. Individual hardware reads (scanner/camera) are handled by
// backend/src/iot/ — this service takes their already-read values as
// input, it doesn't talk to hardware itself.
 
#pragma once
 
#include <pqxx/pqxx>
#include <string>
 
namespace merchantra {
 
struct StationCheckInput {
    int orderItemId;
    std::string permanentProductId;
    std::string stationId;
    int operatorId;
 
    std::string scannedBarcode;
    std::string expectedBarcode;
 
    int scannedQuantity;
    int expectedQuantity;
 
    std::string imageUrl;
    std::string expectedCategory;
};
 
struct StationCheckOutcome {
    int packingSessionId;
    std::string finalStatus;  // "PASS" | "FAIL" | "REVIEW"
    bool barcodeMatch;
    bool quantityMatch;
    double aiConfidence;
    double aiDamageProbability;
};
 
struct StationService {
    // Runs all three checks in one go, records each in
    // verification_results, sets the packing_session's final status,
    // and writes a PACKING_COMPLETED lifecycle event.
    //
    // A FAIL on barcode or quantity skips the AI call entirely — no
    // point spending an AI call on an item that's already wrong.
    static StationCheckOutcome runFullVerification(pqxx::work &txn,
                                                     const StationCheckInput &input);
 
private:
    static int openSession(pqxx::work &txn, const StationCheckInput &input);
 
    static void recordCheck(pqxx::work &txn,
                             int sessionId,
                             const std::string &checkType,
                             const std::string &result,
                             double aiConfidence,
                             const std::string &detailsJson);
 
    static void finalizeSession(pqxx::work &txn, int sessionId, const std::string &finalStatus);
};
 
}  // namespace merchantra
 
