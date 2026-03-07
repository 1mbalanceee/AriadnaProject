import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../GameContext';

// Fixed slot positions relative to viewport center
const SLOT_OFFSETS = [-150, 0, 150]; // px from center X

export default function FinaleDrawers() {
    const { phase, isWardrobeOpen, grantFinalKey } = useGame();

    // Which drawer (0/1/2) sits in which slot (0/1/2)
    const [slots, setSlots] = useState([0, 1, 2]);
    const [shuffling, setShuffling] = useState(false);

    // Only show in phase 3, before wardrobe opens
    const visible = phase === 3 && !isWardrobeOpen;

    // Shuffle two random drawers every ~2s
    useEffect(() => {
        if (!visible) return;
        const id = setInterval(() => {
            setShuffling(true);
            setTimeout(() => {
                setSlots(prev => {
                    const next = [...prev];
                    const i = Math.floor(Math.random() * 3);
                    const j = (i + 1 + Math.floor(Math.random() * 2)) % 3;
                    [next[i], next[j]] = [next[j], next[i]];
                    return next;
                });
                setShuffling(false);
            }, 300);
        }, 2200);
        return () => clearInterval(id);
    }, [visible]);

    const handleClick = useCallback(() => grantFinalKey(), [grantFinalKey]);

    if (!visible) return null;

    return (
        <div className="finale-stage">
            <p className="finale-hint">* Один из них — твой. Любой выбор — верный.</p>
            <div className="finale-drawers-row">
                {slots.map((drawerIdx, slotIdx) => (
                    <div
                        key={drawerIdx}
                        className={`finale-drawer${shuffling ? ' shuffling' : ''}`}
                        style={{ '--slot': slotIdx }}
                        onClick={handleClick}
                        role="button"
                        aria-label={`Финальный ящик ${drawerIdx + 1}`}
                    >
                        <div className="finale-face">
                            <div className="finale-symbol">✦</div>
                            <div className="finale-handle" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
