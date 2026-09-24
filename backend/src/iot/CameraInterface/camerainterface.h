// Common interface for the packing-station camera — real or simulated.
// captureImage() is responsible for getting the image somewhere
// AIClientService can reach it (e.g. uploads to storage, returns a
// URL) — it does NOT call the AI service itself, that stays in
// AIClientService/StationService.

#pragma once

#include <string>

namespace merchantra {

class CameraInterface {
public:
    virtual ~CameraInterface() = default;

    // Captures an image and returns a URL/path AIClientService::verifyProduct
    // can use as image_url. Returns empty string on capture failure.
    virtual std::string captureImage(const std::string &permanentProductId) = 0;

    virtual bool isConnected() const = 0;
};

}  // namespace merchantra