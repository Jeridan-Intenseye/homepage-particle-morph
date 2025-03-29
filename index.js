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
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x121216, 1); // Background color matches fade color
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
const fadeColor = [0.0706, 0.0706, 0.0863]; // #121216 in RGB (0-1 range)
const baseSpherePositions = new Float32Array(particleCount * 3); // Store base sphere positions
for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;
    colors[i * 3] = particleColor[0];
    colors[i * 3 + 1] = particleColor[1];
    colors[i * 3 + 2] = particleColor[2];
    const ringIndex = i % ringCount;
    ringProgress[i] = ringIndex / ringCount;

    // Precompute base sphere positions
    const phi = Math.acos(-1 + (2 * i) / particleCount);
    const theta = Math.sqrt(particleCount * Math.PI) * phi;
    const radius = 5;
    baseSpherePositions[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
    baseSpherePositions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
    baseSpherePositions[i * 3 + 2] = radius * Math.cos(phi);
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
particleSystem.rotation.x = THREE.MathUtils.degToRad(-30);
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
        colors[i * 3] = fadeColor[0] * (1 - alpha) + particleColor[0] * alpha;
        colors[i * 3 + 1] = fadeColor[1] * (1 - alpha) + particleColor[1] * alpha;
        colors[i * 3 + 2] = fadeColor[2] * (1 - alpha) + particleColor[2] * alpha;
    }
}

function toCircleWithLine(positions, colors, progressArray) {
    const radius = 5;
    const thickness = 1;
    const halfThickness = thickness / 2;
    const circleParticleCount = Math.floor(particleCount * 0.7);
    const lineParticleCount = particleCount - circleParticleCount;
    const maxDistance = radius + halfThickness;
    const fadeDistance = maxDistance * 0.8;
    const angle45 = Math.PI / 4;

    for (let i = 0; i < particleCount; i++) {
        let x, y, z;
        let alpha = 1;

        if (i < circleParticleCount) {
            const angle = (i / circleParticleCount) * Math.PI * 2;
            const ringOffset = ((i % 10) / 10 - 0.5) * thickness;
            const r = radius + ringOffset;

            x = Math.cos(angle) * r;
            y = Math.sin(angle) * r;
            z = 0;

            const distanceFromCenter = Math.sqrt(x * x + y * y);
            alpha = distanceFromCenter > fadeDistance
                ? Math.max(0, 1 - (distanceFromCenter - fadeDistance) / (maxDistance - fadeDistance))
                : 1;
        } else {
            const lineIndex = i - circleParticleCount;
            const lineLength = radius * 2 + thickness;
            const t = (lineIndex / (lineParticleCount - 1)) * lineLength - (lineLength / 2);
            const offset = ((i % 10) / 10 - 0.5) * thickness;

            x = t * Math.cos(angle45) + offset * Math.sin(angle45);
            y = t * Math.sin(angle45) - offset * Math.cos(angle45);
            z = 0;

            const distanceFromCenter = Math.sqrt(x * x + y * y);
            alpha = distanceFromCenter > fadeDistance
                ? Math.max(0, 1 - (distanceFromCenter - fadeDistance) / (maxDistance - fadeDistance))
                : 1;
        }

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        progressArray[i] = progressArray[i] || 0;

        alpha = alpha * alpha;
        colors[i * 3] = fadeColor[0] * (1 - alpha) + particleColor[0] * alpha;
        colors[i * 3 + 1] = fadeColor[1] * (1 - alpha) + particleColor[1] * alpha;
        colors[i * 3 + 2] = fadeColor[2] * (1 - alpha) + particleColor[2] * alpha;
    }
}

function updateCircleWithLine(positions, colors, progressArray) {
    const radius = 5;
    const thickness = 1;
    const halfThickness = thickness / 2;
    const circleParticleCount = Math.floor(particleCount * 0.7);
    const lineParticleCount = particleCount - circleParticleCount;
    const maxDistance = radius + halfThickness;
    const fadeDistance = maxDistance * 0.8;
    const angle45 = Math.PI / 4;

    const pulse = Math.sin(Date.now() * 0.001) * 0.2;

    for (let i = 0; i < particleCount; i++) {
        let x, y, z;
        let alpha = 1;

        if (i < circleParticleCount) {
            const angle = (i / circleParticleCount) * Math.PI * 2;
            const ringOffset = ((i % 10) / 10 - 0.5) * thickness;
            const r = radius + ringOffset + pulse;

            x = Math.cos(angle) * r;
            y = Math.sin(angle) * r;
            z = 0;

            const distanceFromCenter = Math.sqrt(x * x + y * y);
            alpha = distanceFromCenter > fadeDistance
                ? Math.max(0, 1 - (distanceFromCenter - fadeDistance) / (maxDistance - fadeDistance))
                : 1;
        } else {
            const lineIndex = i - circleParticleCount;
            const lineLength = radius * 2 + thickness;
            const t = (lineIndex / (lineParticleCount - 1)) * lineLength - (lineLength / 2);
            const offset = ((i % 10) / 10 - 0.5) * thickness;

            x = t * Math.cos(angle45) + offset * Math.sin(angle45);
            y = t * Math.sin(angle45) - offset * Math.cos(angle45);
            z = 0;

            const distanceFromCenter = Math.sqrt(x * x + y * y);
            alpha = distanceFromCenter > fadeDistance
                ? Math.max(0, 1 - (distanceFromCenter - fadeDistance) / (maxDistance - fadeDistance))
                : 1;
        }

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        alpha = alpha * alpha;
        colors[i * 3] = fadeColor[0] * (1 - alpha) + particleColor[0] * alpha;
        colors[i * 3 + 1] = fadeColor[1] * (1 - alpha) + particleColor[1] * alpha;
        colors[i * 3 + 2] = fadeColor[2] * (1 - alpha) + particleColor[2] * alpha;
    }
}

function toSphere(positions, colors) {
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = baseSpherePositions[i * 3];
        positions[i * 3 + 1] = baseSpherePositions[i * 3 + 1];
        positions[i * 3 + 2] = baseSpherePositions[i * 3 + 2];
        colors[i * 3] = particleColor[0];
        colors[i * 3 + 1] = particleColor[1];
        colors[i * 3 + 2] = particleColor[2];
    }
}

let sphereTransitionTime = null; // Store the time when sphere transition completes
function updateSphere(positions) {
    const now = Date.now();
    let pulseAmplitude = 0.1; // Default pulse amplitude
    if (sphereTransitionTime !== null) {
        const timeSinceTransition = (now - sphereTransitionTime) / 1000; // Time in seconds
        // Gradually increase pulse amplitude over 1 second
        pulseAmplitude = Math.min(timeSinceTransition, 1) * 0.1;
    }
    for (let i = 0; i < particleCount; i++) {
        const baseX = baseSpherePositions[i * 3];
        const baseY = baseSpherePositions[i * 3 + 1];
        const baseZ = baseSpherePositions[i * 3 + 2];
        const radiusFactor = 1 + Math.sin(now * 0.001 + i * 0.01) * pulseAmplitude;
        positions[i * 3] = baseX * radiusFactor;
        positions[i * 3 + 1] = baseY * radiusFactor;
        positions[i * 3 + 2] = baseZ * radiusFactor;
    }
}

// Precompute Shape Positions (only rings)
const ringPositions = new Float32Array(particleCount * 3);
const ringColors = new Float32Array(particleCount * 3);
updateRings(ringPositions, ringColors, ringProgress);
const shapes = [
    { positions: ringPositions, colors: ringColors },
    null, // Circle with line computed dynamically
    null  // Sphere computed dynamically
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
        updateCircleWithLine(positions, colors, ringProgress);
        particles.attributes.position.needsUpdate = true;
        particles.attributes.color.needsUpdate = true;
    } else if (currentShapeIndex === 2 && !isTransitioning) {
        updateSphere(positions);
        particles.attributes.position.needsUpdate = true;
    }
    if (!isTransitioning) {
        const targetRotationY = mouseX * 0.2;
        const targetRotationX = -mouseY * 0.2 + (currentShapeIndex === 0 ? THREE.MathUtils.degToRad(-45) : 0);
        particleSystem.rotation.y += (targetRotationY - particleSystem.rotation.y) * 0.05;
        particleSystem.rotation.x += (targetRotationX - particleSystem.rotation.x) * 0.05;
    }
    renderer.render(scene, camera);
}
animate();
// GSAP ScrollTrigger Setup
gsap.registerPlugin(ScrollTrigger);
const canvasContainer = document.querySelector('#canvas-container');
function animateToShape(targetIndex) {
    isTransitioning = true;
    let targetPositions = new Float32Array(particleCount * 3);
    let targetColors = new Float32Array(particleCount * 3);

    if (targetIndex === 0) {
        for (let i = 0; i < particleCount; i++) {
            const ringIndex = i % ringCount;
            ringProgress[i] = ringIndex / ringCount;
        }
        updateRings(targetPositions, targetColors, ringProgress);
    } else if (targetIndex === 1) {
        for (let i = 0; i < particleCount; i++) {
            ringProgress[i] = 0;
        }
        toCircleWithLine(targetPositions, targetColors, ringProgress);
    } else if (targetIndex === 2) {
        toSphere(targetPositions, targetColors);
    }

    gsap.to(positions, {
        duration: 1,
        endArray: targetPositions,
        onUpdate: () => {
            particles.attributes.position.needsUpdate = true;
        },
        ease: "power2.inOut"
    });
    gsap.to(colors, {
        duration: 1,
        endArray: targetColors,
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
            if (targetIndex === 2) {
                sphereTransitionTime = Date.now(); // Record transition end time
            } else {
                sphereTransitionTime = null; // Reset when not in sphere mode
            }
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
            if (index + 1 < 3) {
                animateToShape(index + 1);
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
            }
        },
        onLeaveBack: () => {
            animateToShape(index);
            if (index === 0) {
                gsap.to(canvasContainer, {
                    x: "0%",
                    duration: 1,
                    ease: "sine.inOut"
                });
            } else if (index === 1) {
                gsap.to(canvasContainer, {
                    x: "-25%",
                    duration: 1,
                    ease: "sine.inOut"
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

