"""
Image Anonymization Algorithm
Detects and masks faces in clinical images using MediaPipe/OpenCV.
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Tuple
import time

try:
    import mediapipe as mp
    HAS_MEDIAPIPE = True
except ImportError:
    HAS_MEDIAPIPE = False

from medshield.algorithms.base import BaseAnonymizer, AnonymizationResult


class ImageFaceRedactor(BaseAnonymizer):
    """
    Detects and redacts faces in clinical images to protect patient identity.
    Uses MediaPipe Face Detection for high accuracy.
    
    Parameters:
        blur_mode (str): 'pixelate', 'blur', or 'solid'. Default 'pixelate'.
        blur_intensity (int): Intensity of the blur/pixelation.
        min_confidence (float): Minimum confidence threshold for face detection.
    """

    def __init__(self, blur_mode: str = "pixelate", blur_intensity: int = 15,
                 min_confidence: float = 0.5, config: Dict[str, Any] = None):
        super().__init__(quasi_identifiers=[], sensitive_attributes=[], config=config)
        self.blur_mode = blur_mode
        self.blur_intensity = blur_intensity
        self.min_confidence = min_confidence
        self._faces_detected = 0
        
        if HAS_MEDIAPIPE:
            self.mp_face_detection = mp.solutions.face_detection
            self.face_detector = self.mp_face_detection.FaceDetection(
                min_detection_confidence=self.min_confidence
            )

    @property
    def name(self) -> str:
        return f"Image Face Redactor ({self.blur_mode})"

    def anonymize(self, data, **kwargs):
        # BaseAnonymizer expects DataFrame, but we handle images here
        # So we override the run method or handle image paths
        pass

    def run_image(self, image_path: str, output_path: str) -> Dict[str, Any]:
        """Process a single image."""
        start_time = time.time()
        
        if not Path(image_path).exists():
            raise FileNotFoundError(f"Image not found: {image_path}")

        # Read image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not read image: {image_path}")

        original_image = image.copy()
        
        # Detect and redact
        if HAS_MEDIAPIPE:
            image, faces_found = self._redact_mediapipe(image)
        else:
            image, faces_found = self._redact_haar(image)
            
        self._faces_detected = faces_found

        # Save result
        cv2.imwrite(output_path, image)
        
        elapsed_ms = (time.time() - start_time) * 1000

        return {
            "algorithm": self.name,
            "original_path": image_path,
            "output_path": output_path,
            "faces_detected": faces_found,
            "processing_time_ms": elapsed_ms,
            "status": "Success" if faces_found > 0 else "No faces detected"
        }

    def _redact_mediapipe(self, image: np.ndarray) -> Tuple[np.ndarray, int]:
        """Detect using MediaPipe."""
        # Convert the BGR image to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.face_detector.process(rgb_image)
        
        faces_found = 0
        h, w, _ = image.shape

        if results.detections:
            for detection in results.detections:
                faces_found += 1
                bboxC = detection.location_data.relative_bounding_box
                
                # Convert relative bounding box to absolute coordinates
                x1 = max(0, int(bboxC.xmin * w))
                y1 = max(0, int(bboxC.ymin * h))
                x2 = min(w, int((bboxC.xmin + bboxC.width) * w))
                y2 = min(h, int((bboxC.ymin + bboxC.height) * h))
                
                # Expand box slightly to cover whole head
                expand_h = int((y2 - y1) * 0.2)
                expand_w = int((x2 - x1) * 0.1)
                
                y1 = max(0, y1 - expand_h)
                x1 = max(0, x1 - expand_w)
                x2 = min(w, x2 + expand_w)
                
                image = self._apply_redaction(image, x1, y1, x2, y2)
                
        return image, faces_found

    def _redact_haar(self, image: np.ndarray) -> Tuple[np.ndarray, int]:
        """Fallback: Detect using OpenCV Haar Cascades."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        for (x, y, w, h) in faces:
            image = self._apply_redaction(image, x, y, x + w, y + h)
            
        return image, len(faces)

    def _apply_redaction(self, image: np.ndarray, x1: int, y1: int, x2: int, y2: int) -> np.ndarray:
        """Apply the selected redaction effect to the bounding box."""
        face_region = image[y1:y2, x1:x2]
        
        if face_region.size == 0:
            return image
            
        if self.blur_mode == "pixelate":
            # Shrink and enlarge to pixelate
            h, w = face_region.shape[:2]
            temp = cv2.resize(face_region, (max(1, w // self.blur_intensity), max(1, h // self.blur_intensity)), interpolation=cv2.INTER_LINEAR)
            redacted = cv2.resize(temp, (w, h), interpolation=cv2.INTER_NEAREST)
        elif self.blur_mode == "blur":
            kernel_size = (self.blur_intensity * 2 + 1, self.blur_intensity * 2 + 1)
            redacted = cv2.GaussianBlur(face_region, kernel_size, 0)
        elif self.blur_mode == "solid":
            redacted = np.zeros_like(face_region) # Black box
        else:
            redacted = face_region

        image[y1:y2, x1:x2] = redacted
        
        # Add engaging high-tech visual frame around the redacted face
        color = (0, 255, 0) if self.blur_mode != "solid" else (0, 0, 255)
        
        # Draw corners for a "scanner" look
        corner_len = min(20, (x2-x1)//4)
        thickness = 2
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
        
        # Add tiny "ANONYMIZED" text above the face
        cv2.putText(image, "ANONYMIZED", (x1, max(10, y1 - 5)), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)

        return image

    def _get_params(self) -> Dict[str, Any]:
        return {
            "blur_mode": self.blur_mode,
            "blur_intensity": self.blur_intensity,
            "faces_detected": self._faces_detected
        }
