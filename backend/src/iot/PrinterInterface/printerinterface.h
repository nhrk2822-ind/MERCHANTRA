// Common interface for the barcode printer — real or simulated.

#pragma once

#include <string>

namespace merchantra {

class PrinterInterface {
public:
    virtual ~PrinterInterface() = default;

    // Prints a barcode label for the given Permanent Product ID.
    // Returns true on success.
    virtual bool printBarcodeLabel(const std::string &permanentProductId,
                                    const std::string &barcodeValue) = 0;

    virtual bool isConnected() const = 0;
};

}  // namespace merchantra