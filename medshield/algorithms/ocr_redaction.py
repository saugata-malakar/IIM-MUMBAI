"""
X-Ray & Document OCR Redaction Algorithm
Detects text in images (like X-Rays) and redacts PII using Tesseract OCR.
"""

import cv2
import numpy as np
import re
from pathlib import Path
from typing import Dict, Any, List
import time

try:
    import pytesseract
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False

from medshield.algorithms.base import BaseAnonymizer


class OCRRedactor(BaseAnonymizer):
    """
    Extracts text from images using OCR, identifies PII via Regex/NER,
    and paints over the identified text in the image.
    
    Parameters:
        tesseract_cmd (str): Path to tesseract executable if not in PATH.
        pii_patterns (dict): Regex patterns to redact.
    """

    def __init__(self, tesseract_cmd: str = None, pii_patterns: Dict[str, str] = None,
                 config: Dict[str, Any] = None):
        super().__init__(quasi_identifiers=[], sensitive_attributes=[], config=config)
        self.tesseract_cmd = tesseract_cmd
        self._text_detected = 0
        self._pii_redacted = 0
        
        if HAS_TESSERACT and self.tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = self.tesseract_cmd

        # Default standard patterns
        self.patterns = pii_patterns or {
            "DATE": r'\b\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4}\b',
            "NAME_HINT": r'(?i)(name|patient|pt|dr\.|doctor)\s*[:\-]?\s*([A-Za-z\s]{3,20})',
            "ID_NUM": r'\b\d{5,12}\b',
        }

    @property
    def name(self) -> str:
        return "OCR Text Redaction (Tesseract)"

    def anonymize(self, data, **kwargs):
        pass

    def run_image(self, image_path: str, output_path: str) -> Dict[str, Any]:
        """Process a single image to redact text."""
        start_time = time.time()
        
        if not HAS_TESSERACT:
            return {"error": "pytesseract not installed. Run: pip install pytesseract"}
            
        if not Path(image_path).exists():
            raise FileNotFoundError(f"Image not found: {image_path}")

        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not read image: {image_path}")

        # OCR to data (gets bounding boxes)
        custom_config = r'--oem 3 --psm 11'
        ocr_data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT, config=custom_config)
        
        n_boxes = len(ocr_data['text'])
        self._text_detected = n_boxes
        
        redact_count = 0
        
        # Simple heuristic: redacting words that match our PII patterns
        for i in range(n_boxes):
            word = ocr_data['text'][i].strip()
            if int(ocr_data['conf'][i]) > 40 and word: # Only confident text
                # Check against patterns
                is_pii = False
                for pii_type, pattern in self.patterns.items():
                    if re.search(pattern, word):
                        is_pii = True
                        break
                
                # Also redact any word that is purely uppercase and length > 4 (often last names)
                if word.isupper() and len(word) > 4 and word.isalpha():
                    is_pii = True
                    
                if is_pii:
                    (x, y, w, h) = (ocr_data['left'][i], ocr_data['top'][i], ocr_data['width'][i], ocr_data['height'][i])
                    
                    # More engaging visual redaction: 
                    # 1. Paint a dark background
                    cv2.rectangle(image, (x, y), (x + w, y + h), (30, 30, 30), -1)
                    # 2. Draw a bright border
                    cv2.rectangle(image, (x, y), (x + w, y + h), (0, 0, 255), 2)
                    # 3. Add 'REDACTED' text if there's enough space
                    if h > 15 and w > 40:
                        font = cv2.FONT_HERSHEY_SIMPLEX
                        font_scale = min(w / 100, h / 30)  # scale font to fit box
                        cv2.putText(image, "REDACTED", (x + 2, y + int(h/1.5)), 
                                    font, font_scale, (0, 0, 255), max(1, int(font_scale * 2)))
                                    
                    redact_count += 1
                    
        self._pii_redacted = redact_count

        cv2.imwrite(output_path, image)
        elapsed_ms = (time.time() - start_time) * 1000

        return {
            "algorithm": self.name,
            "original_path": image_path,
            "output_path": output_path,
            "words_analyzed": n_boxes,
            "pii_blocks_redacted": redact_count,
            "processing_time_ms": elapsed_ms,
            "status": "Success"
        }

    def _get_params(self) -> Dict[str, Any]:
        return {
            "pii_redacted": self._pii_redacted,
            "patterns": list(self.patterns.keys())
        }
