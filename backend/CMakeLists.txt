cmake_minimum_required(VERSION 3.16)

project(merchantra_backend LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

if(MSVC)
    foreach(flag_var
        CMAKE_CXX_FLAGS_DEBUG
        CMAKE_C_FLAGS_DEBUG)
        string(REPLACE "/ZI" "/Zi" ${flag_var} "${${flag_var}}")
    endforeach()
endif()

# ---------------------------------------------------------
# vcpkg
# ---------------------------------------------------------

set(VCPKG_ROOT "${CMAKE_SOURCE_DIR}/../vcpkg")

# ---------------------------------------------------------
# Generate compile_commands.json
# This is important for VS Code IntelliSense
# ---------------------------------------------------------

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Help CMake find vcpkg packages
list(APPEND CMAKE_PREFIX_PATH
    "${VCPKG_ROOT}/installed/x64-windows"
    "${VCPKG_ROOT}/installed/x64-windows/share"
)
# ---------------------------------------------------------
# Dependencies
# ---------------------------------------------------------

find_package(Drogon CONFIG REQUIRED)
find_package(libpqxx CONFIG REQUIRED)
find_package(jwt-cpp CONFIG REQUIRED)
find_package(unofficial-sodium CONFIG REQUIRED)

# ---------------------------------------------------------
# Source files
# ---------------------------------------------------------

file(GLOB_RECURSE BACKEND_SOURCES
    "${CMAKE_SOURCE_DIR}/src/*.cpp"
)

# ---------------------------------------------------------
# Executable
# ---------------------------------------------------------

add_executable(merchantra_backend
    ${BACKEND_SOURCES}
)

# ---------------------------------------------------------
# Include directories
# ---------------------------------------------------------

target_include_directories(merchantra_backend
    PRIVATE
        "${CMAKE_SOURCE_DIR}/src"
        "${VCPKG_ROOT}/installed/x64-windows/include"
)

# ---------------------------------------------------------
# Libraries
# ---------------------------------------------------------

target_link_libraries(merchantra_backend
    PRIVATE
        Drogon::Drogon
        libpqxx::pqxx
        jwt-cpp::jwt-cpp
        unofficial-sodium::sodium
)

target_link_options(merchantra_backend PRIVATE "/FORCE:MULTIPLE")
