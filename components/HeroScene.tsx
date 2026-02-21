"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
    PerspectiveCamera,
    Points,
    PointMaterial,
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { Mesh, Vector3, MathUtils, SphereGeometry, BufferAttribute, Color } from "three";

/* ─── Generate face-shaped point cloud ─── */
function generateFacePoints(count: number) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        // Distribute points on an elongated sphere (face shape)
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 1.8 + (Math.random() - 0.5) * 0.3;

        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta) * 0.85;     // x - slightly narrower
        positions[i * 3 + 1] = r * Math.cos(phi) * 1.25;                    // y - taller (face shape)
        positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) * 0.9;   // z - slightly flatter
    }
    return positions;
}

/* ─── Face Wireframe Mesh ─── */
function FaceHead() {
    const wireRef = useRef<Mesh>(null!);
    const solidRef = useRef<Mesh>(null!);
    const scrollRef = useRef(0);

    // Create deformed sphere geometry for face shape
    const faceGeometry = useMemo(() => {
        const geo = new SphereGeometry(1.8, 48, 48);
        const pos = geo.attributes.position;
        const vertex = new Vector3();

        for (let i = 0; i < pos.count; i++) {
            vertex.fromBufferAttribute(pos as BufferAttribute, i);

            // Scale Y to make it taller (head shape)
            vertex.y *= 1.25;
            // Narrow the sides slightly
            vertex.x *= 0.85;
            // Flatten front/back slightly
            vertex.z *= 0.9;

            // Add subtle chin indent at bottom
            if (vertex.y < -1.2) {
                const chinFactor = Math.abs(vertex.y + 1.2) * 0.3;
                vertex.x *= 1 - chinFactor * 0.4;
                vertex.z *= 1 - chinFactor * 0.3;
            }

            // Slight brow ridge bump
            if (vertex.y > 0.8 && vertex.y < 1.2 && vertex.z > 0.5) {
                vertex.z += 0.15;
            }

            // Nose bump
            if (vertex.y > -0.3 && vertex.y < 0.5 && vertex.z > 1.0) {
                vertex.z += 0.25 * (1 - Math.abs(vertex.x) * 2);
            }

            pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
        return geo;
    }, []);

    useFrame((state) => {
        const st = window.scrollY;
        const sh = document.documentElement.scrollHeight - window.innerHeight;
        const target = sh > 0 ? st / sh : 0;
        scrollRef.current = MathUtils.lerp(scrollRef.current, target, 0.08);

        const t = state.clock.getElapsedTime();
        const s = scrollRef.current;

        if (wireRef.current) {
            wireRef.current.rotation.y = Math.sin(t * 0.3) * 0.3 + s * 4;
            wireRef.current.rotation.x = Math.sin(t * 0.2) * 0.08 + s * 1.5;
            wireRef.current.position.y = Math.sin(t * 0.5) * 0.1 - s * 1.5;
        }
        if (solidRef.current) {
            solidRef.current.rotation.y = wireRef.current?.rotation.y ?? 0;
            solidRef.current.rotation.x = wireRef.current?.rotation.x ?? 0;
            solidRef.current.position.y = wireRef.current?.position.y ?? 0;
        }
    });

    return (
        <group>
            {/* Solid dark inner face */}
            <mesh ref={solidRef} geometry={faceGeometry}>
                <meshStandardMaterial color="#080818" roughness={0.9} metalness={0.1} />
            </mesh>

            {/* Wireframe outer face */}
            <mesh ref={wireRef} geometry={faceGeometry}>
                <meshStandardMaterial
                    color="#6366f1"
                    wireframe
                    transparent
                    opacity={0.3}
                    emissive="#4f46e5"
                    emissiveIntensity={0.8}
                />
            </mesh>
        </group>
    );
}

/* ─── Scanning Line ─── */
function ScanLine() {
    const lineRef = useRef<Mesh>(null!);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        // Oscillate up and down over the face
        if (lineRef.current) {
            lineRef.current.position.y = Math.sin(t * 0.8) * 2.2;
            // Pulse opacity
            const mat = lineRef.current.material as any;
            if (mat) mat.opacity = 0.4 + Math.sin(t * 3) * 0.2;
        }
    });

    return (
        <mesh ref={lineRef} rotation={[0, 0, 0]}>
            <planeGeometry args={[5, 0.03]} />
            <meshBasicMaterial
                color="#818cf8"
                transparent
                opacity={0.5}
            />
        </mesh>
    );
}

/* ─── Floating Points ─── */
function FacePoints() {
    const pointsRef = useRef<any>(null!);
    const positions = useMemo(() => generateFacePoints(1500), []);

    useFrame((state) => {
        if (pointsRef.current) {
            pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
        }
    });

    return (
        <Points ref={pointsRef} positions={positions} stride={3}>
            <PointMaterial
                transparent
                color="#a5b4fc"
                size={0.02}
                sizeAttenuation
                depthWrite={false}
                opacity={0.4}
            />
        </Points>
    );
}

/* ─── Camera Rig ─── */
function Rig() {
    const { camera } = useThree();
    const vec = useMemo(() => new Vector3(), []);

    return useFrame((state) => {
        camera.position.lerp(
            vec.set(state.pointer.x * 0.8, state.pointer.y * 0.5, 7),
            0.04
        );
        camera.lookAt(0, 0, 0);
    });
}

/* ─── Exported Component ─── */
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
                frameloop="always"
            >
                <Suspense fallback={null}>
                    <PerspectiveCamera makeDefault position={[0, 0, 7]} fov={50} />

                    <ambientLight intensity={0.08} />
                    <directionalLight position={[3, 5, 5]} intensity={0.8} color="#c7d2fe" />
                    <pointLight position={[-5, -3, -5]} color="#4f46e5" intensity={1.5} />
                    <pointLight position={[5, 3, 2]} color="#6366f1" intensity={0.5} />

                    <FaceHead />
                    <ScanLine />
                    <FacePoints />
                    <Rig />

                    <EffectComposer multisampling={0}>
                        <Bloom luminanceThreshold={0.8} mipmapBlur intensity={1.2} radius={0.4} />
                        <Vignette eskil={false} offset={0.15} darkness={1.1} />
                    </EffectComposer>

                    <fog attach="fog" args={["#030303", 4, 18]} />
                </Suspense>
            </Canvas>
        </div>
    );
}
