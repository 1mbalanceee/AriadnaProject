import React from 'react';
import { useGame } from '../../GameContext';

// Lavond Question 3:
// «Где я впервые встретил Её?»
// Correct answer: «В бальном зале»

export default function ConstellationModal() {
    const { inputValue, setInputValue, errorShake, checkAnswer } = useGame();

    return (
        <>
            <p className="modal-title">* ТЕНЬ ЛАВОНДА — III</p>

            <div className="modal-question" style={{
                animation: 'glitch-text 4s steps(1) infinite',
            }}>
                <p>* «Память хранится в пространстве,</p>
                <p>* а пространство хранит первый шаг.»</p>
                <br />
                <p>* Лавонд спрашивает:</p>
                <p style={{ color: 'rgba(255,120,120,0.85)', fontStyle: 'italic' }}>
                    * Где я впервые встретил Её?
                </p>
            </div>

            <div className="input-row">
                <span className="input-arrow">▶</span>
                <input
                    id="constellation-input"
                    className={`modal-input${errorShake ? ' shake' : ''}`}
                    type="text"
                    placeholder="Место встречи..."
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && checkAnswer('constellation')}
                    autoFocus
                />
            </div>
        </>
    );
}
