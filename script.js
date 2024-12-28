// Keep only essential 3D model rendering without animations
class Hero3DModel {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('hero-3d-model'),
            alpha: true,
            antialias: true
        });
        
        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Create moon
        const geometry = new THREE.SphereGeometry(3, 128, 128);
        const textureLoader = new THREE.TextureLoader();
        const moonTexture = textureLoader.load('https://space-assets-1290.nyc3.digitaloceanspaces.com/moon_texture_4k.jpg');
        
        const material = new THREE.MeshStandardMaterial({
            map: moonTexture,
            roughness: 1.0,
            metalness: 0.0,
            color: 0xffffff
        });

        this.moon = new THREE.Mesh(geometry, material);
        this.scene.add(this.moon);

        // Basic lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 2);
        mainLight.position.set(5, 3, 5);
        this.scene.add(mainLight);

        // Position camera
        this.camera.position.z = 8;

        // Initial render
        this.renderer.render(this.scene, this.camera);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);
        this.renderer.render(this.scene, this.camera);
    }
}

class Hero3DMoon {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('hero-3d-model'),
            alpha: true,
            antialias: true
        });
        
        this.init();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        // Create moon geometry with high detail
        const geometry = new THREE.SphereGeometry(3, 128, 128);
        
        // Load textures
        const textureLoader = new THREE.TextureLoader();
        const moonTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/moon_1024.jpg');
        const normalMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/normal.jpg');
        const displacementMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/displacement.jpg');
        
        // Create material with advanced properties
        const material = new THREE.MeshPhysicalMaterial({
            map: moonTexture,
            normalMap: normalMap,
            displacementMap: displacementMap,
            displacementScale: 0.1,
            roughness: 0.85,
            metalness: 0.1,
            clearcoat: 0.1,
            clearcoatRoughness: 0.4,
            envMapIntensity: 1.0
        });

        this.moon = new THREE.Mesh(geometry, material);
        this.scene.add(this.moon);

        // Add atmospheric glow
        const glowGeometry = new THREE.SphereGeometry(3.2, 64, 64);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                c: { type: "f", value: 0.5 },
                p: { type: "f", value: 4.5 },
                glowColor: { type: "c", value: new THREE.Color(0x6699ff) },
                viewVector: { type: "v3", value: this.camera.position }
            },
            vertexShader: `
                uniform vec3 viewVector;
                varying float intensity;
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(normalMatrix * viewVector);
                    intensity = pow(0.5 - dot(vNormal, vNormel), 2.0);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;
                void main() {
                    vec3 glow = glowColor * intensity;
                    gl_FragColor = vec4(glow, 1.0);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });

        this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.scene.add(this.glow);

        // Add stars background
        const starGeometry = new THREE.BufferGeometry();
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.02,
            transparent: true
        });

        const starVertices = [];
        for(let i = 0; i < 10000; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            const z = -Math.random() * 2000;
            starVertices.push(x, y, z);
        }

        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.stars);

        // Lighting setup
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
        directionalLight.position.set(5, 3, 5);
        this.scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0xff9999, 1);
        pointLight.position.set(-5, -3, 2);
        this.scene.add(pointLight);

        // Position camera
        this.camera.position.z = 8;

        // Add mouse interaction
        this.addMouseInteraction();

        // Start animation
        this.animate();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    addMouseInteraction() {
        let mouseX = 0;
        let mouseY = 0;
        let targetRotationX = 0;
        let targetRotationY = 0;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX - window.innerWidth / 2) / 100;
            mouseY = (e.clientY - window.innerHeight / 2) / 100;
            
            targetRotationX = mouseY * 0.3;
            targetRotationY = mouseX * 0.3;
        });

        // Smooth rotation update in animation loop
        this.updateRotation = () => {
            this.moon.rotation.x += (targetRotationX - this.moon.rotation.x) * 0.05;
            this.moon.rotation.y += (targetRotationY - this.moon.rotation.y) * 0.05;
            this.glow.rotation.x = this.moon.rotation.x;
            this.glow.rotation.y = this.moon.rotation.y;
        };
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update rotations
        if (this.updateRotation) {
            this.updateRotation();
        }

        // Subtle continuous rotation
        this.moon.rotation.y += 0.001;
        this.glow.rotation.y += 0.001;
        
        // Animate stars
        this.stars.rotation.y += 0.0002;

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);
    }
}

class SiteAnimations {
    constructor() {
        this.initMobileMenu();
        this.initScrollAnimations();
        this.initHoverEffects();
        this.init3DModel();
    }

    initMobileMenu() {
        const menuToggle = document.querySelector('.lunar-menu-toggle');
        const navLinks = document.querySelector('.nav-links');
        const links = document.querySelectorAll('.nav-links a');

        menuToggle?.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('active');
            
            // Animate menu items
            links.forEach((link, index) => {
                if (link.style.animation) {
                    link.style.animation = '';
                } else {
                    link.style.animation = `fadeInRight 0.5s ease forwards ${index * 0.1 + 0.2}s`;
                }
            });
        });
    }

    initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements
        document.querySelectorAll('.metric, .hero-badge, .lunar-title, .hero-description')
            .forEach(el => observer.observe(el));
    }

    initHoverEffects() {
        const buttons = document.querySelectorAll('.lunar-button');
        
        buttons.forEach(button => {
            button.addEventListener('mouseover', () => {
                button.style.transform = `scale(1.05) rotate(${Math.random() * 4 - 2}deg)`;
            });
            
            button.addEventListener('mouseout', () => {
                button.style.transform = 'scale(1) rotate(0)';
            });
        });
    }

    init3DModel() {
        // Your existing 3D model code here
        const hero3D = new Hero3DModel();
    }
}

class FAQHandler {
    constructor() {
        this.faqItems = document.querySelectorAll('.faq-item');
        this.init();
    }

    init() {
        this.faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');

            question.addEventListener('click', () => {
                const isOpen = item.classList.contains('active');

                // Close all FAQs
                this.faqItems.forEach(faq => {
                    faq.classList.remove('active');
                    faq.querySelector('.faq-answer').classList.remove('show');
                });

                // Open clicked FAQ if it wasn't open
                if (!isOpen) {
                    item.classList.add('active');
                    answer.classList.add('show');
                }
            });
        });
    }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    new SiteAnimations();
    const faqHandler = new FAQHandler();
    const hero3DMoon = new Hero3DMoon();
});

// Add some fun cursor effects
document.addEventListener('mousemove', (e) => {
    const cursor = document.createElement('div');
    cursor.className = 'cursor-trail';
    cursor.style.left = e.pageX + 'px';
    cursor.style.top = e.pageY + 'px';
    document.body.appendChild(cursor);

    setTimeout(() => {
        cursor.remove();
    }, 1000);
}); 