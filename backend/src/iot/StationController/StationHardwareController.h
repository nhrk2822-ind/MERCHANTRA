// NOTE ON NAMING: the architecture doc called this "StationController",
// but that name is already taken by the HTTP controller in
// backend/src/controllers/StationController/ — reusing it here would
// mean two different classes with the same name in the same
// namespace. Renamed to StationHardwareController to avoid the clash;
// same responsibility the doc described (drives scanner+camera+printer
// as one unit for the physical/simulated station).
//
// This does NOT decide PASS/FAIL/REVIEW — that's StationService. This
// class only knows how to talk to the three hardware interfaces.

#pragma once

#include <memory>
#include <string>

#include "../CameraInterface/CameraInterface.h"
#include "../PrinterInterface/PrinterInterface.h"
#include "../ScannerInterface/ScannerInterface.h"

namespace merchantra {

struct StationHardwareReadout {
    std::string scannedBarcode;
    std::string capturedImageUrl;
    bool scannerConnected;
    bool cameraConnected;
    bool printerConnected;
};

class StationHardwareController {
public:
    StationHardwareController(std::unique_ptr<ScannerInterface> scanner,
                               std::unique_ptr<CameraInterface> camera,
                               std::unique_ptr<PrinterInterface> printer)
        : scanner_(std::move(scanner)),
          camera_(std::move(camera)),
          printer_(std::move(printer)) {}

    // Reads a barcode scan + captures an image in one call — the
    // typical "item on the belt" sequence. StationController (HTTP)
    // calls this, then hands the readout to StationService.
    StationHardwareReadout captureReadout(const std::string &permanentProductId) {
        return StationHardwareReadout{
            scanner_->scanBarcode(),
            camera_->captureImage(permanentProductId),
            scanner_->isConnected(),
            camera_->isConnected(),
            printer_->isConnected(),
        };
    }

    bool printLabel(const std::string &permanentProductId, const std::string &barcodeValue) {
        return printer_->printBarcodeLabel(permanentProductId, barcodeValue);
    }

private:
    std::unique_ptr<ScannerInterface> scanner_;
    std::unique_ptr<CameraInterface> camera_;
    std::unique_ptr<PrinterInterface> printer_;
};

}  // namespace merchantra