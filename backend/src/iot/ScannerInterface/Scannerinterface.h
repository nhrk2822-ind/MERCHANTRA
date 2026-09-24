// Common interface for a barcode scanner — real (ESP32/RPi-attached) or
// simulated. StationController/StationService depend on this interface
// only, never on MockScanner or a real driver class directly.

#pragma once

#include <string>

namespace merchantra {

class ScannerInterface {
public:
    virtual ~ScannerInterface() = default;

    // Blocks until a barcode is read (or times out). Returns empty
    // string on timeout/failure — callers treat that as "no scan".
    virtual std::string scanBarcode() = 0;

    // True if the hardware (or simulator) is reachable/ready.
    virtual bool isConnected() const = 0;
};

}  // namespace merchantra