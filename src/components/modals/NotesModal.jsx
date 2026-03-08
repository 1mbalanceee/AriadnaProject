import React, { useState } from 'react';
import { useGame } from '../../GameContext';

// Lavond Question 4:
// «Как я называл Ариадну?»
// Options: «Звезда», «Дитя эфира», «мост между мирами», «Тень»
// Correct: «мост между мирами»

const OPTIONS = [
    'Звезда',
    'Дитя эфира',
    'мост между мирами',
    'Тень',
];

export default function NotesModal() {
    const { solvePuzzle, closeModal } = useGame();
    const [selected, setSelected] = useState(null);
    const [wrong, setWrong] = useState(false);

    const handleChoice = (opt) => {
        setSelected(opt);
        if (opt === 'мост между мирами') {
            setTimeout(() => {
                solvePuzzle('notes');
                closeModal();
            }, 700);
        } else {
            setWrong(true);
            setTimeout(() => { setWrong(false); setSelected(null); }, 1900);
        }
    };

    return (
        <>
            <p className="modal-title">* ТЕНЬ ЛАВОНДА — IV</p>

            <div className="modal-question">
                <p>* Лавонд, прищурившись, смотрит на тебя:</p>
                <p style={{ color: 'rgba(255,120,120,0.85)', fontStyle: 'italic', marginTop: 6 }}>
                    * «Как я называл Ариадну?»
                </p>
            </div>

            <div style={{
                display: 'flex', flexDirection: 'column', gap: 10,
                marginTop: 16, width: '100%',
            }}>
                {OPTIONS.map(opt => (
                    <button
                        key={opt}
                        id={`notes-opt-${opt.replace(/\s/g, '-')}`}
                        className="modal-action-btn"
                        onClick={() => handleChoice(opt)}
                        style={{
                            background: selected === opt && opt !== 'мост между мирами'
                                ? 'rgba(180,0,0,0.25)'
                                : selected === opt
                                    ? 'rgba(0,180,80,0.18)'
                                    : 'transparent',
                            border: selected === opt && opt !== 'мост между мирами'
                                ? '1px solid rgba(200,0,40,0.6)'
                                : '1px solid rgba(200,150,50,0.3)',
                            transition: 'all 0.2s',
                        }}
                    >
                        [ {opt} ]
                    </button>
                ))}
            </div>

            {wrong && (
                <p style={{
                    color: 'rgba(200,0,40,0.8)', fontSize: '13px',
                    letterSpacing: '2px', textAlign: 'center', marginTop: 12,
                    fontWeight: 600,
                }}>
                    * Лавонд усмехается. «Это не то.»
                </p>
            )}
        </>
    );
}
