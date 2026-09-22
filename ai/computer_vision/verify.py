"""
MERCHANTRA - Computer Vision Verification (Phase 6)

Status:
  IMPLEMENTED — classical CV prototype (OpenCV + SSIM) for product match,
               damage, and packaging-anomaly scoring. Works fully offline,
               no training data required.
  PLANNED     — swap-in CNN backbone (ResNet18 / MobileNetV2, transfer
               learning) once a labeled packaging-defect dataset exists.
               See CNNVerifier stub at the bottom of this file.

This module implements the Smart Station's three checks from the project
brief:
    CHECK 1: Barcode/Product Match       (handled by IoT layer, not here)
    CHECK 2: Quantity Verification       (handled by IoT layer, not here)
    CHECK 3: Visual AI Verification      (this module)

Output matches the AI API contract:
    {
        "product_match_score": 0.0-1.0,
        "damage_probability": 0.0-1.0,
        "anomaly_score": 0.0-1.0,
        "confidence": 0.0-1.0,
        "decision": "PASS" | "FAIL" | "REVIEW"
    }

Usage (standalone test with mock images):
    python verify.py --self-test

Dependencies:
    pip install opencv-python-headless numpy scikit-image pillow
"""

import argparse
import os
from dataclasses import dataclass, asdict
from typing import Optional

import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim


# ------------------------------------------------------------------
# Result contract
# ------------------------------------------------------------------
@dataclass
class VerificationResult:
    product_match_score: float
    damage_probability: float
    anomaly_score: float
    confidence: float
    decision: str
    reason: str

    def to_dict(self):
        return asdict(self)


# ------------------------------------------------------------------
# IMPLEMENTED: classical CV prototype
# ------------------------------------------------------------------
class ClassicalVerifier:
    """
    Prototype visual verifier. Does not require a trained model or GPU.

    Approach:
    - product_match_score: structural similarity (SSIM) between the
      candidate image and a stored reference image for that product/category.
    - damage_probability: edge density + dark-blob area, which tends to
      rise for cracks, dents, tears, and stains.
    - anomaly_score: deviation of basic image statistics (brightness,
      contrast, edge density) from an expected reference range.

    This is intentionally simple and explainable — appropriate for a
    hackathon-level prototype, not a production defect-detection system.
    """

    def __init__(self, image_size=(256, 256),
                 damage_fail_threshold: float = 0.55,
                 damage_review_threshold: float = 0.30,
                 match_fail_threshold: float = 0.45,
                 match_review_threshold: float = 0.65):
        self.image_size = image_size
        self.damage_fail_threshold = damage_fail_threshold
        self.damage_review_threshold = damage_review_threshold
        self.match_fail_threshold = match_fail_threshold
        self.match_review_threshold = match_review_threshold

    def _load_gray(self, image_path: str) -> np.ndarray:
        img = cv2.imread(image_path, cv2.IMREAD_COLOR)
        if img is None:
            raise FileNotFoundError(f"Could not read image: {image_path}")
        img = cv2.resize(img, self.image_size)
        return img

    def _product_match_score(self, candidate: np.ndarray, reference: Optional[np.ndarray]) -> float:
        if reference is None:
            # No reference image available for this product yet — treat as
            # neutral/unknown rather than guessing.
            return 0.75
        cand_gray = cv2.cvtColor(candidate, cv2.COLOR_BGR2GRAY)
        ref_gray = cv2.cvtColor(reference, cv2.COLOR_BGR2GRAY)
        score, _ = ssim(cand_gray, ref_gray, full=True)
        return float(np.clip((score + 1) / 2, 0, 1))  # ssim in [-1,1] -> [0,1]

    def _damage_probability(self, candidate: np.ndarray) -> float:
        gray = cv2.cvtColor(candidate, cv2.COLOR_BGR2GRAY)

        # Edge density: cracks/tears/deformation increase high-frequency edges
        edges = cv2.Canny(gray, 80, 160)
        edge_density = float(np.sum(edges > 0)) / edges.size

        # Dark blob area: stains, deep dents, torn packaging often appear as
        # localized dark regions relative to the overall image.
        mean_brightness = float(np.mean(gray))
        dark_mask = gray < max(0, mean_brightness - 60)
        dark_area_ratio = float(np.sum(dark_mask)) / dark_mask.size

        # Combine (weights chosen for interpretability/mock-image sensitivity,
        # not fit to real labeled data — recalibrate once real photos exist)
        damage_probability = np.clip(0.6 * edge_density * 10 + 0.4 * dark_area_ratio * 8, 0, 1)
        return float(damage_probability)

    def _anomaly_score(self, candidate: np.ndarray) -> float:
        gray = cv2.cvtColor(candidate, cv2.COLOR_BGR2GRAY)
        brightness = float(np.mean(gray))
        contrast = float(np.std(gray))

        # Expected "normal" packaging photo range for a well-lit warehouse
        # station. Values far outside this range suggest a bad capture,
        # unexpected object, or station malfunction rather than the product
        # itself.
        expected_brightness = (80, 200)
        expected_contrast = (20, 80)

        brightness_penalty = 0.0
        if brightness < expected_brightness[0]:
            brightness_penalty = (expected_brightness[0] - brightness) / expected_brightness[0]
        elif brightness > expected_brightness[1]:
            brightness_penalty = (brightness - expected_brightness[1]) / (255 - expected_brightness[1])

        contrast_penalty = 0.0
        if contrast < expected_contrast[0]:
            contrast_penalty = (expected_contrast[0] - contrast) / expected_contrast[0]
        elif contrast > expected_contrast[1]:
            contrast_penalty = min(1.0, (contrast - expected_contrast[1]) / expected_contrast[1])

        anomaly_score = np.clip(0.5 * brightness_penalty + 0.5 * contrast_penalty, 0, 1)
        return float(anomaly_score)

    def verify(self, image_path: str, reference_image_path: Optional[str] = None) -> VerificationResult:
        candidate = self._load_gray(image_path)
        reference = self._load_gray(reference_image_path) if reference_image_path else None

        product_match_score = self._product_match_score(candidate, reference)
        damage_probability = self._damage_probability(candidate)
        anomaly_score = self._anomaly_score(candidate)

        # Confidence: lower when we lack a reference image, or when signals
        # disagree sharply (e.g. high match but high damage).
        confidence = 0.9
        if reference is None:
            confidence -= 0.15
        if abs(product_match_score - (1 - damage_probability)) > 0.5:
            confidence -= 0.1
        confidence = float(np.clip(confidence, 0, 1))

        decision, reason = self._decide(product_match_score, damage_probability, anomaly_score)

        return VerificationResult(
            product_match_score=round(product_match_score, 3),
            damage_probability=round(damage_probability, 3),
            anomaly_score=round(anomaly_score, 3),
            confidence=round(confidence, 3),
            decision=decision,
            reason=reason,
        )

    def _decide(self, match: float, damage: float, anomaly: float):
        if damage >= self.damage_fail_threshold or match <= self.match_fail_threshold:
            return "FAIL", f"damage_probability={damage:.2f} or product_match_score={match:.2f} exceeded fail threshold"
        if (damage >= self.damage_review_threshold
                or match <= self.match_review_threshold
                or anomaly >= 0.5):
            return "REVIEW", f"borderline signal (damage={damage:.2f}, match={match:.2f}, anomaly={anomaly:.2f}) — needs human check"
        return "PASS", "all signals within expected range"


# ------------------------------------------------------------------
# PLANNED: CNN-based verifier (not implemented — requires labeled data + GPU)
# ------------------------------------------------------------------
class CNNVerifier:
    """
    PLANNED. Intended design once a labeled packaging-defect dataset is
    available:

    - Backbone: MobileNetV2 or ResNet18 (torchvision), pretrained on
      ImageNet, fine-tuned on labeled PASS/FAIL/REVIEW packaging images.
    - Same public interface as ClassicalVerifier (`.verify(image_path,
      reference_image_path)` -> VerificationResult) so it's a drop-in
      replacement — no API contract changes needed on the C++ side.
    - Training pipeline would live in ai/models/ with checkpoints saved
      there; this file would load the checkpoint at inference time.

    Not implemented in this prototype: no real dataset exists yet, and
    training an untuned CNN on synthetic images would not out-perform the
    classical baseline above. This stub exists so the swap-in path is
    documented and the interface is agreed upon in advance.
    """

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "CNNVerifier is PLANNED, not implemented. Use ClassicalVerifier for now."
        )


# ------------------------------------------------------------------
# Self-test: generates mock images so this file can be verified without
# any real product photos.
# ------------------------------------------------------------------
def _make_mock_image(path: str, kind: str = "normal", size=(256, 256)):
    img = np.full((size[1], size[0], 3), 150, dtype=np.uint8)
    cv2.rectangle(img, (40, 40), (size[0] - 40, size[1] - 40), (120, 90, 60), -1)
    cv2.putText(img, "PRODUCT", (60, size[1] // 2), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

    if kind == "damaged":
        # simulate a tear / dark stain + jagged edge lines
        cv2.line(img, (60, 60), (200, 180), (10, 10, 10), 4)
        cv2.line(img, (80, 150), (220, 60), (10, 10, 10), 3)
        cv2.circle(img, (180, 180), 25, (5, 5, 5), -1)
    elif kind == "too_dark":
        img = (img * 0.15).astype(np.uint8)
    elif kind == "too_bright":
        img = np.clip(img.astype(np.int16) + 150, 0, 255).astype(np.uint8)

    cv2.imwrite(path, img)


def self_test():
    tmp_dir = "mock_images_test"
    os.makedirs(tmp_dir, exist_ok=True)

    reference_path = os.path.join(tmp_dir, "reference.jpg")
    normal_path = os.path.join(tmp_dir, "normal.jpg")
    damaged_path = os.path.join(tmp_dir, "damaged.jpg")
    dark_path = os.path.join(tmp_dir, "too_dark.jpg")

    _make_mock_image(reference_path, "normal")
    _make_mock_image(normal_path, "normal")
    _make_mock_image(damaged_path, "damaged")
    _make_mock_image(dark_path, "too_dark")

    verifier = ClassicalVerifier()

    print("[SIMULATED] Self-test using generated mock images (not real product photos)\n")
    for label, path in [("normal", normal_path), ("damaged", damaged_path), ("too_dark", dark_path)]:
        result = verifier.verify(path, reference_image_path=reference_path)
        print(f"-- {label} --")
        print(result.to_dict())
        print()


def main():
    parser = argparse.ArgumentParser(description="MERCHANTRA computer vision verification prototype.")
    parser.add_argument("--self-test", action="store_true", help="Run self-test with generated mock images.")
    parser.add_argument("--image", type=str, help="Path to candidate image.")
    parser.add_argument("--reference", type=str, help="Path to reference image (optional).")
    args = parser.parse_args()

    if args.self_test or not args.image:
        self_test()
        return

    verifier = ClassicalVerifier()
    result = verifier.verify(args.image, reference_image_path=args.reference)
    print(result.to_dict())


if __name__ == "__main__":
    main()