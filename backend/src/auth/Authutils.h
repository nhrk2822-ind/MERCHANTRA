// Password hashing + JWT issue/verify.
//
// Controllers and services never hash passwords or touch JWTs directly â€”
// everything auth-related funnels through here so there's exactly one
// place that knows the hashing algorithm and the JWT secret handling.
//
// Dependencies (add to CMakeLists.txt once installed):
//   - libbcrypt (or similar) for password hashing
//   - jwt-cpp (header-only: https://github.com/Thalhammer/jwt-cpp) for JWT

#pragma once

#include <string>

namespace merchantra {

struct AuthUtils {
    // Hashes a plaintext password for storage in users.password_hash.
    static std::string hashPassword(const std::string &plainPassword);

    // Verifies a plaintext password against a stored hash.
    static bool verifyPassword(const std::string &plainPassword,
                                const std::string &storedHash);

    // Issues a signed JWT for a logged-in user.
    // Claims include: sub (user id), role, exp (from Config.jwtExpiryMinutes).
    static std::string issueToken(int userId,
                                   const std::string &role,
                                   const std::string &jwtSecret,
                                   int expiryMinutes);

    // Verifies a JWT and, if valid, returns the user id from its claims.
    // Returns -1 if the token is invalid, expired, or malformed.
    static int verifyTokenAndGetUserId(const std::string &token,
                                        const std::string &jwtSecret);
};

}  // namespace merchantra