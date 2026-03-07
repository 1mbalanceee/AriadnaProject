import React from 'react';
import { useGame } from '../GameContext';
import { PHASE_LABELS } from '../gameState';

export default function PhaseHUD() {
    const { phase } = useGame();
    const label = PHASE_LABELS[phase] ?? '';
    // dots 0-3 represent the 4 phases
    const dots = [0, 1, 2, 3];

    return (
        <div className="phase-hud" aria-label={`Текущий уровень: ${label}`}>
            <div className="phase-label">{label}</div>
            <div className="phase-dots">
                {dots.map(i => (
                    <div
                        key={i}
                        className={[
                            'phase-dot',
                            i < phase ? 'done' : '',
                            i === phase ? 'active' : '',
                        ].filter(Boolean).join(' ')}
                    />
                ))}
            </div>
        </div>
    );
}
