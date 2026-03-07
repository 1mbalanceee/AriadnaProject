import React from 'react';
import { useGame } from '../GameContext';
import { PUZZLE_META, PHASE_PUZZLES } from '../gameState';

// Special-mechanic puzzles don't need a text input, their drawer is just a clue trigger
const SPECIAL = new Set(['beacon', 'constellation', 'notes', 'patience']);

export default function PuzzleDrawers() {
    const { phase, solvedPuzzles, openModal } = useGame();
    const puzzleIds = PHASE_PUZZLES[phase] ?? [];

    return (
        <>
            {puzzleIds.map(id => {
                const meta = PUZZLE_META[id];
                if (!meta) return null;
                const solved = solvedPuzzles.includes(id);
                const special = SPECIAL.has(id);

                return (
                    <div
                        key={id}
                        id={`puzzle-drawer-${id}`}
                        className={[
                            'puzzle-drawer',
                            solved ? 'solved' : '',
                            special ? 'special' : '',
                        ].filter(Boolean).join(' ')}
                        style={{ top: meta.top, left: meta.left }}
                        onClick={() => !solved && openModal(id)}
                        role="button"
                        aria-label={`Загадка ${id}`}
                    >
                        <div className="puzzle-drawer-face">
                            <div className="puzzle-label">{solved ? '★' : '?'}</div>
                            <div className="puzzle-drawer-handle" />
                        </div>
                    </div>
                );
            })}
        </>
    );
}
