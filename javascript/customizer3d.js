import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class JewelryCustomizer {
    constructor() {
        this.container = document.querySelector('.canvas-wrapper');
        this.canvas = document.getElementById('customizer-canvas');
        this.loader = document.getElementById('customizer-loader');
        
        if (!this.canvas || !this.container) return;

        // Initialize state
        this.state = {
            metal: 'yellow-gold',
            gem: 'diamond',
            autoRotate: true,
            sparkle: false
        };

        // Material Presets - High-gloss PBR metals for realistic reflections
        this.materials = {
            metals: {
                'yellow-gold': new THREE.MeshStandardMaterial({
                    color: 0xd4af37, // Real Gold color
                    metalness: 1.0,   // 100% metallic realism
                    roughness: 0.08,  // Highly polished mirror surface
                    name: 'yellow-gold'
                }),
                'rose-gold': new THREE.MeshStandardMaterial({
                    color: 0xb76e79, // Real Rose Gold
                    metalness: 1.0,
                    roughness: 0.08,
                    name: 'rose-gold'
                }),
                'platinum': new THREE.MeshStandardMaterial({
                    color: 0xe5e8e8, // Real Platinum / White Gold
                    metalness: 1.0,
                    roughness: 0.07,
                    name: 'platinum'
                })
            },
            gems: {
                'diamond': new THREE.MeshPhysicalMaterial({
                    color: 0xffffff,
                    roughness: 0.0,
                    metalness: 0.0,
                    transmission: 0.98,
                    thickness: 0.6,
                    ior: 2.417, // Diamond Index of Refraction
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.0,
                    transparent: true,
                    opacity: 1.0,
                    side: THREE.DoubleSide
                }),
                'ruby': new THREE.MeshPhysicalMaterial({
                    color: 0xC41E3A,
                    roughness: 0.02,
                    metalness: 0.0,
                    transmission: 0.9,
                    thickness: 0.7,
                    ior: 1.766, // Ruby Index of Refraction
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.0,
                    transparent: true,
                    opacity: 1.0,
                    side: THREE.DoubleSide
                }),
                'emerald': new THREE.MeshPhysicalMaterial({
                    color: 0x50c878,
                    roughness: 0.03,
                    metalness: 0.0,
                    transmission: 0.88,
                    thickness: 0.8,
                    ior: 1.576, // Emerald Index of Refraction
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.0,
                    transparent: true,
                    opacity: 1.0,
                    side: THREE.DoubleSide
                }),
                'sapphire': new THREE.MeshPhysicalMaterial({
                    color: 0x0f52ba,
                    roughness: 0.02,
                    metalness: 0.0,
                    transmission: 0.91,
                    thickness: 0.75,
                    ior: 1.77, // Sapphire Index of Refraction
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.0,
                    transparent: true,
                    opacity: 1.0,
                    side: THREE.DoubleSide
                })
            }
        };

        this.init();
    }

    init() {
        // 1. Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = null; // Transparent background to leverage CSS gradients

        // 2. Camera setup
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
        this.camera.position.set(0, 3.5, 7.5);

        // 3. Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.25;

        // 4. Orbit Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 4;
        this.controls.maxDistance = 15;
        this.controls.enablePan = false;
        
        // Auto-tilt settings for OrbitControls
        this.controls.minPolarAngle = Math.PI / 6; // Limit top angle
        this.controls.maxPolarAngle = Math.PI / 1.8; // Limit bottom angle

        // 5. Lighting Setup
        this.setupLighting();

        // 6. Build the 3D Model
        this.buildJewelry();

        // 7. Space Dust Particles Effect
        this.setupParticles();

        // 8. Bind interactive UI events
        this.bindEvents();

        // Hide loader once setup finishes
        if (this.loader) {
            setTimeout(() => {
                this.loader.classList.add('fade-out');
            }, 600);
        }

        // 9. Start render loop
        this.animate();

        // 10. Handle window resizing
        window.addEventListener('resize', () => this.onResize());
    }

    setupLighting() {
        // Soft ambient to prevent pitch-black back shadow, while retaining high PBR contrast
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
        this.scene.add(ambientLight);

        // 1. Front-Right Key Light
        this.keyLight = new THREE.DirectionalLight(0xffffff, 5.0);
        this.keyLight.position.set(5, 8, 5);
        this.keyLight.castShadow = true;
        this.keyLight.shadow.mapSize.width = 1024;
        this.keyLight.shadow.mapSize.height = 1024;
        this.keyLight.shadow.bias = -0.0005;
        this.scene.add(this.keyLight);

        // 2. Front-Left Fill Light (for front-face metallic highlights)
        const fillLight = new THREE.DirectionalLight(0xffffff, 4.0);
        fillLight.position.set(-5, 2, 5);
        this.scene.add(fillLight);

        // 3. Back-Left Gold Rim Light (brings out rich warm gold curves)
        const goldRimLight = new THREE.DirectionalLight(0xffd700, 4.5);
        goldRimLight.position.set(-5, 4, -5);
        this.scene.add(goldRimLight);

        // 4. Back-Right Silver Rim Light (adds white gold specular highlight)
        const silverRimLight = new THREE.DirectionalLight(0xffffff, 3.5);
        silverRimLight.position.set(5, 4, -5);
        this.scene.add(silverRimLight);

        // 5. Overhead Crown Spotlight (to directly illuminate the gemstone facets)
        const overheadLight = new THREE.DirectionalLight(0xffffff, 4.5);
        overheadLight.position.set(0, 10, 0);
        this.scene.add(overheadLight);

        // 6. Underneath Bounce Light (reflects off bottom curved gold edges)
        const bounceLight = new THREE.DirectionalLight(0xffffff, 2.5);
        bounceLight.position.set(0, -6, 0);
        this.scene.add(bounceLight);

        // Blue sparkle glint light to simulate diamond facets reflecting skies
        this.sparkleLight = new THREE.PointLight(0xa5c9ff, 6.0, 15);
        this.sparkleLight.position.set(0, 2.36, 0);
        this.scene.add(this.sparkleLight);
    }

    buildJewelry() {
        this.jewelryGroup = new THREE.Group();

        // A. Ring Band (Torus) - Stand vertical in X-Y plane
        const bandGeometry = new THREE.TorusGeometry(1.6, 0.22, 32, 80);
        this.band = new THREE.Mesh(bandGeometry, this.materials.metals[this.state.metal]);
        this.band.rotation.x = 0;
        this.band.castShadow = true;
        this.band.receiveShadow = true;
        this.jewelryGroup.add(this.band);

        // B. Gem Crown Setting
        this.clawsGroup = new THREE.Group();
        this.clawsGroup.position.set(0, 1.78, 0);

        // Base collar holding claws
        const collarGeom = new THREE.CylinderGeometry(0.5, 0.4, 0.2, 16);
        const collar = new THREE.Mesh(collarGeom, this.materials.metals[this.state.metal]);
        collar.position.y = -0.05;
        collar.castShadow = true;
        this.clawsGroup.add(collar);

        // Claws (4 small cylinders wrapping the diamond)
        const clawGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.65, 8);
        const clawAngle = Math.PI / 4;
        const clawRadius = 0.48;

        for (let i = 0; i < 4; i++) {
            const angle = clawAngle + (i * Math.PI / 2);
            const claw = new THREE.Mesh(clawGeom, this.materials.metals[this.state.metal]);
            
            claw.position.x = Math.cos(angle) * clawRadius;
            claw.position.z = Math.sin(angle) * clawRadius;
            claw.position.y = 0.28;
            
            // Rotate claw inwards slightly
            claw.rotation.z = -Math.cos(angle) * 0.2;
            claw.rotation.x = Math.sin(angle) * 0.2;
            
            claw.castShadow = true;
            this.clawsGroup.add(claw);
        }
        
        this.jewelryGroup.add(this.clawsGroup);

        // C. Center Gemstone
        // Creating beautiful double-pyramid diamond facet geometry
        const gemGeom = new THREE.OctahedronGeometry(0.68, 1);
        this.gem = new THREE.Mesh(gemGeom, this.materials.gems[this.state.gem]);
        this.gem.position.set(0, 2.36, 0);
        this.gem.rotation.y = Math.PI / 8; // Offset rotation to align facets cinematographically
        this.gem.castShadow = true;
        this.jewelryGroup.add(this.gem);

        // Adjust complete jewelry position
        this.jewelryGroup.position.y = -0.6;
        this.scene.add(this.jewelryGroup);
    }

    setupParticles() {
        const particleCount = 60;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const scales = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            // Position particles in a spherical field around the ring
            const radius = 3.5 + Math.random() * 5.0;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            scales[i] = Math.random();
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

        // Creating glowing particle material (gold stardust)
        const material = new THREE.PointsMaterial({
            color: 0xffd700,
            size: 0.05,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    bindEvents() {
        // A. Metal Selector swatches
        const metalSwatches = document.querySelectorAll('.metal-swatch');
        metalSwatches.forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                metalSwatches.forEach(btn => btn.classList.remove('active'));
                swatch.classList.add('active');
                
                const selectedMetal = swatch.getAttribute('data-metal');
                this.updateMetal(selectedMetal);
            });
        });

        // B. Gem Selector swatches
        const gemSwatches = document.querySelectorAll('.gem-swatch');
        gemSwatches.forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                gemSwatches.forEach(btn => btn.classList.remove('active'));
                swatch.classList.add('active');
                
                const selectedGem = swatch.getAttribute('data-gem');
                this.updateGem(selectedGem);
            });
        });

        // C. Spin Toggle
        const spinBtn = document.getElementById('btn-spin');
        if (spinBtn) {
            spinBtn.addEventListener('click', () => {
                this.state.autoRotate = !this.state.autoRotate;
                spinBtn.classList.toggle('active', this.state.autoRotate);
            });
        }

        // D. Sparkle Effect Toggle
        const sparkleBtn = document.getElementById('btn-sparkle');
        if (sparkleBtn) {
            sparkleBtn.addEventListener('click', () => {
                this.triggerGlintSparkle();
            });
        }
    }

    updateMetal(metalId) {
        if (!this.materials.metals[metalId]) return;
        this.state.metal = metalId;
        const newMaterial = this.materials.metals[metalId];
        
        // Update meshes
        this.band.material = newMaterial;
        this.clawsGroup.traverse((child) => {
            if (child.isMesh) {
                child.material = newMaterial;
            }
        });
    }

    updateGem(gemId) {
        if (!this.materials.gems[gemId]) return;
        this.state.gem = gemId;
        
        // Dynamic glint light tint depending on gemstone choice
        const colorMap = {
            'diamond': 0xa5c9ff,
            'ruby': 0xff5555,
            'emerald': 0x6effaa,
            'sapphire': 0x6e9eff
        };
        this.sparkleLight.color.setHex(colorMap[gemId] || 0xffffff);

        // Apply new material to gem mesh
        this.gem.material = this.materials.gems[gemId];
    }

    triggerGlintSparkle() {
        this.state.sparkle = true;
        this.sparkleTime = 0;
        
        // Trigger a subtle flash on point lights
        const originalIntensity = this.sparkleLight.intensity;
        this.sparkleLight.intensity = 20.0;
        
        // Pull highlight directional light intensity up briefly
        this.keyLight.intensity = 8.0;

        setTimeout(() => {
            this.sparkleLight.intensity = 6.0;
            this.keyLight.intensity = 4.0;
            this.state.sparkle = false;
        }, 800);
    }

    onResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const clockTime = performance.now() * 0.001;

        // Auto rotation
        if (this.state.autoRotate && this.jewelryGroup) {
            this.jewelryGroup.rotation.y = clockTime * 0.25;
            this.jewelryGroup.rotation.x = Math.sin(clockTime * 0.2) * 0.1;
        }

        // Particle field rotation (gives a slow nebula drift sensation)
        if (this.particles) {
            this.particles.rotation.y = clockTime * 0.04;
            this.particles.rotation.x = clockTime * 0.02;
        }

        // Gem sparkling pulsing light
        if (this.sparkleLight) {
            if (this.state.sparkle) {
                // Energetic quick pulsing
                this.sparkleLight.intensity = 10.0 + Math.sin(clockTime * 45) * 8.0;
            } else {
                // Subtle breathing pulse
                this.sparkleLight.intensity = 4.0 + Math.sin(clockTime * 3) * 1.5;
            }
        }

        // Damping controls
        this.controls.update();

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialise the customizer with robust readyState execution check
const initCustomizer = () => {
    new JewelryCustomizer();
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCustomizer);
} else {
    initCustomizer();
}
