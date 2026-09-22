
#include "AIClientService.h"
 
#include <drogon/HttpClient.h>
#include <trantor/utils/Logger.h>
 
#include <chrono>
#include <future>
 
namespace merchantra {
 
std::string AIClientService::baseUrl_;
 
void AIClientService::init(const std::string &baseUrl) {
    baseUrl_ = baseUrl;
}
 
long long AIClientService::persistAiResult(pqxx::work &txn,
                                            const std::string &permanentProductId,
                                            const std::string &aiType,
                                            const std::string &requestJson,
                                            const std::string &responseJson,
                                            double confidence,
                                            const std::string &decision) {
    auto row = txn.exec_params(
        "INSERT INTO ai_results "
        "(permanent_product_id, ai_type, request_json, response_json, confidence, decision) "
        "VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, NULLIF($6, '')) "
        "RETURNING id",
        permanentProductId, aiType, requestJson, responseJson, confidence, decision);
    return row[0][0].as<long long>();
}
 
namespace {
// Shared HTTP call helper: posts jsonBody to path, returns the parsed
// JSON response or nullptr on timeout/network failure. Used by both
// verifyProduct and assessReturnRisk so the blocking/timeout dance
// lives in exactly one place.
Json::Value postToAiService(const std::string &baseUrl,
                             const std::string &path,
                             const Json::Value &jsonBody,
                             std::string &rawResponseOut,
                             bool &succeededOut) {
    succeededOut = false;
    rawResponseOut = "{}";
 
    try {
        auto client = drogon::HttpClient::newHttpClient(baseUrl);
        auto req = drogon::HttpRequest::newHttpJsonRequest(jsonBody);
        req->setMethod(drogon::Post);
        req->setPath(path);
 
        std::promise<drogon::HttpResponsePtr> promise;
        auto future = promise.get_future();
 
        client->sendRequest(
            req,
            [&promise](drogon::ReqResult result, const drogon::HttpResponsePtr &resp) {
                promise.set_value(result == drogon::ReqResult::Ok ? resp : nullptr);
            },
            5.0 /* seconds timeout */);
 
        auto status = future.wait_for(std::chrono::seconds(6));
        auto resp = (status == std::future_status::ready) ? future.get() : nullptr;
 
        if (!resp) {
            LOG_ERROR << "AIClientService: no response from " << path;
            return Json::Value();
        }
 
        rawResponseOut = std::string(resp->body());
        auto json = resp->getJsonObject();
        if (json) {
            succeededOut = true;
            return *json;
        }
        return Json::Value();
    } catch (const std::exception &e) {
        LOG_ERROR << "AIClientService: call to " << path << " failed: " << e.what();
        return Json::Value();
    }
}
}  // namespace
 
VisualVerificationResult AIClientService::verifyProduct(
    pqxx::work &txn,
    const std::string &permanentProductId,
    const std::string &imageUrl,
    const std::string &expectedCategory) {
    Json::Value requestBody;
    requestBody["product_id"] = permanentProductId;
    requestBody["image_url"] = imageUrl;
    requestBody["expected_category"] = expectedCategory;
 
    Json::StreamWriterBuilder writer;
    std::string requestJson = Json::writeString(writer, requestBody);
 
    VisualVerificationResult result{0.0, 0.0, 0.0, 0.0, "REVIEW"};
 
    std::string responseJson;
    bool succeeded = false;
    Json::Value json = postToAiService(baseUrl_, "/ai/verify-product", requestBody,
                                        responseJson, succeeded);
 
    if (!succeeded) {
        LOG_ERROR << "AIClientService::verifyProduct degrading to REVIEW for "
                  << permanentProductId;
    } else {
        result.productMatchScore = json.get("product_match_score", 0.0).asDouble();
        result.damageProbability = json.get("damage_probability", 0.0).asDouble();
        result.anomalyScore = json.get("anomaly_score", 0.0).asDouble();
        result.confidence = json.get("confidence", 0.0).asDouble();
        result.decision = json.get("decision", "REVIEW").asString();
    }
 
    persistAiResult(txn, permanentProductId, "VERIFY_PRODUCT",
                     requestJson, responseJson, result.confidence, result.decision);
 
    return result;
}
 
ReturnRiskResult AIClientService::assessReturnRisk(
    pqxx::work &txn,
    const std::string &permanentProductId,
    int returnId,
    const std::string &reason,
    const std::string &conditionNotes) {
    Json::Value requestBody;
    requestBody["product_id"] = permanentProductId;
    requestBody["return_id"] = returnId;
    requestBody["reason"] = reason;
    requestBody["condition_notes"] = conditionNotes;
 
    Json::StreamWriterBuilder writer;
    std::string requestJson = Json::writeString(writer, requestBody);
 
    // Failure default is deliberately "flag for human review", never
    // "assume safe" — see ReturnService for how this reason string is
    // used to force FLAG_FOR_REVIEW when the AI call didn't succeed.
    ReturnRiskResult result{0.0, 0.0, "AI service unavailable", 0};
 
    std::string responseJson;
    bool succeeded = false;
    Json::Value json = postToAiService(baseUrl_, "/ai/return-risk", requestBody,
                                        responseJson, succeeded);
 
    if (succeeded) {
        result.riskScore = json.get("risk_score", 0.0).asDouble();
        result.confidence = json.get("confidence", 0.0).asDouble();
        result.reason = json.get("reason", "").asString();
    } else {
        LOG_ERROR << "AIClientService::assessReturnRisk degrading to FLAG_FOR_REVIEW for "
                  << permanentProductId;
    }
 
    result.aiResultId = persistAiResult(txn, permanentProductId, "RETURN_RISK",
                                          requestJson, responseJson,
                                          result.confidence, "");
 
    return result;
}
 
}  // namespace merchantra
 
