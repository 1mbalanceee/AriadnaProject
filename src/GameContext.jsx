import React, {
    createContext, useContext, useReducer,
    useState, useCallback, useEffect, useRef, useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initialState, gameReducer, calcFullCount } from './gameState';
import { BEACON_NODES } from './components/BeaconOverlay';

const PUZZLE_ANSWERS = {
    shadow: ['глупости', 'глупость', 'чепуха', 'бред'],
    flicker: ['20 августа', 'двадцатое августа', '20.08', '20-е августа'],
    synonyms: ['любовь', 'предчувствие', 'love', 'любоавь'],
    constellation: ['в бальном зале', 'в тронном зале', 'в зале', 'во дворце', 'бальный зал', 'тронный зал', 'дворец'],
};

const PUZZLE_HINTS = {
    shadow: '«вместо чернил...» — как он сказал?',
    flicker: 'Конец августа... Жаркий день.',
    synonyms: 'Это чувство — величайшее из всех.',
    constellation: 'Это было в одном из залов дворца.',
};

const GameContext = createContext(null);

export function GameProvider({ children }) {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const [inputValue, setInputValue] = useState('');
    const [errorShake, setErrorShake] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);
    const [hints, setHints] = useState([]); // { id, text }
    const [failures, setFailures] = useState({}); // { puzzleId: count }

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

    const showHint = useCallback((text) => {
        const id = Math.random().toString(36).substr(2, 9);
        setHints(prev => [...prev, { id, text }]);
        setTimeout(() => {
            setHints(prev => prev.filter(h => h.id !== id));
        }, 1500);
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

    /** Start a fresh Simon-Says round — picks 5 random beacon nodes */
    const startBeaconSequence = useCallback(() => {
        const shuffled = [...BEACON_NODES].sort(() => Math.random() - 0.5);
        const seq = shuffled.slice(0, 5).map(n => n.id);
        setBeaconSequence(seq);
        setBeaconPlayerStep(0);
        runShowSequence(seq);
    }, [runShowSequence]);

    /** Handle player clicking a box during input phase */
    const handleBeaconClick = useCallback((boxId) => {
        if (beaconPhase !== 'input') return;

        // Feedback: briefly light up the clicked box
        setBeaconLitId(boxId);
        setTimeout(() => setBeaconLitId(null), 250);

        if (boxId === beaconSequence[beaconPlayerStep]) {
            const nextStep = beaconPlayerStep + 1;
            if (nextStep >= beaconSequence.length) {
                // ✅ All correct — solve!
                setBeaconPhase('idle');
                setBeaconPlayerStep(0);
                dispatch({ type: 'SOLVE_PUZZLE', puzzleId: 'beacon' });
                showHint('Сигнал принят!');
            } else {
                setBeaconPlayerStep(nextStep);
            }
        } else {
            // ❌ Wrong — flash error then replay sequence
            setBeaconPhase('idle');
            setBeaconPlayerStep(0);
            showHint('Ошибка ритма...');
            setTimeout(() => runShowSequence(beaconSequence, 500), 500);
        }
    }, [beaconPhase, beaconSequence, beaconPlayerStep, runShowSequence, showHint]);

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
        const trimmed = inputValue.trim().toLowerCase();

        if (trimmed === '') {
            setErrorShake(true);
            setTimeout(() => setErrorShake(false), 500);
            return;
        }

        const correctAnswers = PUZZLE_ANSWERS[puzzleId];

        if (correctAnswers) {
            const isCorrect = correctAnswers.some(ans => trimmed === ans.toLowerCase());
            if (!isCorrect) {
                setErrorShake(true);
                setTimeout(() => setErrorShake(false), 500);

                const newFailures = { ...failures, [puzzleId]: (failures[puzzleId] || 0) + 1 };
                setFailures(newFailures);

                if (newFailures[puzzleId] >= 2) {
                    showHint(PUZZLE_HINTS[puzzleId] || 'Неверно...');
                } else {
                    showHint('Неверно...');
                }
                return;
            }
        }

        dispatch({ type: 'SOLVE_PUZZLE', puzzleId });
        setInputValue('');
        setFailures({ ...failures, [puzzleId]: 0 });
        showHint('Верно!');
    }, [inputValue, showHint, failures]);

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
        showHint,
    };

    return (
        <GameContext.Provider value={value}>
            {children}
            <div className="hint-container" style={{
                position: 'fixed',
                bottom: '25%',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
            }}>
                <AnimatePresence>
                    {hints.map(hint => (
                        <motion.div
                            key={hint.id}
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: -10 }}
                            style={{
                                background: 'rgba(20, 20, 35, 0.95)',
                                border: '1px solid rgba(232, 232, 240, 0.4)',
                                padding: '8px 16px',
                                color: 'white',
                                fontSize: '13px',
                                letterSpacing: '2px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                                textTransform: 'uppercase',
                                fontFamily: "'Courier New', monospace",
                            }}
                        >
                            [ {hint.text} ]
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </GameContext.Provider>
    );
}

export const useGame = () => {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error('useGame must be used within GameProvider');
    return ctx;
};
