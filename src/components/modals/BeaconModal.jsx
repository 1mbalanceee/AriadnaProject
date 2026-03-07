import React, { useEffect } from 'react';
import { useGame } from '../../GameContext';

export default function BeaconModal() {
    const {
        closeModal,
        beaconPhase, beaconPlayerStep, beaconSequence,
        startBeaconSequence,
    } = useGame();

    // Запускаем последовательность при открытии модала
    useEffect(() => {
        startBeaconSequence();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const statusText = beaconPhase === 'showing'
        ? '[ ЗАПОМИНАЙ... ]'
        : beaconPhase === 'input'
            ? `[ ПОВТОРИ: ${beaconPlayerStep} / ${beaconSequence.length} ]`
            : '[ ИНИЦИАЛИЗАЦИЯ... ]';

    return (
        <div className="beacon-modal-content">
            <p className="modal-title">* ЭХО В ИНТЕРФЕЙСЕ</p>

            <div className="modal-question">
                <p>«В глухих архивах, где застыло время,</p>
                <p>Один лишь пульс крадёт полночный мрак.</p>
                <p>Он дышит, ждёт, неся былое бремя —</p>
                <p>Твой верный маяк, твой единственный знак...»</p>
                <br />
                <p>Не закрывай глаза. Пускай рука</p>
                <p>Коснётся искр в том же порядке.</p>
            </div>

            <div className="beacon-indicator">
                <div className="beacon-dot" />
                <span className="beacon-text">{statusText}</span>
            </div>

            <button
                id="beacon-cancel-btn"
                className="modal-action-btn secondary"
                style={{
                    marginTop: '24px',
                    opacity: 0.4,
                    fontSize: '9px',
                    letterSpacing: '1px',
                }}
                onClick={closeModal}
            >
                [ ПРЕРВАТЬ СВЯЗЬ ]
            </button>
        </div>
    );
}