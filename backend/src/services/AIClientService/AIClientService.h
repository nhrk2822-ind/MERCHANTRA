
// The ONLY code in this backend that calls Person 2's Python AI service.
//
// Every call here: (1) hits one of the documented /ai/* endpoints,
// (2) persists the raw response to ai_results, (3) returns a parsed
// result to the caller. Callers (StationService, ReturnService, ...)
// never construct the HTTP request themselves.
 
#pragma once
 
#include <pqxx/pqxx>
#include <string>
 
namespace merchantra {
 
struct VisualVerificationResult {
    double productMatchScore;
    double damageProbability;
    double anomalyScore;
    double confidence;
    std::string decision;  // "PASS" | "FAIL" | "REVIEW"
};
 
struct ReturnRiskResult {
    double riskScore;
    double confidence;
    std::string reason;
    long long aiResultId;  // row id in ai_results, for return_inspections.ai_result_id
};
 
struct AIClientService {
    // Configure once at startup with the AI service base URL
    // (Config.aiServiceBaseUrl).
    static void init(const std::string &baseUrl);
 
    // Calls POST /ai/verify-product with the given image, persists the
    // response into ai_results, and returns the parsed result.
    //
    // On network failure or timeout, does NOT throw — returns a result
    // with decision = "REVIEW" and confidence = 0, so a Python outage
    // degrades the packing line to manual review instead of crashing
    // the request. Also logs the failure so it's visible operationally.
    static VisualVerificationResult verifyProduct(pqxx::work &txn,
                                                    const std::string &permanentProductId,
                                                    const std::string &imageUrl,
                                                    const std::string &expectedCategory);
 
    // Calls POST /ai/return-risk. Same failure-handling philosophy as
    // verifyProduct: on failure, returns riskScore = 0, confidence = 0,
    // reason = "AI service unavailable" — ReturnService should treat
    // that as FLAG_FOR_REVIEW, never as "safe to restock automatically".
    static ReturnRiskResult assessReturnRisk(pqxx::work &txn,
                                              const std::string &permanentProductId,
                                              int returnId,
                                              const std::string &reason,
                                              const std::string &conditionNotes);
 
private:
    static std::string baseUrl_;
 
    // Returns the inserted ai_results.id so callers (return_inspections)
    // can store a proper foreign key back to the exact AI call.
    static long long persistAiResult(pqxx::work &txn,
                                      const std::string &permanentProductId,
                                      const std::string &aiType,
                                      const std::string &requestJson,
                                      const std::string &responseJson,
                                      double confidence,
                                      const std::string &decision);
};
 
}  // namespace merchantra
 
