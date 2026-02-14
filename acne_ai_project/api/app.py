
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, request, jsonify
from flask_cors import CORS
from inference.pipeline import AcnePipeline
import cv2
import numpy as np

app = Flask(__name__)
CORS(app)

# Initialize Pipeline (Loads models)
try:
    pipeline = AcnePipeline()
except Exception as e:
    print(f"Error initializing pipeline: {e}")
    pipeline = None

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "model_loaded": pipeline is not None})

@app.route('/predict', methods=['POST'])
def predict():
    if not pipeline:
        return jsonify({"error": "Model not loaded"}), 500
        
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
        
    file = request.files['image']
    skin_type = request.form.get('skin_type', 'Normal')
    
    # Read image bytes directly — no temp file needed
    image_bytes = file.read()
    
    # Run Inference
    try:
        report = pipeline.predict(image_bytes=image_bytes, skin_type=skin_type)
        return jsonify(report)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
