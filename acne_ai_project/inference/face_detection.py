
import cv2
import numpy as np

class FaceDetector:
    def __init__(self, min_detection_confidence=0.5):
        self.use_mediapipe = False
        try:
            import mediapipe as mp
            self.mp_face_detection = mp.solutions.face_detection
            self.face_detection = self.mp_face_detection.FaceDetection(
                min_detection_confidence=min_detection_confidence)
            self.use_mediapipe = True
        except ImportError:
            print("Warning: MediaPipe not found. Using fallback face detection (center crop).")
        except AttributeError:
             print("Warning: MediaPipe found but missing attributes. Using fallback face detection (center crop).")

    def detect_and_crop(self, image, padding=0.2):
        """
        Detects face in image and crops with padding.
        Returns: cropped_face (numpy array) or None if no face found.
        """
        if isinstance(image, str):
            image = cv2.imread(image)
            if image is None: return None, None
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        h, w, c = image.shape
        
        if self.use_mediapipe:
            try:
                results = self.face_detection.process(image)
                
                if results.detections:
                    # Assume detecting the largest face if multiple
                    detection = results.detections[0] # Simplification
                    
                    bboxC = detection.location_data.relative_bounding_box
                    
                    x = int(bboxC.xmin * w)
                    y = int(bboxC.ymin * h)
                    box_w = int(bboxC.width * w)
                    box_h = int(bboxC.height * h)
                    
                    # Apply padding
                    x_pad = int(box_w * padding)
                    y_pad = int(box_h * padding)
                    
                    x_start = max(0, x - x_pad)
                    y_start = max(0, y - y_pad)
                    x_end = min(w, x + box_w + x_pad)
                    y_end = min(h, y + box_h + y_pad)
                    
                    cropped_face = image[y_start:y_end, x_start:x_end]
                    
                    return cropped_face, (x_start, y_start, x_end, y_end)
            except Exception as e:
                print(f"MediaPipe error: {e}")
        
        # Fallback: No face detected — return None to signal rejection
        print("No face detected in image.")
        return None, None
