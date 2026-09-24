// Simulated barcode scanner — no physical hardware required.
// Configure with a fixed barcode (or a queue of them) so integration
// tests and demos get predictable scan results.

#pragma once

#include <deque>
#include <string>

#include "../ScannerInterface/ScannerInterface.h"

namespace merchantra {

class MockScanner : public ScannerInterface {
public:
    // If queuedBarcodes is empty, scanBarcode() always returns
    // defaultBarcode — useful for a demo that always "scans correctly".
    explicit MockScanner(std::string defaultBarcode = "8901234567890")
        : defaultBarcode_(std::move(defaultBarcode)) {}

    // Pushes a barcode to be returned by the next scanBarcode() call —
    // lets a test script simulate a specific (possibly wrong) scan.
    void enqueueScan(const std::string &barcode) { queue_.push_back(barcode); }

    std::string scanBarcode() override {
        if (!queue_.empty()) {
            std::string next = queue_.front();
            queue_.pop_front();
            return next;
        }
        return defaultBarcode_;
    }

    bool isConnected() const override { return true; }  // simulator is always "connected"

private:
    std::string defaultBarcode_;
    std::deque<std::string> queue_;
};

}  // namespace merchantra