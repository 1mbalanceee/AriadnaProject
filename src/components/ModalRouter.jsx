import React from 'react';
import { useGame } from '../GameContext';

import FlickerModal from './modals/FlickerModal';
import ShadowModal from './modals/ShadowModal';
import BeaconModal from './modals/BeaconModal';
import SynonymsModal from './modals/SynonymsModal';
import PatienceModal from './modals/PatienceModal';
import ConstellationModal from './modals/ConstellationModal';
import NotesModal from './modals/NotesModal';

const MODAL_MAP = {
    flicker: FlickerModal,
    shadow: ShadowModal,
    beacon: BeaconModal,
    synonyms: SynonymsModal,
    patience: PatienceModal,
    constellation: ConstellationModal,
    notes: NotesModal,
};

export default function ModalRouter() {
    const { activeModal, closeModal } = useGame();
    if (!activeModal) return null;

    const ModalComponent = MODAL_MAP[activeModal];
    if (!ModalComponent) return null;

    const isBeacon = activeModal === 'beacon';

    return (
        <div
            className={`modal-overlay${isBeacon ? ' beacon-mode' : ''}`}
            onClick={isBeacon ? undefined : closeModal}
            role="dialog"
            aria-modal="true"
        >
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={closeModal} aria-label="Закрыть">✕</button>
                <ModalComponent />
            </div>
        </div>
    );
}
