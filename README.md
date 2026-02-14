# Acne AI 🧴🤖

**Acne AI** is an intelligent dermatology assistant that identifies acne types from images and provides personalized, severity-based treatment recommendations.

![Acne AI Demo](public/preview.png)

## 🚀 Features

-   **AI Analysis**: Detects 6 types of acne (Blackheads, Whiteheads, Papules, Pustules, Nodules, Cystic).
-   **Severity Assessment**: Classifies conditions as Mild, Moderate, or Severe.
-   **Smart Recommendations**: Provides actionable OTC advice or doctor referrals based on severity.
-   **Privacy-First**: "Clear History" feature allows users to wipe their data instantly.
-   **History Tracking**: Local-storage based history of past scans.
-   **Modern UI**: Built with Next.js, Tailwind CSS, and Framer Motion.

## 🛠️ Tech Stack

-   **Frontend**: Next.js 14, React, Tailwind CSS, Lucide Icons, Framer Motion.
-   **Backend**: Python, Flask, PyTorch (backend for Keras 3), OpenCV, MediaPipe.
-   **AI/ML**: Keras 3 (EfficientNetB3), YOLOv8 (Spot Detection), MediaPipe (Face Detection).
-   **Deployment**: Docker ready.

## 📦 Installation

### Prerequisites
-   Node.js 18+
-   Python 3.10+
-   CUDA-enabled GPU (Optional, for faster training)

### 1. Backend Setup
```bash
# Clone repository
git clone https://github.com/Bhyg-03/Acne-Ai.git
cd Acne-Ai/acne_ai_project

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Frontend Setup
```bash
# Navigate to app directory
cd ../

# Install dependencies
npm install

# Run development server
npm run dev
```

### 3. Running the Inference Server
```bash
# From acne_ai_project directory
python api/app.py
```

## 🧠 Model Training

To train the classification model on your own dataset:
1.  Place images in `data/processed` organized by class folders.
2.  Run the training script:
```bash
python training/train_classifier.py
```
*Note: Configurable parameters (Learning Rate, Epochs) are in `config/config.yaml`.*

## 🔒 Privacy

No image data is sent to the cloud for storage.
-   **Analysis**: Images are processed in RAM by the Python backend and discarded.
-   **History**: Scan results are stored **locally** in your browser (`localStorage`).
-   **Clear Data**: Use the "Clear History" button to remove all traces.

## 📜 License
MIT License.
