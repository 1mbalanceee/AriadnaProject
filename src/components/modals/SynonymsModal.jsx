import React from 'react';
import { useGame } from '../../GameContext';

export default function SynonymsModal() {
    const { inputValue, setInputValue, errorShake, checkAnswer } = useGame();

    return (
        <>
            <p className="modal-title">* СИНОНИМЫ ЧУВСТВ</p>

            <div className="modal-question">
                <p>* «Люди считают, что это невидимый компас для заблудших душ.</p>
                <p>* Можно даже сказать — единственный яд, который исцеляет.</p>
                <p>* Она не огонь, но греет в лютый мороз.</p>
                <p>* Она связывает двоих, не касаясь их кожей.»</p>
                <br />
                <p style={{ color: 'rgba(255,120,120,0.85)', fontStyle: 'italic' }}>
                    * Перед тобой четыре тени одного чувства. Назови его.
                </p>
            </div>

            <div className="input-row">
                <span className="input-arrow">▶</span>
                <input
                    id="synonyms-input"
                    className={`modal-input${errorShake ? ' shake' : ''}`}
                    type="text"
                    placeholder="Один ответ..."
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && checkAnswer('synonyms')}
                    autoFocus
                />
            </div>
        </>
    );
}
