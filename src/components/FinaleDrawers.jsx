import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../GameContext';

const SHOW_MS = 1500;
const SHUFFLE_COUNT = 24;   // Увеличиваем количество — дольше концентрация
const SHUFFLE_START = 420;  // Начинаем спокойно
const SHUFFLE_MIN = 160;    // Заканчиваем безумно быстро
const COOLDOWN_S = 3;

export default function FinaleDrawers() {
    const { phase, isWardrobeOpen, grantFinalKey, dispatch } = useGame();

    // slots = array of drawerIdx in display order (left to right)
    // drawerIdx 0 = the KEY (correct); 1 & 2 = decoys
    const [slots, setSlots] = useState([1, 0, 2]);
    const [roundPhase, setRoundPhase] = useState('idle');
    const [showKey, setShowKey] = useState(false);
    const [cooldownLeft, setCooldown] = useState(0);
    const timers = useRef([]);

    const visible = phase === 3 && !isWardrobeOpen;
    const canSkip = phase < 3; // Allow skipping from any phase before the finale

    const killAll = () => {
        timers.current.forEach(t => { clearTimeout(t); clearInterval(t); });
        timers.current = [];
    };

    const startRound = useCallback(() => {
        timers.current.forEach(t => { clearTimeout(t); clearInterval(t); });
        timers.current = [];

        const initial = [1, 0, 2]; // KEY (0) in center at first
        setSlots(initial);
        setShowKey(true);
        setRoundPhase('showing');

        const t1 = setTimeout(() => {
            setShowKey(false);
            setRoundPhase('shuffling');

            let cur = [...initial];
            let count = 0;

            const doSwap = () => {
                if (count >= SHUFFLE_COUNT) {
                    setRoundPhase('input');
                    return;
                }
                const i = Math.floor(Math.random() * 3);
                const j = (i + 1 + Math.floor(Math.random() * 2)) % 3;
                [cur[i], cur[j]] = [cur[j], cur[i]];
                setSlots([...cur]);
                count++;
                
                // Ускорение: с каждым шагом задержка уменьшается
                const progress = count / SHUFFLE_COUNT;
                const nextDelay = SHUFFLE_START - (SHUFFLE_START - SHUFFLE_MIN) * progress;
                
                const t = setTimeout(doSwap, nextDelay);
                timers.current.push(t);
            };

            const t2 = setTimeout(doSwap, 300);
            timers.current.push(t2);
        }, SHOW_MS);

        timers.current.push(t1);
    }, []);

    useEffect(() => {
        if (!visible) { killAll(); return; }
        startRound();
        return killAll;
    }, [visible]); // eslint-disable-line

    // drawerIdx is the ID of the drawer that was clicked
    const handleClick = useCallback((drawerIdx) => {
        if (roundPhase !== 'input') return;
        if (drawerIdx === 0) {
            grantFinalKey(); // ✅ Correct
        } else {
            // ❌ Wrong — cooldown
            timers.current.forEach(t => { clearTimeout(t); clearInterval(t); });
            timers.current = [];
            setRoundPhase('cooldown');
            setCooldown(COOLDOWN_S);
            let rem = COOLDOWN_S;
            const tick = setInterval(() => {
                rem -= 1;
                setCooldown(rem);
                if (rem <= 0) { clearInterval(tick); startRound(); }
            }, 1000);
            timers.current.push(tick);
        }
    }, [roundPhase, grantFinalKey, startRound]);

    if (!visible && !canSkip) return null;

    const hintText =
        roundPhase === 'showing' ? '✦  Запомни — где нить  ✦' :
            roundPhase === 'shuffling' ? '· · ·' :
                roundPhase === 'cooldown' ? `✗  Неверно — подожди ${cooldownLeft}с` :
                    '✦  Найди нить  ✦';

    const isShuffling = roundPhase === 'shuffling';

    return (
        <>
            {canSkip && (
                <button
                    onClick={() => dispatch({ type: 'SOLVE_PUZZLE', puzzleId: 'DEBUG_TO_SHUFFLE', forcePhase: 3 })}
                    style={{
                        position: 'fixed',
                        bottom: '25px',
                        left: '25px',
                        zIndex: 9999,
                        background: 'rgba(255, 100, 100, 0.4)',
                        border: '1px solid rgba(255, 100, 100, 0.6)',
                        color: 'white',
                        fontSize: '9px',
                        padding: '12px 18px',
                        cursor: 'pointer',
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        fontFamily: "'Press Start 2P', 'Courier New', monospace",
                        boxShadow: '0 0 20px rgba(255, 100, 100, 0.3)',
                    }}
                >
                    [ К ШАФФЛУ → ]
                </button>
            )}
            {visible && (
                <div className="finale-stage">
                    <p className="finale-hint">{hintText}</p>
                    <div className="finale-drawers-row">
                        {slots.map((drawerIdx) => {
                            const isKey = drawerIdx === 0;
                            const lit = isKey && showKey;
                            const isCool = roundPhase === 'cooldown';

                            return (
                                <motion.div
                                    key={drawerIdx}
                                    layout
                                    transition={{
                                        layout: {
                                            type: 'spring',
                                            stiffness: isShuffling ? 450 : 380, // Еще жестче когда быстро
                                            damping: isShuffling ? 32 : 28,
                                            mass: 0.6
                                        }
                                    }}
                                    animate={isShuffling ? { 
                                        filter: ['blur(0px)', 'blur(3px)', 'blur(0px)'],
                                        scale: [1, 0.96, 1],
                                        rotate: [0, (Math.random() - 0.5) * 4, 0]
                                    } : {}}
                                    className="finale-drawer"
                                    style={{ animation: isShuffling ? 'none' : undefined }}
                                    onClick={() => handleClick(drawerIdx)}
                                    role="button"
                                >
                                    <div
                                        className="finale-face"
                                        style={
                                            lit ? {
                                                borderColor: '#ffd700',
                                                boxShadow: '0 0 36px #ffd700, 0 0 72px rgba(255,215,0,0.4), inset 0 0 24px rgba(255,215,0,0.12)',
                                            } : isCool ? {
                                                borderColor: 'rgba(255,60,60,0.35)',
                                            } : {}
                                        }
                                    >
                                        <div className="finale-symbol">
                                            {lit ? '🗝️' : '✦'}
                                        </div>
                                        <div className="finale-handle" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
}
