import React, {
    createContext, useContext, useReducer,
    useState, useCallback, useEffect, useRef,
} from 'react';
import { initialState, gameReducer, calcFullCount } from './gameState';
import { BEACON_NODES } from './components/BeaconOverlay';

const GameContext = createContext(null);

export function GameProvider({ children }) {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const [inputValue, setInputValue] = useState('');
    const [errorShake, setErrorShake] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);

    // ── Beacon Simon-Says state ──────────────────────────────
    const [beaconSequence, setBeaconSequence] = useState([]);
    const [beaconLitId, setBeaconLitId] = useState(null);
    const [beaconPhase, setBeaconPhase] = useState('idle'); // 'idle'|'showing'|'input'
    const [beaconPlayerStep, setBeaconPlayerStep] = useState(0);
    const beaconTimers = useRef([]);

    const clearBeaconTimers = useCallback(() => {
        beaconTimers.current.forEach(clearTimeout);
        beaconTimers.current = [];
    }, []);

    /** Run the "show" animation for a sequence, then switch to input phase */
    const runShowSequence = useCallback((seq, delayBefore = 800) => {
        const SHOW_MS = 900;
        const GAP_MS = 350;
        clearBeaconTimers();
        setBeaconPhase('showing');
        setBeaconLitId(null);

        seq.forEach((id, i) => {
            const start = delayBefore + i * (SHOW_MS + GAP_MS);
            beaconTimers.current.push(setTimeout(() => setBeaconLitId(id), start));
            beaconTimers.current.push(setTimeout(() => setBeaconLitId(null), start + SHOW_MS));
        });

        const total = delayBefore + seq.length * (SHOW_MS + GAP_MS);
        beaconTimers.current.push(setTimeout(() => {
            setBeaconPhase('input');
        }, total));
    }, [clearBeaconTimers]);

    /** Start a fresh Simon-Says round — picks 4 random beacon nodes */
    const startBeaconSequence = useCallback(() => {
        const shuffled = [...BEACON_NODES].sort(() => Math.random() - 0.5);
        const seq = shuffled.slice(0, 4).map(n => n.id);
        setBeaconSequence(seq);
        setBeaconPlayerStep(0);
        runShowSequence(seq);
    }, [runShowSequence]);

    /** Handle player clicking a box during input phase */
    const handleBeaconClick = useCallback((boxId) => {
        if (beaconPhase !== 'input') return;

        if (boxId === beaconSequence[beaconPlayerStep]) {
            const nextStep = beaconPlayerStep + 1;
            if (nextStep >= beaconSequence.length) {
                // ✅ All correct — solve!
                setBeaconPhase('idle');
                setBeaconPlayerStep(0);
                dispatch({ type: 'SOLVE_PUZZLE', puzzleId: 'beacon' });
            } else {
                setBeaconPlayerStep(nextStep);
            }
        } else {
            // ❌ Wrong — flash error then replay sequence
            setBeaconPhase('idle');
            setBeaconPlayerStep(0);
            setTimeout(() => runShowSequence(beaconSequence, 500), 300);
        }
    }, [beaconPhase, beaconSequence, beaconPlayerStep, runShowSequence]);

    // Boot: measure viewport → right number of tiles
    useEffect(() => {
        dispatch({ type: 'INIT', fullCount: calcFullCount() });
    }, []);

    // Finalize dying boxes after CSS animation completes
    useEffect(() => {
        const hasDying = state.boxes.some(b => b.isDying);
        if (!hasDying) return;
        const t = setTimeout(() => dispatch({ type: 'FINALIZE_DEATHS' }), 900);
        return () => clearTimeout(t);
    }, [state.boxes]);

    // Cleanup beacon timers on unmount
    useEffect(() => () => clearBeaconTimers(), [clearBeaconTimers]);

    const checkAnswer = useCallback((puzzleId) => {
        if (inputValue.trim() === '') {
            setErrorShake(true);
            setTimeout(() => setErrorShake(false), 500);
            return;
        }
        dispatch({ type: 'SOLVE_PUZZLE', puzzleId });
        setInputValue('');
    }, [inputValue]);

    const openModal = useCallback((id) => {
        dispatch({ type: 'OPEN_MODAL', puzzleId: id });
        setInputValue('');
        setErrorShake(false);
    }, []);

    const closeModal = useCallback(() => {
        clearBeaconTimers();
        setBeaconPhase('idle');
        setBeaconLitId(null);
        dispatch({ type: 'CLOSE_MODAL' });
    }, [clearBeaconTimers]);

    const solvePuzzle = useCallback((id) => dispatch({ type: 'SOLVE_PUZZLE', puzzleId: id }), []);
    const grantFinalKey = useCallback(() => dispatch({ type: 'GRANT_FINAL_KEY' }), []);

    const value = {
        ...state,
        inputValue, setInputValue,
        errorShake,
        holdProgress, setHoldProgress,
        checkAnswer,
        openModal, closeModal,
        solvePuzzle, grantFinalKey,
        dispatch,
        // Beacon Simon-Says
        beaconSequence, beaconLitId, beaconPhase, beaconPlayerStep,
        startBeaconSequence, handleBeaconClick,
    };

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useGame = () => {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error('useGame must be used within GameProvider');
    return ctx;
};
