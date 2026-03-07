import React from 'react';
import { useGame } from '../GameContext';

export default function Wardrobe({ zooming = false, onEnter }) {
    const { isWardrobeOpen } = useGame();

    const handleClick = () => {
        if (isWardrobeOpen && onEnter) onEnter();
    };

    return (
        <div
            className={[
                'wardrobe',
                isWardrobeOpen ? 'unlocked' : '',
                zooming ? 'zooming' : '',
            ].filter(Boolean).join(' ')}
            onClick={handleClick}
            style={isWardrobeOpen ? { cursor: 'pointer' } : undefined}
            role={isWardrobeOpen ? 'button' : undefined}
            aria-label={isWardrobeOpen ? 'Войти в шкаф' : undefined}
        >
            {/* Portal glow behind doors */}
            {isWardrobeOpen && (
                <div className="portal-interior">
                    <div className="portal-light" />
                    <span className="portal-text">В О Й Т И</span>
                </div>
            )}

            <div className="wardrobe-frame">
                <div className="wardrobe-rail top-rail" />

                <div className="wardrobe-doors">
                    <div className={`wardrobe-door left-door${isWardrobeOpen ? ' open' : ''}`}>
                        <div className="door-panel" />
                        <div className="door-panel" />
                        <div className="door-knob knob-right" />
                    </div>
                    <div className={`wardrobe-door right-door${isWardrobeOpen ? ' open' : ''}`}>
                        <div className="door-panel" />
                        <div className="door-panel" />
                        <div className="door-knob knob-left" />
                    </div>
                </div>

                <div className="wardrobe-rail bottom-rail" />
            </div>
        </div>
    );
}
