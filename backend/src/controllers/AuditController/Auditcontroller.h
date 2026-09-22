// HTTP handler for /audit-logs.
// Read-only list of audit logs for ADMIN and ANALYST users.

#pragma once

#include <drogon/HttpController.h>

namespace merchantra {

class AuditController : public drogon::HttpController<AuditController, false> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(AuditController::listAuditLogs,
                  "/audit-logs",
                  drogon::Get,
                  "merchantra::AuthFilter");
    METHOD_LIST_END

    void listAuditLogs(
        const drogon::HttpRequestPtr &req,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback);
};

}  // namespace merchantra