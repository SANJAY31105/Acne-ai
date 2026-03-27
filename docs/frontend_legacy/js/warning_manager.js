/**
 * Warning Manager
 * Handles UI messages, banners, and status updates.
 */
export class WarningManager {
    constructor() {
        this.banner = document.getElementById('warning-banner');
        this.statusText = document.getElementById('camera-status'); // Used for persistent minor status
        this.scanButton = document.getElementById('btn-scan');

        // Status Panel Elements
        this.checkFace = document.getElementById('check-face');
        this.checkPos = document.getElementById('check-position');
        this.checkLight = document.getElementById('check-lighting');
        this.checkBlur = document.getElementById('check-clarity');
        this.brightnessFill = document.getElementById('brightness-fill');

        this.debounceTimer = null;
    }

    show(type, message) {
        // Debounce slightly to prevent flicker
        if (this.debounceTimer) clearTimeout(this.debounceTimer);

        this.debounceTimer = setTimeout(() => {
            this._renderWarning(type, message);
        }, 100);
    }

    _renderWarning(type, message) {
        if (!this.banner) return;

        this.banner.className = 'warning-banner'; // Reset
        this.banner.classList.remove('hidden');

        if (type === 'CRITICAL') {
            this.banner.classList.add('critical');
            this.scanButton.disabled = true;
            this.scanButton.classList.add('disabled');
        } else if (type === 'WARNING') {
            this.banner.classList.add('warning');
            this.scanButton.disabled = false; // Allow but warn? Specs said "enabled but shows warning"
            this.scanButton.classList.remove('disabled');
        } else if (type === 'SUCCESS') {
            this.banner.classList.add('success');
            this.scanButton.disabled = false;
            this.scanButton.classList.remove('disabled');
        } else {
            this.banner.classList.add('info');
        }

        // Set text
        const msgEl = this.banner.querySelector('#warning-message');
        if (msgEl) msgEl.textContent = message;
    }

    updateStatusPanel(faceResult, lightingResult, qualityResult) {
        // Helper to update check items
        const setItem = (el, passed, text) => {
            if (!el) return;
            const icon = el.querySelector('.check-icon');
            const status = el.querySelector('.check-status');

            if (passed) {
                el.classList.add('passed');
                el.classList.remove('failed');
                icon.textContent = '✅';
                status.textContent = 'OK';
            } else {
                el.classList.add('failed');
                el.classList.remove('passed');
                icon.textContent = '❌';
                status.textContent = text || 'Check failed';
            }
        };

        setItem(this.checkFace, faceResult.status !== 'NO_FACE', faceResult.status);
        setItem(this.checkPos, faceResult.status === 'OK' || faceResult.status === 'PARTIAL', faceResult.status === 'OK' ? 'OK' : 'Adjust');
        setItem(this.checkLight, lightingResult.isValid, lightingResult.status);
        setItem(this.checkBlur, qualityResult.isValid, qualityResult.status);

        // Update Brightness Meter
        if (this.brightnessFill) {
            // Map 0-255 to 0-100%
            const pct = Math.min(100, (lightingResult.meanBrightness / 255) * 100);
            this.brightnessFill.style.width = `${pct}%`;

            // Color code meter
            let color = 'var(--valid-color)';
            if (lightingResult.status.includes('TOO')) color = 'var(--error-color)';
            else if (lightingResult.status === 'BRIGHT' || lightingResult.status === 'DIM') color = 'var(--warning-color)';

            this.brightnessFill.style.backgroundColor = color;
        }
    }
}
