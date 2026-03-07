import React, { useState, useRef, useCallback } from 'react';
import { useGame } from '../../GameContext';

const HOLD_MS = 5000;

export default function PatienceModal() {
    const { solvePuzzle } = useGame();
    const [progress, setProgress] = useState(0);   // 0–100
    const [bloomed, setBloomed] = useState(false);
    const [holding, setHolding] = useState(false);
    const intervalRef = useRef(null);
    const startRef = useRef(null);

    const startHold = useCallback(() => {
        if (bloomed) return;
        setHolding(true);
        startRef.current = Date.now();
        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startRef.current;
            const pct = Math.min((elapsed / HOLD_MS) * 100, 100);
            setProgress(pct);
            if (pct >= 100) {
                clearInterval(intervalRef.current);
                setBloomed(true);
                setHolding(false);
                setTimeout(() => solvePuzzle('patience'), 1200);
            }
        }, 50);
    }, [bloomed, solvePuzzle]);

    const stopHold = useCallback(() => {
        if (bloomed) return;
        clearInterval(intervalRef.current);
        setHolding(false);
        setProgress(0);
    }, [bloomed]);

    return (
        <>
            <p className="modal-title">* ИЗМЕНЕНИЕ СОСТОЯНИЯ</p>

            {/* Bud / flower CSS art */}
            <div className="bud-wrapper" aria-label={bloomed ? 'Цветок расцвёл' : 'Закрытый бутон'}>
                <div className={`bud${bloomed ? ' bloomed' : ''}`}>
                    {bloomed ? '✿' : '⊙'}
                </div>
            </div>

            <div className="modal-question">
                {bloomed
                    ? <p>* Ты дождалась.</p>
                    : <p>* Удерживай кнопку — не отпускай.</p>
                }
            </div>

            {!bloomed && (
                <>
                    <div className="patience-progress">
                        <div className="patience-fill" style={{ width: `${progress}%` }} />
                    </div>

                    <button
                        id="hold-btn"
                        className={`hold-btn${holding ? ' holding' : ''}`}
                        onMouseDown={startHold}
                        onMouseUp={stopHold}
                        onMouseLeave={stopHold}
                        onTouchStart={startHold}
                        onTouchEnd={stopHold}
                    >
                        {holding ? '[ ДЕРЖИ... ]' : '[ НАЖАТЬ И ДЕРЖАТЬ ]'}
                    </button>
                </>
            )}
        </>
    );
}
