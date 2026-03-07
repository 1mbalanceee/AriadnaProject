// ── CONSTANTS ─────────────────────────────────────────────────

// Fraction of the full grid to keep alive per phase
export const PHASE_FRACTIONS = {
    0: 1.00, // full wall
    1: 0.65,
    2: 0.38,
    3: 0.10,
    4: 0,    // exactly 3 boxes (handled separately)
};

export const PHASE_LABELS = {
    0: 'УРОВЕНЬ I — ВНИМАТЕЛЬНОСТЬ',
    1: 'УРОВЕНЬ II — АССОЦИАЦИЯ',
    2: 'УРОВЕНЬ III — МЕТА',
    3: 'ФИНАЛ',
    4: '✦',
};

export const PHASE_PUZZLES = {
    0: ['flicker', 'shadow', 'beacon'],
    1: ['synonyms', 'patience'],
    2: ['constellation', 'notes'],
    3: [],
};

export const PUZZLE_META = {
    flicker: { label: '⬡', phase: 0, top: '12%', left: '6%' },
    shadow: { label: '⬡', phase: 0, top: '74%', left: '8%' },
    beacon: { label: '⬡', phase: 0, top: '30%', left: '86%' },
    synonyms: { label: '⬡', phase: 1, top: '14%', left: '10%' },
    patience: { label: '⬡', phase: 1, top: '70%', left: '80%' },
    constellation: { label: '⬡', phase: 2, top: '16%', left: '7%' },
    notes: { label: '⬡', phase: 2, top: '74%', left: '82%' },
};

// ── DYNAMIC BOX COUNT ─────────────────────────────────────────

const DRAWER_STEP = 51; // 48px tile + 3px gap

/** How many tiles fit on screen right now */
export function calcFullCount() {
    const cols = Math.max(1, Math.floor(window.innerWidth / DRAWER_STEP));
    const rows = Math.max(1, Math.floor(window.innerHeight / DRAWER_STEP));
    return cols * rows;
}

/** Target box count for a given phase */
export function getPhaseCount(phase, fullCount) {
    if (phase >= 4) return 3;
    const frac = PHASE_FRACTIONS[phase] ?? 0.1;
    return Math.max(6, Math.round(fullCount * frac));
}

// ── BOX GENERATION ────────────────────────────────────────────

/** The beacon is always placed at 2/3 of the total count so it's well inside the wall */
function beaconIndex(total) { return Math.floor(total * 0.66); }

export function createInitialBoxes(fullCount) {
    const bIdx = beaconIndex(fullCount);
    return Array.from({ length: fullCount }, (_, i) => ({
        id: `box-${i}`,
        role: i === bIdx ? 'beacon' : 'bg',
        isAlive: true,
        isDying: false,
    }));
}

export function eliminateBoxes(boxes, targetCount) {
    const alive = boxes.filter(b => b.isAlive && !b.isDying);
    const excess = alive.length - targetCount;
    if (excess <= 0) return boxes;

    const killIds = new Set(
        alive
            .filter(b => b.role === 'bg')
            .map(b => b.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, excess)
    );
    return boxes.map(b => killIds.has(b.id) ? { ...b, isDying: true } : b);
}

// ── REDUCER ───────────────────────────────────────────────────

export const initialState = {
    phase: 0,
    fullCount: 0,   // set on INIT; used for proportional elimination
    boxes: [],
    solvedPuzzles: [],
    activeModal: null,
    isWardrobeOpen: false,
};

function tryAdvancePhase(state, solved) {
    const required = PHASE_PUZZLES[state.phase] ?? [];
    const phaseDone = required.every(p => solved.includes(p));
    if (!phaseDone) return { ...state, solvedPuzzles: solved, activeModal: null };

    const nextPhase = Math.min(state.phase + 1, 4);
    const target = getPhaseCount(nextPhase, state.fullCount);
    return {
        ...state,
        solvedPuzzles: solved,
        phase: nextPhase,
        boxes: eliminateBoxes(state.boxes, target),
        activeModal: null,
    };
}

export function gameReducer(state, action) {
    switch (action.type) {

        case 'INIT': {
            const fullCount = action.fullCount ?? calcFullCount();
            return {
                ...state,
                fullCount,
                boxes: createInitialBoxes(fullCount),
            };
        }

        case 'OPEN_MODAL':
            return { ...state, activeModal: action.puzzleId };

        case 'CLOSE_MODAL':
            return { ...state, activeModal: null };

        case 'SOLVE_PUZZLE': {
            const solved = [...state.solvedPuzzles, action.puzzleId];
            return tryAdvancePhase(state, solved);
        }

        case 'FINALIZE_DEATHS':
            return {
                ...state,
                boxes: state.boxes.map(b =>
                    b.isDying ? { ...b, isAlive: false, isDying: false } : b
                ),
            };

        case 'GRANT_FINAL_KEY':
            return {
                ...state,
                boxes: eliminateBoxes(state.boxes, 3),
                isWardrobeOpen: true,
                activeModal: null,
                phase: 4,
            };

        default:
            return state;
    }
}
