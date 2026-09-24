#include "AuthUtils.h"

#ifndef NOMINMAX
#define NOMINMAX
#endif

#include <chrono>
#include <stdexcept>
#include <string>

#include <sodium.h>

#include <jwt-cpp/jwt.h>
#include <jwt-cpp/traits/kazuho-picojson/defaults.h>

namespace merchantra {

namespace {

struct SodiumInit {
    SodiumInit() {
        if (sodium_init() < 0) {
            throw std::runtime_error(
                "libsodium failed to initialize");
        }
    }
};

static SodiumInit sodiumInit;

} // namespace


std::string AuthUtils::hashPassword(
    const std::string &plainPassword) {

    char hashedPassword[crypto_pwhash_STRBYTES];

    if (crypto_pwhash_str(
            hashedPassword,
            plainPassword.c_str(),
            plainPassword.size(),
            crypto_pwhash_OPSLIMIT_INTERACTIVE,
            crypto_pwhash_MEMLIMIT_INTERACTIVE) != 0) {

        throw std::runtime_error(
            "crypto_pwhash_str failed");
    }

    return std::string(hashedPassword);
}


bool AuthUtils::verifyPassword(
    const std::string &plainPassword,
    const std::string &storedHash) {

    return crypto_pwhash_str_verify(
        storedHash.c_str(),
        plainPassword.c_str(),
        plainPassword.size()) == 0;
}


std::string AuthUtils::issueToken(
    int userId,
    const std::string &role,
    const std::string &jwtSecret,
    int expiryMinutes) {

    if (jwtSecret.empty()) {
        throw std::runtime_error(
            "JWT_SECRET is not configured");
    }

    auto now =
        std::chrono::system_clock::now();

    auto expiry =
        now + std::chrono::minutes(expiryMinutes);

    return jwt::create()
        .set_issuer("merchantra-backend")
        .set_type("JWS")
        .set_issued_at(now)
        .set_expires_at(expiry)
        .set_subject(std::to_string(userId))
        .set_payload_claim(
            "role",
            jwt::claim(role))
        .sign(
            jwt::algorithm::hs256{jwtSecret});
}


int AuthUtils::verifyTokenAndGetUserId(
    const std::string &token,
    const std::string &jwtSecret) {

    try {

        if (jwtSecret.empty()) {
            return -1;
        }

        auto decodedToken =
            jwt::decode(token);

        auto verifier =
            jwt::verify()
                .allow_algorithm(
                    jwt::algorithm::hs256{jwtSecret})
                .with_issuer(
                    "merchantra-backend");

        verifier.verify(decodedToken);

        return std::stoi(
            decodedToken.get_subject());

    } catch (const std::exception &) {

        return -1;
    }
}

} // namespace merchantra