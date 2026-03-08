import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

// ── Bedroom GLB model ─────────────────────────────────────────
function BedroomModel() {
    const { scene } = useGLTF('/models/roomver2.glb');
    return <primitive object={scene} />;
}

// Preload so it starts fetching before the transition fires
useGLTF.preload('/models/roomver2.glb');

// ── Loading placeholder while GLB streams ─────────────────────
function Loader() {
    return (
        <mesh>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshBasicMaterial color="#8060ff" wireframe />
        </mesh>
    );
}

// ── Dust particles (subtle, indoor feeling) ───────────────────
function DustParticles({ count = 60 }) {
    const positions = React.useMemo(() => {
        const arr = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            arr[i * 3] = (Math.random() - 0.5) * 8;
            arr[i * 3 + 1] = Math.random() * 4;
            arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
        }
        return arr;
    }, [count]);

    const ref = useRef();
    useFrame(({ clock }) => {
        if (ref.current) {
            // slow upward drift
            ref.current.position.y = Math.sin(clock.getElapsedTime() * 0.2) * 0.15;
        }
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial
                size={0.018}
                color="#fff8e0"
                transparent
                opacity={0.45}
                sizeAttenuation
            />
        </points>
    );
}

// ── Full scene ────────────────────────────────────────────────
function Scene() {
    return (
        <>
            <color attach="background" args={['#0a080f']} />

            {/* Soft ambient base */}
            <ambientLight intensity={0.6} />

            {/* Warm window-style light from the side */}
            <directionalLight
                position={[4, 5, 2]}
                intensity={1.4}
                color="#ffe8c0"
                castShadow
            />
            {/* Cool fill from opposite side (like sky bounce) */}
            <directionalLight
                position={[-3, 3, -3]}
                intensity={0.5}
                color="#c0d8ff"
            />
            {/* Subtle warm lamp on table / floor */}
            <pointLight
                position={[1, 1, 1]}
                intensity={1.2}
                color="#ffb060"
                distance={6}
            />

            {/* The bedroom */}
            <Suspense fallback={<Loader />}>
                <BedroomModel />
                <ContactShadows
                    position={[0, -0.01, 0]}
                    opacity={0.5}
                    scale={12}
                    blur={2}
                    far={4}
                />
            </Suspense>

            <DustParticles />

            <OrbitControls
                enableDamping
                dampingFactor={0.07}
                minDistance={1}
                maxDistance={12}
                maxPolarAngle={Math.PI * 0.82}
                target={[0, 0.8, 0]}
            />

            <EffectComposer>
                <Bloom luminanceThreshold={0.9} mipmapBlur intensity={0.8} />
                <Vignette eskil={false} offset={0.3} darkness={0.7} />
            </EffectComposer>
        </>
    );
}

// ── Canvas wrapper ────────────────────────────────────────────
export default function Room3D({ onBack }) {
    return (
        <div style={{ position: 'absolute', inset: 0 }}>
            <Canvas
                shadows
                camera={{ position: [0, 1.6, 4], fov: 55 }}
                style={{ position: 'absolute', inset: 0 }}
            >
                <Scene />
            </Canvas>

            {onBack && (
                <button
                    id="back-to-2d-btn"
                    className="back-to-2d-btn"
                    onClick={onBack}
                >
                    ← вернуться
                </button>
            )}
        </div>
    );
}
