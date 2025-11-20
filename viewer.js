// THREE.JS ES MODULE IMPORTS via importmap
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { gsap } from "gsap";

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 0, 2);

// Renderer with enhanced settings
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0xffffff, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById("viewer-container").appendChild(renderer.domElement);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 1.5;
controls.maxDistance = 4;

// Lighting setup for realism
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
mainLight.position.set(5, 5, 5);
scene.add(mainLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
fillLight.position.set(-3, 3, 2);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
rimLight.position.set(0, -2, 5);
scene.add(rimLight);

// HDR Environment
const rgbeLoader = new RGBELoader();
rgbeLoader.load("hdr/studio_small.hdr", (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
});

// GLB Model Loader
const loader = new GLTFLoader();
let model;

loader.load("models/ring.glb", (gltf) => {
    model = gltf.scene;

    // Center model first
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);
    model.position.sub(center);

    // Scale model
    const size = new THREE.Vector3();
    box.getSize(size);
    const scale = 1.5 / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(scale);

    // Single mesh model - use custom shader
    let originalMesh = null;
    model.traverse((child) => {
        if (child.isMesh) {
            originalMesh = child;
            console.log("Found mesh:", child.name);
        }
    });

    // Enhance materials for realism
    model.traverse((child) => {
        if (child.isMesh && child.material) {
            // Ensure realistic PBR settings
            if (child.material.isMeshPhysicalMaterial || child.material.isMeshStandardMaterial) {
                child.material.metalness = Math.max(child.material.metalness || 0, 0.8);
                child.material.roughness = Math.min(child.material.roughness || 0, 0.3);
                child.material.envMapIntensity = Math.max(child.material.envMapIntensity || 0, 1.2);
            }

            // If material doesn't support PBR, convert to physical material
            if (!(child.material.isMeshPhysicalMaterial || child.material.isMeshStandardMaterial)) {
                const originalColor = child.material.color || new THREE.Color(0xD4AF37);
                child.material = new THREE.MeshPhysicalMaterial({
                    color: originalColor,
                    metalness: 0.9,
                    roughness: 0.2,
                    clearcoat: 0.3,
                    clearcoatRoughness: 0.1,
                    envMapIntensity: 1.5
                });
            }

            console.log("Enhanced material for:", child.name);
        }
    });

    scene.add(model);

    // GSAP Animation
    gsap.to(model.rotation, {
        y: model.rotation.y + Math.PI * 2,
        duration: 20,
        repeat: -1,
        ease: "none",
    });
});



// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Scroll to model on customize button click
document.querySelector('.customize').addEventListener('click', () => {
    document.querySelector('.viewer-section').scrollIntoView({ behavior: 'smooth' });
});
