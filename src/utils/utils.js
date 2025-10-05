const Vector = Matter.Vector;
const render = Matter.render;

export function lerp(t, MinInput, MaxInput, MinOutput, MaxOutput) {
    return MinOutput + ((t - MinInput) * (MaxOutput - MinOutput)) / (MaxInput - MinInput);
}

export function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function RandomPosAroundCenter(magnitude = 1) {
    let centerPoint = Vector.create(render.canvas.width / 2, render.canvas.height / 2);
    let newX = (Math.random() > 0.5 ? 1 : -1) * Math.max(Math.random(), 0.7) * magnitude;
    let newY = (Math.random() > 0.5 ? 1 : -1) * Math.max(Math.random(), 0.7) * magnitude;
    return Vector.create(centerPoint.x + newX, centerPoint.y + newY);
}

export function isTouchDevice() {
    return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0));
}

//#region Color Conversion
// Function to convert hex color code to RGBA
export function hexToRgba(hex) {
    if (!/^#([A-Fa-f0-9]{3}){1,2}([A-Fa-f0-9]{2})?$/.test(hex)) {
        throw new Error('Invalid hex color code');
    }

    hex = hex.slice(1);

    if (hex.length === 3 || hex.length === 4) {
        hex = hex.split('').map(char => char + char).join('');
    }

    if (hex.length === 6) {
        hex += 'FF'; // Default alpha value to maximum if not provided
    }

    let bigint = parseInt(hex, 16);
    let r = (bigint >> 24) & 255;
    let g = (bigint >> 16) & 255;
    let b = (bigint >> 8) & 255;
    let a = (bigint & 255) / 255;

    return { r, g, b, a };
}

// Function to convert RGBA to hex color code
export function rgbaToHex(r, g, b, a = 1.0) {
    // Clamp values between 0 and 255 for RGB and 0 and 1 for alpha
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    a = Math.max(0, Math.min(1, a));

    // Convert each RGB component to hex
    let hexR = r.toString(16).padStart(2, '0').toUpperCase();
    let hexG = g.toString(16).padStart(2, '0').toUpperCase();
    let hexB = b.toString(16).padStart(2, '0').toUpperCase();
    let hexA = Math.round(a * 255).toString(16).padStart(2, '0').toUpperCase();

    return `#${hexR}${hexG}${hexB}${hexA}`;
}

// Function to convert RGBA to HSL
export function rgbaToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return { h, s, l };
}

// Function to convert HSL to RGBA
export function hslToRgba(h, s, l, a = 1.0) {
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 3) return q;
            if (t < 1 / 2) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), a };
}

// Function to reduce saturation of an RGBA color
export function reduceSaturation(rgba, reductionFactor) {
    let { r, g, b, a } = rgba;
    let gray = 0.3 * r + 0.59 * g + 0.11 * b;

    r = r * (1 - reductionFactor) + gray * reductionFactor;
    g = g * (1 - reductionFactor) + gray * reductionFactor;
    b = b * (1 - reductionFactor) + gray * reductionFactor;

    return { r: Math.round(r), g: Math.round(g), b: Math.round(b), a };
}