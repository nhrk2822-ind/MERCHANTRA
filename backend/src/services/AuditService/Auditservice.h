// Single writer to audit_logs. Called from controllers for
// security/compliance-sensitive actions (role changes, inventory
// adjustments, return decisions, login) — NOT for every read request,
// that would flood the table with no real audit value.
//
// Deliberately lightweight: no ip_address capture wired in yet (would
// need to be threaded through from the Drogon request in each caller);
// left NULL until that's worth the plumbing.

#pragma once

#include <pqxx/pqxx>
#include <string>

namespace merchantra {

struct AuditService {
    // Takes the CALLER's transaction — same reasoning as every other
    // *Service in this codebase: an audit entry should commit or roll
    // back atomically with the action it's recording, not as a
    // separate fire-and-forget write that could succeed even if the
    // action itself failed.
    static void log(pqxx::work &txn,
                     int userId,
                     const std::string &action,
                     const std::string &resourceType = "",
                     int resourceId = 0,
                     const std::string &metadataJson = "{}");
};

}  // namespace merchantra