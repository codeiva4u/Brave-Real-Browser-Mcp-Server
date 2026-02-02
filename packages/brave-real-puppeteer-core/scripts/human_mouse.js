
/**
 * Human-like mouse movement using Bezier curves
 * Simulates realistic cursor behavior to bypass bot detection
 */

// Cubic Bezier curve point generator
function cubicBezier(t, p0, p1, p2, p3) {
    const oneMinusT = 1 - t;
    const x = Math.pow(oneMinusT, 3) * p0.x +
        3 * Math.pow(oneMinusT, 2) * t * p1.x +
        3 * oneMinusT * Math.pow(t, 2) * p2.x +
        Math.pow(t, 3) * p3.x;

    const y = Math.pow(oneMinusT, 3) * p0.y +
        3 * Math.pow(oneMinusT, 2) * t * p1.y +
        3 * oneMinusT * Math.pow(t, 2) * p2.y +
        Math.pow(t, 3) * p3.y;

    return { x, y };
}

function generateBezierPath(startX, startY, endX, endY, totalPoints = 50) {
    const control1 = {
        x: startX + (Math.random() * (endX - startX)) * 0.5 + (Math.random() - 0.5) * 100,
        y: startY + (Math.random() * (endY - startY)) * 0.5 + (Math.random() - 0.5) * 100
    };

    const control2 = {
        x: startX + (Math.random() * (endX - startX)) * 0.8 + (Math.random() - 0.5) * 100,
        y: startY + (Math.random() * (endY - startY)) * 0.8 + (Math.random() - 0.5) * 100
    };

    const path = [];
    const p0 = { x: startX, y: startY };
    const p3 = { x: endX, y: endY };

    for (let i = 0; i <= totalPoints; i++) {
        const t = i / totalPoints;
        // Ease-in-out
        const easedT = t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;

        path.push(cubicBezier(easedT, p0, control1, control2, p3));
    }

    return path;
}

// Store last position
let lastMouseX = 0;
let lastMouseY = 0;

export async function moveMouseNaturally(page, x, y, options = {}) {
    if (!page || !page.mouse) return;

    const steps = options.steps || 25;

    // Use last known position or 0,0
    const startX = lastMouseX;
    const startY = lastMouseY;

    const path = generateBezierPath(startX, startY, x, y, steps);

    for (const point of path) {
        // Move to each point instantly (steps: 1 would smooth it but linearize small segments)
        // We want to control the path ourselves.
        await page.mouse.move(point.x, point.y);

        // Random micro-delay to simulate varying speed?
        if (Math.random() > 0.8) {
            await new Promise(r => setTimeout(r, Math.random() * 5));
        }
    }

    // Update last position
    lastMouseX = x;
    lastMouseY = y;
}

export async function performHumanClick(page, selector) {
    const element = await page.$(selector);
    if (!element) return false;

    const box = await element.boundingBox();
    if (!box) return false;

    const x = box.x + box.width / 2 + (Math.random() - 0.5) * (box.width * 0.8);
    const y = box.y + box.height / 2 + (Math.random() - 0.5) * (box.height * 0.8);

    await moveMouseNaturally(page, x, y);
    await new Promise(r => setTimeout(r, 50 + Math.random() * 100));
    await page.mouse.down();
    await new Promise(r => setTimeout(r, 50 + Math.random() * 100));
    await page.mouse.up();

    return true;
}

export default { moveMouseNaturally, performHumanClick };
