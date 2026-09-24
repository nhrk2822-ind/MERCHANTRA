# Multi-stage build: compile the C++ backend, then ship a slim runtime
# image with just the binary + its shared library dependencies.

FROM ubuntu:24.04 AS build

RUN apt-get update && apt-get install -y \
    build-essential cmake git curl zip unzip tar pkg-config \
    libpq-dev postgresql-server-dev-all \
    && rm -rf /var/lib/apt/lists/*

# vcpkg for Drogon / libpqxx / jwt-cpp.
# NOTE: bcrypt is deliberately NOT installed via vcpkg here — vcpkg's
# port catalog doesn't reliably have a "libbcrypt" matching the C API
# AuthUtils.cpp expects (bcrypt_gensalt/bcrypt_hashpw/bcrypt_checkpw).
# Verify the actual port name/availability for your vcpkg version before
# relying on this build, or switch to a vcpkg-confirmed alternative
# (e.g. libsodium's crypto_pwhash) and update AuthUtils.cpp to match.
RUN git clone https://github.com/microsoft/vcpkg /opt/vcpkg \
    && /opt/vcpkg/bootstrap-vcpkg.sh
ENV VCPKG_ROOT=/opt/vcpkg
RUN /opt/vcpkg/vcpkg install drogon libpqxx jwt-cpp

WORKDIR /src
COPY backend/ .

RUN cmake -B build -DCMAKE_TOOLCHAIN_FILE=$VCPKG_ROOT/scripts/buildsystems/vcpkg.cmake \
    && cmake --build build -j"$(nproc)"

FROM ubuntu:24.04 AS runtime

RUN apt-get update && apt-get install -y libpq5 ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /src/build/merchantra_backend ./merchantra_backend

EXPOSE 8080
CMD ["./merchantra_backend"]
