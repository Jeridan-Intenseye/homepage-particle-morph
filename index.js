
// Lenis Smooth Scroll Setup
let lenis = new Lenis({
    lerp: 0.1,
    wheelMultiplier: 0.7,
    gestureOrientation: "vertical",
    normalizeWheel: false,
    smoothTouch: false,
});
function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Set the background color (e.g., to white)
renderer.setClearColor(0x121216, 1); // 0xffffff is white, 1 is full opacity

const container = document.querySelector('#canvas-container');
if (container) {
    container.appendChild(renderer.domElement);
} else {
    console.error('Error: #canvas-container not found in the DOM.');
    document.body.appendChild(renderer.domElement);
}
camera.position.z = 20;
// Particle Setup
const particleCount = 1000;
const particles = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);
const ringProgress = new Float32Array(particleCount);
const ringCount = 5;
const particleColor = [1.0, 0.239, 0.0]; // #FF3D00 in RGB (0-1 range)
for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;
    colors[i * 3] = particleColor[0];
    colors[i * 3 + 1] = particleColor[1];
    colors[i * 3 + 2] = particleColor[2];
    const ringIndex = i % ringCount;
    ringProgress[i] = ringIndex / ringCount;
}
particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
const material = new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: true,
    transparent: true
});
const particleSystem = new THREE.Points(particles, material);
scene.add(particleSystem);
// Set initial rotation for rings
particleSystem.rotation.x = THREE.MathUtils.degToRad(-45);
// Mouse movement
let mouseX = 0;
let mouseY = 0;
window.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 1.5 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 1.5 + 1;
});
// Shape Functions
function updateRings(positions, colors, progressArray) {
    const maxRadius = 10;
    const fadeRadius = maxRadius * 0.8;

for (let i = 0; i < particleCount; i++) {
    let progress = progressArray[i];
    let radius = maxRadius * progress;
    const angle = (i / particleCount) * Math.PI * 2;

    if (radius > maxRadius) {
        progress = 0;
        progressArray[i] = 0;
    }

    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = Math.sin(angle) * radius;
    positions[i * 3 + 2] = 0;

    const alpha = radius > fadeRadius ? 1 - (radius - fadeRadius) / (maxRadius - fadeRadius) : 1;
    colors[i * 3] = particleColor[0] * alpha;
    colors[i * 3 + 1] = particleColor[1] * alpha;
    colors[i * 3 + 2] = particleColor[2] * alpha;
}

}
function toGrid(positions, colors, progressArray) {
    const gridSize = 15;
    const halfSize = gridSize / 2;
    const lineCount = 8; // 8 lines in each direction
    const spacing = gridSize / (lineCount - 1);

    // Split particles: half for vertical, half for horizontal
    const particlesPerDirection = Math.floor(particleCount / 2);
    const particlesPerLine = Math.floor(particlesPerDirection / lineCount);

    for (let i = 0; i < particleCount; i++) {
        const isVertical = i < particlesPerDirection;
        const lineIndex = isVertical
            ? Math.floor(i / particlesPerLine)
            : Math.floor((i - particlesPerDirection) / particlesPerLine);
        const particleIndexInLine = isVertical
            ? i % particlesPerLine
            : (i - particlesPerDirection) % particlesPerLine;

        let x, y;
        if (isVertical) {
            // Vertical lines (constant x, will move along y)
            x = lineIndex * spacing - halfSize; // Fixed x position
            y = (particleIndexInLine / (particlesPerLine - 1)) * gridSize - halfSize; // Distribute along y
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = 0;
        } else {
            // Horizontal lines (constant y, will move along x)
            y = lineIndex * spacing - halfSize; // Fixed y position
            x = (particleIndexInLine / (particlesPerLine - 1)) * gridSize - halfSize; // Distribute along x
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = 0;
        }

        // Apply fading effect at edges (same logic as updateGrid)
        const distanceFromCenterX = Math.abs(x);
        const distanceFromCenterY = Math.abs(y);
        const maxDistance = halfSize;
        const fadeDistance = maxDistance * 0.8;
        const distance = Math.max(distanceFromCenterX, distanceFromCenterY);
        const alpha = distance > fadeDistance ? 1 - (distance - fadeDistance) / (maxDistance - fadeDistance) : 1;

        // Set colors with fading applied
        colors[i * 3] = particleColor[0] * alpha;
        colors[i * 3 + 1] = particleColor[1] * alpha;
        colors[i * 3 + 2] = particleColor[2] * alpha;

        progressArray[i] = progressArray[i] || 0;
    }
}

let globalProgress = 0;
function updateGrid(positions, colors, progressArray) {
    const gridSize = 15;
    const halfSize = gridSize / 2;
    const lineCount = 8;
    const spacing = gridSize / (lineCount - 1);
    const particlesPerDirection = Math.floor(particleCount / 2);
    const particlesPerLine = Math.floor(particlesPerDirection / lineCount);

globalProgress += 0.002;
if (globalProgress > 1) globalProgress = 0;

const moveOffset = (globalProgress * 2 - 1) * halfSize * 0.3;

for (let i = 0; i < particleCount; i++) {
    const isVertical = i < particlesPerDirection;
    const lineIndex = isVertical
        ? Math.floor(i / particlesPerLine)
        : Math.floor((i - particlesPerDirection) / particlesPerLine);
    const particleIndexInLine = isVertical
        ? i % particlesPerLine
        : (i - particlesPerDirection) % particlesPerLine;

    if (isVertical) {
        const x = lineIndex * spacing - halfSize + moveOffset;
        const y = (particleIndexInLine / (particlesPerLine - 1)) * gridSize - halfSize;
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = 0;
    } else {
        const y = lineIndex * spacing - halfSize + moveOffset;
        const x = (particleIndexInLine / (particlesPerLine - 1)) * gridSize - halfSize;
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = 0;
    }

    const distanceFromCenterX = Math.abs(positions[i * 3]);
    const distanceFromCenterY = Math.abs(positions[i * 3 + 1]);
    const maxDistance = halfSize;
    const fadeDistance = maxDistance * 0.8;
    const distance = Math.max(distanceFromCenterX, distanceFromCenterY);
    const alpha = distance > fadeDistance ? 1 - (distance - fadeDistance) / (maxDistance - fadeDistance) : 1;

    colors[i * 3] = particleColor[0] * alpha;
    colors[i * 3 + 1] = particleColor[1] * alpha;
    colors[i * 3 + 2] = particleColor[2] * alpha;
}

}
function toSphere(positions, colors) {
    for (let i = 0; i < particleCount; i++) {
        const phi = Math.acos(-1 + (2 * i) / particleCount);
        const theta = Math.sqrt(particleCount * Math.PI) * phi;
        const radius = 5;
        positions[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
        positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
        positions[i * 3 + 2] = radius * Math.cos(phi);
        colors[i * 3] = particleColor[0];
        colors[i * 3 + 1] = particleColor[1];
        colors[i * 3 + 2] = particleColor[2];
    }
}
// Precompute Shape Positions
const ringPositions = new Float32Array(particleCount * 3);
const ringColors = new Float32Array(particleCount * 3);
const gridPositions = new Float32Array(particleCount * 3);
const gridColors = new Float32Array(particleCount * 3);
const spherePositions = new Float32Array(particleCount * 3);
const sphereColors = new Float32Array(particleCount * 3);
updateRings(ringPositions, ringColors, ringProgress);
toGrid(gridPositions, gridColors, ringProgress);
toSphere(spherePositions, sphereColors);
const shapes = [
    { positions: ringPositions, colors: ringColors },
    { positions: gridPositions, colors: gridColors },
    { positions: spherePositions, colors: sphereColors }
];
// Animation Loop
let currentShapeIndex = 0;
let isTransitioning = false;
function animate() {
    requestAnimationFrame(animate);

if (currentShapeIndex === 0 && !isTransitioning) {
    for (let i = 0; i < particleCount; i++) {
        ringProgress[i] += 0.002;
    }
    updateRings(positions, colors, ringProgress);
    particles.attributes.position.needsUpdate = true;
    particles.attributes.color.needsUpdate = true;
} else if (currentShapeIndex === 1 && !isTransitioning) {
    updateGrid(positions, colors, ringProgress);
    particles.attributes.position.needsUpdate = true;
    particles.attributes.color.needsUpdate = true;
}

if (!isTransitioning) {
    const targetRotationY = mouseX * 0.2;
    const targetRotationX = mouseY * 0.2 + (currentShapeIndex === 0 ? THREE.MathUtils.degToRad(-45) : 0);
    particleSystem.rotation.y += (targetRotationY - particleSystem.rotation.y) * 0.05;
    particleSystem.rotation.x += (targetRotationX - particleSystem.rotation.x) * 0.05;
}

renderer.render(scene, camera);

}
animate();
// GSAP ScrollTrigger Setup
gsap.registerPlugin(ScrollTrigger);
// Select the canvas container
const canvasContainer = document.querySelector('#canvas-container');
// Function to animate to a target shape
function animateToShape(targetShape) {
    const targetIndex = shapes.indexOf(targetShape);

isTransitioning = true;

if (targetIndex === 0) {
    for (let i = 0; i < particleCount; i++) {
        const ringIndex = i % ringCount;
        ringProgress[i] = ringIndex / ringCount;
    }
} else if (targetIndex === 1) {
    for (let i = 0; i < particleCount; i++) {
        ringProgress[i] = 0;
    }
    globalProgress = 0;
}

gsap.to(positions, {
    duration: 1,
    endArray: targetShape.positions,
    onUpdate: () => {
        particles.attributes.position.needsUpdate = true;
    },
    ease: "power2.inOut"
});

gsap.to(colors, {
    duration: 1,
    endArray: targetShape.colors,
    onUpdate: () => {
        particles.attributes.color.needsUpdate = true;
    },
    ease: "power2.inOut"
});

gsap.to(particleSystem.rotation, {
    duration: 1,
    x: targetIndex === 0 ? THREE.MathUtils.degToRad(-45) : 0,
    y: 0,
    ease: "power2.inOut",
    onComplete: () => {
        currentShapeIndex = targetIndex;
        isTransitioning = false;
    }
});

}
// Initial shape setup
updateRings(positions, colors, ringProgress);
particles.attributes.position.needsUpdate = true;
particles.attributes.color.needsUpdate = true;
// Single ScrollTrigger setup
const morphElements = document.querySelectorAll('.shape-morph');
morphElements.forEach((element, index) => {
    ScrollTrigger.create({
        trigger: element,
        start: "top center",
        onEnter: () => {
            animateToShape(shapes[index + 1]);
            if (index === 0) {
                gsap.to(canvasContainer, {
                    x: "-25%",
                    duration: 1,
                    ease: "sine.inOut" 
                });
            } else if (index === 1) {
                gsap.to(canvasContainer, {
                    x: "0%",
                    duration: 1,
                    ease: "sine.inOut"
                });
            }
        },
        onLeaveBack: () => {
            animateToShape(shapes[index]);
            if (index === 0) {
                gsap.to(canvasContainer, {
                    x: "0%",
                    duration: 1,
                    ease: "sine.inOut" // Changed easing here (matches reverse motion)
                });
            } else if (index === 1) {
                gsap.to(canvasContainer, {
                    x: "-25%",
                    duration: 1,
                    ease: "sine.inOut" // Changed easing here (matches reverse motion)
                });
            }
        }
    });
});
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
