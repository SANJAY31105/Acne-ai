
import cv2
import json
import os
import sys

# Set Keras Backend to PyTorch
os.environ["KERAS_BACKEND"] = "torch"

import keras
import numpy as np
from inference.face_detection import FaceDetector
import yaml

# Add project root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Severity labels (must match training folder order: alphabetical)
SEVERITY_LABELS = {0: "Mild", 1: "Moderate", 2: "Severe"}

def load_config(config_path=None):
    if config_path is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        config_path = os.path.join(base_dir, "config", "config.yaml")
    
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

class AcnePipeline:
    def __init__(self):
        self.config = load_config()
        self.labels = SEVERITY_LABELS
        
        # Load Face Detector
        self.face_detector = FaceDetector()
        
        # Load Severity Classifier (MobileNetV2)
        self.classifier_path = os.path.join(self.config['paths']['models'], 'best_severity.keras')
        if os.path.exists(self.classifier_path):
            try:
                self.classifier = keras.saving.load_model(self.classifier_path)
                print(f"Severity classifier loaded (Keras 3 / PyTorch): {self.classifier_path}")
            except Exception as e:
                print(f"Failed to load severity classifier: {e}")
                self.classifier = None
        else:
            print("Warning: Severity model not found. Using mock mode.")
            self.classifier = None
        
    def mock_predict(self, image_path):
        """Simulate a severity prediction for testing."""
        import random
        
        severity = random.choice(["Mild", "Moderate", "Severe"])
        confidence = round(random.uniform(65.0, 95.0), 2)
        
        report = {
            "status": "success",
            "mode": "mock",
            "face_detected": True,
            "primary_diagnosis": {
                "severity": severity,
                "confidence": confidence
            },
            "recommendations": self.get_recommendations(severity)
        }
        return report

    def get_recommendations(self, severity, skin_type="Normal"):
        """Fetch personalized recommendations based on severity + skin type."""
        rec_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config", "recommendations.json")
        
        try:
            with open(rec_path, 'r') as f:
                recommendations_db = json.load(f)
        except Exception as e:
            print(f"Error loading recommendations: {e}")
            return {
                "likely_types": [],
                "personalized_plan": ["Consult a dermatologist for professional advice."],
                "type_treatments": {}
            }

        if severity in recommendations_db:
            entry = recommendations_db[severity]
            # Get skin-type-specific recommendations
            skin_recs = entry.get("by_skin_type", {}).get(skin_type, entry.get("general", []))
            return {
                "likely_types": entry.get("likely_types", []),
                "personalized_plan": skin_recs,
                "type_treatments": entry.get("type_treatments", {})
            }
        return {
            "likely_types": [],
            "personalized_plan": ["Keep skin clean.", "Use non-comedogenic products."],
            "type_treatments": {}
        }

    def predict(self, image_path=None, skin_type="Normal", image_bytes=None):
        """
        Full pipeline:
        1. Read Image (from bytes or file path)
        2. Optionally detect face
        3. Classify severity (Mild/Moderate/Severe)
        4. Generate Report with likely acne types + personalized recommendations
        """
        # FALLBACK TO MOCK IF NO CLASSIFIER
        if self.classifier is None:
            print("Using MOCK inference (severity model missing).")
            return self.mock_predict(image_path)

        # 1. Read Image — prefer in-memory bytes to avoid filesystem issues
        if image_bytes is not None:
            nparr = np.frombuffer(image_bytes, np.uint8)
            original_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        elif image_path is not None:
            original_img = cv2.imread(image_path)
        else:
            return {"status": "error", "message": "No image provided"}
            
        if original_img is None:
            return {"status": "error", "message": "Could not read image"}
            
        rgb_img = cv2.cvtColor(original_img, cv2.COLOR_BGR2RGB)
        
        # 2. Face Detection (REQUIRED — reject non-face images)
        cropped_face, bbox = self.face_detector.detect_and_crop(rgb_img)
        
        if cropped_face is not None:
            analysis_img = cropped_face
            face_detected = True
        else:
            # NO face found → reject the image
            return {
                "status": "error",
                "message": "No face detected. Please upload a clear photo of your face.",
                "face_detected": False
            }
            
        # 3. Severity Classification
        img_size = tuple(self.config['data']['image_size'])
        input_img = cv2.resize(analysis_img, img_size)
        input_img = input_img / 255.0
        input_img = np.expand_dims(input_img, axis=0)
        
        preds = self.classifier.predict(input_img, verbose=0)
        top_idx = int(np.argmax(preds[0]))
        confidence = float(preds[0][top_idx]) * 100

        severity = self.labels[top_idx]
        
        # Uncertainty handling
        if confidence < 40.0:
            severity = "Inconclusive"
            
        # 4. Generate Report
        report = {
            "status": "success",
            "mode": "real",
            "face_detected": face_detected,
            "primary_diagnosis": {
                "severity": severity,
                "confidence": round(confidence, 2)
            },
            "skin_type": skin_type,
            "recommendations": self.get_recommendations(severity, skin_type)
        }
        
        return report

if __name__ == "__main__":
    pipeline = AcnePipeline()
    print("Pipeline ready.")
