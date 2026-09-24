
// WebSocket endpoint that pushes live Smart Station status to any
// connected frontend clients — so the dashboard's Smart Station page
// updates in real time instead of polling /station/status.
//
// Drogon WebSocket controllers are singletons like HTTP controllers;
// this one keeps a list of connected clients and StationController
// calls broadcastVerificationResult() after every /station/verify.
 
#pragma once
 
#include <drogon/WebSocketController.h>
#include <mutex>
#include <unordered_set>
 
namespace merchantra {
 
class StationStatusHub : public drogon::WebSocketController<StationStatusHub, false> {
public:
    WS_PATH_LIST_BEGIN
    WS_PATH_ADD("/ws/station", "merchantra::AuthFilter");
    WS_PATH_LIST_END
 
    void handleNewMessage(const drogon::WebSocketConnectionPtr &conn,
                           std::string &&message,
                           const drogon::WebSocketMessageType &type) override;
 
    void handleNewConnection(const drogon::HttpRequestPtr &req,
                              const drogon::WebSocketConnectionPtr &conn) override;
 
    void handleConnectionClosed(const drogon::WebSocketConnectionPtr &conn) override;
 
    // Called by StationController right after StationService returns an
    // outcome, so every connected dashboard sees the PASS/FAIL/REVIEW
    // the moment it happens.
    static void broadcastVerificationResult(const std::string &permanentProductId,
                                             const std::string &status,
                                             int packingSessionId);
 
private:
    static std::unordered_set<drogon::WebSocketConnectionPtr> clients_;
    static std::mutex clientsMutex_;
};
 
}  // namespace merchantra
 
