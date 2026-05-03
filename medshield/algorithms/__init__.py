"""
MedShield Algorithms Package
All anonymization algorithms inherit from BaseAnonymizer.
"""

from medshield.algorithms.base import BaseAnonymizer, AnonymizationResult
from medshield.algorithms.k_anonymity import KAnonymity
from medshield.algorithms.l_diversity import LDiversity
from medshield.algorithms.t_closeness import TCloseness
from medshield.algorithms.differential_privacy import DifferentialPrivacy
from medshield.algorithms.chaos_perturbation import ChaosPerturbation
from medshield.algorithms.pseudonymization import Pseudonymization
from medshield.algorithms.pii_redaction import PIIRedactor
from medshield.algorithms.hybrid import HybridAnonymizer
from medshield.algorithms.clustering import ClusteringAnonymizer

# Optional imports — require mediapipe / pytesseract
try:
    from medshield.algorithms.image_anonymization import ImageFaceRedactor
except ImportError:
    ImageFaceRedactor = None

try:
    from medshield.algorithms.ocr_redaction import OCRRedactor
except ImportError:
    OCRRedactor = None

ALGORITHM_REGISTRY = {
    "k-anonymity": KAnonymity,
    "l-diversity": LDiversity,
    "t-closeness": TCloseness,
    "differential-privacy": DifferentialPrivacy,
    "chaos-perturbation": ChaosPerturbation,
    "pseudonymization": Pseudonymization,
    "pii-redaction": PIIRedactor,
    "hybrid": HybridAnonymizer,
    "clustering": ClusteringAnonymizer,
}

# Only add image/OCR if their deps are available
if ImageFaceRedactor is not None:
    ALGORITHM_REGISTRY["image-anonymization"] = ImageFaceRedactor
if OCRRedactor is not None:
    ALGORITHM_REGISTRY["ocr-redaction"] = OCRRedactor

__all__ = [
    "BaseAnonymizer",
    "AnonymizationResult",
    "KAnonymity",
    "LDiversity",
    "TCloseness",
    "DifferentialPrivacy",
    "ChaosPerturbation",
    "Pseudonymization",
    "PIIRedactor",
    "HybridAnonymizer",
    "ClusteringAnonymizer",
    "ImageFaceRedactor",
    "OCRRedactor",
    "ALGORITHM_REGISTRY",
]
