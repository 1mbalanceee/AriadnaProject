import React from 'react';

export default function DrawerTile({ box, beaconLit, beaconClickable, onBeaconClick }) {
    // Dead tiles hold their grid space but are invisible
    if (!box.isAlive && !box.isDying) {
        return <div className="drawer-tile dead" aria-hidden="true" />;
    }

    const cls = [
        'drawer-tile',
        box.isDying ? 'dying' : '',
        box.role !== 'bg' ? `role-${box.role}` : '',
        beaconLit ? 'beacon-seq-lit' : '',
        beaconClickable && !beaconLit ? 'beacon-clickable' : '',
    ].filter(Boolean).join(' ');

    return (
        <div
            className={cls}
            onClick={beaconClickable ? onBeaconClick : undefined}
            role={beaconClickable ? 'button' : undefined}
            aria-label={beaconLit ? 'Активный маяк' : beaconClickable ? 'Нажми' : undefined}
        >
            <div className="drawer-handle" />
        </div>
    );
}
