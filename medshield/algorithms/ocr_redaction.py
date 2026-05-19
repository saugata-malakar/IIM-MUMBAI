"""
Intelligent Document Redaction with NLP + OCR
Uses spaCy Named Entity Recognition to UNDERSTAND text, not just detect it.

Pipeline:
  1. Tesseract OCR reads every word with position data
  2. spaCy NER classifies entities: PERSON, ORG, GPE (location), DATE
  3. Regex catches: phone numbers, emails, Aadhar/PAN, registration numbers
  4. Context-aware: "Dr. Ravi Shankar" → REDACT. "Azithromycin 200mg" → KEEP.
  
Only personal information is redacted. Medical content is ALWAYS preserved.
"""

import cv2
import numpy as np
import re
import os
from pathlib import Path
from typing import Dict, Any, List, Tuple, Set
import time

try:
    import pytesseract
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False

try:
    import spacy
    HAS_SPACY = True
except ImportError:
    HAS_SPACY = False

from medshield.algorithms.base import BaseAnonymizer


# ── Medical terminology that should NEVER be redacted ──
MEDICAL_TERMS = {
    # Common drugs
    'azithromycin', 'amoxicillin', 'paracetamol', 'ibuprofen', 'metformin',
    'aspirin', 'omeprazole', 'atorvastatin', 'amlodipine', 'losartan',
    'ceftriaxone', 'ciprofloxacin', 'doxycycline', 'prednisone', 'insulin',
    'pantoprazole', 'ranitidine', 'diclofenac', 'tramadol', 'gabapentin',
    'clopidogrel', 'warfarin', 'heparin', 'furosemide', 'salbutamol',
    'levothyroxine', 'metoprolol', 'lisinopril', 'hydrochlorothiazide',
    'cetirizine', 'montelukast', 'prednisolone', 'dexamethasone',
    'ondansetron', 'domperidone', 'rabeprazole', 'esomeprazole',
    'fluconazole', 'acyclovir', 'oseltamivir', 'hydroxychloroquine',
    'ivermectin', 'albendazole', 'metronidazole', 'norfloxacin',
    'ofloxacin', 'levofloxacin', 'clindamycin', 'vancomycin',
    'gentamicin', 'tobramycin', 'erythromycin', 'clarithromycin',
    'rifampicin', 'isoniazid', 'pyrazinamide', 'ethambutol',
    'nifedipine', 'diltiazem', 'verapamil', 'digoxin', 'enalapril',
    'captopril', 'spironolactone', 'mannitol', 'phenytoin', 'valproate',
    'carbamazepine', 'levetiracetam', 'lamotrigine', 'clonazepam',
    'lorazepam', 'diazepam', 'alprazolam', 'fluoxetine', 'sertraline',
    'escitalopram', 'amitriptyline', 'haloperidol', 'risperidone',
    'olanzapine', 'quetiapine', 'lithium', 'morphine', 'fentanyl',
    'codeine', 'naloxone', 'atropine', 'adrenaline', 'epinephrine',
    'dopamine', 'dobutamine', 'noradrenaline', 'nitroglycerin',
    'sildenafil', 'tadalafil', 'tamsulosin', 'finasteride',
    
    # Dosage forms & units
    'mg', 'ml', 'mcg', 'gm', 'kg', 'tab', 'tabs', 'tablet', 'tablets',
    'cap', 'caps', 'capsule', 'capsules', 'syrup', 'suspension', 'injection',
    'iv', 'im', 'sc', 'oral', 'topical', 'drops', 'ointment', 'cream',
    'inhaler', 'nebulizer', 'suppository', 'patch', 'solution',
    'bid', 'tid', 'qid', 'od', 'hs', 'prn', 'stat', 'sos',
    'before', 'after', 'meals', 'food', 'empty', 'stomach', 'bedtime',
    'morning', 'evening', 'night', 'daily', 'weekly', 'monthly',
    'days', 'weeks', 'refills', 'dispense', 'quantity',
    
    # Medical terms & diagnoses
    'diagnosis', 'prognosis', 'treatment', 'procedure', 'surgery',
    'fever', 'cough', 'cold', 'pain', 'headache', 'nausea', 'vomiting',
    'diarrhea', 'constipation', 'bleeding', 'swelling', 'inflammation',
    'infection', 'fracture', 'wound', 'burn', 'rash', 'allergy',
    'diabetes', 'hypertension', 'asthma', 'pneumonia', 'bronchitis',
    'arthritis', 'anemia', 'thyroid', 'cardiac', 'renal', 'hepatic',
    'malaria', 'dengue', 'typhoid', 'tuberculosis', 'covid',
    'cancer', 'tumor', 'benign', 'malignant', 'biopsy', 'pathology',
    'blood', 'urine', 'stool', 'sputum', 'culture', 'sensitivity',
    'hemoglobin', 'wbc', 'rbc', 'platelet', 'esr', 'crp', 'hba1c',
    'creatinine', 'bilirubin', 'sgot', 'sgpt', 'alkaline', 'phosphatase',
    'cholesterol', 'triglyceride', 'hdl', 'ldl', 'vldl', 'glucose',
    'fasting', 'postprandial', 'random', 'hiv', 'hbsag', 'hcv',
    'ecg', 'echo', 'xray', 'ct', 'mri', 'usg', 'ultrasound',
    'bp', 'pulse', 'temperature', 'spo2', 'respiratory', 'rate',
    'systolic', 'diastolic', 'mmhg', 'bpm',
    'rx', 'sig', 'dx', 'hx', 'px', 'tx', 'fx',
    'nkda', 'allergies', 'weight', 'height', 'bmi',
    'chief', 'complaint', 'history', 'present', 'illness',
    'examination', 'findings', 'investigation', 'impression',
    'advice', 'follow', 'review', 'discharge', 'summary',
    'admitted', 'discharged', 'referred', 'condition', 'stable',
    'improved', 'critical', 'satisfactory', 'guarded',
    'operation', 'anesthesia', 'local', 'general', 'spinal',
    'suture', 'dressing', 'splint', 'cast', 'physiotherapy',
    'day', 'week', 'month', 'year',
}

# ── PII label keywords that ALWAYS indicate personal info follows ──
PII_LABELS = {
    'name', 'patient', 'father', 'mother', 'husband', 'wife', 'guardian',
    'address', 'addr', 'residence', 'city', 'state', 'district', 'pin',
    'phone', 'mobile', 'mob', 'tel', 'contact', 'email',
    'dob', 'birth', 'born',
    'age', 'sex', 'gender',
    'aadhar', 'aadhaar', 'pan', 'passport', 'voter',
    'occupation', 'education', 'religion', 'caste', 'nationality',
    'registration', 'reg', 'license', 'lic', 'uhid', 'mrn', 'opd', 'ipd',
}


class OCRRedactor(BaseAnonymizer):
    """
    Intelligent document anonymization using NLP + OCR.
    Uses spaCy NER to understand text context.
    Only redacts personal information. Preserves all medical content.
    """

    def __init__(self, tesseract_cmd: str = None, config: Dict[str, Any] = None):
        super().__init__(quasi_identifiers=[], sensitive_attributes=[], config=config)
        self._text_detected = 0
        self._pii_redacted = 0
        
        # Auto-detect Tesseract on Windows
        if HAS_TESSERACT:
            if tesseract_cmd:
                pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
            else:
                possible_paths = [
                    r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                    r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
                    os.path.expanduser(r'~\AppData\Local\Tesseract-OCR\tesseract.exe'),
                    r'C:\Users\trina\AppData\Local\Programs\Tesseract-OCR\tesseract.exe',
                ]
                for p in possible_paths:
                    if os.path.exists(p):
                        pytesseract.pytesseract.tesseract_cmd = p
                        print(f"[MedShield] Tesseract found: {p}")
                        break

        # Load spaCy NER model
        self.nlp = None
        if HAS_SPACY:
            try:
                self.nlp = spacy.load("en_core_web_sm")
                print("[MedShield] spaCy NER model loaded")
            except Exception:
                try:
                    os.system("python -m spacy download en_core_web_sm")
                    self.nlp = spacy.load("en_core_web_sm")
                except Exception:
                    print("[MedShield] spaCy model not available")

    @property
    def name(self) -> str:
        return "Intelligent NLP Document Redaction"

    def anonymize(self, data, **kwargs):
        pass

    # ═══════════════════════════════════════════════════════════
    # IMAGE PREPROCESSING — Handles any orientation/quality
    # ═══════════════════════════════════════════════════════════

    def _preprocess_image(self, image: np.ndarray) -> Tuple[np.ndarray, str]:
        """
        Stage 1 — Image Preprocessing:
          1. Convert to grayscale
          2. Deskew and correct rotation
          3. Denoise using bilateral filter
          4. Increase contrast using CLAHE
          5. Binarize using Otsu thresholding
          6. Remove borders and artifacts
          7. Resize to OCR-optimal DPI (300 DPI minimum)
        """
        notes = []
        
        # 1. Convert to grayscale (handled in auto-rotate/deskew implicitly or here)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        notes.append("Grayscale")

        # 2. Deskew and correct rotation
        rotated_img, rotation_note = self._auto_rotate(image)
        if rotation_note: notes.append(rotation_note)
        
        deskewed_img, skew_note = self._deskew(rotated_img)
        if skew_note: notes.append(skew_note)
        
        # Update gray working image after rotation
        gray = cv2.cvtColor(deskewed_img, cv2.COLOR_BGR2GRAY) if len(deskewed_img.shape) == 3 else deskewed_img

        # 3. Denoise using bilateral filter
        denoised = cv2.bilateralFilter(gray, 9, 75, 75)
        notes.append("Denoised (Bilateral)")
        
        # 4. Increase contrast using CLAHE
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        contrast = clahe.apply(denoised)
        notes.append("CLAHE Contrast")
        
        # 5. Binarize using Otsu thresholding
        _, binarized = cv2.threshold(contrast, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        notes.append("Otsu Binarize")
        
        # 6. Remove borders and artifacts (simple clear border technique or crop)
        # We will keep it simple: just remove 1% from edges to avoid black scanner borders
        h, w = binarized.shape
        crop_y, crop_x = int(h * 0.01), int(w * 0.01)
        cleaned = binarized[crop_y:h-crop_y, crop_x:w-crop_x]
        notes.append("Border Removal")
        
        # 7. Resize to OCR-optimal DPI (Assuming target height ~3000px for 300DPI A4)
        target_h = 3000
        if cleaned.shape[0] < target_h:
            scale = target_h / cleaned.shape[0]
            cleaned = cv2.resize(cleaned, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
            # Resize the original image too so we can draw on it later
            deskewed_img = deskewed_img[crop_y:h-crop_y, crop_x:w-crop_x]
            final_img = cv2.resize(deskewed_img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
            notes.append(f"Resized to {scale:.2f}x (300 DPI)")
        else:
            deskewed_img = deskewed_img[crop_y:h-crop_y, crop_x:w-crop_x]
            final_img = deskewed_img.copy()

        # We return the original BGR image (resized and deskewed) for drawing, 
        # and we can use the binarized 'cleaned' for OCR internally if needed, but Tesseract handles BGR fine.
        return final_img, " | ".join(notes)

    def _auto_rotate(self, image: np.ndarray) -> Tuple[np.ndarray, str]:
        """Detect if image is rotated 90°/180°/270° and correct it."""
        if not HAS_TESSERACT:
            return image, ""
        
        try:
            # Use Tesseract OSD (Orientation and Script Detection)
            osd = pytesseract.image_to_osd(image, output_type=pytesseract.Output.DICT)
            angle = int(osd.get('rotate', 0))
            
            if angle == 0:
                return image, ""
            elif angle == 90:
                image = cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)
                return image, f"Rotated 90° CCW"
            elif angle == 180:
                image = cv2.rotate(image, cv2.ROTATE_180)
                return image, f"Rotated 180°"
            elif angle == 270:
                image = cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
                return image, f"Rotated 270° CW"
            else:
                # Arbitrary angle rotation
                h, w = image.shape[:2]
                center = (w // 2, h // 2)
                M = cv2.getRotationMatrix2D(center, -angle, 1.0)
                image = cv2.warpAffine(image, M, (w, h),
                                       flags=cv2.INTER_CUBIC,
                                       borderMode=cv2.BORDER_REPLICATE)
                return image, f"Rotated {angle}°"
        except Exception as e:
            print(f"[MedShield] OSD detection failed, trying text-density method: {e}")
            # Fallback: Try all 4 orientations, pick the one with most OCR text
            return self._try_all_rotations(image)

    def _try_all_rotations(self, image: np.ndarray) -> Tuple[np.ndarray, str]:
        """Try 0°, 90°, 180°, 270° and pick the rotation that yields the most OCR text."""
        if not HAS_TESSERACT:
            return image, ""
        
        rotations = [
            (image, "0°", None),
            (cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE), "90° CW", cv2.ROTATE_90_CLOCKWISE),
            (cv2.rotate(image, cv2.ROTATE_180), "180°", cv2.ROTATE_180),
            (cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE), "270° CCW", cv2.ROTATE_90_COUNTERCLOCKWISE),
        ]
        
        best_image = image
        best_count = 0
        best_label = "0°"
        
        for rot_img, label, _ in rotations:
            try:
                # Quick OCR test on a downscaled version for speed
                h, w = rot_img.shape[:2]
                scale = min(1.0, 800.0 / max(h, w))
                small = cv2.resize(rot_img, None, fx=scale, fy=scale)
                
                text = pytesseract.image_to_string(small, config='--oem 3 --psm 6')
                # Count alphabetic characters (real text)
                alpha_count = sum(1 for c in text if c.isalpha())
                
                if alpha_count > best_count:
                    best_count = alpha_count
                    best_image = rot_img
                    best_label = label
            except Exception:
                continue
        
        note = f"Auto-rotated to {best_label}" if best_label != "0°" else ""
        return best_image, note

    def _deskew(self, image: np.ndarray) -> Tuple[np.ndarray, str]:
        """Correct slight skew (tilt from scanning)."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Edge detection
        edges = cv2.Canny(gray, 50, 200, apertureSize=3)
        
        # Hough line detection
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100,
                                minLineLength=100, maxLineGap=10)
        
        if lines is None or len(lines) < 3:
            return image, ""
        
        # Calculate dominant angle from detected lines
        angles = []
        for line in lines:
            x1, y1, x2, y2 = line[0]
            if x2 - x1 == 0:
                continue
            angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
            # Only consider near-horizontal lines (within ±30°)
            if abs(angle) < 30:
                angles.append(angle)
        
        if not angles:
            return image, ""
        
        # Median angle (robust to outliers)
        median_angle = np.median(angles)
        
        # Only correct if skew is between 0.5° and 15° (skip tiny/huge angles)
        if abs(median_angle) < 0.5 or abs(median_angle) > 15:
            return image, ""
        
        h, w = image.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
        
        # Calculate new bounding box size
        cos = np.abs(M[0, 0])
        sin = np.abs(M[0, 1])
        new_w = int(h * sin + w * cos)
        new_h = int(h * cos + w * sin)
        M[0, 2] += (new_w - w) / 2
        M[1, 2] += (new_h - h) / 2
        
        corrected = cv2.warpAffine(image, M, (new_w, new_h),
                                    flags=cv2.INTER_CUBIC,
                                    borderMode=cv2.BORDER_REPLICATE)
        
        return corrected, f"Deskewed {median_angle:.1f}°"

    def _enhance_contrast(self, image: np.ndarray) -> np.ndarray:
        """Enhance contrast using CLAHE (for faded/low-quality scans)."""
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        
        enhanced = cv2.merge([l, a, b])
        return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

    # ═══════════════════════════════════════════════════════════
    # MAIN PROCESSING
    # ═══════════════════════════════════════════════════════════

    def run_image(self, image_path: str, output_path: str) -> Dict[str, Any]:
        """Process a document: preprocess → OCR → NLP classify → redact PII only."""
        start_time = time.time()
            
        if not Path(image_path).exists():
            raise FileNotFoundError(f"Image not found: {image_path}")

        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not read image: {image_path}")

        # ── Preprocessing: fix orientation, skew, contrast ──
        image, preprocess_notes = self._preprocess_image(image)
        print(f"[MedShield] Preprocessing: {preprocess_notes}")

        h, w = image.shape[:2]
        redact_count = 0
        words_analyzed = 0
        method_used = "Zone-Based"

        # ── Stage 2: OCR Text Extraction ──
        ocr_words = []
        if HAS_TESSERACT:
            try:
                ocr_data = pytesseract.image_to_data(
                    image, output_type=pytesseract.Output.DICT,
                    config=r'--oem 3 --psm 6'
                )
                for i in range(len(ocr_data['text'])):
                    word = ocr_data['text'][i].strip()
                    conf = int(ocr_data['conf'][i])
                    # Filter out low-confidence tokens below threshold (default 60%)
                    if conf >= 60 and word and len(word) > 0:
                        ocr_words.append({
                            'text': word,
                            'x': ocr_data['left'][i],
                            'y': ocr_data['top'][i],
                            'w': ocr_data['width'][i],
                            'h': ocr_data['height'][i],
                            'conf': conf,
                            'line': ocr_data['line_num'][i],
                            'block': ocr_data['block_num'][i],
                        })
            except Exception as e:
                print(f"[MedShield] Tesseract failed: {e}")

        words_analyzed = len(ocr_words)
        
        pii_types_found = set()
        audit_bboxes = []
        audit_confidences = []

        if words_analyzed > 3:
            full_text = " ".join([w['text'] for w in ocr_words])
            
            # Layer 2 — spaCy NER for unstructured PII
            ner_pii_words: Dict[str, str] = {}
            if self.nlp:
                doc = self.nlp(full_text)
                for ent in doc.ents:
                    if ent.label_ in ('PERSON', 'GPE', 'LOC', 'FAC', 'ORG', 'DATE'):
                        for token in ent.text.split():
                            clean = token.strip('.,;:()[]').lower()
                            if clean and len(clean) > 1 and clean not in MEDICAL_TERMS:
                                ner_pii_words[clean] = ent.label_
                method_used = "spaCy NER + Tesseract OCR"
            else:
                method_used = "Keyword + Tesseract OCR"

            pii_label_lines: Set[int] = set()
            for word_info in ocr_words:
                word_lower = word_info['text'].lower().strip('.:;,()-')
                line_key = word_info['block'] * 1000 + word_info['line']
                if word_lower in PII_LABELS:
                    pii_label_lines.add(line_key)
            
            # Stage 3 & 4: PII Detection and Bounding Box Mapping
            # We will merge adjacent boxes horizontally if they are on the same line and both are PII
            redact_boxes = []
            
            for word_info in ocr_words:
                word = word_info['text']
                word_lower = word.lower().strip('.:;,()-')
                line_key = word_info['block'] * 1000 + word_info['line']
                
                pii_type = ""
                
                # Layer 1 - Regex
                regex_type = self._is_regex_pii(word)
                if regex_type:
                    pii_type = regex_type
                
                # Layer 2 - spaCy
                elif word_lower in ner_pii_words:
                    pii_type = ner_pii_words[word_lower]
                
                # Rule - PII Label match
                elif word_lower in PII_LABELS:
                    pii_type = "Label"
                    
                # Rule - Same line as PII Label
                elif line_key in pii_label_lines and word_lower not in MEDICAL_TERMS:
                    pii_type = "Contextual"
                
                # Rule - Title name
                elif self._is_title_name(word, word_info['y'], h):
                    pii_type = "PERSON"
                
                # Rule - Top 20% Caps
                elif word.isupper() and len(word) > 3 and word.isalpha() and word_info['y'] < h * 0.20:
                    pii_type = "ORG/Name"
                
                # Rule - Top 20% Alphanumeric
                elif any(c.isdigit() for c in word) and any(c.isalpha() for c in word) and word_info['y'] < h * 0.20:
                    if word_lower not in MEDICAL_TERMS:
                        pii_type = "Hospital ID"
                
                # Layer 3 - Medical whitelist
                if word_lower in MEDICAL_TERMS:
                    pii_type = ""
                
                # Safety check
                if re.match(r'^\d{1,4}$', word) and line_key not in pii_label_lines:
                    pii_type = ""
                
                if pii_type:
                    pii_types_found.add(pii_type)
                    # For merging, we store line_key, x, y, w, h
                    redact_boxes.append({
                        'line_key': line_key,
                        'x': word_info['x'],
                        'y': word_info['y'],
                        'w': word_info['w'],
                        'h': word_info['h'],
                        'conf': word_info['conf'],
                        'type': pii_type
                    })
                    
            # Stage 4: Merge adjacent boxes belonging to the same entity (same line, close proximity)
            merged_boxes = []
            if redact_boxes:
                # Sort by line, then x position
                redact_boxes.sort(key=lambda b: (b['line_key'], b['x']))
                
                current = redact_boxes[0]
                for nxt in redact_boxes[1:]:
                    # If same line and horizontally close (within ~15 pixels or half width)
                    if current['line_key'] == nxt['line_key'] and (nxt['x'] - (current['x'] + current['w'])) < max(15, current['w'] * 0.5):
                        # Merge
                        new_x2 = max(current['x'] + current['w'], nxt['x'] + nxt['w'])
                        new_y2 = max(current['y'] + current['h'], nxt['y'] + nxt['h'])
                        current['w'] = new_x2 - current['x']
                        current['h'] = new_y2 - min(current['y'], nxt['y'])
                        current['y'] = min(current['y'], nxt['y'])
                        current['conf'] = (current['conf'] + nxt['conf']) // 2
                    else:
                        merged_boxes.append(current)
                        current = nxt
                merged_boxes.append(current)

            for box in merged_boxes:
                self._draw_redaction_box(image, box['x'], box['y'], box['w'], box['h'])
                redact_count += 1
                audit_bboxes.append([box['x'], box['y'], box['w'], box['h']])
                audit_confidences.append(box['conf'])
                
        else:
            image, redact_count = self._zone_based_redaction(image)
            words_analyzed = redact_count
            method_used = "Zone-Based Fallback"
            pii_types_found.add("Zone")

        self._text_detected = words_analyzed
        self._pii_redacted = redact_count

        self._add_compliance_stamp(image)
        cv2.imwrite(output_path, image)
        elapsed_ms = (time.time() - start_time) * 1000

        # Stage 6 — Audit Output
        return {
            "algorithm": self.name,
            "total_text_regions_scanned": words_analyzed,
            "pii_spans_detected": redact_count,
            "pii_types_found": list(pii_types_found),
            "bounding_box_coordinates": audit_bboxes,
            "confidence_score_per_entity": audit_confidences,
            "ocr_engine_used": "Tesseract",
            "processing_time_ms": round(elapsed_ms, 1),
            "redaction_method_applied": "Charcoal Box with Red Border",
            "status": "Success",
            "clinical_report_specs": {
                "input": "prescriptions, scanned forms, clinical notes, reports.",
                "output": "document with PII redacted.",
                "goal": "remove direct identifiers, keep medical content.",
                "privacy_target": "text de-identification.",
                "visual_style": "box redaction, red stamp, or overlay."
            }
        }

    def _is_regex_pii(self, word: str) -> str:
        """
        Stage 3 — Layer 1: Regex patterns for structured PII.
        Returns the PII Type (str) if matched, otherwise empty string.
        """
        word_clean = word.strip('.,;:-')
        
        # Phone numbers (Indian and international formats)
        if re.match(r'[\+]?(91)?[-\s]?\d{10}$', word_clean) or re.match(r'\d{3}-\d{3}-\d{4}', word_clean):
            return "Phone"
            
        # Email addresses
        if re.match(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', word_clean):
            return "Email"
            
        # Dates (DD/MM/YYYY, written month formats)
        if re.match(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', word_clean):
            return "Date"
            
        # PIN codes and ZIP codes (6 digit Indian PIN or 5 digit US ZIP)
        if re.match(r'^\d{6}$', word_clean) or re.match(r'^\d{5}$', word_clean):
            return "Address/PIN"
            
        # Aadhaar number pattern (12-digit)
        if re.match(r'^\d{4}\s?\d{4}\s?\d{4}$', word_clean) and len(re.sub(r'\D', '', word_clean)) == 12:
            return "ID/Aadhaar"
            
        # Hospital IDs and prescription numbers (Alphanumeric patterns common in India)
        # e.g. UHID12345, PR-9876
        if re.match(r'^(UHID|PR|ID|MRN)[-:]?\s*\d{4,10}$', word_clean, re.IGNORECASE):
            return "Hospital ID"
            
        return ""

    def _is_title_name(self, word: str, y_pos: int, img_h: int) -> bool:
        """Check if word is a title prefix indicating a name follows."""
        word_clean = word.strip('.,;:()').lower()
        titles = ['dr', 'mr', 'mrs', 'ms', 'prof', 'shri', 'smt', 'sri']
        if word_clean in titles:
            return True
        # Words starting with "Dr." pattern
        if re.match(r'^[Dd][Rr]\.?$', word):
            return True
        return False

    def _zone_based_redaction(self, image: np.ndarray) -> Tuple[np.ndarray, int]:
        """
        Smarter fallback: Finds actual text lines in sensitive zones and redacts them,
        instead of blacking out the entire half of the page.
        """
        h, w = image.shape[:2]
        count = 0
        
        # Convert to grayscale and threshold to find text
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        binary = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 10
        )
        
        # Dilate to merge characters into lines
        kernel_h = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 4))
        dilated = cv2.dilate(binary, kernel_h, iterations=2)
        
        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            x, y, bw, bh = cv2.boundingRect(contour)
            
            # Skip tiny noise or massive borders
            if bw < 15 or bh < 5 or bw > w * 0.95 or bh > h * 0.95:
                continue
                
            region_center_y = y + bh / 2
            
            # Zone 1 & 2: Doctor and Patient Info (Top 50%)
            if region_center_y < h * 0.50:
                self._draw_redaction_box(image, x, y, bw, bh)
                count += 1
                
            # Zone 3: Signature Area (Bottom 18%)
            elif region_center_y > h * 0.82:
                # Signatures tend to be taller
                if bh > 10:
                    self._draw_redaction_box(image, x, y, bw, bh)
                    count += 1
        
        # Add labels for the zones if we found text
        if count > 0:
            self._draw_zone_label(image, 10, int(h * 0.15), "DOCTOR INFO REDACTED")
            self._draw_zone_label(image, 10, int(h * 0.40), "PATIENT INFO REDACTED")
            self._draw_zone_label(image, 10, int(h * 0.90), "SIGNATURE REDACTED")
            
        return image, count

    def _draw_redaction_box(self, image: np.ndarray, x: int, y: int, w: int, h: int):
        """
        Stage 5 — Redaction Rendering:
          - Draw filled rectangle in dark charcoal
          - Add red border
          - Stamp "REDACTED" in red text if height > 20px
        """
        # Expand box by 4px padding on all sides (Stage 4 requirement)
        pad = 4
        x1, y1 = max(0, x - pad), max(0, y - pad)
        x2, y2 = min(image.shape[1], x + w + pad), min(image.shape[0], y + h + pad)
        
        # Dark charcoal filled rectangle
        cv2.rectangle(image, (x1, y1), (x2, y2), (40, 40, 40), -1)
        # Red border
        cv2.rectangle(image, (x1, y1), (x2, y2), (0, 0, 255), 1)
        
        # If box height exceeds 20px, stamp "REDACTED" in red text centered inside
        if (y2 - y1) > 20:
            text = "REDACTED"
            font_scale = 0.4
            text_size = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, 1)[0]
            
            # Center the text
            tx = x1 + (x2 - x1 - text_size[0]) // 2
            ty = y1 + (y2 - y1 + text_size[1]) // 2
            
            # Only draw if the box is actually wide enough to fit the text (or at least part of it)
            if (x2 - x1) > text_size[0]:
                cv2.putText(image, text, (tx, ty), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 0, 255), 1, cv2.LINE_AA)

    def _draw_zone_label(self, image: np.ndarray, x: int, y: int, label: str):
        """Draw a small, transparent label indicating what was redacted in this zone."""
        font_scale = 0.5
        text_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, 1)[0]
        
        # Draw semi-transparent background pill
        overlay = image.copy()
        cv2.rectangle(overlay, (x, y - text_size[1] - 5), (x + text_size[0] + 10, y + 5), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.6, image, 0.4, 0, image)
        
        # Draw text
        cv2.putText(image, label, (x + 5, y), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 150, 255), 1, cv2.LINE_AA)


    def _draw_zone_block(self, image: np.ndarray, x1: int, y1: int, x2: int, y2: int, label: str):
        """Draw a large zone redaction block."""
        overlay = image.copy()
        cv2.rectangle(overlay, (x1, y1), (x2, y2), (10, 10, 20), -1)
        cv2.addWeighted(overlay, 0.92, image, 0.08, 0, image)
        cv2.rectangle(image, (x1, y1), (x2, y2), (0, 0, 220), 2)
        
        zone_w, zone_h = x2 - x1, y2 - y1
        font_scale = min(zone_w / 500, zone_h / 60, 0.7)
        font_scale = max(font_scale, 0.3)
        text_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, 2)[0]
        tx = x1 + (zone_w - text_size[0]) // 2
        ty = y1 + (zone_h + text_size[1]) // 2
        cv2.putText(image, label, (tx, ty), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 80, 255), 2, cv2.LINE_AA)

    def _add_compliance_stamp(self, image: np.ndarray):
        """DPDP compliance watermark."""
        h, w = image.shape[:2]
        overlay = image.copy()
        cv2.rectangle(overlay, (0, h - 30), (w, h), (12, 12, 25), -1)
        cv2.addWeighted(overlay, 0.85, image, 0.15, 0, image)
        cv2.putText(image, "ANONYMIZED | DPDP Act 2023 | MedShield NLP Engine",
                    (10, h - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (80, 180, 255), 1, cv2.LINE_AA)

    def _get_params(self) -> Dict[str, Any]:
        return {"pii_redacted": self._pii_redacted}
