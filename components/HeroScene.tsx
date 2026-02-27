"use client";

import { useRef, useMemo, Suspense, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Points, PointMaterial } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

/* ─────────────────────────────────────────────
   VOXEL DATA — pixel positions forming a face
───────────────────────────────────────────── */
interface VoxelData {
    x: number; y: number; z: number;
    r: number; g: number; b: number;
    size: number;
    region: string;
}

function generateVoxels(): VoxelData[] {
    const voxels: VoxelData[] = [];
    const step = 0.24;
    const colors: Record<string, [number, number, number]> = {
        eye: [0.13, 0.83, 0.93],  // cyan
        brow: [0.65, 0.71, 0.98],  // light indigo
        nose: [0.51, 0.55, 0.97],  // indigo
        mouth: [0.94, 0.67, 0.99],  // pink
        cheek: [0.31, 0.27, 0.90],  // deep indigo
        forehead: [0.26, 0.22, 0.79],  // darker indigo
        chin: [0.26, 0.22, 0.79],
        skin: [0.39, 0.40, 0.95],  // medium indigo
    };

    const insideFace = (x: number, y: number): boolean => {
        const ny = y / 3.0;
        let hw: number;
        if (ny > 0.6) hw = 1.25 * Math.sqrt(Math.max(0, 1 - ((ny - 0.2) / 1.05) ** 2));
        else if (ny > -0.35) hw = 1.30;
        else hw = 1.30 * Math.max(0, 1 - ((ny + 0.35) / 0.85) ** 1.6);
        return Math.abs(x) < hw;
    };

    for (let y = -2.8; y <= 3.3; y += step) {
        for (let x = -1.9; x <= 1.9; x += step) {
            if (!insideFace(x, y)) continue;
            const ny = y / 3.0;
            const ax = Math.abs(x);

            let region = "skin";
            if (ny > 0.10 && ny < 0.27 && ax > 0.30 && ax < 0.68) region = "eye";
            else if (ny > 0.27 && ny < 0.40 && ax > 0.22 && ax < 0.82) region = "brow";
            else if (ny > -0.18 && ny < 0.12 && ax < 0.16) region = "nose";
            else if (ny > -0.28 && ny < -0.14 && ax < 0.30) region = "nose";
            else if (ny > -0.52 && ny < -0.36 && ax < 0.48) region = "mouth";
            else if (ny > -0.22 && ny < 0.12 && ax > 0.78) region = "cheek";
            else if (ny > 0.52) region = "forehead";
            else if (ny < -0.58) region = "chin";

            const rFace = 2.4;
            const dist = Math.sqrt(x * x + (y * 0.78) ** 2);
            const z = Math.sqrt(Math.max(0.01, rFace ** 2 - dist ** 2)) - rFace + 0.6;

            const [r, g, b] = colors[region];
            const sz = 0.08 + (Math.random() - 0.5) * 0.012;
            voxels.push({ x, y, z, r, g, b, size: sz, region });
        }
    }
    return voxels;
}

/* ─────────────────────────────────────────────
   INSTANCED VOXEL FACE — single draw call
───────────────────────────────────────────── */
function VoxelFace() {
    const meshRef = useRef<THREE.InstancedMesh>(null!);
    const scroll = useRef(0);
    const voxels = useMemo(generateVoxels, []);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const basePositions = useMemo(() => voxels.map(v => [v.x, v.y, v.z] as [number, number, number]), [voxels]);

    // Set initial transforms + colors
    useEffect(() => {
        if (!meshRef.current) return;
        const color = new THREE.Color();

        voxels.forEach((v, i) => {
            dummy.position.set(v.x, v.y, v.z);
            dummy.scale.setScalar(v.size / 0.08);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
            color.setRGB(v.r, v.g, v.b);
            meshRef.current.setColorAt(i, color);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }, [voxels, dummy]);

    useFrame((state) => {
        if (!meshRef.current) return;
        const sh = document.documentElement.scrollHeight - window.innerHeight;
        scroll.current = THREE.MathUtils.lerp(scroll.current, sh > 0 ? window.scrollY / sh : 0, 0.06);
        const t = state.clock.getElapsedTime();
        const s = scroll.current;

        // Rotate whole group
        meshRef.current.rotation.y = Math.sin(t * 0.20) * 0.28 + s * 3.5;
        meshRef.current.rotation.x = Math.sin(t * 0.14) * 0.05 + s * 0.8;
        meshRef.current.position.y = Math.sin(t * 0.32) * 0.12 - s * 2;

        // Animate per-instance Z wave (every few frames for perf)
        if (Math.floor(t * 30) % 2 === 0) {
            voxels.forEach((v, i) => {
                const wave = Math.sin(t * 1.8 + v.x * 2.5 + v.y * 1.8) * 0.04;
                dummy.position.set(v.x, v.y, v.z + wave);
                dummy.scale.setScalar(v.size / 0.08);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);
            });
            meshRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, voxels.length]}>
            <boxGeometry args={[0.08, 0.08, 0.10]} />
            <meshBasicMaterial
                transparent
                opacity={0.65}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                toneMapped={false}
            />
        </instancedMesh>
    );
}

/* ─────────────────────────────────────────────
   SCAN RINGS
───────────────────────────────────────────── */
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

        r1.current.rotation.y += 0.005;
        r1.current.position.y = py;
        (r1.current.material as THREE.MeshBasicMaterial).opacity = 0.18 + Math.sin(t * 1.3) * 0.06;

        r2.current.rotation.z += 0.004;
        r2.current.rotation.x += 0.002;
        r2.current.position.y = py;

        r3.current.rotation.y -= 0.006;
        r3.current.rotation.z += 0.003;
        r3.current.position.y = py;
    });

    return (
        <>
            <mesh ref={r1} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[3.2, 0.008, 2, 200]} />
                <meshBasicMaterial color="#22d3ee" transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh ref={r2} rotation={[0.5, 0.6, 0]}>
                <torusGeometry args={[3.5, 0.006, 2, 200]} />
                <meshBasicMaterial color="#818cf8" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh ref={r3} rotation={[1.0, 0.2, 0.5]}>
                <torusGeometry args={[3.7, 0.005, 2, 200]} />
                <meshBasicMaterial color="#f0abfc" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
        </>
    );
}

/* ─── SCAN BEAM ─── */
function ScanBeam() {
    const ref = useRef<THREE.Mesh>(null!);
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        ref.current.position.y = Math.sin(t * 0.6) * 3.5;
        (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.20 + Math.sin(t * 3) * 0.08;
    });
    return (
        <mesh ref={ref}>
            <planeGeometry args={[8, 0.015]} />
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
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
    useFrame((state) => { ref.current.rotation.y = state.clock.getElapsedTime() * 0.03; });
    return (
        <Points ref={ref} positions={positions} stride={3}>
            <PointMaterial transparent color="#a5b4fc" size={0.02} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.45} />
        </Points>
    );
}

/* ─── ACCENT ORBS ─── */
function AccentOrbs() {
    const o1 = useRef<THREE.Mesh>(null!);
    const o2 = useRef<THREE.Mesh>(null!);
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        o1.current.position.set(Math.sin(t * 0.5) * 4, Math.cos(t * 0.4) * 2, Math.sin(t * 0.3) * 2);
        o2.current.position.set(Math.cos(t * 0.35) * -3.5, Math.sin(t * 0.5) * 2.5, Math.cos(t * 0.4) * 1.5);
    });
    return (
        <>
            <mesh ref={o1}>
                <sphereGeometry args={[0.6, 16, 16]} />
                <meshBasicMaterial color="#6366f1" transparent opacity={0.10} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh ref={o2}>
                <sphereGeometry args={[0.45, 16, 16]} />
                <meshBasicMaterial color="#22d3ee" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
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

                    <ambientLight intensity={0.04} />
                    <pointLight position={[-4, -2, -3]} color="#4f46e5" intensity={2} />
                    <pointLight position={[4, 2, 3]} color="#0ea5e9" intensity={1.5} />

                    <VoxelFace />
                    <ScanBeam />
                    <ScanRings />
                    <DataParticles />
                    <AccentOrbs />
                    <Rig />

                    <EffectComposer multisampling={0}>
                        <Bloom luminanceThreshold={0.3} mipmapBlur intensity={2.5} radius={0.65} />
                        <Vignette eskil={false} offset={0.1} darkness={1.3} />
                    </EffectComposer>

                    <fog attach="fog" args={["#030303", 6, 24]} />
                </Suspense>
            </Canvas>
        </div>
    );
}
