"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Points, PointMaterial } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

/* ─────────────────────────────────────────────
   PIXEL FACE DATA — ~150 voxels in face shape
───────────────────────────────────────────── */
function generatePixels(): Array<{ pos: [number, number, number]; color: string }> {
    const pixels: Array<{ pos: [number, number, number]; color: string }> = [];
    const step = 0.35;

    for (let y = -2.5; y <= 3.0; y += step) {
        for (let x = -1.6; x <= 1.6; x += step) {
            const ny = y / 3.0;
            const ax = Math.abs(x);

            // Face silhouette
            let hw: number;
            if (ny > 0.6) hw = 1.15 * Math.sqrt(Math.max(0, 1 - ((ny - 0.2) / 1.05) ** 2));
            else if (ny > -0.35) hw = 1.20;
            else hw = 1.20 * Math.max(0, 1 - ((ny + 0.35) / 0.85) ** 1.6);
            if (ax >= hw) continue;

            // Region coloring
            let color = "#6366f1"; // skin
            if (ny > 0.10 && ny < 0.27 && ax > 0.25 && ax < 0.65) color = "#22d3ee"; // eyes
            else if (ny > 0.27 && ny < 0.42 && ax > 0.18 && ax < 0.78) color = "#a5b4fc"; // brows
            else if (ny > -0.18 && ny < 0.14 && ax < 0.14) color = "#818cf8"; // nose bridge
            else if (ny > -0.28 && ny < -0.14 && ax < 0.26) color = "#818cf8"; // nose tip
            else if (ny > -0.52 && ny < -0.36 && ax < 0.44) color = "#f0abfc"; // mouth
            else if (ny > -0.22 && ny < 0.14 && ax > 0.74) color = "#4f46e5"; // cheeks
            else if (ny > 0.52) color = "#4338ca"; // forehead
            else if (ny < -0.56) color = "#3730a3"; // chin

            // Face curvature depth
            const dist = Math.sqrt(x * x + (y * 0.78) ** 2);
            const z = Math.sqrt(Math.max(0.01, 5.76 - dist * dist)) - 1.8;

            pixels.push({ pos: [x, y, z], color });
        }
    }
    return pixels;
}

/* ─── PIXEL FACE MESH GROUP ─── */
function PixelFace() {
    const groupRef = useRef<THREE.Group>(null!);
    const scroll = useRef(0);
    const pixels = useMemo(generatePixels, []);

    useFrame((state) => {
        if (!groupRef.current) return;
        const sh = document.documentElement.scrollHeight - window.innerHeight;
        scroll.current = THREE.MathUtils.lerp(scroll.current, sh > 0 ? window.scrollY / sh : 0, 0.06);
        const t = state.clock.getElapsedTime();
        const s = scroll.current;
        groupRef.current.rotation.y = Math.sin(t * 0.20) * 0.28 + s * 3.5;
        groupRef.current.rotation.x = Math.sin(t * 0.14) * 0.05 + s * 0.8;
        groupRef.current.position.y = Math.sin(t * 0.32) * 0.12 - s * 2;
    });

    return (
        <group ref={groupRef}>
            {pixels.map((p, i) => (
                <mesh key={i} position={p.pos}>
                    <boxGeometry args={[0.14, 0.14, 0.16]} />
                    <meshStandardMaterial
                        color={p.color}
                        emissive={p.color}
                        emissiveIntensity={1.2}
                        roughness={0.3}
                        toneMapped={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

/* ─── SCAN RINGS ─── */
function ScanRings() {
    const r1 = useRef<THREE.Mesh>(null!);
    const r2 = useRef<THREE.Mesh>(null!);
    const r3 = useRef<THREE.Mesh>(null!);
    const scroll = useRef(0);

    useFrame((state) => {
        const sh = document.documentElement.scrollHeight - window.innerHeight;
        scroll.current = THREE.MathUtils.lerp(scroll.current, sh > 0 ? window.scrollY / sh : 0, 0.06);
        const t = state.clock.getElapsedTime();
        const py = Math.sin(t * 0.32) * 0.12 - scroll.current * 2;
        if (r1.current) { r1.current.rotation.y += 0.005; r1.current.position.y = py; }
        if (r2.current) { r2.current.rotation.z += 0.004; r2.current.rotation.x += 0.002; r2.current.position.y = py; }
        if (r3.current) { r3.current.rotation.y -= 0.006; r3.current.rotation.z += 0.003; r3.current.position.y = py; }
    });

    return (
        <>
            <mesh ref={r1} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[3.2, 0.008, 2, 200]} />
                <meshBasicMaterial color="#22d3ee" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh ref={r2} rotation={[0.5, 0.6, 0]}>
                <torusGeometry args={[3.5, 0.006, 2, 200]} />
                <meshBasicMaterial color="#818cf8" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh ref={r3} rotation={[1.0, 0.2, 0.5]}>
                <torusGeometry args={[3.7, 0.005, 2, 200]} />
                <meshBasicMaterial color="#f0abfc" transparent opacity={0.10} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
        </>
    );
}

/* ─── SCAN BEAM ─── */
function ScanBeam() {
    const ref = useRef<THREE.Mesh>(null!);
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (ref.current) {
            ref.current.position.y = Math.sin(t * 0.6) * 3.5;
            (ref.current.material as any).opacity = 0.22 + Math.sin(t * 3) * 0.08;
        }
    });
    return (
        <mesh ref={ref}>
            <planeGeometry args={[8, 0.015]} />
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
    );
}

/* ─── DATA PARTICLES ─── */
function DataParticles() {
    const ref = useRef<any>(null!);
    const positions = useMemo(() => {
        const arr = new Float32Array(3000);
        for (let i = 0; i < 1000; i++) {
            const th = Math.random() * Math.PI * 2;
            const ph = Math.acos(2 * Math.random() - 1);
            const r = 3.8 + Math.random() * 4.0;
            arr[i * 3] = r * Math.sin(ph) * Math.cos(th);
            arr[i * 3 + 1] = r * Math.cos(ph) * 1.2;
            arr[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
        }
        return arr;
    }, []);
    useFrame((state) => {
        if (ref.current) ref.current.rotation.y = state.clock.getElapsedTime() * 0.03;
    });
    return (
        <Points ref={ref} positions={positions} stride={3}>
            <PointMaterial transparent color="#a5b4fc" size={0.02} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.5} />
        </Points>
    );
}

/* ─── ACCENT ORBS ─── */
function AccentOrbs() {
    const o1 = useRef<THREE.Mesh>(null!);
    const o2 = useRef<THREE.Mesh>(null!);
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (o1.current) o1.current.position.set(Math.sin(t * 0.5) * 4, Math.cos(t * 0.4) * 2, Math.sin(t * 0.3) * 2);
        if (o2.current) o2.current.position.set(Math.cos(t * 0.35) * -3.5, Math.sin(t * 0.5) * 2.5, Math.cos(t * 0.4) * 1.5);
    });
    return (
        <>
            <mesh ref={o1}>
                <sphereGeometry args={[0.6, 16, 16]} />
                <meshBasicMaterial color="#6366f1" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh ref={o2}>
                <sphereGeometry args={[0.45, 16, 16]} />
                <meshBasicMaterial color="#22d3ee" transparent opacity={0.10} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
        </>
    );
}

/* ─── CAMERA RIG ─── */
function Rig() {
    const { camera } = useThree();
    const target = useMemo(() => new THREE.Vector3(), []);
    useFrame((state) => {
        target.set(state.pointer.x * 0.8, state.pointer.y * 0.5, 9);
        camera.position.lerp(target, 0.03);
        camera.lookAt(0, 0, 0);
    });
    return null;
}

/* ─────────────────────────────────────────────
   EXPORTED HERO SCENE
───────────────────────────────────────────── */
export default function HeroScene() {
    return (
        <div className="fixed inset-0 -z-10 w-full h-full bg-[#030303]">
            <Canvas
                dpr={[1, 1.5]}
                gl={{ antialias: false, alpha: false, powerPreference: "high-performance", stencil: false, depth: true }}
                performance={{ min: 0.5 }}
            >
                <Suspense fallback={null}>
                    <PerspectiveCamera makeDefault position={[0, 0, 9]} fov={50} />

                    <ambientLight intensity={0.3} />
                    <directionalLight position={[3, 5, 5]} intensity={1.0} color="#c7d2fe" />
                    <pointLight position={[-5, -2, -4]} color="#4f46e5" intensity={4} />
                    <pointLight position={[5, 2, 3]} color="#0ea5e9" intensity={3} />
                    <pointLight position={[0, -4, 2]} color="#818cf8" intensity={2} />

                    <PixelFace />
                    <ScanBeam />
                    <ScanRings />
                    <DataParticles />
                    <AccentOrbs />
                    <Rig />

                    <EffectComposer multisampling={0}>
                        <Bloom luminanceThreshold={0.2} mipmapBlur intensity={2.5} radius={0.7} />
                        <Vignette eskil={false} offset={0.1} darkness={1.3} />
                    </EffectComposer>

                    <fog attach="fog" args={["#030303", 6, 24]} />
                </Suspense>
            </Canvas>
        </div>
    );
}
