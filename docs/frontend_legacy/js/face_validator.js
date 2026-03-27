/**
 * Face Validator
 * Uses face-api.js to detect face presence, position, orientation, and expressions.
 */
export class FaceValidator {
    constructor() {
        this.modelLoaded = false;
        // Thresholds
        this.minFaceRatio = 0.35; // 35% of frame
        this.maxFaceRatio = 0.95; // 95% of frame
        this.maxCenterOffset = 0.15; // 15% deviation
        this.maxAngle = 15; // 15 degrees tilt
        this.maxYaw = 20; // 20 degrees turn
    }

    async initialize() {
        try {
            // Load models from local public/models directory
            const MODEL_URL = './public/models'; // Relative path
            // Check if global faceapi exists
            if (typeof faceapi === 'undefined') {
                throw new Error('face-api.js not loaded');
            }

            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
            await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
            await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

            this.modelLoaded = true;
            console.log("FaceValidator: Models loaded");
        } catch (e) {
            console.error("FaceValidator Init Error:", e);
            throw e;
        }
    }

    async validate(videoElement, overlayCanvas) {
        if (!this.modelLoaded || videoElement.paused || videoElement.ended) {
            return { isValid: false, status: 'LOADING', message: 'Loading models...' };
        }

        const displaySize = { width: videoElement.videoWidth, height: videoElement.videoHeight };
        // Ensure overlay matches video size
        if (overlayCanvas.width !== displaySize.width) {
            faceapi.matchDimensions(overlayCanvas, displaySize);
        }

        // Detect All Faces
        const detections = await faceapi.detectAllFaces(
            videoElement,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
        ).withFaceLandmarks().withFaceExpressions();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        // --- Logic Evaluator ---

        // 1. No Face
        if (resizedDetections.length === 0) {
            return { isValid: false, status: 'NO_FACE', message: '😶 No face detected. Position face in oval.' };
        }

        // 2. Multiple Faces
        if (resizedDetections.length > 1) {
            return { isValid: false, status: 'MULTIPLE_FACES', message: '👥 Multiple faces detected. One person only.' };
        }

        const detection = resizedDetections[0];
        const box = detection.detection.box;

        // Frame Metrics
        const frameW = displaySize.width;
        const frameH = displaySize.height;
        const centerX = frameW / 2;
        const centerY = frameH / 2;

        const faceCenterX = box.x + box.width / 2;
        const faceCenterY = box.y + box.height / 2;

        // --- Position Checks ---

        // 3. Distance (Size Ratio)
        // Oval is approx 60% width * 75% height of viewport
        // We compare face box area to frame area scaling
        // Using "face width relative to frame width" is easier
        const faceWidthRatio = box.width / frameW;

        if (faceWidthRatio < 0.25) { // Too small (< 25% width)
            return { isValid: false, status: 'TOO_FAR', message: '📏 Too far away. Move closer.', correction: 'move-closer' };
        }
        if (faceWidthRatio > 0.85) { // Too big
            return { isValid: false, status: 'TOO_CLOSE', message: '📏 Too close. Move back.', correction: 'move-back' };
        }

        // 4. Centering
        const offsetX = (faceCenterX - centerX) / frameW;
        const offsetY = (faceCenterY - centerY) / frameH;

        if (offsetX < -this.maxCenterOffset) return { isValid: false, status: 'OFF_CENTER_LEFT', message: '👉 Move LEFT', correction: 'left' };
        if (offsetX > this.maxCenterOffset) return { isValid: false, status: 'OFF_CENTER_RIGHT', message: '👈 Move RIGHT', correction: 'right' };
        if (offsetY < -this.maxCenterOffset) return { isValid: false, status: 'OFF_CENTER_UP', message: '👇 Move DOWN', correction: 'down' };
        if (offsetY > this.maxCenterOffset) return { isValid: false, status: 'OFF_CENTER_DOWN', message: '👆 Move UP', correction: 'up' };

        // 5. Orientation (Tilt/Yaw)
        // Note: TinyFaceDetector doesn't give explicit angles.
        // We approximate using landmarks.
        // Jaw: 0-16, Left Eye: 36-41, Right Eye: 42-47, Nose: 27-35
        const landmarks = detection.landmarks;
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        const nose = landmarks.getNose();

        // Tilt (Roll) - Angle between eyes
        // slope m = (y2 - y1) / (x2 - x1)
        // angle = atan(m)
        const dY = rightEye[0].y - leftEye[0].y;
        const dX = rightEye[0].x - leftEye[0].x;
        const angleRad = Math.atan2(dY, dX);
        const angleDeg = angleRad * (180 / Math.PI);

        if (Math.abs(angleDeg) > this.maxAngle) {
            return { isValid: false, status: 'TILTED', message: '🔄 Face tilted. Straighten head.', correction: 'rotate' };
        }

        // Yaw (Turning Left/Right)
        // Compare nose x to eye midpoint x
        const eyeMidX = (leftEye[0].x + rightEye[3].x) / 2;
        const noseX = nose[3].x; // Tip of nose
        // If nose is significantly offset from eye midpoint, face is turned
        const yawOffset = (noseX - eyeMidX) / box.width; // Normalize by face width

        if (Math.abs(yawOffset) > 0.15) { // Approx 15 degrees equivalent
            return { isValid: false, status: 'TURNED', message: '↩️ Look straight ahead.', correction: 'turn' };
        }

        // 6. Completeness (Landmarks inside frame)
        // Check if jaw points 0 and 16 are within frame
        // (Simplified check via box)
        if (box.x < 0 || box.y < 0 || box.bottom > frameH || box.right > frameW) {
            return { isValid: false, status: 'PARTIAL', message: '⚠️ Face partially out of frame.' };
        }

        // All Valid
        return {
            isValid: true,
            status: 'OK',
            message: '✅ Perfect! Hold still.',
            landmarks: detection.landmarks,
            box: detection.detection.box
        };
    }
}
