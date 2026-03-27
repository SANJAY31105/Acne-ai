/**
 * Lighting Validator
 * Analyzes image brightness, contrast, and exposure to ensure optimal scanning conditions.
 */
export class LightingValidator {
    constructor() {
        this.history = [];
        this.maxHistory = 5; // Smooth out readings
    }

    analyze(imageData) {
        const pixels = imageData.data;
        let totalBrightness = 0;
        let minBrightness = 255;
        let maxBrightness = 0;
        let overexposedCount = 0;
        let underexposedCount = 0;
        let pixelCount = 0;
        const width = imageData.width;

        // Histogram analysis (for contrast/shadows)
        const histogram = new Array(256).fill(0);

        // Zone mapping for uneven lighting detection
        let leftSideBrightness = 0;
        let rightSideBrightness = 0;
        let leftCount = 0;
        let rightCount = 0;

        // Sample every 4th pixel for performance
        for (let i = 0; i < pixels.length; i += 16) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];

            // Perceived brightness (Rec. 601)
            const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

            totalBrightness += brightness;
            minBrightness = Math.min(minBrightness, brightness);
            maxBrightness = Math.max(maxBrightness, brightness);

            histogram[Math.floor(brightness)]++;

            if (brightness > 240) overexposedCount++;
            if (brightness < 30) underexposedCount++;

            // Split into left/right zones
            // x coordinate of current pixel
            const x = (i / 4) % width;
            if (x < width / 2) {
                leftSideBrightness += brightness;
                leftCount++;
            } else {
                rightSideBrightness += brightness;
                rightCount++;
            }

            pixelCount++;
        }

        const meanBrightness = totalBrightness / pixelCount;
        const overexposedPct = overexposedCount / pixelCount;
        const underexposedPct = underexposedCount / pixelCount;

        const avgLeft = leftSideBrightness / leftCount;
        const avgRight = rightSideBrightness / rightCount;
        const sideDiff = Math.abs(avgLeft - avgRight);

        // Standard Deviation for contrast/shadows
        let varianceSum = 0;
        // Approximation from histogram
        for (let val = 0; val < 256; val++) {
            const count = histogram[val];
            varianceSum += count * Math.pow(val - meanBrightness, 2);
        }
        const stdDev = Math.sqrt(varianceSum / pixelCount);

        const result = {
            isValid: false,
            status: 'OPTIMAL',
            message: '',
            meanBrightness,
            stdDev,
            details: []
        };

        // --- Logic Evaluator ---

        // 1. Critical: Too Bright / Overexposed
        if (meanBrightness > 220 || overexposedPct > 0.40) {
            result.status = 'TOO_BRIGHT';
            result.message = '☀️ Heavy lighting detected! Your face is overexposed.';
            result.details.push('Move away from direct bright lights');
            return result;
        }

        // 2. Critical: Too Dark / Underexposed
        if (meanBrightness < 50 || underexposedPct > 0.40) {
            result.status = 'TOO_DARK';
            result.message = '🌑 It\'s too dark! Your face is not clearly visible.';
            result.details.push('Turn on more lights or move to a brighter area');
            return result;
        }

        // 3. Warning: Moderately Bright
        if (meanBrightness > 190) {
            result.status = 'BRIGHT';
            result.message = '🔆 Lighting is a bit too bright.';
            result.isValid = true; // Allow but warn
        }
        // 4. Warning: Moderately Dark
        else if (meanBrightness < 80) {
            result.status = 'DIM';
            result.message = '🌒 Lighting is a bit dim.';
            result.isValid = true;
        }
        // 5. Warning: Uneven Lighting
        else if (sideDiff > 50) {
            result.status = 'UNEVEN';
            result.message = '💡 Uneven lighting detected.';
            result.details.push('Face the light source directly');
            result.isValid = true;
        }
        // 6. Good: Optimal
        else {
            result.status = 'OPTIMAL';
            result.message = '💡 Lighting is perfect!';
            result.isValid = true;
        }

        // 7. Check for Harsh Shadows vs Soft Light
        if (stdDev > 80 && result.isValid) {
            result.status = 'SHADOWS';
            result.message = '🌓 Harsh shadows detected.';
            result.details.push('Use softer lighting if possible');
        }

        return result;
    }
}
