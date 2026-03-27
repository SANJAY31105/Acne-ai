/**
 * Image Quality Validator
 * Checks for blurriness and resolution issues.
 */
export class ImageQualityValidator {

    validate(imageData) {
        const width = imageData.width;
        const height = imageData.height;

        const result = {
            isValid: true,
            status: 'GOOD',
            message: '',
            score: 100
        };

        // 1. Resolution Check
        if (width < 200 || height < 200) {
            result.isValid = false;
            result.status = 'LOW_RES';
            result.message = '📐 Image resolution too low.';
            result.score = 0;
            return result;
        }

        // 2. Blur Check (Laplacian Variance approximation)
        // We use a simplified edge detection to estimate sharpness
        const sharpness = this.detectSharpness(imageData);

        if (sharpness < 100) { // Threshold from specs
            result.isValid = true; // Warn but don't block? (Specs said "Yellow", implies warning)
            // Specs said Q1 is a warning.
            result.status = 'BLURRY';
            result.message = '📷 Image is blurry. Hold steady.';
            result.score = 50;
        } else {
            result.status = 'SHARP';
            result.message = '📸 Image is sharp.';
        }

        return result;
    }

    detectSharpness(imageData) {
        const pixels = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        let edgeSum = 0;
        let count = 0;

        // Simple Laplacian kernel [-1, -1, -1, -1, 8, -1, -1, -1, -1]
        // Or simpler specific horizontal/vertical difference
        // We'll use adjacent pixel difference average as a proxy for high frequency content

        for (let y = 1; y < height - 1; y += 2) {
            for (let x = 1; x < width - 1; x += 2) {
                const i = (y * width + x) * 4;
                const i_left = (y * width + (x - 1)) * 4;
                const i_right = (y * width + (x + 1)) * 4;
                const i_up = ((y - 1) * width + x) * 4;
                const i_down = ((y + 1) * width + x) * 4;

                const val = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
                const left = (pixels[i_left] + pixels[i_left + 1] + pixels[i_left + 2]) / 3;
                const right = (pixels[i_right] + pixels[i_right + 1] + pixels[i_right + 2]) / 3;
                const up = (pixels[i_up] + pixels[i_up + 1] + pixels[i_up + 2]) / 3;
                const down = (pixels[i_down] + pixels[i_down + 1] + pixels[i_down + 2]) / 3;

                // Laplacian-like difference
                const diff = Math.abs(val - left) + Math.abs(val - right) + Math.abs(val - up) + Math.abs(val - down);
                edgeSum += diff;
                count++;
            }
        }

        // Normalize roughly to match "100" as a threshold for a 640x480 image
        // A sharp image has high average difference.
        // This is an arbitrary scale, tuning it to match the "100" variance idea roughly.
        // "Variance" is usually squared deviation. 
        // Let's just return the average edge strength * 10 as a score.
        // A blurry image has low local contrast.

        return (edgeSum / count) * 5;
    }
}
