"use client";

import { useRef, useMemo, Suspense, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Points, PointMaterial } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

/* ─────────────────────────────────────────────
   VOXEL FACE — hundreds of pixel cubes forming a face
───────────────────────────────────────────── */
function generateVoxelPositions() {
    const voxels: { pos: [number, number, number]; color: string; size: number; region: string }[] = [];

    // Face silhouette mask — returns true if (x, y) is "inside" the face outline
    const insideFace = (x: number, y: number): boolean => {
        // Elliptical face: narrower at top and tapers at chin
        const ny = y / 3.0; // normalize y from approx -3 to +3
        let halfWidth: number;

        if (ny > 0.6) {
            // Forehead — rounded dome
            halfWidth = 1.2 * Math.sqrt(Math.max(0, 1 - ((ny - 0.2) / 1.1) ** 2));
        } else if (ny > -0.4) {
            // Mid face — cheekbones
            halfWidth = 1.25;
        } else {
            // Jaw taper
            halfWidth = 1.25 * Math.max(0, 1 - ((ny + 0.4) / 0.9) ** 1.8);
        }

        return Math.abs(x) < halfWidth;
    };

    const step = 0.22;

    for (let y = -2.8; y <= 3.2; y += step) {
        for (let x = -1.8; x <= 1.8; x += step) {
            if (!insideFace(x, y)) continue;

            const ny = y / 3.0;
            const ax = Math.abs(x);

            // Determine region for coloring
            let region = "skin";
            let color = "#6366f1";
            let size = 0.08;

            // Eyes
            if (ny > 0.08 && ny < 0.28 && ax > 0.28 && ax < 0.7) {
                region = "eye";
                color = "#22d3ee";
                size = 0.09;
            }
            // Eyebrows
            else if (ny > 0.28 && ny < 0.42 && ax > 0.2 && ax < 0.85) {
                region = "brow";
                color = "#a5b4fc";
                size = 0.085;
            }
            // Nose bridge
            else if (ny > -0.2 && ny < 0.15 && ax < 0.18) {
                region = "nose";
                color = "#818cf8";
                size = 0.075;
            }
            // Nose tip / nostrils
            else if (ny > -0.30 && ny < -0.15 && ax < 0.35) {
                region = "nose";
                color = "#818cf8";
                size = 0.08;
            }
            // Mouth
            else if (ny > -0.55 && ny < -0.38 && ax < 0.5) {
                region = "mouth";
                color = "#f0abfc";
                size = 0.075;
            }
            // Cheeks
            else if (ny > -0.25 && ny < 0.15 && ax > 0.75) {
                region = "cheek";
                color = "#4f46e5";
                size = 0.07;
            }
            // Forehead
            else if (ny > 0.5) {
                region = "forehead";
                color = "#4338ca";
                size = 0.075;
            }
            // Chin
            else if (ny < -0.6) {
                region = "chin";
                color = "#4338ca";
                size = 0.07;
            }

            // Add small random Z depth for face curvature
            const rFace = 2.2;
            const dist = Math.sqrt(x * x + (y * 0.8) ** 2);
            const z = Math.sqrt(Math.max(0, rFace ** 2 - dist ** 2)) - rFace + 0.5;

            // Small jitter for organic feel
            const jx = (Math.random() - 0.5) * 0.02;
            const jy = (Math.random() - 0.5) * 0.02;
            const jz = (Math.random() - 0.5) * 0.02;

            voxels.push({
                pos: [x + jx, y + jy, z + jz],
                color,
                size: size + (Math.random() - 0.5) * 0.015,
                region,
            });
        }
    }

    return voxels;
}

function VoxelFace() {
    const groupRef = useRef<THREE.Group>(null!);
    const scroll = useRef(0);
    const voxels = useMemo(generateVoxelPositions, []);

    // Refs for individual animated voxels
    const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

    useFrame((state) => {
        const sh = document.documentElement.scrollHeight - window.innerHeight;
        scroll.current = THREE.MathUtils.lerp(
            scroll.current,
            sh > 0 ? window.scrollY / sh : 0,
            0.06
        );
        const t = state.clock.getElapsedTime();
        const s = scroll.current;

        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.25 + s * 3;
            groupRef.current.rotation.x = Math.sin(t * 0.15) * 0.05 + s * 0.8;
            groupRef.current.position.y = Math.sin(t * 0.35) * 0.1 - s * 2;
        }

        // Animate individual voxels — wave pulse
        meshRefs.current.forEach((mesh, i) => {
            if (!mesh) return;
            const v = voxels[i];
            const wave = Math.sin(t * 1.5 + v.pos[0] * 2 + v.pos[1] * 1.5) * 0.03;
            mesh.position.z = v.pos[2] + wave;

            // Pulsing opacity for eyes
            if (v.region === "eye") {
                const mat = mesh.material as THREE.MeshBasicMaterial;
                mat.opacity = 0.7 + Math.sin(t * 2.5 + i * 0.1) * 0.2;
            }
        });
    });

    return (
        <group ref={groupRef}>
            {voxels.map((v, i) => (
                <mesh
                    key={i}
                    ref={(el) => { meshRefs.current[i] = el; }}
                    position={v.pos}
                >
                    <boxGeometry args={[v.size, v.size, v.size * 1.2]} />
                    <meshBasicMaterial
                        color={v.color}
                        transparent
                        opacity={v.region === "eye" ? 0.85 : 0.55}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

/* ─────────────────────────────────────────────
   SCAN RINGS — torus rings orbiting the face
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
        const py = Math.sin(t * 0.35) * 0.1 - scroll.current * 2;

        if (r1.current) {
            r1.current.rotation.y += 0.005;
            r1.current.position.y = py;
            (r1.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(t * 1.2) * 0.05;
        }
        if (r2.current) {
            r2.current.rotation.z += 0.004;
            r2.current.rotation.x += 0.002;
            r2.current.position.y = py;
        }
        if (r3.current) {
            r3.current.rotation.y -= 0.006;
            r3.current.rotation.z += 0.003;
            r3.current.position.y = py;
        }
    });

    return (
        <>
            <mesh ref={r1} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[3.0, 0.008, 2, 200]} />
                <meshBasicMaterial color="#22d3ee" transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh ref={r2} rotation={[0.5, 0.6, 0]}>
                <torusGeometry args={[3.3, 0.006, 2, 200]} />
                <meshBasicMaterial color="#818cf8" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh ref={r3} rotation={[1.0, 0.2, 0.5]}>
                <torusGeometry args={[3.5, 0.005, 2, 200]} />
                <meshBasicMaterial color="#f0abfc" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
        </>
    );
}

/* ─────────────────────────────────────────────
   HORIZONTAL SCAN BEAM
───────────────────────────────────────────── */
function ScanBeam() {
    const ref = useRef<THREE.Mesh>(null!);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        ref.current.position.y = Math.sin(t * 0.6) * 3.5;
        (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.18 + Math.sin(t * 3) * 0.07;
    });

    return (
        <mesh ref={ref}>
            <planeGeometry args={[8, 0.015]} />
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
    );
}

/* ─────────────────────────────────────────────
   FLOATING DATA PARTICLES
───────────────────────────────────────────── */
function DataParticles() {
    const ref = useRef<any>(null!);
    const positions = useMemo(() => {
        const arr = new Float32Array(3000);
        for (let i = 0; i < 1000; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 3.5 + Math.random() * 4.0;
            arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            arr[i * 3 + 1] = r * Math.cos(phi) * 1.2;
            arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        }
        return arr;
    }, []);

    useFrame((state) => {
        ref.current.rotation.y = state.clock.getElapsedTime() * 0.03;
    });

    return (
        <Points ref={ref} positions={positions} stride={3}>
            <PointMaterial
                transparent
                color="#a5b4fc"
                size={0.018}
                sizeAttenuation
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                opacity={0.45}
            />
        </Points>
    );
}

/* ─────────────────────────────────────────────
   ACCENT GLOWING ORBS
───────────────────────────────────────────── */
function AccentOrbs() {
    const o1 = useRef<THREE.Mesh>(null!);
    const o2 = useRef<THREE.Mesh>(null!);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        o1.current.position.set(Math.sin(t * 0.5) * 4, Math.cos(t * 0.4) * 2, Math.sin(t * 0.3) * 2);
        o2.current.position.set(Math.cos(t * 0.35) * -3.5, Math.sin(t * 0.5) * 2.5, Math.cos(t * 0.4) * 1.5);
        (o1.current.material as THREE.MeshBasicMaterial).opacity = 0.10 + Math.sin(t) * 0.04;
        (o2.current.material as THREE.MeshBasicMaterial).opacity = 0.08 + Math.sin(t * 0.8) * 0.03;
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

/* ─────────────────────────────────────────────
   CAMERA RIG — smooth mouse parallax
───────────────────────────────────────────── */
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
                gl={{
                    antialias: false,
                    alpha: false,
                    powerPreference: "high-performance",
                    stencil: false,
                    depth: true,
                }}
                performance={{ min: 0.5 }}
            >
                <Suspense fallback={null}>
                    <PerspectiveCamera makeDefault position={[0, 0, 9]} fov={50} />

                    {/* Minimal lighting — voxels use MeshBasicMaterial */}
                    <ambientLight intensity={0.05} />
                    <pointLight position={[-4, -2, -3]} color="#4f46e5" intensity={2.0} />
                    <pointLight position={[4, 2, 3]} color="#0ea5e9" intensity={1.5} />

                    {/* Pixel Face */}
                    <VoxelFace />

                    {/* Scanner FX */}
                    <ScanBeam />
                    <ScanRings />

                    {/* Environment */}
                    <DataParticles />
                    <AccentOrbs />
                    <Rig />

                    {/* Post-processing */}
                    <EffectComposer multisampling={0}>
                        <Bloom luminanceThreshold={0.4} mipmapBlur intensity={2.5} radius={0.6} />
                        <Vignette eskil={false} offset={0.1} darkness={1.3} />
                    </EffectComposer>

                    <fog attach="fog" args={["#030303", 6, 24]} />
                </Suspense>
            </Canvas>
        </div>
    );
}
