"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Points, PointMaterial } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

/* ─────────────────────────────────────────────
   ANATOMICAL FACE GEOMETRY — heavily sculpted sphere
───────────────────────────────────────────── */
function buildFaceGeo(): THREE.BufferGeometry {
    const geo = new THREE.SphereGeometry(2.2, 80, 80);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);

        const len = v.length();
        const nx = v.x / len, ny = v.y / len, nz = v.z / len;

        // HEAD: taller, narrower
        v.y *= 1.30;
        v.x *= 0.82;
        v.z *= 0.90;

        // FOREHEAD — slight bulge
        if (ny > 0.45 && ny < 0.85 && nz > 0.2) {
            v.z += 0.12 * nz * Math.exp(-3 * (ny - 0.65) ** 2);
        }

        // BROW RIDGE — strong shelf above eyes
        if (ny > 0.30 && ny < 0.50 && nz > 0.3) {
            v.z += 0.25 * nz * Math.exp(-10 * (ny - 0.40) ** 2);
        }

        // EYE SOCKETS — deep inset
        const leftEye = Math.exp(-12 * ((nx + 0.38) ** 2 + (ny - 0.30) ** 2));
        const rightEye = Math.exp(-12 * ((nx - 0.38) ** 2 + (ny - 0.30) ** 2));
        if (nz > 0.2) {
            v.z -= 0.35 * (leftEye + rightEye) * nz;
        }

        // CHEEKBONES — prominent lateral push
        const cheekL = Math.exp(-8 * ((nx + 0.55) ** 2 + (ny - 0.08) ** 2));
        const cheekR = Math.exp(-8 * ((nx - 0.55) ** 2 + (ny - 0.08) ** 2));
        if (nz > 0) {
            v.z += 0.22 * (cheekL + cheekR) * nz;
            v.x += 0.10 * (cheekR - cheekL) * nz;  // push outward
        }

        // NOSE — strong central protrusion
        const noseMask = Math.exp(-25 * nx ** 2);
        // Nose bridge
        if (ny > -0.10 && ny < 0.35 && nz > 0) {
            v.z += noseMask * 0.40 * Math.exp(-3 * (ny - 0.12) ** 2) * nz;
        }
        // Nose tip — extra bump
        if (ny > -0.18 && ny < 0.02 && nz > 0.3) {
            v.z += noseMask * 0.30 * Math.exp(-15 * (ny + 0.08) ** 2);
        }
        // Nostrils — widen at bottom
        if (ny > -0.22 && ny < -0.08 && nz > 0.3 && Math.abs(nx) > 0.05 && Math.abs(nx) < 0.25) {
            v.z += 0.08 * Math.exp(-8 * (ny + 0.15) ** 2);
            v.x *= 1.0 + 0.06 * Math.exp(-8 * (ny + 0.15) ** 2);
        }

        // PHILTRUM — vertical groove between nose and upper lip
        if (ny > -0.35 && ny < -0.15 && Math.abs(nx) < 0.08 && nz > 0.3) {
            v.z -= 0.06 * Math.exp(-30 * nx ** 2);
        }

        // UPPER LIP — forward and shaped
        if (ny > -0.42 && ny < -0.30 && nz > 0.2) {
            const lipCurve = Math.exp(-6 * nx ** 2);
            v.z += 0.18 * lipCurve * Math.exp(-12 * (ny + 0.36) ** 2);
        }

        // LOWER LIP — slightly fuller
        if (ny > -0.52 && ny < -0.40 && nz > 0.2) {
            const lipCurve = Math.exp(-5 * nx ** 2);
            v.z += 0.14 * lipCurve * Math.exp(-10 * (ny + 0.46) ** 2);
        }

        // MOUTH CREASE — indent between lips
        if (ny > -0.44 && ny < -0.38 && nz > 0.2 && Math.abs(nx) < 0.4) {
            v.z -= 0.08 * Math.exp(-4 * nx ** 2) * Math.exp(-20 * (ny + 0.41) ** 2);
        }

        // CHIN — forward protrusion
        if (ny < -0.55 && ny > -0.80 && nz > 0) {
            v.z += 0.15 * Math.exp(-8 * nx ** 2) * Math.exp(-4 * (ny + 0.65) ** 2) * nz;
        }

        // JAW LINE — angular taper
        if (ny < -0.40) {
            const t = (ny + 0.40) / 0.55;
            v.x *= 1 + t * 0.35;  // taper inward
        }

        // TEMPLE INDENT — subtle indent at sides of forehead
        if (ny > 0.35 && ny < 0.75 && Math.abs(nx) > 0.55 && nz > 0) {
            v.z -= 0.08 * Math.exp(-6 * (Math.abs(nx) - 0.6) ** 2);
        }

        // EARS — slight bumps
        if (Math.abs(ny - 0.15) < 0.25 && Math.abs(nx) > 0.8 && nz > -0.2 && nz < 0.3) {
            v.x *= 1.0 + 0.08 * Math.sign(nx) * Math.exp(-8 * (ny - 0.15) ** 2);
        }

        pos.setXYZ(i, v.x, v.y, v.z);
    }

    geo.computeVertexNormals();
    return geo;
}

/* ─── WIREFRAME FACE ─── */
function WireframeFace() {
    const groupRef = useRef<THREE.Group>(null!);
    const scroll = useRef(0);
    const geo = useMemo(buildFaceGeo, []);

    useFrame((state) => {
        if (!groupRef.current) return;
        const sh = document.documentElement.scrollHeight - window.innerHeight;
        scroll.current = THREE.MathUtils.lerp(scroll.current, sh > 0 ? window.scrollY / sh : 0, 0.06);
        const t = state.clock.getElapsedTime();
        const s = scroll.current;
        
        // Base animation + scroll + interactive mouse tracking
        const targetRotY = Math.sin(t * 0.18) * 0.20 + s * 3.5 + (state.pointer.x * 0.4);
        const targetRotX = Math.sin(t * 0.12) * 0.04 + s * 0.8 + (-state.pointer.y * 0.3);

        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.05);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.05);
        groupRef.current.position.y = Math.sin(t * 0.30) * 0.08 - s * 2;
    });

    return (
        <group ref={groupRef}>
            {/* Solid face - very subtle, gives depth */}
            <mesh geometry={geo}>
                <meshStandardMaterial
                    color="#1a0e08"
                    roughness={0.9}
                    metalness={0.0}
                    transparent
                    opacity={0.4}
                />
            </mesh>

            {/* Primary wireframe - skin tone */}
            <mesh geometry={geo}>
                <meshBasicMaterial
                    color="#d4a574"
                    wireframe
                    transparent
                    opacity={0.35}
                />
            </mesh>

            {/* Highlight wireframe - brighter overlay */}
            <mesh geometry={geo}>
                <meshStandardMaterial
                    color="#e8c4a0"
                    wireframe
                    emissive="#d4a574"
                    emissiveIntensity={0.3}
                    transparent
                    opacity={0.15}
                    toneMapped={false}
                />
            </mesh>
        </group>
    );
}

/* ─── FACIAL LANDMARK DOTS ─── */
function LandmarkDots() {
    const groupRef = useRef<THREE.Group>(null!);
    const scroll = useRef(0);

    // Key facial landmarks
    const landmarks: Array<{ pos: [number, number, number]; size: number; color: string }> = [
        // Left eye
        { pos: [-0.85, 0.85, 1.50], size: 0.06, color: "#00e5ff" },
        { pos: [-0.60, 0.85, 1.65], size: 0.05, color: "#00e5ff" },
        { pos: [-1.10, 0.85, 1.40], size: 0.05, color: "#00e5ff" },
        { pos: [-0.85, 0.72, 1.55], size: 0.04, color: "#00e5ff" },
        { pos: [-0.85, 0.98, 1.45], size: 0.04, color: "#00e5ff" },
        // Right eye
        { pos: [0.85, 0.85, 1.50], size: 0.06, color: "#00e5ff" },
        { pos: [0.60, 0.85, 1.65], size: 0.05, color: "#00e5ff" },
        { pos: [1.10, 0.85, 1.40], size: 0.05, color: "#00e5ff" },
        { pos: [0.85, 0.72, 1.55], size: 0.04, color: "#00e5ff" },
        { pos: [0.85, 0.98, 1.45], size: 0.04, color: "#00e5ff" },
        // Nose
        { pos: [0, 0.30, 2.10], size: 0.05, color: "#4fc3f7" },
        { pos: [0, -0.05, 2.25], size: 0.06, color: "#4fc3f7" },
        { pos: [-0.22, -0.20, 2.05], size: 0.04, color: "#4fc3f7" },
        { pos: [0.22, -0.20, 2.05], size: 0.04, color: "#4fc3f7" },
        // Lips
        { pos: [0, -0.90, 1.85], size: 0.05, color: "#f48fb1" },
        { pos: [-0.30, -0.85, 1.75], size: 0.04, color: "#f48fb1" },
        { pos: [0.30, -0.85, 1.75], size: 0.04, color: "#f48fb1" },
        { pos: [0, -1.10, 1.78], size: 0.05, color: "#f48fb1" },
        { pos: [-0.25, -1.05, 1.72], size: 0.04, color: "#f48fb1" },
        { pos: [0.25, -1.05, 1.72], size: 0.04, color: "#f48fb1" },
        // Jaw
        { pos: [-1.30, -0.60, 1.10], size: 0.04, color: "#80cbc4" },
        { pos: [1.30, -0.60, 1.10], size: 0.04, color: "#80cbc4" },
        { pos: [-1.05, -1.30, 0.80], size: 0.04, color: "#80cbc4" },
        { pos: [1.05, -1.30, 0.80], size: 0.04, color: "#80cbc4" },
        { pos: [0, -1.65, 1.30], size: 0.05, color: "#80cbc4" },
        // Cheekbones
        { pos: [-1.45, 0.20, 1.30], size: 0.05, color: "#4fc3f7" },
        { pos: [1.45, 0.20, 1.30], size: 0.05, color: "#4fc3f7" },
        // Forehead
        { pos: [0, 1.80, 1.50], size: 0.04, color: "#80cbc4" },
        { pos: [-0.50, 1.60, 1.55], size: 0.04, color: "#80cbc4" },
        { pos: [0.50, 1.60, 1.55], size: 0.04, color: "#80cbc4" },
    ];

    useFrame((state) => {
        if (!groupRef.current) return;
        const sh = document.documentElement.scrollHeight - window.innerHeight;
        scroll.current = THREE.MathUtils.lerp(scroll.current, sh > 0 ? window.scrollY / sh : 0, 0.06);
        const t = state.clock.getElapsedTime();
        const s = scroll.current;
        
        // Base animation + scroll + interactive mouse tracking (matches WireframeFace)
        const targetRotY = Math.sin(t * 0.18) * 0.20 + s * 3.5 + (state.pointer.x * 0.4);
        const targetRotX = Math.sin(t * 0.12) * 0.04 + s * 0.8 + (-state.pointer.y * 0.3);

        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.05);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.05);
        groupRef.current.position.y = Math.sin(t * 0.30) * 0.08 - s * 2;
    });

    return (
        <group ref={groupRef}>
            {landmarks.map((lm, i) => (
                <mesh key={i} position={lm.pos}>
                    <sphereGeometry args={[lm.size, 12, 12]} />
                    <meshBasicMaterial
                        color={lm.color}
                        transparent
                        opacity={0.85}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                        toneMapped={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

/* ─── SCAN BEAM ─── */
function ScanBeam() {
    const ref = useRef<THREE.Mesh>(null!);
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (ref.current) {
            ref.current.position.y = Math.sin(t * 0.6) * 3.5;
            (ref.current.material as any).opacity = 0.25 + Math.sin(t * 3) * 0.10;
        }
    });
    return (
        <mesh ref={ref}>
            <planeGeometry args={[8, 0.02]} />
            <meshBasicMaterial color="#00e5ff" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
    );
}

/* ─── SCAN RINGS ─── */
function ScanRings() {
    const r1 = useRef<THREE.Mesh>(null!);
    const r2 = useRef<THREE.Mesh>(null!);
    const scroll = useRef(0);

    useFrame((state) => {
        const sh = document.documentElement.scrollHeight - window.innerHeight;
        scroll.current = THREE.MathUtils.lerp(scroll.current, sh > 0 ? window.scrollY / sh : 0, 0.06);
        const t = state.clock.getElapsedTime();
        const py = Math.sin(t * 0.30) * 0.08 - scroll.current * 2;
        if (r1.current) { r1.current.rotation.y += 0.004; r1.current.position.y = py; }
        if (r2.current) { r2.current.rotation.z += 0.003; r2.current.rotation.x += 0.002; r2.current.position.y = py; }
    });

    return (
        <>
            <mesh ref={r1} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[3.5, 0.006, 2, 200]} />
                <meshBasicMaterial color="#00e5ff" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh ref={r2} rotation={[0.6, 0.4, 0]}>
                <torusGeometry args={[3.8, 0.005, 2, 200]} />
                <meshBasicMaterial color="#4fc3f7" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
        </>
    );
}

/* ─── DATA PARTICLES ─── */
function DataParticles() {
    const ref = useRef<any>(null!);
    const positions = useMemo(() => {
        const arr = new Float32Array(2400);
        for (let i = 0; i < 800; i++) {
            const th = Math.random() * Math.PI * 2;
            const ph = Math.acos(2 * Math.random() - 1);
            const r = 4.0 + Math.random() * 4.5;
            arr[i * 3] = r * Math.sin(ph) * Math.cos(th);
            arr[i * 3 + 1] = r * Math.cos(ph) * 1.2;
            arr[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
        }
        return arr;
    }, []);
    useFrame((state) => {
        if (ref.current) ref.current.rotation.y = state.clock.getElapsedTime() * 0.02;
    });
    return (
        <Points ref={ref} positions={positions} stride={3}>
            <PointMaterial transparent color="#80deea" size={0.015} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.35} />
        </Points>
    );
}

/* ─── CAMERA RIG ─── */
function Rig() {
    const { camera } = useThree();
    const target = useMemo(() => new THREE.Vector3(), []);
    useFrame((state) => {
        target.set(state.pointer.x * 0.6, state.pointer.y * 0.4, 8);
        camera.position.lerp(target, 0.03);
        camera.lookAt(0, 0, 0);
    });
    return null;
}

/* ─────────────────────────────────────────────
   EXPORTED SCENE
───────────────────────────────────────────── */
export default function HeroScene() {
    return (
        <div className="fixed inset-0 -z-10 w-full h-full bg-[#0a0e1a]">
            <Canvas
                dpr={[1, 1.5]}
                gl={{ antialias: false, alpha: false, powerPreference: "high-performance", stencil: false, depth: true }}
                performance={{ min: 0.5 }}
            >
                <Suspense fallback={null}>
                    <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />

                    {/* Warm skin-tone lighting */}
                    <ambientLight intensity={0.15} color="#ffeedd" />
                    <directionalLight position={[3, 4, 5]} intensity={0.8} color="#fff0e0" />
                    <pointLight position={[-5, -1, -4]} color="#ff9966" intensity={2} />
                    <pointLight position={[5, 2, 3]} color="#ffd4b2" intensity={1.5} />
                    {/* Cool accent from below for techy feel */}
                    <pointLight position={[0, -4, 2]} color="#00bcd4" intensity={2} />

                    <WireframeFace />
                    <LandmarkDots />
                    <ScanBeam />
                    <ScanRings />
                    <DataParticles />
                    <Rig />

                    <EffectComposer multisampling={0}>
                        <Bloom luminanceThreshold={0.4} mipmapBlur intensity={1.8} radius={0.6} />
                        <Vignette eskil={false} offset={0.1} darkness={1.3} />
                    </EffectComposer>

                    <fog attach="fog" args={["#0a0e1a", 8, 22]} />
                </Suspense>
            </Canvas>
        </div>
    );
}
