import React, { useState } from 'react';
import { useGame } from '../../GameContext';

// Lavond Question 1:
// «Я вручил тебе свиток, который не смел открыть сам,
//  и посмеялся над его содержимым.
//  Что, по моим словам, было там начертано вместо чернил?»
// Correct answer: «Глупости»

export default function ShadowModal() {
    const { inputValue, setInputValue, errorShake, checkAnswer } = useGame();
    const [scratched, setScratched] = useState(false);
    const [isScratching, setIsScratching] = useState(false);

    const handleScratch = () => {
        if (scratched) return;
        setIsScratching(true);
        setTimeout(() => {
            setScratched(true);
            setIsScratching(false);
        }, 1200);
    };

    return (
        <>
            <p className="modal-title">* ТЕНЬ ЛАВОНДА — I</p>

            {/* Scratch mechanic */}
            <div
                className="scratch-wrapper"
                style={{
                    position: 'relative',
                    width: '100%',
                    minHeight: 90,
                    cursor: scratched ? 'default' : 'crosshair',
                    margin: '10px 0',
                    userSelect: 'none',
                }}
                onMouseDown={handleScratch}
                onTouchStart={handleScratch}
            >
                {/* Noise overlay */}
                {!scratched && (
                    <div style={{
                        position: 'absolute', inset: 0, zIndex: 2,
                        background: 'repeating-linear-gradient(45deg, #111 0px, #111 2px, #1a1a2e 2px, #1a1a2e 6px)',
                        opacity: isScratching ? 0.4 : 1,
                        transition: 'opacity 1.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'rgba(200,0,40,0.6)',
                        fontSize: '10px',
                        letterSpacing: '3px',
                        fontFamily: "'Courier New', monospace",
                    }}>
                        [ ЗАЖМИ МЫШЬ ЧТОБЫ СТЕРЕТЬ ]
                    </div>
                )}
                {/* Hidden question under the noise */}
                <div className="modal-question" style={{ zIndex: 1 }}>
                    <p>* Я вручил тебе свиток, который не смел открыть сам,</p>
                    <p>* и посмеялся над его содержимым.</p>
                    <p>* Что, по моим словам, было там начертано вместо чернил?</p>
                </div>
            </div>

            {scratched && (
                <div className="input-row">
                    <span className="input-arrow">▶</span>
                    <input
                        id="shadow-input"
                        className={`modal-input${errorShake ? ' shake' : ''}`}
                        type="text"
                        placeholder="Введи ответ..."
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && checkAnswer('shadow')}
                        autoFocus
                    />
                </div>
            )}
        </>
    );
}
