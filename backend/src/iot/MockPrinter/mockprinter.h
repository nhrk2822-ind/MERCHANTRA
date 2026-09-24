// Simulated printer — logs what would have been printed instead of
// sending anything to real hardware.

#pragma once

#include <trantor/utils/Logger.h>

#include "../PrinterInterface/PrinterInterface.h"

namespace merchantra {

class MockPrinter : public PrinterInterface {
public:
    bool printBarcodeLabel(const std::string &permanentProductId,
                            const std::string &barcodeValue) override {
        LOG_INFO << "[MockPrinter] Would print label for " << permanentProductId
                 << " barcode=" << barcodeValue;
        return true;
    }

    bool isConnected() const override { return true; }
};

}  // namespace merchantra