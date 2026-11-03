/**
 * Procedural 3D Garment Viewer
 * Three.js is imported dynamically ONLY when opened.
 * Features:
 * - Procedural luxury garment mesh (tunic/agbada silhouette)
 * - Damped orbital drag
 * - Slow idle auto-rotation pausing on interaction
 * - Pauses render loop when hidden
 * - Pixel ratio capped at 2
 */

let THREE = null;
let renderer = null;
let scene = null;
let camera = null;
let garmentGroup = null;
let animationFrameId = null;
let isInteracting = false;
let isModalOpen = false;
let idleTimer = null;

// Orbit state
let targetRotationX = 0.1;
let targetRotationY = 0;
let currentRotationX = 0.1;
let currentRotationY = 0;
let isPointerDown = false;
let pointerStartX = 0;
let pointerStartY = 0;
let startRotationX = 0;
let startRotationY = 0;

export async function open3DViewer(design, containerElement) {
  isModalOpen = true;

  if (!THREE) {
    // Dynamic import to keep initial public JS bundle tiny
    THREE = await import('three');
  }

  initScene(containerElement, design);
  startRenderLoop();

  // Listen to visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

export function close3DViewer() {
  isModalOpen = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange);
}

function handleVisibilityChange() {
  if (document.hidden) {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  } else if (isModalOpen) {
    startRenderLoop();
  }
}

function initScene(container, design) {
  // Clear any existing canvas
  container.innerHTML = '';

  const width = container.clientWidth || 500;
  const height = container.clientHeight || 450;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0e0e);

  camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 0.4, 3.4);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xf6f3ee, 2.2);
  keyLight.position.set(2, 4, 3);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xb89b6a, 1.4);
  fillLight.position.set(-3, 1, 2);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xd4bc91, 1.8);
  rimLight.position.set(0, 3, -3);
  scene.add(rimLight);

  // Build Procedural Garment
  garmentGroup = createGarmentMesh(design);
  scene.add(garmentGroup);

  // Pedestal
  const pedestalGeo = new THREE.CylinderGeometry(0.7, 0.75, 0.05, 48);
  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x181615,
    roughness: 0.8,
    metalness: 0.2
  });
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestal.position.y = -1.15;
  scene.add(pedestal);

  // Attach controls
  setupControls(renderer.domElement);

  // Resize handler
  window.addEventListener('resize', () => {
    if (!container || !isModalOpen) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}

function createGarmentMesh(design) {
  const group = new THREE.Group();

  // Primary Fabric Material
  const isLight = design?.color === '#F3EFE9' || design?.color === '#D5CEBF';
  const fabricColor = isLight ? 0xede8e1 : 0x141312;
  const accentHex = 0xb89b6a;

  const fabricMat = new THREE.MeshStandardMaterial({
    color: fabricColor,
    roughness: 0.65,
    metalness: 0.15
  });

  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    roughness: 0.25,
    metalness: 0.85
  });

  const mannequinMat = new THREE.MeshStandardMaterial({
    color: 0x22201e,
    roughness: 0.8
  });

  // 1. Mannequin Stand / Neck
  const neckGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.45, 32);
  const neck = new THREE.Mesh(neckGeo, mannequinMat);
  neck.position.y = 0.85;
  group.add(neck);

  const finialGeo = new THREE.SphereGeometry(0.09, 32, 16);
  const finial = new THREE.Mesh(finialGeo, goldTrimMat);
  finial.position.y = 1.1;
  group.add(finial);

  // 2. Torso / Garment Body (Tunic / Agbada shape)
  // Lathe geometry creates a flowing draped silhouette
  const points = [];
  points.push(new THREE.Vector2(0.12, 0.7)); // Collar
  points.push(new THREE.Vector2(0.38, 0.55)); // Shoulders
  points.push(new THREE.Vector2(0.44, 0.35)); // Chest drape
  points.push(new THREE.Vector2(0.40, 0.0));  // Waist
  points.push(new THREE.Vector2(0.48, -0.4)); // Flare
  points.push(new THREE.Vector2(0.56, -0.9)); // Hem
  points.push(new THREE.Vector2(0.52, -1.0)); // Edge turn

  const bodyGeo = new THREE.LatheGeometry(points, 48);
  const bodyMesh = new THREE.Mesh(bodyGeo, fabricMat);
  group.add(bodyMesh);

  // 3. Embroidered Collar Band
  const collarGeo = new THREE.TorusGeometry(0.13, 0.025, 16, 48);
  const collar = new THREE.Mesh(collarGeo, goldTrimMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.68;
  group.add(collar);

  // 4. Central Placket Trim
  const placketGeo = new THREE.BoxGeometry(0.045, 0.85, 0.02);
  const placket = new THREE.Mesh(placketGeo, goldTrimMat);
  placket.position.set(0, 0.25, 0.41);
  group.add(placket);

  // 5. Agbada Wing Drapes (Sleeves)
  const wingGeo = new THREE.CylinderGeometry(0.18, 0.26, 1.1, 24, 1, true, 0, Math.PI);
  // Left wing
  const leftWing = new THREE.Mesh(wingGeo, fabricMat);
  leftWing.position.set(-0.48, 0.05, 0);
  leftWing.rotation.z = 0.25;
  group.add(leftWing);

  // Right wing
  const rightWing = new THREE.Mesh(wingGeo, fabricMat);
  rightWing.position.set(0.48, 0.05, 0);
  rightWing.rotation.z = -0.25;
  rightWing.rotation.y = Math.PI;
  group.add(rightWing);

  // 6. Buttons
  for (let i = 0; i < 4; i++) {
    const btnGeo = new THREE.SphereGeometry(0.018, 16, 16);
    const btn = new THREE.Mesh(btnGeo, goldTrimMat);
    btn.position.set(0, 0.5 - i * 0.16, 0.43);
    group.add(btn);
  }

  // 7. Hemline Accent Ring
  const hemGeo = new THREE.TorusGeometry(0.55, 0.016, 16, 48);
  const hem = new THREE.Mesh(hemGeo, goldTrimMat);
  hem.rotation.x = Math.PI / 2;
  hem.position.y = -0.98;
  group.add(hem);

  return group;
}

function setupControls(domElement) {
  domElement.addEventListener('pointerdown', (e) => {
    isPointerDown = true;
    isInteracting = true;
    pointerStartX = e.clientX;
    pointerStartY = e.clientY;
    startRotationX = targetRotationX;
    startRotationY = targetRotationY;
    if (idleTimer) clearTimeout(idleTimer);
  });

  window.addEventListener('pointermove', (e) => {
    if (!isPointerDown) return;
    const deltaX = e.clientX - pointerStartX;
    const deltaY = e.clientY - pointerStartY;

    targetRotationY = startRotationY + deltaX * 0.008;
    targetRotationX = Math.max(-0.4, Math.min(0.6, startRotationX + deltaY * 0.006));
  });

  window.addEventListener('pointerup', () => {
    if (isPointerDown) {
      isPointerDown = false;
      // After 2.5s of no interaction, resume gentle idle spin
      idleTimer = setTimeout(() => {
        isInteracting = false;
      }, 2500);
    }
  });
}

function startRenderLoop() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  // Check prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animate() {
    if (!isModalOpen) return;

    // Damped orbit interpolation
    currentRotationY += (targetRotationY - currentRotationY) * 0.08;
    currentRotationX += (targetRotationX - currentRotationX) * 0.08;

    // Idle rotation when not interacting and reduced motion is false
    if (!isInteracting && !prefersReducedMotion) {
      targetRotationY += 0.004;
    }

    if (garmentGroup) {
      garmentGroup.rotation.y = currentRotationY;
      garmentGroup.rotation.x = currentRotationX;
    }

    renderer.render(scene, camera);
    animationFrameId = requestAnimationFrame(animate);
  }

  animate();
}
