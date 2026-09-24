#include "StationStatusHub.h"

#include <trantor/utils/Logger.h>

namespace merchantra {

std::unordered_set<drogon::WebSocketConnectionPtr> StationStatusHub::clients_;
std::mutex StationStatusHub::clientsMutex_;

void StationStatusHub::handleNewConnection(const drogon::HttpRequestPtr &,
                                            const drogon::WebSocketConnectionPtr &conn) {
    std::lock_guard<std::mutex> lock(clientsMutex_);
    clients_.insert(conn);
    LOG_INFO << "StationStatusHub: client connected (" << clients_.size() << " total)";
}

void StationStatusHub::handleConnectionClosed(const drogon::WebSocketConnectionPtr &conn) {
    std::lock_guard<std::mutex> lock(clientsMutex_);
    clients_.erase(conn);
    LOG_INFO << "StationStatusHub: client disconnected (" << clients_.size() << " remaining)";
}

void StationStatusHub::handleNewMessage(const drogon::WebSocketConnectionPtr &,
                                         std::string &&,
                                         const drogon::WebSocketMessageType &) {
    // This channel is push-only (server -> dashboard) — clients aren't
    // expected to send anything meaningful. Incoming messages are
    // intentionally ignored rather than echoed.
}

void StationStatusHub::broadcastVerificationResult(const std::string &permanentProductId,
                                                     const std::string &status,
                                                     int packingSessionId) {
    Json::Value json;
    json["type"] = "STATION_VERIFICATION_RESULT";
    json["permanent_product_id"] = permanentProductId;
    json["status"] = status;
    json["packing_session_id"] = packingSessionId;

    Json::StreamWriterBuilder writer;
    std::string payload = Json::writeString(writer, json);

    std::lock_guard<std::mutex> lock(clientsMutex_);
    for (const auto &client : clients_) {
        client->send(payload);
    }
}

}  // namespace merchantra