// Simulated camera — returns a placeholder image URL instead of
// capturing anything real. Placeholder is clearly labeled so nobody
// mistakes it for a real packing photo in logs/screenshots.

#pragma once

#include "../CameraInterface/CameraInterface.h"

namespace merchantra {

class MockCamera : public CameraInterface {
public:
    std::string captureImage(const std::string &permanentProductId) override {
        return "https://mock-storage.local/simulated-capture/" + permanentProductId + ".jpg";
    }

    bool isConnected() const override { return true; }
};

}  // namespace merchantra