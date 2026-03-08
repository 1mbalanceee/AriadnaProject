import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import {
    OrbitControls,
    Html,
    useGLTF,
    Sparkles,
    ContactShadows,
    Environment,
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
//  TEXT SEQUENCE
// ─────────────────────────────────────────────────────────────
const compliments = [
    "Дорогая моя Ариадна...",
    "Я потерял счёт попыткам пробиться сквозь эту пустоту.",
    "Этот путь оказался намного сложнее, чем я думал в начале.",
    "Сундуки заклинивало, время замирало,",
    "а я снова и снова забывал, как зажечь этот чёртов свет.",
    "Но я готов справляться с любыми трудностями,",
    "сколько бы раз мне ни пришлось начинать сначала.",
    "Потому что ты — та самая искра,",
    "ради которой стоит снова и снова слушать едкие замечания самого же себя.",
    "Я видел, как ты росла в этой истории...",
    "От той первой минуты, когда ты просто хотела обнять подушку,",
    "до момента, когда осознала — магия это ты сама.",
    "Я очень рад наблюдать, что ты стремишься добиваться...",
    "И используешь свою природную мудрость для достижения этих целей.",
    "Уверен, что порой ты подсознательно сама знаешь решения,",
    "даже если в это сама ещё не веришь.",
    "Что ты сильная, смелая, свободная...",
    "Но при этом милая, нежная, чуткая.",
    "В те моменты, когда ты об этом забываешь...",
    "Об этом всегда буду помнить я.",
    "И всегда тебя поддержу.",
    "Спасибо, что ты есть!",
    "Я ∞ тебя люблю! ❤️",
];

// Dynamic display time: ~50ms per char, min 3500ms, max 7000ms
function displayTime(str) {
    return Math.min(7000, Math.max(3500, str.length * 60));
}

// ─────────────────────────────────────────────────────────────
//  GLB MODEL
// ─────────────────────────────────────────────────────────────
const _clayMat = new THREE.MeshStandardMaterial({
    color: '#dedad4',   // тёплый белый, как гипс/штукатурка
    roughness: 0.88,
    metalness: 0.0,
});

function BedroomModel() {
    const { scene } = useGLTF('/models/roomver2.glb');

    useEffect(() => {
        scene.traverse((child) => {
            if (child.isMesh) {
                child.material = _clayMat;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }, [scene]);

    return <primitive object={scene} />;
}
useGLTF.preload('/models/roomver2.glb');

// ─────────────────────────────────────────────────────────────
//  LOADING SCREEN (HTML overlay)
// ─────────────────────────────────────────────────────────────
function LoadingPlaceholder() {
    return (
        <mesh>
            <boxGeometry args={[0.01, 0.01, 0.01]} />
            <meshBasicMaterial transparent opacity={0} />
        </mesh>
    );
}

// ─────────────────────────────────────────────────────────────
//  INVISIBLE BED HITBOX
// ─────────────────────────────────────────────────────────────
function BedHitbox({ onStart, isRunning }) {
    const [hovered, setHovered] = useState(false);

    const handleOver = useCallback(() => {
        if (isRunning) return;
        setHovered(true);
        document.body.style.cursor = 'pointer';
    }, [isRunning]);

    const handleOut = useCallback(() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
    }, []);

    const handleClick = useCallback((e) => {
        e.stopPropagation();
        if (isRunning) return;
        document.body.style.cursor = 'auto';
        setHovered(false);
        onStart();
    }, [isRunning, onStart]);

    return (
        <group>
            {/* Invisible clickable box positioned where the bed is */}
            <mesh
                position={[0.3, 0.45, 0.2]}
                rotation={[0, 0.1, 0]}
                onClick={handleClick}
                onPointerOver={handleOver}
                onPointerOut={handleOut}
            >
                <boxGeometry args={[2.2, 0.8, 3.4]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Subtle glow outline when hovered */}
            {hovered && !isRunning && (
                <mesh position={[0.3, 0.45, 0.2]} rotation={[0, 0.1, 0]}>
                    <boxGeometry args={[2.22, 0.82, 3.42]} />
                    <meshBasicMaterial
                        color="#ffcc66"
                        transparent
                        opacity={0.07}
                        wireframe={false}
                    />
                </mesh>
            )}
        </group>
    );
}

// ─────────────────────────────────────────────────────────────
//  FIREFLY SPARKLES (drei Sparkles)
// ─────────────────────────────────────────────────────────────
function Fireflies() {
    return (
        <Sparkles
            count={80}
            scale={[8, 5, 8]}
            size={1.8}
            speed={0.28}
            opacity={0.7}
            color="#ffdd88"
            noise={0.5}
        />
    );
}

// ─────────────────────────────────────────────────────────────
//  3D SCENE CONTENTS
// ─────────────────────────────────────────────────────────────
function SceneContents({ isRunning, onBedClick, index, isFinished }) {
    return (
        <>
            <color attach="background" args={['#0d0a0f']} />

            {/* ── LIGHTING ── */}
            {/* Soft warm ambient */}
            <ambientLight intensity={0.55} color="#ffe4b8" />

            {/* Main warm window/torch light */}
            <directionalLight
                position={[4, 5, 2]}
                intensity={1.2}
                color="#ffcc88"
                castShadow
                shadow-mapSize={[1024, 1024]}
                shadow-camera-far={20}
            />

            {/* Cool fill from the left (skylight feel) */}
            <directionalLight
                position={[-4, 3, -4]}
                intensity={0.35}
                color="#c0c8ff"
            />

            {/* Warm candle/lamp point light near the bed */}
            <pointLight
                position={[1.5, 1.2, -0.5]}
                intensity={isRunning ? 2.5 : 1.8}
                color="#ff9933"
                distance={7}
                decay={2}
            />

            {/* Second warm fill behind camera */}
            <pointLight
                position={[-2, 2, 4]}
                intensity={0.6}
                color="#ffaa44"
                distance={8}
                decay={2}
            />

            {/* ── MODEL ── */}
            <Suspense fallback={<LoadingPlaceholder />}>
                <BedroomModel />
                <ContactShadows
                    position={[0, -0.01, 0]}
                    opacity={0.45}
                    scale={14}
                    blur={2.5}
                    far={5}
                />
            </Suspense>

            {/* ── BED HITBOX ── */}
            <BedHitbox onStart={onBedClick} isRunning={isRunning} />

            {/* ── FIREFLIES ── */}
            <Fireflies />

            {/* ── TEXT HTML OVERLAY (in 3D world space) ── */}
            {isRunning && index >= 0 && !isFinished && (
                <Html
                    position={[0.3, 2.4, 0]}
                    center
                    distanceFactor={9}
                    style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.82, filter: 'blur(18px)', y: 18 }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }}
                            exit={{ opacity: 0, scale: 1.08, filter: 'blur(12px)', y: -16 }}
                            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <motion.div
                                animate={{ y: [0, -8, 0] }}
                                transition={{ repeat: Infinity, duration: 4.2, ease: 'easeInOut' }}
                                style={textStyle}
                            >
                                {compliments[index]}
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>
                </Html>
            )}

            {/* "Click the bed" hint — 3D space */}
            {!isRunning && !isFinished && (
                <Html position={[0.3, 2.0, 0]} center distanceFactor={9}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.3, 0.9, 0.3] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                        style={hintStyle}
                    >
                        нажми на кровать
                    </motion.div>
                </Html>
            )}

            {/* ── CAMERA CONTROLS ── */}
            <OrbitControls
                enablePan={false}
                enableDamping
                dampingFactor={0.06}
                minDistance={2}
                maxDistance={9}
                minPolarAngle={Math.PI * 0.12}
                maxPolarAngle={Math.PI * 0.78}
                target={[0.3, 0.8, 0]}
                azimuthAngle={Math.PI * 0.5}
            />

            {/* ── POST-PROCESSING ── */}
            <EffectComposer>
                <Bloom
                    luminanceThreshold={0.75}
                    luminanceSmoothing={0.35}
                    mipmapBlur
                    intensity={isRunning ? 1.6 : 0.9}
                />
                <Vignette eskil={false} offset={0.28} darkness={0.72} />
            </EffectComposer>
        </>
    );
}

// ─────────────────────────────────────────────────────────────
//  TEXT STYLES
// ─────────────────────────────────────────────────────────────
const textStyle = {
    fontFamily: "'Cormorant Garamond', 'Palatino Linotype', 'Georgia', serif",
    fontSize: 'clamp(22px, 4vw, 48px)',
    fontWeight: 600,
    fontStyle: 'italic',
    color: '#fff8f0',
    textShadow: '0 0 30px rgba(255,220,150,0.95), 0 0 60px rgba(255,180,80,0.5)',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    userSelect: 'none',
    textAlign: 'center',
    lineHeight: 1.3,
};

const hintStyle = {
    fontFamily: "'Courier New', monospace",
    fontSize: '12px',
    letterSpacing: '4px',
    color: 'rgba(255,220,150,0.7)',
    textTransform: 'lowercase',
    pointerEvents: 'none',
    userSelect: 'none',
};

// ─────────────────────────────────────────────────────────────
//  FINALE CARD (shown after all text finishes)
// ─────────────────────────────────────────────────────────────
function FinaleCard({ onReplay }) {
    return (
        <motion.div
            style={finaleCardStyle}
            initial={{ opacity: 0, scale: 0.88, filter: 'blur(24px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        >
            <div style={finaleHeartStyle}>❤️</div>
            <div style={finaleTitleStyle}>
                Я ∞ тебя люблю
            </div>
            <div style={finaleSubStyle}>
                Ариадна
            </div>
            <button style={finaleReplayStyle} onClick={onReplay}>
                повторить ещё раз
            </button>
        </motion.div>
    );
}

const finaleCardStyle = {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    pointerEvents: 'none',
    zIndex: 200,
};

const finaleHeartStyle = {
    fontSize: 'clamp(48px, 10vw, 96px)',
    filter: 'drop-shadow(0 0 30px rgba(255,100,100,0.9))',
    animation: 'heartbeat 1.4s ease-in-out infinite',
};

const finaleTitleStyle = {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 'clamp(28px, 5vw, 56px)',
    fontStyle: 'italic',
    fontWeight: 700,
    color: '#fff0e0',
    textShadow: '0 0 40px rgba(255,220,150,0.9), 0 0 80px rgba(255,160,60,0.5)',
    textAlign: 'center',
};

const finaleSubStyle = {
    fontFamily: "'Courier New', monospace",
    fontSize: 'clamp(10px, 1.5vw, 13px)',
    letterSpacing: '8px',
    color: 'rgba(255,220,150,0.55)',
    textAlign: 'center',
};

const finaleReplayStyle = {
    marginTop: 32,
    padding: '12px 28px',
    background: 'transparent',
    border: '1px solid rgba(255,220,150,0.35)',
    color: 'rgba(255,220,150,0.65)',
    fontFamily: "'Courier New', monospace",
    fontSize: '10px',
    letterSpacing: '3px',
    cursor: 'pointer',
    pointerEvents: 'auto',
    transition: 'all 0.2s',
};

// ─────────────────────────────────────────────────────────────
//  LOADING OVERLAY
// ─────────────────────────────────────────────────────────────
function LoadingOverlay({ visible }) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    style={loadingOverlayStyle}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2 }}
                >
                    <motion.div
                        style={loadingDotStyle}
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                    >
                        загружаем комнату...
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

const loadingOverlayStyle = {
    position: 'absolute',
    inset: 0,
    zIndex: 100,
    background: '#0d0a0f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const loadingDotStyle = {
    fontFamily: "'Courier New', monospace",
    fontSize: '11px',
    letterSpacing: '4px',
    color: 'rgba(255,220,150,0.5)',
};

// ─────────────────────────────────────────────────────────────
//  AUDIO — simple Web Audio tones (no dependency needed)
// ─────────────────────────────────────────────────────────────
function playMagicChime() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
            gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
            gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + i * 0.12 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.55);
            osc.start(ctx.currentTime + i * 0.12);
            osc.stop(ctx.currentTime + i * 0.12 + 0.6);
        });
    } catch { }
}

function playFinaleChord() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [261.63, 329.63, 392, 523.25].forEach(freq => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.07, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.5);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 3.6);
        });
    } catch { }
}

// ─────────────────────────────────────────────────────────────
//  MAIN EXPORTED COMPONENT
// ─────────────────────────────────────────────────────────────
export default function RoomScene({ onBack }) {
    const [index, setIndex] = useState(-1);
    const [isRunning, setIsRunning] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [modelReady, setModelReady] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    // ── Start sequence ──
    const handleBedClick = useCallback(() => {
        if (isRunning || isFinished) return;
        playMagicChime();
        setIsRunning(true);
        setIndex(0);
    }, [isRunning, isFinished]);

    // ── Auto-advance ──
    useEffect(() => {
        if (!isRunning || index < 0) return;

        if (index < compliments.length - 1) {
            const ms = displayTime(compliments[index]);
            const t = setTimeout(() => setIndex(i => i + 1), ms);
            return () => clearTimeout(t);
        } else {
            // Last phrase shown — wait then show finale card
            const ms = displayTime(compliments[index]);
            const t = setTimeout(() => {
                setIsRunning(false);
                setIsFinished(true);
                playFinaleChord();
            }, ms);
            return () => clearTimeout(t);
        }
    }, [index, isRunning]);

    // ── Replay ──
    const handleReplay = useCallback(() => {
        setIsFinished(false);
        setIndex(-1);
        setTimeout(() => handleBedClick(), 100);
    }, [handleBedClick]);

    // Detect when GLB has loaded (Canvas onCreated fires early; we use a short delay)
    useEffect(() => {
        const t = setTimeout(() => setModelReady(true), 1800);
        return () => clearTimeout(t);
    }, []);

    return (
        <div style={{ position: 'absolute', inset: 0, background: '#0d0a0f' }}>
            {/* Google Fonts */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600;1,700&display=swap');

        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          14%       { transform: scale(1.18); }
          28%       { transform: scale(1); }
          42%       { transform: scale(1.12); }
          56%       { transform: scale(1); }
        }

        .room-replay-btn:hover {
          border-color: rgba(255,220,150,0.8) !important;
          color: rgba(255,220,150,1) !important;
          box-shadow: 0 0 20px rgba(255,180,60,0.25);
        }
      `}</style>

            {/* ── 3D CANVAS ── */}
            <Canvas
                shadows
                camera={{ position: [5.5, 1.8, 0], fov: 50 }}
                style={{ position: 'absolute', inset: 0 }}
                gl={{ antialias: true, alpha: false }}
                onPointerDown={() => setHasInteracted(true)}
            >
                <SceneContents
                    isRunning={isRunning}
                    onBedClick={handleBedClick}
                    index={index}
                    isFinished={isFinished}
                />
            </Canvas>

            {/* ── LOADING OVERLAY ── */}
            <LoadingOverlay visible={!modelReady} />

            {/* ── FINALE CARD (DOM overlay, above canvas) ── */}
            <AnimatePresence>
                {isFinished && (
                    <FinaleCard onReplay={handleReplay} />
                )}
            </AnimatePresence>

            {/* ── PROGRESS INDICATOR (which phrase we're on) ── */}
            <AnimatePresence>
                {isRunning && index >= 0 && (
                    <motion.div
                        style={progressBarWrapStyle}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {compliments.map((_, i) => (
                            <motion.div
                                key={i}
                                style={{
                                    ...progressDotStyle,
                                    background: i < index
                                        ? 'rgba(255,210,100,0.9)'
                                        : i === index
                                            ? '#ffdd66'
                                            : 'rgba(255,255,255,0.15)',
                                    boxShadow: i === index ? '0 0 8px #ffdd66' : 'none',
                                    transform: i === index ? 'scale(1.4)' : 'scale(1)',
                                }}
                                transition={{ duration: 0.4 }}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── BACK BUTTON ── */}
            {onBack && !isRunning && !isFinished && (
                <button
                    id="room-scene-back-btn"
                    className="back-to-2d-btn"
                    onClick={onBack}
                >
                    ← вернуться
                </button>
            )}

            {/* ── MOUSE HINT ── */}
            {!isRunning && !isFinished && !hasInteracted && (
                <motion.div
                    style={mousehintStyle}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                >
                    ↻ &nbsp; потяни мышкой — осмотри комнату
                </motion.div>
            )}

            {/* ── DEV: JUMP TO FINALE ── */}
            {!isRunning && !isFinished && modelReady && (
                <button
                    id="dev-jump-finale-btn"
                    style={devJumpStyle}
                    onClick={() => {
                        setIsFinished(true);
                        playFinaleChord();
                    }}
                >
                    перейти к финалу →
                </button>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  MISC STYLES
// ─────────────────────────────────────────────────────────────
const progressBarWrapStyle = {
    position: 'fixed',
    bottom: 28,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 8,
    zIndex: 50,
    alignItems: 'center',
};

const progressDotStyle = {
    width: 7,
    height: 7,
    borderRadius: '50%',
    transition: 'background 0.4s, transform 0.35s, box-shadow 0.4s',
};

const devJumpStyle = {
    position: 'absolute',
    bottom: 18,
    right: 20,
    zIndex: 50,
    background: 'none',
    border: 'none',
    color: 'rgba(255,220,150,0.25)',
    fontFamily: "'Courier New', monospace",
    fontSize: '10px',
    letterSpacing: '2px',
    cursor: 'pointer',
    padding: '6px 10px',
    opacity: 0.65,
};

const mousehintStyle = {
    position: 'absolute',
    bottom: 56,
    left: '50%',
    transform: 'translateX(-50%)',
    fontFamily: "'Courier New', monospace",
    fontSize: '13px',
    letterSpacing: '3px',
    color: 'rgba(255,220,150,0.7)',
    pointerEvents: 'none',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    zIndex: 50,
};
