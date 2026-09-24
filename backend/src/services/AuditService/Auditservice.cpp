#include "AuditService.h"

namespace merchantra {

void AuditService::log(pqxx::work &txn,
                        int userId,
                        const std::string &action,
                        const std::string &resourceType,
                        int resourceId,
                        const std::string &metadataJson) {
    txn.exec_params(
        "INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata_json) "
        "VALUES (NULLIF($1, 0), $2, NULLIF($3, ''), NULLIF($4, 0), $5::jsonb)",
        userId, action, resourceType, resourceId, metadataJson);
}

}  // namespace merchantra