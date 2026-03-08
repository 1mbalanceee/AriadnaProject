import React, { useState, useCallback, useRef } from 'react';
import { useGame } from '../../GameContext';

// Lavond Question 2:
// «В летящей повозке, пока мы созерцали смерть внизу,
//  я назвал тебе дату, когда паутина между мирами натянется до предела.
//  Когда наступит этот миг?»
// Correct answer: «20 августа»

// Red Thread mechanic — click the pulsing line at the right moment
const BEAT_INTERVAL = 1400; // ms between beats
const WINDOW_MS = 600;  // acceptable window around beat (wider = easier)

export default function FlickerModal() {
    const { checkAnswer, inputValue, setInputValue, errorShake } = useGame();
    const [mode, setMode] = useState('thread'); // 'thread' | 'input'
    const [beats, setBeats] = useState(0);      // successful beats
    const [failed, setFailed] = useState(false);
    const [pulsing, setPulsing] = useState(false);
    const lastBeatRef = useRef(Date.now());
    const intervalRef = useRef(null);

    // Start rhythm
    const startThread = useCallback(() => {
        if (intervalRef.current) return;
        lastBeatRef.current = Date.now();
        intervalRef.current = setInterval(() => {
            setPulsing(true);
            lastBeatRef.current = Date.now();
            setTimeout(() => setPulsing(false), 450);
        }, BEAT_INTERVAL);
    }, []);

    const handleLineClick = useCallback(() => {
        if (mode !== 'thread') return;
        const now = Date.now();
        const diff = Math.abs((now - lastBeatRef.current) % BEAT_INTERVAL);
        const inWindow = diff < WINDOW_MS || diff > BEAT_INTERVAL - WINDOW_MS;
        if (inWindow) {
            setBeats(b => {
                if (b + 1 >= 3) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                    setMode('input');
                    return 0;
                }
                return b + 1;
            });
        } else {
            setFailed(true);
            setBeats(0);
            setTimeout(() => setFailed(false), 600);
        }
    }, [mode]);

    return (
        <>
            <p className="modal-title">* ТЕНЬ ЛАВОНДА — II</p>

            {mode === 'thread' && (
                <>
                    <div className="modal-question">
                        <p>* Лавонд говорит: «В летящей повозке,</p>
                        <p>* пока мы созерцали смерть внизу,</p>
                        <p>* я назвал тебе дату.»</p>
                        <p style={{ color: 'rgba(200,0,40,0.7)', marginTop: 8 }}>
                            * Сначала синхронизируйся с его нитью — нажимай в ритм.
                        </p>
                    </div>

                    <div
                        style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', gap: 16, margin: '16px 0',
                        }}
                        onMouseEnter={startThread}
                    >
                        {/* The red thread */}
                        <div
                            onClick={handleLineClick}
                            style={{
                                width: '80%', height: 14, cursor: 'pointer',
                                background: pulsing ? '#ff2244' : '#440010',
                                boxShadow: pulsing ? '0 0 32px #ff2244, 0 0 64px #ff224466' : '0 0 6px #440010',
                                transition: 'background 0.12s, box-shadow 0.12s',
                                borderRadius: 5,
                                border: failed ? '2px solid #ff4400' : '1px solid #330010',
                            }}
                        />
                        <div style={{
                            fontFamily: "'Courier New', monospace", fontSize: '14px',
                            letterSpacing: '2px', color: 'rgba(200,0,40,0.7)',
                            fontWeight: 'bold'
                        }}
                        >
                            {failed ? '[ ПРОМАХ ]' : `[ ${beats}/3 ]`}
                        </div>
                    </div>
                </>
            )}

            {mode === 'input' && (
                <>
                    <div className="modal-question">
                        <p>* Нить стабилизирована. Теперь назови дату.</p>
                    </div>
                    <div className="input-row">
                        <span className="input-arrow">▶</span>
                        <input
                            id="flicker-input"
                            className={`modal-input${errorShake ? ' shake' : ''}`}
                            type="text"
                            placeholder="Дата..."
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && checkAnswer('flicker')}
                            autoFocus
                        />
                    </div>
                </>
            )}
        </>
    );
}
