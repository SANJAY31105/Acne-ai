"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Points, PointMaterial } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import {
    Mesh, Vector3, MathUtils, SphereGeometry, BufferAttribute,
    CatmullRomCurve3, TubeGeometry,
    AdditiveBlending
} from "three";

/* ─────────────────────────────────────────────
   FACE GEOMETRY — high-res deformed sphere
   with proper brow ridge, cheeks, nose, chin
───────────────────────────────────────────── */
function buildFaceGeo() {
    const geo = new SphereGeometry(2.0, 64, 64);
    const pos = geo.attributes.position as BufferAttribute;
    const v = new Vector3();

    for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const { x, y, z } = v;
        const nx = x / 2.0, ny = y / 2.0, nz = z / 2.0;

        // Head elongation
        v.y *= 1.28;
        v.x *= 0.80;
        v.z *= 0.86;

        // ── Forehead: dome it forward ──
        if (ny > 0.55 && nz > 0) {
            v.z += 0.12 * nz * Math.max(0, ny - 0.55);
        }

        // ── Brow ridge ──
        if (ny > 0.35 && ny < 0.55 && nz > 0.5) {
            v.z += 0.22 * nz * Math.exp(-8 * (ny - 0.45) ** 2);
        }

        // ── Cheekbones ──
        const cheek = Math.exp(-6 * (ny - 0.0) ** 2) * Math.exp(-4 * (Math.abs(nx) - 0.55) ** 2);
        if (nz > 0) v.z += 0.18 * cheek * nz;

        // ── Nose bridge + tip ──
        const noseMask = Math.exp(-25 * nx ** 2);
        if (ny > -0.3 && ny < 0.45 && nz > 0) {
            v.z += noseMask * 0.35 * nz * Math.exp(-4 * (ny - 0.1) ** 2);
        }

        // ── Lip area: slight pout ──
        const lipMask = Math.exp(-20 * nx ** 2) * Math.exp(-14 * (ny + 0.35) ** 2);
        if (nz > 0) v.z += lipMask * 0.18 * nz;

        // ── Jaw / chin taper ──
        if (ny < -0.55) {
            const taper = Math.abs(ny + 0.55);
            v.x *= 1 - taper * 0.7;
            v.z *= 1 - taper * 0.3;
        }

        // ── Temples: slight concave ──
        const templeMask = Math.exp(-6 * (ny - 0.4) ** 2) * Math.exp(-5 * (Math.abs(nx) - 0.7) ** 2);
        v.x *= 1 - templeMask * 0.12;

        pos.setXYZ(i, v.x, v.y, v.z);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
}

/* ─────────────────────────────────────────────
   FACIAL LANDMARK POSITIONS
───────────────────────────────────────────── */
const LANDMARKS = [
    // Eyes
    new Vector3(-0.62, 0.55, 1.52), // left eye
    new Vector3(0.62, 0.55, 1.52),  // right eye
    // Pupils
    new Vector3(-0.62, 0.55, 1.72),
    new Vector3(0.62, 0.55, 1.72),
    // Brow ends
    new Vector3(-0.95, 0.8, 1.2),
    new Vector3(0.95, 0.8, 1.2),
    new Vector3(-0.3, 0.85, 1.55),
    new Vector3(0.3, 0.85, 1.55),
    // Nose
    new Vector3(0, 0.1, 2.0),       // nose tip
    new Vector3(-0.22, -0.08, 1.85),
    new Vector3(0.22, -0.08, 1.85),
    // Mouth corners
    new Vector3(-0.38, -0.45, 1.78),
    new Vector3(0.38, -0.45, 1.78),
    new Vector3(0, -0.38, 1.88),    // cupid's bow
    new Vector3(0, -0.55, 1.82),    // bottom lip
    // Chin
    new Vector3(0, -1.05, 1.5),
    new Vector3(-0.25, -0.85, 1.65),
    new Vector3(0.25, -0.85, 1.65),
    // Cheekbones
    new Vector3(-0.78, 0.15, 1.65),
    new Vector3(0.78, 0.15, 1.65),
    // Temples
    new Vector3(-1.05, 0.45, 0.9),
    new Vector3(1.05, 0.45, 0.9),
    // Ear points
    new Vector3(-1.55, 0.1, 0.1),
    new Vector3(1.55, 0.1, 0.1),
    // Crown / hairline
    new Vector3(0, 1.55, 1.0),
    new Vector3(-0.6, 1.48, 0.7),
    new Vector3(0.6, 1.48, 0.7),
];

/* Neural connection pairs (landmark indices) */
const CONNECTIONS = [
    [0, 4], [0, 6], [1, 5], [1, 7],     // brow
    [0, 2], [1, 3],                       // eye-pupil
    [8, 9], [8, 10], [9, 12], [10, 11],  // nose
    [11, 13], [12, 13], [11, 16], [12, 17], [13, 14], // mouth
    [15, 16], [15, 17],                   // chin
    [16, 22], [17, 23],                   // jaw-ear
    [18, 0], [19, 1],                     // cheek-eye
    [20, 4], [21, 5],                     // temple-brow
    [24, 25], [24, 26],                   // crown
    [4, 20], [5, 21],
];

/* ─────────────────────────────────────────────
   MAIN FACE GROUP
───────────────────────────────────────────── */
function FaceHead() {
    const groupRef = useRef<any>(null!);
    const wireRef = useRef<Mesh>(null!);
    const solidRef = useRef<Mesh>(null!);
    const glowRef = useRef<Mesh>(null!);
    const scroll = useRef(0);
    const faceGeo = useMemo(buildFaceGeo, []);

    useFrame((state) => {
        const st = window.scrollY;
        const sh = document.documentElement.scrollHeight - window.innerHeight;
        const target = sh > 0 ? st / sh : 0;
        scroll.current = MathUtils.lerp(scroll.current, target, 0.06);

        const t = state.clock.getElapsedTime();
        const s = scroll.current;

        const ry = Math.sin(t * 0.25) * 0.35 + s * 4;
        const rx = Math.sin(t * 0.18) * 0.06 + s * 1.2;
        const py = Math.sin(t * 0.4) * 0.12 - s * 2;

        if (groupRef.current) {
            groupRef.current.rotation.y = ry;
            groupRef.current.rotation.x = rx;
            groupRef.current.position.y = py;
        }

        // Pulse glow
        if (glowRef.current) {
            const mat = glowRef.current.material as any;
            mat.opacity = 0.04 + Math.sin(t * 1.2) * 0.02;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Solid dark face — slight skin undertone */}
            <mesh ref={solidRef} geometry={faceGeo}>
                <meshStandardMaterial color="#050510" roughness={0.95} metalness={0.05} />
            </mesh>

            {/* Wireframe overlay — cyan/indigo */}
            <mesh ref={wireRef} geometry={faceGeo}>
                <meshStandardMaterial
                    color="#38bdf8"
                    wireframe
                    transparent
                    opacity={0.18}
                    emissive="#6366f1"
                    emissiveIntensity={1.2}
                />
            </mesh>

            {/* Outer glow shell — slightly larger */}
            <mesh ref={glowRef} geometry={faceGeo} scale={1.015}>
                <meshStandardMaterial
                    color="#818cf8"
                    transparent
                    opacity={0.06}
                    side={2}
                    emissive="#818cf8"
                    emissiveIntensity={2}
                />
            </mesh>
        </group>
    );
}

/* ─────────────────────────────────────────────
   LANDMARK POINTS — glowing dots + labels
───────────────────────────────────────────── */
function LandmarkPoints() {
    const groupRef = useRef<any>(null!);
    const scroll = useRef(0);

    useFrame((state) => {
        const st = window.scrollY;
        const sh = document.documentElement.scrollHeight - window.innerHeight;
        const target = sh > 0 ? st / sh : 0;
        scroll.current = MathUtils.lerp(scroll.current, target, 0.06);

        const t = state.clock.getElapsedTime();
        const s = scroll.current;
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(t * 0.25) * 0.35 + s * 4;
            groupRef.current.rotation.x = Math.sin(t * 0.18) * 0.06 + s * 1.2;
            groupRef.current.position.y = Math.sin(t * 0.4) * 0.12 - s * 2;
        }
    });

    // Create neural-network connection tubes
    const tubes = useMemo(() => {
        return CONNECTIONS.map(([a, b], i) => {
            const curve = new CatmullRomCurve3([
                LANDMARKS[a].clone(),
                new Vector3(
                    (LANDMARKS[a].x + LANDMARKS[b].x) / 2 + (Math.random() - 0.5) * 0.05,
                    (LANDMARKS[a].y + LANDMARKS[b].y) / 2 + (Math.random() - 0.5) * 0.05,
                    (LANDMARKS[a].z + LANDMARKS[b].z) / 2,
                ),
                LANDMARKS[b].clone(),
            ]);
            return { geo: new TubeGeometry(curve, 8, 0.004, 4, false), key: i };
        });
    }, []);

    return (
        <group ref={groupRef}>
            {/* Neural connection lines */}
            {tubes.map(({ geo, key }) => (
                <mesh key={key} geometry={geo}>
                    <meshBasicMaterial
                        color="#38bdf8"
                        transparent
                        opacity={0.35}
                        blending={AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>
            ))}

            {/* Landmark glowing dots */}
            {LANDMARKS.map((pos, i) => (
                <mesh key={i} position={pos}>
                    <sphereGeometry args={[0.022, 8, 8]} />
                    <meshBasicMaterial
                        color={i < 4 ? "#f0abfc" : i < 8 ? "#a5f3fc" : "#818cf8"}
                        transparent
                        opacity={0.9}
                        blending={AdditiveBlending}
                    />
                </mesh>
            ))}
        </group>
    );
}

/* ─────────────────────────────────────────────
   ORBITAL SCAN RINGS
───────────────────────────────────────────── */
function ScanRings() {
    const rings = useRef<(Mesh | null)[]>([]);

    const ringConfigs = [
        { rx: Math.PI / 2, ry: 0, rz: 0, speed: 0.4, radius: 2.3, color: "#38bdf8", opacity: 0.18 },
        { rx: 0.3, ry: 0.6, rz: 0, speed: -0.3, radius: 2.5, color: "#818cf8", opacity: 0.12 },
        { rx: 1.1, ry: 0.3, rz: 0.4, speed: 0.6, radius: 2.6, color: "#f0abfc", opacity: 0.08 },
        { rx: Math.PI / 6, ry: 1.2, rz: 0.8, speed: -0.5, radius: 2.8, color: "#6366f1", opacity: 0.07 },
    ];

    const scroll = useRef(0);

    useFrame((state) => {
        const st = window.scrollY;
        const sh = document.documentElement.scrollHeight - window.innerHeight;
        const target = sh > 0 ? st / sh : 0;
        scroll.current = MathUtils.lerp(scroll.current, target, 0.06);

        const t = state.clock.getElapsedTime();
        const s = scroll.current;

        rings.current.forEach((ring, i) => {
            if (!ring) return;
            const cfg = ringConfigs[i];
            ring.rotation.y = cfg.ry + t * cfg.speed;
            ring.rotation.x = cfg.rx;
            ring.rotation.z = cfg.rz + t * cfg.speed * 0.3;
            ring.position.y = Math.sin(t * 0.4) * 0.12 - s * 2;

            const mat = ring.material as any;
            mat.opacity = cfg.opacity * (0.7 + 0.3 * Math.sin(t * 1.5 + i));
        });
    });

    return (
        <>
            {ringConfigs.map((cfg, i) => (
                <mesh
                    key={i}
                    ref={(el) => { rings.current[i] = el; }}
                    rotation={[cfg.rx, cfg.ry, cfg.rz]}
                >
                    <torusGeometry args={[cfg.radius, 0.008, 2, 180]} />
                    <meshBasicMaterial
                        color={cfg.color}
                        transparent
                        opacity={cfg.opacity}
                        blending={AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </>
    );
}

/* ─────────────────────────────────────────────
   ANIMATED SCAN LINE (AI sweep)
───────────────────────────────────────────── */
function ScanBeam() {
    const planeRef = useRef<Mesh>(null!);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (planeRef.current) {
            planeRef.current.position.y = Math.sin(t * 0.7) * 2.4;
            const mat = planeRef.current.material as any;
            mat.opacity = 0.25 + Math.sin(t * 4) * 0.1;
        }
    });

    return (
        <mesh ref={planeRef} rotation={[0, 0, 0]}>
            <planeGeometry args={[6, 0.012]} />
            <meshBasicMaterial
                color="#38bdf8"
                transparent
                opacity={0.3}
                blending={AdditiveBlending}
                depthWrite={false}
            />
        </mesh>
    );
}

/* ─────────────────────────────────────────────
   FLOATING PARTICLES — neural data stream
───────────────────────────────────────────── */
function DataParticles() {
    const ref = useRef<any>(null!);
    const count = 2000;

    const { positions, phases } = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const ph = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 2.8 + Math.random() * 3.0;
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.cos(phi) * 1.3;
            pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
            ph[i] = Math.random() * Math.PI * 2;
        }
        return { positions: pos, phases: ph };
    }, []);

    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y = state.clock.getElapsedTime() * 0.04;
            ref.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.06) * 0.08;
        }
    });

    return (
        <Points ref={ref} positions={positions} stride={3}>
            <PointMaterial
                transparent
                color="#a5b4fc"
                size={0.018}
                sizeAttenuation
                depthWrite={false}
                blending={AdditiveBlending}
                opacity={0.5}
            />
        </Points>
    );
}

/* ─────────────────────────────────────────────
   ACCENT ORBS — 2 pulsing light orbs
───────────────────────────────────────────── */
function AccentOrbs() {
    const orb1 = useRef<Mesh>(null!);
    const orb2 = useRef<Mesh>(null!);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (orb1.current) {
            orb1.current.position.set(
                Math.sin(t * 0.5) * 3.2,
                Math.cos(t * 0.4) * 1.5,
                Math.sin(t * 0.35) * 2
            );
            (orb1.current.material as any).opacity = 0.12 + Math.sin(t * 1.2) * 0.05;
        }
        if (orb2.current) {
            orb2.current.position.set(
                Math.cos(t * 0.4) * -3,
                Math.sin(t * 0.6) * 2,
                Math.cos(t * 0.45) * 1.5
            );
            (orb2.current.material as any).opacity = 0.1 + Math.sin(t * 0.9) * 0.04;
        }
    });

    return (
        <>
            <mesh ref={orb1}>
                <sphereGeometry args={[0.55, 16, 16]} />
                <meshBasicMaterial color="#6366f1" transparent opacity={0.12} blending={AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh ref={orb2}>
                <sphereGeometry args={[0.45, 16, 16]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.1} blending={AdditiveBlending} depthWrite={false} />
            </mesh>
        </>
    );
}

/* ─────────────────────────────────────────────
   CAMERA RIG — smooth mouse parallax
───────────────────────────────────────────── */
function Rig() {
    const { camera } = useThree();
    const vec = useMemo(() => new Vector3(), []);

    return useFrame((state) => {
        camera.position.lerp(
            vec.set(state.pointer.x * 0.6, state.pointer.y * 0.4, 8),
            0.035
        );
        camera.lookAt(0, 0, 0);
    });
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
                frameloop="always"
            >
                <Suspense fallback={null}>
                    <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={48} />

                    {/* Lighting */}
                    <ambientLight intensity={0.05} />
                    <directionalLight position={[2, 4, 5]} intensity={0.6} color="#c7d2fe" />
                    <pointLight position={[-5, -2, -4]} color="#4f46e5" intensity={2.5} />
                    <pointLight position={[5, 2, 3]} color="#0ea5e9" intensity={1.8} />
                    <pointLight position={[0, -4, 2]} color="#818cf8" intensity={1.0} />
                    <spotLight position={[0, 8, 4]} angle={0.4} penumbra={1} intensity={1.5} color="#e0f2fe" />

                    {/* 3D Face */}
                    <FaceHead />
                    <LandmarkPoints />

                    {/* Scanner FX */}
                    <ScanBeam />
                    <ScanRings />

                    {/* Environment */}
                    <DataParticles />
                    <AccentOrbs />
                    <Rig />

                    {/* Post-processing */}
                    <EffectComposer multisampling={0}>
                        <Bloom
                            luminanceThreshold={0.6}
                            mipmapBlur
                            intensity={2.0}
                            radius={0.55}
                        />
                        <Vignette eskil={false} offset={0.12} darkness={1.2} />
                    </EffectComposer>

                    <fog attach="fog" args={["#030303", 5, 22]} />
                </Suspense>
            </Canvas>
        </div>
    );
}
