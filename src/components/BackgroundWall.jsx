import React from 'react';
import { useGame } from '../GameContext';
import DrawerTile from './DrawerTile';

export default function BackgroundWall() {
    const {
        boxes, activeModal,
        beaconLitId, beaconPhase,
        solvePuzzle, closeModal,
        handleBeaconClick,
    } = useGame();

    const isBeaconOpen = activeModal === 'beacon';

    return (
        <div className="background-wall">
            {boxes.map(box => (
                <DrawerTile
                    key={box.id}
                    box={box}
                    beaconLit={isBeaconOpen && box.id === beaconLitId}
                    beaconClickable={isBeaconOpen && beaconPhase === 'input'}
                    onBeaconClick={() => handleBeaconClick(box.id)}
                />
            ))}
        </div>
    );
}
