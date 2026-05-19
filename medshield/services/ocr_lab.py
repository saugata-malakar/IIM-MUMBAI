"""
Prescription OCR Demo Lab

Processes prescription images: OCR extraction, PII detection, redaction.
Runs mostly client-side (Tesseract.js), backend provides PII detection support.
"""

import re
from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple
from enum import Enum


class PIIType(Enum):
    NAME = "name"
    PHONE = "phone"
    EMAIL = "email"
    DATE = "date"
    AADHAAR = "aadhaar"
    PIN_CODE = "pin_code"
    ID = "id"


@dataclass
class PIISpan:
    """Detected PII span"""
    text: str
    pii_type: str
    start_char: int
    end_char: int
    confidence: float  # 0-1


@dataclass
class OCRResult:
    """OCR extraction result"""
    full_text: str
    words: List[Dict]  # [{text, confidence, x, y, width, height}, ...]
    pii_spans: List[PIISpan]
    processing_time_ms: float


class PrescriptionOCRLab:
    """
    Prescription OCR with PII detection and redaction.
    Mostly client-side (Tesseract.js), backend provides PII regex validation.
    """

    # Indian phone number patterns
    PHONE_PATTERNS = [
        r"\+91[6-9]\d{9}",  # +91 9876543210
        r"[6-9]\d{9}",      # 9876543210 (without +91)
        r"\+91[-\s]?[6-9]\d{4}[-\s]?\d{5}",  # Formatted with dashes
    ]

    # Date patterns
    DATE_PATTERNS = [
        r"\d{2}/\d{2}/\d{4}",  # DD/MM/YYYY
        r"\d{2}-\d{2}-\d{4}",  # DD-MM-YYYY
        r"\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{4}",  # D Month YYYY
    ]

    # Email pattern
    EMAIL_PATTERN = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"

    # Aadhaar pattern (12 digits in groups of 4)
    AADHAAR_PATTERN = r"\d{4}\s\d{4}\s\d{4}"

    # PIN code pattern (6 digits)
    PIN_CODE_PATTERN = r"[0-9]{6}(?!\d)"

    # Medical vocabulary whitelist (don't flag as names)
    MEDICAL_WHITELIST = {
        # Drug names
        "metformin",
        "glimepiride",
        "sitagliptin",
        "amlodipine",
        "telmisartan",
        "atenolol",
        "aspirin",
        "atorvastatin",
        "paracetamol",
        "ibuprofen",
        "amoxicillin",
        "ciprofloxacin",
        "levothyroxine",
        "insulin",
        "lisinopril",
        "hydrochlorothiazide",
        # ICD terms
        "diabetes",
        "hypertension",
        "tuberculosis",
        "pneumonia",
        "covid",
        "dengue",
        # Anatomy
        "heart",
        "lung",
        "liver",
        "kidney",
        "brain",
        "blood",
        "glucose",
        "pressure",
        "systolic",
        "diastolic",
        "patient",
        "doctor",
        "prescription",
        "medication",
        "dosage",
        "tablet",
        "capsule",
        "injection",
        "twice",
        "thrice",
        "daily",
        "weekly",
        "monthly",
        "morning",
        "evening",
        "night",
        "after",
        "before",
        "meals",
        "food",
        "ml",
        "mg",
        "mcg",
        "gm",
    }

    def __init__(self):
        """Initialize OCR lab"""
        self.compiled_patterns = self._compile_patterns()

    def _compile_patterns(self) -> Dict:
        """Pre-compile regex patterns"""
        return {
            "phone": [re.compile(p) for p in self.PHONE_PATTERNS],
            "date": [re.compile(p, re.IGNORECASE) for p in self.DATE_PATTERNS],
            "email": re.compile(self.EMAIL_PATTERN),
            "aadhaar": re.compile(self.AADHAAR_PATTERN),
            "pin_code": re.compile(self.PIN_CODE_PATTERN),
        }

    def detect_pii_in_text(self, text: str) -> List[PIISpan]:
        """
        Detect PII spans in OCR text using regex + heuristics.
        """
        spans = []

        # Phone numbers
        for pattern in self.compiled_patterns["phone"]:
            for match in pattern.finditer(text):
                spans.append(
                    PIISpan(
                        text=match.group(),
                        pii_type=PIIType.PHONE.value,
                        start_char=match.start(),
                        end_char=match.end(),
                        confidence=0.95,
                    )
                )

        # Dates
        for pattern in self.compiled_patterns["date"]:
            for match in pattern.finditer(text):
                spans.append(
                    PIISpan(
                        text=match.group(),
                        pii_type=PIIType.DATE.value,
                        start_char=match.start(),
                        end_char=match.end(),
                        confidence=0.85,
                    )
                )

        # Email
        for match in self.compiled_patterns["email"].finditer(text):
            spans.append(
                PIISpan(
                    text=match.group(),
                    pii_type=PIIType.EMAIL.value,
                    start_char=match.start(),
                    end_char=match.end(),
                    confidence=0.92,
                )
            )

        # Aadhaar
        for match in self.compiled_patterns["aadhaar"].finditer(text):
            spans.append(
                PIISpan(
                    text=match.group(),
                    pii_type=PIIType.AADHAAR.value,
                    start_char=match.start(),
                    end_char=match.end(),
                    confidence=0.98,
                )
            )

        # PIN code
        for match in self.compiled_patterns["pin_code"].finditer(text):
            spans.append(
                PIISpan(
                    text=match.group(),
                    pii_type=PIIType.PIN_CODE.value,
                    start_char=match.start(),
                    end_char=match.end(),
                    confidence=0.75,
                )
            )

        # Capitalized word pairs (likely names) — exclude medical whitelist
        words = text.split()
        for i in range(len(words) - 1):
            word1 = words[i].strip()
            word2 = words[i + 1].strip()

            if (
                word1 and word1[0].isupper() and word2 and word2[0].isupper()
                and word1.lower() not in self.MEDICAL_WHITELIST
                and word2.lower() not in self.MEDICAL_WHITELIST
                and not word1[0].isdigit()
                and not word2[0].isdigit()
            ):
                # Find position in text
                pos = text.find(f"{word1} {word2}")
                if pos >= 0:
                    spans.append(
                        PIISpan(
                            text=f"{word1} {word2}",
                            pii_type=PIIType.NAME.value,
                            start_char=pos,
                            end_char=pos + len(word1) + 1 + len(word2),
                            confidence=0.65,
                        )
                    )

        # Sort by position
        spans.sort(key=lambda s: s.start_char)

        # Remove overlaps (keep highest confidence)
        deduped = []
        for span in spans:
            overlap = False
            for existing in deduped:
                if not (
                    span.end_char <= existing.start_char
                    or span.start_char >= existing.end_char
                ):
                    overlap = True
                    # Keep the one with higher confidence
                    if span.confidence > existing.confidence:
                        deduped.remove(existing)
                    break
            if not overlap:
                deduped.append(span)

        return deduped

    def validate_pii_detected(self, pii_spans: List[PIISpan]) -> Dict:
        """
        Validate detected PII — check for obvious errors.
        """
        validation = {
            "total_spans": len(pii_spans),
            "by_type": {},
            "high_confidence": [],
            "low_confidence": [],
        }

        for span in pii_spans:
            pii_type = span.pii_type
            if pii_type not in validation["by_type"]:
                validation["by_type"][pii_type] = 0
            validation["by_type"][pii_type] += 1

            if span.confidence >= 0.85:
                validation["high_confidence"].append(
                    {
                        "text": span.text,
                        "type": pii_type,
                        "confidence": span.confidence,
                    }
                )
            else:
                validation["low_confidence"].append(
                    {
                        "text": span.text,
                        "type": pii_type,
                        "confidence": span.confidence,
                    }
                )

        return validation

    def generate_redaction_masks(
        self, text: str, pii_spans: List[PIISpan]
    ) -> Dict:
        """
        Generate redaction masks for canvas rendering.
        Returns bounding box info for each PII span.
        """
        masks = []

        for span in pii_spans:
            # Calculate approximate position in text
            before_text = text[: span.start_char]
            line_number = before_text.count("\n")
            col_in_line = len(before_text.split("\n")[-1])

            masks.append(
                {
                    "text": span.text,
                    "type": span.pii_type,
                    "char_start": span.start_char,
                    "char_end": span.end_char,
                    "line": line_number,
                    "column": col_in_line,
                    "length": span.end_char - span.start_char,
                    "confidence": span.confidence,
                }
            )

        return {"total_masks": len(masks), "masks": masks}

    def get_ocr_lab_info(self) -> Dict:
        """Get OCR lab information"""
        return {
            "status": "ready",
            "pii_types_supported": [t.value for t in PIIType],
            "phone_patterns_count": len(self.PHONE_PATTERNS),
            "date_patterns_count": len(self.DATE_PATTERNS),
            "medical_whitelist_size": len(self.MEDICAL_WHITELIST),
            "capabilities": [
                "Image preprocessing (grayscale, deskew, contrast, binarization)",
                "OCR via Tesseract.js (word-level bounding boxes)",
                "PII detection (regex + heuristics)",
                "Redaction rendering (canvas masks)",
                "Audit log generation",
            ],
        }
