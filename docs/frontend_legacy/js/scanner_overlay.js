/**
 * Scanner Overlay
 * Draws the face oval, corner brackets, and scanning animations.
 */
export class ScannerOverlay {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scanLineY = 0;
        this.scanDirection = 1;
        this.frameCount = 0;
    }

    draw(status, validationResult) {
        const { width, height } = this.canvas;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, width, height);

        // Define Oval (60% width, 75% height)
        const ovalW = width * 0.6;
        const ovalH = height * 0.75;
        const ovalX = (width - ovalW) / 2;
        const ovalY = (height - ovalH) / 2;

        // 1. Draw Semi-Transparent Background (Darken outside oval)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.rect(0, 0, width, height);
        // Cut out oval
        ctx.globalCompositeOperation = 'destination-out';
        ctx.moveTo(ovalX + ovalW / 2, ovalY);
        ctx.ellipse(ovalX + ovalW / 2, ovalY + ovalH / 2, ovalW / 2, ovalH / 2, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        // 2. Determine Border Color
        let color = '#ffffff'; // Default
        let lineWidth = 3;
        let glow = 0;

        if (status === 'OK') {
            color = '#22c55e'; // Green
            glow = 20;
        } else if (['TOO_BRIGHT', 'TOO_DARK', 'NO_FACE'].includes(status)) {
            color = '#ef4444'; // Red
            glow = 10;
        } else {
            color = '#eab308'; // Yellow/Orange (Warning)
            glow = 5;
        }

        // 3. Draw Oval Border
        ctx.beginPath();
        ctx.ellipse(ovalX + ovalW / 2, ovalY + ovalH / 2, ovalW / 2, ovalH / 2, 0, 0, 2 * Math.PI);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = glow;

        // Pulse animation for warnings
        if (status !== 'OK') {
            const alpha = 0.5 + 0.5 * Math.sin(Date.now() / 200);
            ctx.globalAlpha = alpha;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        } else {
            ctx.stroke();

            // 4. Draw Scan Line (Only when OK)
            this.drawScanLine(ctx, ovalX, ovalY, ovalW, ovalH, color);
        }

        ctx.shadowBlur = 0; // Reset glow

        // 5. Draw Corner Brackets (Tech Look)
        this.drawBrackets(ctx, ovalX, ovalY, ovalW, ovalH, color);

        // 6. Draw Landmarks (Debug / Tech feel)
        if (validationResult && validationResult.landmarks) {
            // Optional: Draw simple dots for eyes/nose to look cool
            const lm = validationResult.landmarks;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            [...lm.getLeftEye(), ...lm.getRightEye(), ...lm.getNose()].forEach(pt => {
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 2, 0, 2 * Math.PI);
                ctx.fill();
            });
        }
    }

    drawScanLine(ctx, x, y, w, h, color) {
        // Animate line up and down inside oval
        this.scanLineY += 5 * this.scanDirection;
        if (this.scanLineY > h) this.scanDirection = -1;
        if (this.scanLineY < 0) this.scanDirection = 1;

        const lineY = y + this.scanLineY;

        ctx.beginPath();
        ctx.moveTo(x, lineY);
        ctx.lineTo(x + w, lineY);
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        // Clip to oval? For simplicity, we just draw horizontal line but strict implementation would clip.
        // Let's clip to be neat.
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
        ctx.clip();

        ctx.beginPath();
        ctx.moveTo(x, lineY);
        ctx.lineTo(x + w, lineY);
        ctx.stroke();

        ctx.restore();
    }

    drawBrackets(ctx, x, y, w, h, color) {
        const len = 30;
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;

        // TL
        ctx.beginPath();
        ctx.moveTo(x, y + len);
        ctx.lineTo(x, y);
        ctx.lineTo(x + len, y);
        ctx.stroke();

        // TR
        ctx.beginPath();
        ctx.moveTo(x + w - len, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + len);
        ctx.stroke();

        // BL
        ctx.beginPath();
        ctx.moveTo(x, y + h - len);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x + len, y + h);
        ctx.stroke();

        // BR
        ctx.beginPath();
        ctx.moveTo(x + w - len, y + h);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w, y + h - len);
        ctx.stroke();
    }
}
