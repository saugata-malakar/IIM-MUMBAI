"""
Image Anonymization Algorithm
Detects and masks faces in clinical images using OpenCV Haar Cascades + MediaPipe.
Robust fallback: always works even without MediaPipe.
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Tuple
import time

from medshield.algorithms.base import BaseAnonymizer, AnonymizationResult

# Try to load MediaPipe, but gracefully handle API changes
HAS_MEDIAPIPE = False
try:
    import mediapipe as mp
    # Check if the new or old API is available
    if hasattr(mp, 'solutions') and hasattr(mp.solutions, 'face_detection'):
        HAS_MEDIAPIPE = True
except Exception:
    pass


class ImageFaceRedactor(BaseAnonymizer):
    """
    Detects and redacts faces in clinical images to protect patient identity.
    Primary: OpenCV Haar Cascades (works everywhere).
    Enhanced: MediaPipe Face Detection (when available).
    
    Parameters:
        blur_mode (str): 'pixelate', 'blur', or 'solid'. Default 'pixelate'.
        blur_intensity (int): Intensity of the blur/pixelation.
        min_confidence (float): Minimum confidence threshold for face detection.
    """

    def __init__(self, blur_mode: str = "pixelate", blur_intensity: int = 15,
                 min_confidence: float = 0.75, config: Dict[str, Any] = None):
        super().__init__(quasi_identifiers=[], sensitive_attributes=[], config=config)
        
        # Accept config overrides
        if config:
            self.blur_mode = config.get("masking_mode", blur_mode)
            self.blur_intensity = config.get("blur_intensity", blur_intensity)
        else:
            self.blur_mode = blur_mode
            self.blur_intensity = blur_intensity
            
        self.min_confidence = min_confidence
        
        # Stage 2: Initialize MediaPipe (Primary Detector)
        self.face_detector = None
        if HAS_MEDIAPIPE:
            try:
                self.mp_face_detection = mp.solutions.face_detection
                self.face_detector = self.mp_face_detection.FaceDetection(
                    min_detection_confidence=self.min_confidence
                )
            except Exception:
                self.face_detector = None

    @property
    def name(self) -> str:
        return f"Image Face Redactor ({self.blur_mode})"

    def anonymize(self, data, **kwargs):
        pass

    def run_image(self, image_path: str, output_path: str) -> Dict[str, Any]:
        """Process a single clinical image through the 6-stage anonymization pipeline."""
        start_time = time.time()
        
        if not Path(image_path).exists():
            raise FileNotFoundError(f"Image not found: {image_path}")

        # ── Stage 1: Image Preprocessing ──
        # Load image in original resolution
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not read image: {image_path}")

        # Optionally resize for detection speed if very large (e.g. > 4K)
        h, w = image.shape[:2]
        if h > 4000 or w > 4000:
            scale = 4000 / max(h, w)
            image = cv2.resize(image, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)

        # ── Stage 2: Face Detection ──
        audit_bboxes = []
        audit_confidences = []
        model_used = ""

        # Primary detector: MediaPipe
        if self.face_detector is not None:
            faces, confs = self._detect_mediapipe(image)
            model_used = "MediaPipe Face Detection"
        else:
            faces, confs = [], []
            
        # Fallback: Haar Cascades
        if len(faces) == 0:
            faces, confs = self._detect_haar(image)
            model_used = "OpenCV Haar Cascades"
            
        # NMS Deduplication (part of Stage 2)
        unique_faces, unique_confs = self._deduplicate_faces(faces, confs)
        
        faces_detected = len(unique_faces)
        faces_anonymized = 0
        
        for (x, y, fw, fh), conf in zip(unique_faces, unique_confs):
            # ── Stage 3: Region Expansion ──
            # Expand each bounding box by 10-15% on all sides
            expand_w = int(fw * 0.15)
            expand_h = int(fh * 0.15)
            
            x1 = max(0, x - expand_w)
            y1 = max(0, y - expand_h)
            x2 = min(image.shape[1], x + fw + expand_w)
            y2 = min(image.shape[0], y + fh + expand_h)
            
            # ── Stage 4: Anonymization (actual privacy step) ──
            image = self._apply_anonymization(image, x1, y1, x2, y2)
            
            # ── Stage 5: UI Overlay (visual layer only) ──
            image = self._draw_ui_overlay(image, x1, y1, x2, y2)
            
            faces_anonymized += 1
            audit_bboxes.append([x1, y1, x2 - x1, y2 - y1])
            audit_confidences.append(conf)

        cv2.imwrite(output_path, image)
        elapsed_ms = (time.time() - start_time) * 1000

        # ── Stage 6: Audit Output ──
        return {
            "algorithm": self.name,
            "original_path": image_path,
            "output_path": output_path,
            "faces_detected": faces_detected,
            "faces_anonymized": faces_anonymized,
            "bounding_box_coordinates": audit_bboxes,
            "detection_confidence_per_face": audit_confidences,
            "anonymization_mode_applied": self.blur_mode.capitalize(),
            "processing_time_ms": round(elapsed_ms, 1),
            "model_used": model_used,
            "status": "Success" if faces_detected > 0 else "No faces detected",
            "clinical_report_specs": {
                "input": "clinical photographs, patient images, ID-like medical visuals.",
                "output": "anonymized image with face removed or obscured.",
                "goal": "preserve clinical utility, remove identity cues.",
                "privacy_target": "biometric de-identification.",
                "visual_style": "optional overlay for UI clarity, not the privacy method."
            }
        }

    def _detect_mediapipe(self, image: np.ndarray) -> Tuple[List[Tuple[int, int, int, int]], List[float]]:
        # Convert to RGB for model compatibility
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.face_detector.process(rgb_image)
        
        faces = []
        confs = []
        h, w = image.shape[:2]

        if results.detections:
            for detection in results.detections:
                conf = detection.score[0] if detection.score else 1.0
                if conf >= self.min_confidence:
                    bboxC = detection.location_data.relative_bounding_box
                    x = int(bboxC.xmin * w)
                    y = int(bboxC.ymin * h)
                    fw = int(bboxC.width * w)
                    fh = int(bboxC.height * h)
                    faces.append((x, y, fw, fh))
                    confs.append(round(conf, 2))
                    
        return faces, confs

    def _detect_haar(self, image: np.ndarray) -> Tuple[List[Tuple[int, int, int, int]], List[float]]:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        gray_enhanced = clahe.apply(gray)
        
        cascades = [
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml',
            cv2.data.haarcascades + 'haarcascade_frontalface_alt2.xml',
            cv2.data.haarcascades + 'haarcascade_profileface.xml',
        ]
        
        faces = []
        confs = []
        for cascade_path in cascades:
            try:
                face_cascade = cv2.CascadeClassifier(cascade_path)
                detections = face_cascade.detectMultiScale(
                    gray_enhanced, scaleFactor=1.1, minNeighbors=4, minSize=(30, 30)
                )
                for (x, y, w, h) in detections:
                    faces.append((x, y, w, h))
                    confs.append(0.60) # Default moderate confidence for Haar
            except Exception as e:
                print(f"[MedShield] Cascade {cascade_path} failed: {e}")
                
        return faces, confs

    def _deduplicate_faces(self, faces: List, confs: List) -> Tuple[List, List]:
        if not faces:
            return [], []
            
        unique_faces = []
        unique_confs = []
        
        for i, face in enumerate(faces):
            is_dup = False
            for existing in unique_faces:
                x_overlap = max(0, min(face[0]+face[2], existing[0]+existing[2]) - max(face[0], existing[0]))
                y_overlap = max(0, min(face[1]+face[3], existing[1]+existing[3]) - max(face[1], existing[1]))
                overlap_area = x_overlap * y_overlap
                face_area = face[2] * face[3]
                if face_area > 0 and overlap_area / face_area > 0.4:
                    is_dup = True
                    break
            if not is_dup:
                unique_faces.append(face)
                unique_confs.append(confs[i])
                
        return unique_faces, unique_confs

    def _apply_anonymization(self, image: np.ndarray, x1: int, y1: int, x2: int, y2: int) -> np.ndarray:
        face_region = image[y1:y2, x1:x2]
        if face_region.size == 0:
            return image
            
        if self.blur_mode == "pixelate":
            # Mode B: downsample to 8x8 then upsample back
            h, w = face_region.shape[:2]
            temp = cv2.resize(face_region, (8, 8), interpolation=cv2.INTER_LINEAR)
            redacted = cv2.resize(temp, (w, h), interpolation=cv2.INTER_NEAREST)
        elif self.blur_mode == "blur":
            # Mode A: strong Gaussian blur (kernel 51x51 or higher)
            redacted = cv2.GaussianBlur(face_region, (51, 51), 0)
        elif self.blur_mode == "solid":
            # Mode C: uniform dark color
            redacted = np.zeros_like(face_region)
            redacted[:] = (20, 20, 20)
        elif self.blur_mode == "noise" or self.blur_mode == "frame":
            # Mode D: Gaussian noise
            h, w, c = face_region.shape
            noise = np.random.randint(0, 256, (h, w, c), dtype=np.uint8)
            redacted = noise
        else:
            redacted = cv2.GaussianBlur(face_region, (51, 51), 0)

        image[y1:y2, x1:x2] = redacted
        return image

    def _draw_ui_overlay(self, image: np.ndarray, x1: int, y1: int, x2: int, y2: int) -> np.ndarray:
        # Cyberpunk bracket frame in bright green
        color = (0, 255, 0)
        thickness = 2
        corner_len = min(20, (x2-x1)//4)
        
        # Top-left
        cv2.line(image, (x1, y1), (x1 + corner_len, y1), color, thickness)
        cv2.line(image, (x1, y1), (x1, y1 + corner_len), color, thickness)
        # Top-right
        cv2.line(image, (x2, y1), (x2 - corner_len, y1), color, thickness)
        cv2.line(image, (x2, y1), (x2, y1 + corner_len), color, thickness)
        # Bottom-left
        cv2.line(image, (x1, y2), (x1 + corner_len, y2), color, thickness)
        cv2.line(image, (x1, y2), (x1, y2 - corner_len), color, thickness)
        # Bottom-right
        cv2.line(image, (x2, y2), (x2 - corner_len, y2), color, thickness)
        cv2.line(image, (x2, y2), (x2, y2 - corner_len), color, thickness)
        
        # Stamp "ANONYMIZED" label above the box
        cv2.putText(image, "ANONYMIZED", (x1, max(15, y1 - 8)), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1, cv2.LINE_AA)
        return image

    def _get_params(self) -> Dict[str, Any]:
        return {
            "blur_mode": self.blur_mode,
            "blur_intensity": self.blur_intensity,
            "min_confidence": self.min_confidence,
            "faces_detected": getattr(self, "_faces_detected", 0)
        }
