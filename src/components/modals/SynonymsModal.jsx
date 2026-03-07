import React from 'react';
import { useGame } from '../../GameContext';

export default function SynonymsModal() {
    const { inputValue, setInputValue, errorShake, checkAnswer } = useGame();

    return (
        <>
            <p className="modal-title">* СИНОНИМЫ ЧУВСТВ</p>

            <div className="modal-question">
                <p>* У него нет голоса, но оно поёт о весне.</p>
                <p>* У него нет крыльев, но оно приносит тепло.</p>
                <p>* У него нет рук, но оно касается каждого.</p>
                <p>* Оно одно — для всех.</p>
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
