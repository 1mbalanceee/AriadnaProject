import React from 'react';
import { useGame } from '../GameContext';

// 12 фиксированных позиций — разбросаны по экрану, центр свободен для модала
export const BEACON_NODES = [
    { id: 'bn-0', x: '7%', y: '15%' },
    { id: 'bn-1', x: '50%', y: '8%' },
    { id: 'bn-2', x: '93%', y: '15%' },
    { id: 'bn-3', x: '7%', y: '42%' },
    { id: 'bn-4', x: '93%', y: '42%' },
    { id: 'bn-5', x: '7%', y: '72%' },
    { id: 'bn-6', x: '50%', y: '90%' },
    { id: 'bn-7', x: '93%', y: '72%' },
    { id: 'bn-8', x: '27%', y: '28%' },
    { id: 'bn-9', x: '73%', y: '28%' },
    { id: 'bn-10', x: '27%', y: '75%' },
    { id: 'bn-11', x: '73%', y: '75%' },
];

export default function BeaconOverlay() {
    const { activeModal, beaconLitId, beaconPhase, beaconPlayerStep, handleBeaconClick } = useGame();

    if (activeModal !== 'beacon') return null;

    return (
        <div style={{
            position: 'fixed', inset: 0,
            zIndex: 101, // над стеной, под модалом-контентом
            pointerEvents: 'none', // сам оверлей не блокирует
        }}>
            {BEACON_NODES.map((node, idx) => {
                const isLit = beaconLitId === node.id;
                const isClickable = beaconPhase === 'input';

                return (
                    <div
                        key={node.id}
                        onClick={isClickable ? () => handleBeaconClick(node.id) : undefined}
                        style={{
                            position: 'absolute',
                            left: node.x,
                            top: node.y,
                            transform: 'translate(-50%, -50%)',
                            width: 72,
                            height: 72,
                            borderRadius: '50%',
                            border: isLit
                                ? '2px solid white'
                                : '1px solid rgba(232,232,240,0.25)',
                            background: isLit
                                ? 'rgba(255,255,255,0.18)'
                                : 'rgba(232,232,240,0.04)',
                            boxShadow: isLit
                                ? '0 0 32px white, 0 0 64px rgba(255,255,255,0.6), inset 0 0 20px rgba(255,255,255,0.2)'
                                : isClickable
                                    ? '0 0 8px rgba(232,232,240,0.15)'
                                    : 'none',
                            cursor: isClickable ? 'pointer' : 'default',
                            pointerEvents: 'auto', // ноды кликабельны
                            transition: 'box-shadow 0.08s, border 0.08s, background 0.08s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {/* Номер ноды — помогает ориентироваться */}
                        <span style={{
                            fontFamily: "'Courier New', monospace",
                            fontSize: 11,
                            color: isLit ? 'rgba(255,255,255,0.9)' : 'rgba(232,232,240,0.2)',
                            letterSpacing: 1,
                            userSelect: 'none',
                        }}>
                            {isLit ? '◉' : isClickable ? '○' : '·'}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
