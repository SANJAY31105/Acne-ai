import { FaceValidator } from './face_validator.js';
import { LightingValidator } from './lighting_validator.js';
import { ImageQualityValidator } from './image_quality_validator.js';
import { ScannerOverlay } from './scanner_overlay.js';
import { WarningManager } from './warning_manager.js';

class ScanController {
    constructor() {
        this.video = document.getElementById('camera-feed');
        this.canvas = document.getElementById('overlay'); // Renamed from scanner-overlay to match HTML plan
        // Actually, HTML plan had specific IDs. Let's stick to a simple overlay canvas.
        // Wait, the detailed request had 'scanner-overlay' AND 'detection-canvas'.
        // I will simplify to one main overlay canvas for drawing.

        this.faceValidator = new FaceValidator();
        this.lightingValidator = new LightingValidator();
        this.qualityValidator = new ImageQualityValidator();
        this.overlay = new ScannerOverlay(this.canvas);
        this.warningManager = new WarningManager();

        this.isScanning = false;
        this.animationId = null;
    }

    async initialize() {
        try {
            await this.faceValidator.initialize();
            await this.startCamera();

            // Start Loop
            this.startScanning();

            // Bind Buttons
            document.getElementById('btn-scan').addEventListener('click', () => {
                this.capture();
            });

            console.log("ScanController initialized");
        } catch (e) {
            console.error("Init failed:", e);
            this.warningManager.show('CRITICAL', 'Failed to initialize scanner. ' + e.message);
        }
    }

    async startCamera() {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        this.video.srcObject = stream;

        return new Promise((resolve) => {
            this.video.onloadedmetadata = () => {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
                resolve();
            };
        });
    }

    startScanning() {
        this.isScanning = true;
        this.loop();
    }

    stopScanning() {
        this.isScanning = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }

    async loop() {
        if (!this.isScanning) return;

        // 1. Draw Video Frame to Canvas (for analysis)
        // Actually face-api takes video element directly.
        // Lighting validator needs image data.
        const ctx = this.canvas.getContext('2d');
        // We don't draw video to canvas, we draw OVER video.
        // But for analysis we need pixel data.

        // Create an offscreen canvas for pixel analysis if needed, 
        // or just read from a small hidden canvas to be fast.
        if (!this.analysisCanvas) {
            this.analysisCanvas = document.createElement('canvas');
            this.analysisCanvas.width = 160; // Downscale for speed
            this.analysisCanvas.height = 120;
        }
        const actx = this.analysisCanvas.getContext('2d');
        actx.drawImage(this.video, 0, 0, this.analysisCanvas.width, this.analysisCanvas.height);
        const imageData = actx.getImageData(0, 0, this.analysisCanvas.width, this.analysisCanvas.height);

        // 2. Run Validators
        // a. Lighting
        const lightingResult = this.lightingValidator.analyze(imageData);

        // b. Face
        const faceResult = await this.faceValidator.validate(this.video, this.canvas);

        // c. Quality
        const qualityResult = this.qualityValidator.validate(imageData);

        // 3. Update UI
        // Priority: Critical (Lighting/Face) -> Warning -> Success
        let status = 'OK';
        let msg = 'Ready to Scan';

        if (faceResult.status !== 'OK') {
            status = faceResult.status;
            msg = faceResult.message;
        } else if (!lightingResult.isValid) {
            status = lightingResult.status;
            msg = lightingResult.message;
        } else if (!qualityResult.isValid) {
            status = qualityResult.status;
            msg = qualityResult.message;
        }

        this.overlay.draw(status, faceResult);

        // Update Banner / Button
        if (status === 'OK') {
            this.warningManager.show('SUCCESS', '✅ Perfect! Face is ready.');
        } else {
            // Determine severity
            const type = (status.includes('TOO') || status === 'NO_FACE') ? 'CRITICAL' : 'WARNING';
            this.warningManager.show(type, msg);
        }

        // Update Panel
        this.warningManager.updateStatusPanel(faceResult, lightingResult, qualityResult);

        this.animationId = requestAnimationFrame(() => this.loop());
    }

    capture() {
        this.stopScanning();
        // Capture logic here... transition to dashboard
        // For now just alert
        alert("Scan Captured! (Transitioning...)");

        // Simulate result for now
        setTimeout(() => {
            // Redirect or show results
            // window.location.href = ...
        }, 1000);
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    const controller = new ScanController();
    controller.initialize();
});
