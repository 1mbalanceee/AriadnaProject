import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ══════════════════════════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════════════════════════

const FONT = "'Press Start 2P', 'Courier New', monospace";
const SERIF = "'UnifrakturMaguntia', 'Palatino Linotype', Georgia, serif";

// Sprite image paths (box only, chests are per-entry in CHESTS array)
const BOX_WAX_IMG = '/assets/box_wax_closed.png';
const BOX_MELTED_IMG = '/assets/box_wax_open.png';

// Item definitions
const ITEMS = {
    matches: { emoji: '🔥', label: 'Спички', color: '#e8621a' },
    rag: { emoji: '🪢', label: 'Ветошь', color: '#c0954a' },
    ragFrozen: { emoji: '🧊', label: '«Проп. хладом» ветошь', color: '#6ab0e4' },
    solarEmber: { emoji: '🟠', label: 'Солнечный уголёк', color: '#ff7700' },
    candle: { emoji: '🕯️', label: 'Свеча', color: '#f4d03f' },
    key: { emoji: '🗝️', label: 'Ключ', color: '#f4c430' },
};

// Compliments for nat 20
const NAT20_COMPLIMENTS = [
    'Идеальное чутьё!',
    'Великолепно!',
    'Судьба улыбается тебе!',
    'Удача на твоей стороне!',
    'Мастерский бросок!',
];

// Troll messages for decor chests (keyed by chest id)
const TROLL_MESSAGES = {
    decor1: { title: 'Ага.', text: 'Этот сундук пустой. Не ожидал? 🙃' },
    decor2: { title: 'Серьёзно?', text: 'Ты открываешь его уже в пятый раз. Там всё ещё пусто. 😐' },
    decor3: { title: 'Послушай...', text: 'Может, стоит поискать там, где ты ещё не был, а не ходить по кругу? 🔄' },
    decor4: { title: 'ЭЙ!', text: 'АХАХАХАХАХ ты снова попался! 😂\nВнутри только записка с этим текстом.' },
    decor5: {
        title: '👋',
        text: 'АХАХАХАХАХ ты снова попался)',
        jumpscare: true,
    },
};

// Chest / box layout — 4 quest + 5 decor (one is jumpscare)
const CHESTS = [
    // ── Quest chests ──────────────────────────────────────────
    {
        id: 'chest1', item: 'matches', label: 'Старый сундук', x: 12, y: 55,
        closedImg: '/assets/chest1_closed.png', openImg: '/assets/chest1_open.png',
    },
    {
        id: 'chest2', item: 'rag', label: 'Замшелый сундук', x: 33, y: 30,
        closedImg: '/assets/chest2_closed.png', openImg: '/assets/chest2_open.png',
    },
    {
        id: 'chest3', item: 'candle', label: 'Облезший сундук', x: 58, y: 65,
        closedImg: '/assets/chest3_closed.png', openImg: '/assets/chest3_open.png',
    },
    {
        id: 'box', item: 'key', label: 'Залитая воском шкатулка', x: 76, y: 35, isBox: true,
    },
    // ── Decor / troll chests ──────────────────────────────────
    {
        id: 'decor1', item: 'empty', label: 'Разбитый ящик', x: 22, y: 78,
        closedImg: '/assets/decor1_closed.png', openImg: '/assets/decor1_open.png',
    },
    {
        id: 'decor2', item: 'empty', label: 'Покрытый пылью сундук', x: 47, y: 18,
        closedImg: '/assets/decor2_closed.png', openImg: '/assets/decor2_open.png',
    },
    {
        id: 'decor3', item: 'solarEmber', label: 'Тёплый сундучок', x: 68, y: 80,
        closedImg: '/assets/decor3_closed.png', openImg: '/assets/decor3_open.png',
    },
    {
        id: 'decor4', item: 'note', label: 'Ветхий ларец', x: 88, y: 60,
        closedImg: '/assets/decor4_closed.png', openImg: '/assets/decor4_open.png',
    },
    {
        id: 'decor5', item: 'jumpscare', label: 'Подозрительный ящик', x: 6, y: 25,
        closedImg: '/assets/decor5_closed.png', openImg: '/assets/decor5_open.png',
    },
];

const QUEST_IDS = new Set(['chest1', 'chest2', 'chest3', 'box']);
const TROLL_IDS = new Set(['decor1', 'decor2', 'decor3', 'decor4', 'decor5']);
const DECOR_ITEM_EMOJIS = { empty: '💨', note: '📜', solarEmber: '🟠', jumpscare: '👾' };

// Lavond shadow scene constants
const LAVOND_SHADOW_IMG = '/assets/lavond_shadow.png';
const LAVOND_SPEECH = [
    'Ты думал, всё так просто?',
    'Этот мир создан на лжи и запретах,',
    'и ты сам приложил к этому руку.',
    'Ты запер её в сказке, а теперь хочешь войти, когда тебе вздумалось?',
    'Я украл твой ключ и раскидал его осколки по сундукам моего лабиринта.',
    'Если ты действительно тот, за кого себя выдаёшь —',
    'любящий идиот — то вспомнишь правила этой реальности.',
    'Пройди мои загадки.',
    'Докажи, что ты достоин коснуться её мира.',
    'И тогда, быть может, я позволю тебе переступить порог.',
];

function rollD20() { return Math.floor(Math.random() * 20) + 1; }

// Pre-loaded dice sound — plays on every chest click
const _diceAudio = typeof window !== 'undefined' ? new Audio('/assets/dice.wav') : null;
if (_diceAudio) _diceAudio.volume = 0.7;
function playDiceSound() {
    if (!_diceAudio) return;
    _diceAudio.currentTime = 0;
    _diceAudio.play().catch(() => { });
}


// ══════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════

// ── 1. SCROLL MODAL (start screen) ───────────────────────────
function ScrollModal({ onStart }) {
    return (
        <motion.div
            style={sc.scrollOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                style={sc.scroll}
                initial={{ scale: 0.88, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
                {/* Corner ornaments */}
                <div style={{ ...sc.corner, top: 8, left: 8 }}>✦</div>
                <div style={{ ...sc.corner, top: 8, right: 8 }}>✦</div>
                <div style={{ ...sc.corner, bottom: 8, left: 8 }}>✦</div>
                <div style={{ ...sc.corner, bottom: 8, right: 8 }}>✦</div>

                {/* Top divider */}
                <div style={sc.divider} />

                <div style={sc.scrollTitle}>НИТЬ АРИАДНЫ</div>
                <div style={sc.scrollSubtitle}>— Манускрипт —</div>

                <div style={sc.divider} />

                <div style={sc.scrollBody}>
                    <p>Эту инструкцию ты написал сам себе, чтобы не забыть,</p>
                    <p>но кажется, раз ты снова здесь, то ты снова забыл!</p>
                    <br />
                    <p style={{ color: '#8b0000', fontWeight: 'bold' }}>Ну какой же ты дурак!!!</p>
                    <p>Вот тебе снова эти сундуки...</p>
                    <p>и не дай бог ветошь снова окажется мокрой.</p>
                    <p>Я уже не знаю, что с тобой сделаю, дурак.</p>
                    <p>Ты надеюсь хотя бы про все ловушки помнишь???</p>
                    <br />
                    <p style={{ color: '#5a0a00', fontStyle: 'italic', textAlign: 'center' }}>
                        Да пребудет с тобой удача.
                    </p>
                </div>

                <div style={sc.divider} />

                <motion.button
                    style={sc.sealBtn}
                    onClick={onStart}
                    whileHover={{ scale: 1.04, boxShadow: '0 0 24px #8b000088' }}
                    whileTap={{ scale: 0.97 }}
                >
                    ⚔ Сорвать печать ⚔
                </motion.button>
            </motion.div>
        </motion.div>
    );
}

// ── 2. ARIADNE THREAD ────────────────────────────────────────
function AriadneThread({ chests, openedIds, containerRef }) {
    const [lines, setLines] = useState([]);

    useEffect(() => {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();

        // Read actual center of each opened chest sprite from DOM
        const nodes = chests
            .filter(c => openedIds.includes(c.id))
            .map(c => {
                const el = containerRef.current.querySelector(`[data-chest-id="${c.id}"]`);
                if (!el) return null;
                const r = el.getBoundingClientRect();
                return {
                    id: c.id,
                    cx: r.left + r.width  / 2 - containerRect.left,
                    cy: r.top  + r.height / 2 - containerRect.top,
                };
            })
            .filter(Boolean);

        const newLines = [];
        for (let i = 0; i < nodes.length - 1; i++) {
            newLines.push({ from: nodes[i], to: nodes[i + 1], id: `${nodes[i].id}-${nodes[i + 1].id}` });
        }
        setLines(newLines);
    }, [openedIds, chests, containerRef]);

    return (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
            <defs>
                <filter id="thread-glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <linearGradient id="threadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#cc1133" />
                    <stop offset="100%" stopColor="#ff2244" />
                </linearGradient>
            </defs>
            <AnimatePresence>
                {lines.map(({ from, to, id }) => (
                    <motion.line
                        key={id}
                        x1={from.cx} y1={from.cy} x2={to.cx} y2={to.cy}
                        stroke="url(#threadGrad)" strokeWidth="2.5" filter="url(#thread-glow)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.5, 1, 0.6, 1] }}
                        transition={{ duration: 0.8, opacity: { duration: 2.2, repeat: Infinity, repeatType: 'mirror' } }}
                    />
                ))}
            </AnimatePresence>
        </svg>
    );
}

// ── 3. D20 OVERLAY ───────────────────────────────────────────
function D20Overlay({ roll, onDone }) {
    const isNat20 = roll === 20;
    const isNat1 = roll === 1;
    const isSuccess = roll >= 6;
    const isFail = roll <= 5;

    const resultLabel = isNat20 ? '🌟 НАТ 20! 🌟'
        : isNat1 ? 'КРИТИЧЕСКИЙ ПРОВАЛ'
            : isSuccess ? 'УСПЕХ!'
                : 'ПРОВАЛ — ЗАКЛИНИЛО';

    const resultColor = isNat20 ? '#ffd700'
        : isNat1 ? '#ff2222'
            : isSuccess ? '#44ff88'
                : '#ff6644';

    return (
        <motion.div style={sc.d20Overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
                style={sc.d20Wrapper}
                initial={{ scale: 0.15, rotate: -45 }}
                animate={{ scale: 1, rotate: isNat20 ? [0, -20, 20, -15, 15, -8, 8, 0] : [0, -18, 18, -10, 10, 0] }}
                transition={{ duration: isNat20 ? 1.1 : 0.75, type: 'spring', stiffness: 260, damping: 10 }}
                onAnimationComplete={onDone}
            >
                {/* NAT 20 golden burst */}
                {isNat20 && <GoldBurst />}

                <div style={{
                    ...sc.d20Body,
                    boxShadow: isNat20
                        ? '0 0 60px #ffd70088, 0 0 120px #ffd70044, 0 8px 36px rgba(0,0,0,0.65)'
                        : sc.d20Body.boxShadow,
                }}>
                    <div style={{ ...sc.d20Number, color: isNat20 ? '#5a3a00' : '#1a0800' }}>{roll ?? '?'}</div>
                    <div style={sc.d20Label}>D20</div>
                </div>

                <motion.div
                    style={{ ...sc.d20Result, color: resultColor, textShadow: `0 0 14px ${resultColor}88` }}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    {resultLabel}
                </motion.div>
            </motion.div>
        </motion.div>
    );
}

// ── 4. GOLD BURST (nat 20 particle explosion) ─────────────────
function GoldBurst() {
    const particles = useMemo(() =>
        Array.from({ length: 18 }, (_, i) => ({
            id: i,
            angle: (i / 18) * 360,
            dist: 60 + Math.random() * 80,
            size: 8 + Math.random() * 12,
        })), []
    );

    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: -1 }}>
            {particles.map(p => {
                const rad = (p.angle * Math.PI) / 180;
                const tx = Math.cos(rad) * p.dist;
                const ty = Math.sin(rad) * p.dist;
                return (
                    <motion.div
                        key={p.id}
                        style={{
                            position: 'absolute',
                            top: '50%', left: '50%',
                            width: p.size, height: p.size,
                            marginTop: -p.size / 2,
                            marginLeft: -p.size / 2,
                            borderRadius: '50%',
                            background: `radial-gradient(circle, #ffe066, #ffa500)`,
                            boxShadow: `0 0 ${p.size}px #ffd700`,
                        }}
                        initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                        animate={{ x: tx, y: ty, opacity: 0, scale: 0.3 }}
                        transition={{ duration: 0.9 + Math.random() * 0.4, ease: 'easeOut' }}
                    />
                );
            })}
        </div>
    );
}

// ── 5. NAT20 COMPLIMENT TOAST ────────────────────────────────
function Nat20Toast({ text, onDone }) {
    return (
        <motion.div
            style={sc.nat20Toast}
            initial={{ opacity: 0, y: 0, scale: 0.7 }}
            animate={{ opacity: 1, y: -60, scale: 1 }}
            exit={{ opacity: 0, y: -120, scale: 0.9 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            onAnimationComplete={onDone}
        >
            ✨ {text} ✨
        </motion.div>
    );
}

// ── 8. TROLL MODAL ───────────────────────────────────────────
function TrollModal({ chestId, onClose }) {
    const msg = TROLL_MESSAGES[chestId];
    if (!msg) return null;
    useEffect(() => { playSound('paper'); }, []);

    return (
        <motion.div style={sc.trollOverlay}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
        >
            {/* Glitch scanline burst */}
            <motion.div style={sc.glitchBurst}
                animate={{ opacity: [1, 0, 1, 0, 0.8, 0] }}
                transition={{ duration: 0.4 }}
            />
            <motion.div
                style={sc.trollCard}
                initial={{ scale: 0.5, rotate: msg.jumpscare ? -15 : 0, y: msg.jumpscare ? -80 : 0 }}
                animate={{ scale: 1, rotate: 0, y: 0 }}
                transition={{ type: 'spring', stiffness: msg.jumpscare ? 500 : 280, damping: 14 }}
                onClick={e => e.stopPropagation()}
            >
                {msg.jumpscare && (
                    <motion.div style={sc.trollHand}
                        animate={{ y: [0, -12, 0], rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: 2 }}
                    >
                        👋
                    </motion.div>
                )}
                <div style={sc.trollTitle}>{msg.title}</div>
                <div style={sc.divider} />
                <div style={sc.trollText}>{msg.text}</div>
                <div style={sc.divider} />
                <motion.button style={sc.sealBtn} onClick={onClose}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                    Закрыть
                </motion.button>
            </motion.div>
        </motion.div>
    );
}

// ── 9. LAVOND SCENE (dark interlude — Tyen's monologue after key) ──
function LavondScene({ onDone }) {
    const [lineIdx, setLineIdx] = useState(0);
    const [displayed, setDisplayed] = useState('');
    const [charIdx, setCharIdx] = useState(0);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (lineIdx >= LAVOND_SPEECH.length) { setDone(true); return; }
        const line = LAVOND_SPEECH[lineIdx];
        if (charIdx < line.length) {
            const t = setTimeout(() => {
                setDisplayed(prev => prev + line[charIdx]);
                setCharIdx(c => c + 1);
            }, 38);
            return () => clearTimeout(t);
        }
        // Line done — pause then next
        const pause = lineIdx === LAVOND_SPEECH.length - 1 ? 4000 : 1100;
        const t = setTimeout(() => {
            setDisplayed('');
            setCharIdx(0);
            setLineIdx(i => i + 1);
        }, pause);
        return () => clearTimeout(t);
    }, [lineIdx, charIdx]);

    useEffect(() => { if (done) { setTimeout(onDone, 1200); } }, [done]);

    return (
        <motion.div style={sc.lavondOverlay}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.0 }}>
            {/* Glitch flicker bar */}
            <motion.div style={sc.lavondGlitch}
                animate={{ opacity: [0, 0.22, 0, 0.14, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2.5 }} />
            {/* Shadow sprite */}
            <motion.div style={sc.lavondImgWrap}
                animate={{ opacity: [0.5, 0.72, 0.5], x: [0, -4, 0, 4, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
                <img src={LAVOND_SHADOW_IMG} alt="Тень Лавонда" style={sc.lavondImg}
                    onError={e => { e.target.style.display = 'none'; }} />
                <div style={sc.lavondFallback}>👁</div>
            </motion.div>
            {/* Speech */}
            <div style={sc.lavondSpeech}>
                <div style={sc.lavondText}>
                    «{displayed}
                    {!done && <span style={sc.cursor}>▌</span>}»
                </div>
            </div>
            {/* Progress dots */}
            <div style={sc.monologueDots}>
                {LAVOND_SPEECH.map((_, i) => (
                    <div key={i} style={{
                        ...sc.monoDot,
                        background: i < lineIdx ? '#8b0000' : i === lineIdx ? '#ff2244' : '#1a0000',
                        boxShadow: i === lineIdx ? '0 0 8px #ff2244' : 'none',
                    }} />
                ))}
            </div>
        </motion.div>
    );
}

// ── 6. REGULAR CHEST ─────────────────────────────────────────
function Chest({ chest, isOpen, isCooldown, isFlying, isDisabled, isCrit20, onChestClick }) {
    const { x, y, item, label } = chest;
    const isDecor = !QUEST_IDS.has(chest.id);
    const itemData = ITEMS[item] ?? null;
    const decorEmoji = DECOR_ITEM_EMOJIS[item];

    const sprite = isOpen
        ? (chest.openImg ?? '/assets/chest_open.png')
        : (chest.closedImg ?? '/assets/chest_closed.png');

    const filterVal = isCooldown
        ? 'drop-shadow(0 0 14px #aa0000) brightness(0.65) saturate(0.3)'
        : isCrit20
            ? 'drop-shadow(0 0 28px #ffd700) brightness(1.4)'
            : isOpen
                ? 'drop-shadow(0 0 18px #c8860a) brightness(1.15)'
                : 'drop-shadow(0 0 6px #3a2200)';

    return (
        <motion.div
            id={`chest-${chest.id}`}
            style={{
                ...sc.chestWrap,
                left: `${x}%`,
                top: `${y}%`,
                opacity: isFlying ? 0 : 1,
                cursor: isOpen || isDisabled || isCooldown ? 'default' : 'pointer',
                filter: filterVal,
            }}
            whileHover={!isOpen && !isDisabled && !isCooldown ? { scale: 1.1, y: -6 } : {}}
            animate={!isOpen && !isFlying && !isCooldown ? { y: [0, -6, 0] } : isCooldown ? { x: [-3, 3, -2, 2, 0] } : {}}
            transition={isCooldown
                ? { duration: 0.25, repeat: 3 }
                : { duration: 2.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            onClick={() => !isOpen && !isDisabled && !isCooldown && onChestClick(chest.id)}
        >
            <img
                src={sprite} alt={label} draggable={false}
                data-chest-id={chest.id}
                style={sc.chestSprite}
            />

            {/* Nat20 ring glow */}
            {isCrit20 && (
                <motion.div
                    style={sc.nat20Ring}
                    animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.1, 0.95] }}
                    transition={{ duration: 0.8, repeat: 3 }}
                />
            )}

            {/* Levitating quest item */}
            <AnimatePresence>
                {isOpen && itemData && (
                    <motion.div
                        style={sc.floatingItem}
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: 1, y: [-10, -28, -14, -28] }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                    >
                        <span style={{ fontSize: 32, filter: `drop-shadow(0 0 10px ${itemData.color}) drop-shadow(0 0 20px ${itemData.color}66)` }}>
                            {itemData.emoji}
                        </span>
                    </motion.div>
                )}

                {/* Decor item reveal */}
                {isOpen && !itemData && decorEmoji && (
                    <motion.div
                        style={sc.floatingItem}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 0.7, scale: 1, y: [-8, -20, -10, -20] }}
                        transition={{ duration: 2.2, repeat: Infinity, repeatType: 'mirror' }}
                    >
                        <span style={{ fontSize: 26, opacity: 0.6 }}>{decorEmoji}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cooldown skull */}
            <AnimatePresence>
                {isCooldown && !isOpen && (
                    <motion.div style={sc.critIcon}
                        initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}>
                        🔒
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={sc.chestLabel}>{label}</div>
        </motion.div>
    );
}

// ── 7. WAX BOX ───────────────────────────────────────────────
function WaxBox({ chest, isMelted, isCandleLit, isFlying, isDisabled, onChestClick }) {
    const { x, y, label } = chest;
    const sprite = isMelted ? BOX_MELTED_IMG : BOX_WAX_IMG;
    const canClick = isCandleLit && !isMelted && !isFlying && !isDisabled;

    return (
        <motion.div
            id="chest-box"
            style={{
                ...sc.chestWrap,
                left: `${x}%`, top: `${y}%`,
                opacity: isFlying ? 0 : 1,
                cursor: canClick ? 'pointer' : 'default',
                filter: isMelted
                    ? 'drop-shadow(0 0 22px #c8860a) brightness(1.2)'
                    : isCandleLit
                        ? 'drop-shadow(0 0 16px #cc8800) brightness(1.05)'
                        : 'drop-shadow(0 0 6px #3a1a00) brightness(0.7)',
            }}
            whileHover={canClick ? { scale: 1.1, y: -6 } : {}}
            animate={!isMelted && !isDisabled ? { y: [0, -6, 0] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            onClick={() => canClick && onChestClick(chest.id)}
        >
            <img src={sprite} alt={label} draggable={false} style={sc.chestSprite} />

            {/* Floating key */}
            <AnimatePresence>
                {isMelted && (
                    <motion.div
                        style={sc.floatingItem}
                        initial={{ scale: 0, rotate: -180, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1, y: [-10, -28, -14, -28] }}
                        transition={{
                            scale: { duration: 0.5, type: 'spring' },
                            rotate: { duration: 0.5 },
                            opacity: { duration: 0.3 },
                            y: { duration: 2, repeat: Infinity, repeatType: 'mirror', delay: 0.5 },
                        }}
                    >
                        <span style={{ fontSize: 32, filter: 'drop-shadow(0 0 12px #f4c430) drop-shadow(0 0 24px #f4c43066)' }}>
                            🗝️
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Candle lock tooltip */}
            {!isCandleLit && !isMelted && (
                <motion.div style={sc.lockedTooltip}
                    animate={{ opacity: [0.4, 0.9, 0.4] }}
                    transition={{ duration: 2.4, repeat: Infinity }}>
                    🕯 нужна горящая свеча
                </motion.div>
            )}

            {/* Glow ring when candle lit */}
            {isCandleLit && !isMelted && (
                <motion.div style={sc.glowRing}
                    animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.9, 1.08, 0.9] }}
                    transition={{ duration: 1.6, repeat: Infinity }} />
            )}

            <div style={sc.chestLabel}>{label}</div>
        </motion.div>
    );
}

// ══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function AriadneQuest({ onComplete }) {
    const containerRef = useRef(null);

    // ── Gates ─────────────────────────────────────────────────
    const [scrollOpen, setScrollOpen] = useState(true);   // start screen
    const [gameActive, setGameActive] = useState(false);

    // ── Quest item state ──────────────────────────────────────
    const [hasMatches, setHasMatches] = useState(false);
    const [hasRag, setHasRag] = useState(false);
    const [hasCandle, setHasCandle] = useState(false);
    const [isCandleLit, setIsCandleLit] = useState(false);
    const [isBoxMelted, setIsBoxMelted] = useState(false);
    const [keyObtained, setKeyObtained] = useState(false);

    // ── Chest UI state ────────────────────────────────────────
    const [openedIds, setOpenedIds] = useState([]);
    const [cooldownIds, setCooldownIds] = useState([]);   // locked chests (fail 1-5)
    const [flyingIds, setFlyingIds] = useState([]);
    const [crit20Id, setCrit20Id] = useState(null); // chest that got nat 20

    // ── D20 state ─────────────────────────────────────────────
    const [diceRoll, setDiceRoll] = useState(null);
    const [showDice, setShowDice] = useState(false);
    const [pendingChestId, setPendingChestId] = useState(null);

    // ── Nat20 toast ───────────────────────────────────────────
    const [nat20Toast, setNat20Toast] = useState(null);

    // ── Troll modal ───────────────────────────────────────────
    const [trollModal, setTrollModal] = useState(null);

    // ── Frozen rag + solar ember mechanic ────────────────────────
    const [ragIsFrozen, setRagIsFrozen] = useState(true);
    const [hasSolarEmber, setHasSolarEmber] = useState(false);

    // ── Lavond shadow scene ───────────────────────────────────
    const [lavondOpen, setLavondOpen] = useState(false);

    // ── Phase / craft state ───────────────────────────────────
    const [craftPhase, setCraftPhase] = useState(null);
    const [tvOff, setTvOff] = useState(false);

    // ── Derived ───────────────────────────────────────────────
    // Rag is usable only when thawed by solar ember
    const ragUsable = hasRag && (!ragIsFrozen || hasSolarEmber);
    const allCraftItemsReady = hasMatches && ragUsable && hasCandle && !isCandleLit;

    // ── Scroll → Game ─────────────────────────────────────────
    const handleScrollStart = useCallback(() => {
        setScrollOpen(false);
        setTimeout(() => setGameActive(true), 500);
    }, []);

    // ── Auto-craft trigger ────────────────────────────────────
    useEffect(() => {
        if (allCraftItemsReady && craftPhase === null) {
            const t = setTimeout(triggerCrafting, 800);
            return () => clearTimeout(t);
        }
    }, [allCraftItemsReady, craftPhase]);

    // ── Key found → Lavond scene → TV-off → onComplete ─────────────
    useEffect(() => {
        if (!keyObtained) return;
        const t = setTimeout(() => {
            setLavondOpen(true);
        }, 900);
        return () => clearTimeout(t);
    }, [keyObtained]);

    // ── Crafting sequence ─────────────────────────────────────
    const triggerCrafting = useCallback(() => {
        setCraftPhase('crafting');
        playSound('craft');
        setFlyingIds(['chest1', 'chest2']);
        setTimeout(() => {
            setFlyingIds([]);
            setIsCandleLit(true);
            setCraftPhase('candleLit');
            playSound('ignite');
        }, 1200);
    }, []);

    // ── Melting sequence ──────────────────────────────────────
    const triggerMelting = useCallback(() => {
        if (!isCandleLit || isBoxMelted) return;
        setCraftPhase('melting');
        playSound('melt');
        setFlyingIds(['chest3']);
        setTimeout(() => {
            setFlyingIds([]);
            setIsBoxMelted(true);
            setOpenedIds(prev => [...prev, 'box']);
            setCraftPhase('finale');
            playSound('key');
            setTimeout(() => setKeyObtained(true), 800);
        }, 1400);
    }, [isCandleLit, isBoxMelted]);

    // ── Chest click ───────────────────────────────────────────
    const onChestClick = useCallback((chestId) => {
        if (chestId === 'box') {
            if (!isCandleLit) return;
            triggerMelting();
            return;
        }
        if (openedIds.includes(chestId) || cooldownIds.includes(chestId)) return;

        const roll = rollD20();
        setDiceRoll(roll);
        setShowDice(true);
        setPendingChestId(chestId);
        playDiceSound();
    }, [isCandleLit, openedIds, cooldownIds, triggerMelting]);

    // ── Dice resolve (new rules) ──────────────────────────────
    const onDiceAnimDone = useCallback(() => {
        setTimeout(() => {
            setShowDice(false);
            if (!pendingChestId) return;

            const roll = diceRoll;
            const chestId = pendingChestId;
            setPendingChestId(null);

            // ─ 1–5: FAIL — cooldown ─
            if (roll <= 5) {
                playSound('locked');
                setCooldownIds(prev => [...prev, chestId]);
                const cooldownMs = roll === 1 ? 3000 : 2000;
                setTimeout(() => setCooldownIds(prev => prev.filter(id => id !== chestId)), cooldownMs);
                return;
            }

            // ─ 6–19+: SUCCESS ─
            playSound('success');
            const chest = CHESTS.find(c => c.id === chestId);

            // Troll chests: show modal instead of levitating item
            if (TROLL_IDS.has(chestId)) {
                setOpenedIds(prev => [...prev, chestId]);
                // jumpscare plays special sfx
                if (chest?.item === 'jumpscare') playSound('jumpscare');
                else playSound('paper');
                setTrollModal(chestId);
                if (chest?.item === 'solarEmber') setHasSolarEmber(true);
                if (roll === 20) playSound('nat20');
            } else {
                // Quest chest
                setOpenedIds(prev => [...prev, chestId]);
                if (chest?.item === 'matches') setHasMatches(true);
                if (chest?.item === 'rag') {
                    setHasRag(true);
                    // Rag starts wet — hint player
                }
                if (chest?.item === 'candle') setHasCandle(true);
            }

            // ─ NAT 20 — CRITICAL SUCCESS pomposity ─
            if (roll === 20) {
                setCrit20Id(chestId);
                const compliment = NAT20_COMPLIMENTS[Math.floor(Math.random() * NAT20_COMPLIMENTS.length)];
                setNat20Toast({ text: compliment, chestId });
                setTimeout(() => { setCrit20Id(null); setNat20Toast(null); }, 3200);
            }
        }, 420);
    }, [pendingChestId, diceRoll]);

    // ── Hint ─────────────────────────────────────────────────
    const hint = (() => {
        if (!gameActive) return '';
        if (keyObtained) return 'Ключ найден...';
        if (isCandleLit && !isBoxMelted) return 'Поднеси горящую свечу к шкатулке';
        if (craftPhase === 'crafting') return 'Предметы объединяются...';
        if (allCraftItemsReady) return 'Комбинирование...';
        if (hasRag && ragIsFrozen && !hasSolarEmber) return '«Обычное пламя бессильно против хлада Пустоты...» — найди Солнечный уголёк.';
        if (hasRag && ragIsFrozen && hasSolarEmber) return 'Уголёк найден — ветошь оттаивает!';
        return 'Брось кубик — открой сундук. Найди Ключ.';
    })();

    // ──────────────────────────────────────────────────────────
    //  RENDER
    // ──────────────────────────────────────────────────────────
    return (
        <div ref={containerRef} style={sc.root}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=UnifrakturMaguntia&display=swap');
        @keyframes scanMove {
          from { background-position: 0 0; }
          to   { background-position: 0 100px; }
        }
        @keyframes torchFlicker {
          0%,100% { opacity: 0.85; filter: brightness(1); }
          33%     { opacity: 1;    filter: brightness(1.4) drop-shadow(0 0 16px #f4a820); }
          66%     { opacity: 0.6;  filter: brightness(0.72); }
        }
        @keyframes flamePulse {
          0%,100% { transform: scaleY(1) scaleX(1); }
          50%     { transform: scaleY(1.28) scaleX(0.8); }
        }
        @keyframes glitch {
          0%   { clip-path: inset(0 0 95% 0); transform: translateX(-4px); }
          20%  { clip-path: inset(30% 0 50% 0); transform: translateX(4px); }
          40%  { clip-path: inset(60% 0 20% 0); transform: translateX(-2px); }
          60%  { clip-path: inset(10% 0 80% 0); transform: translateX(3px); }
          80%  { clip-path: inset(80% 0 5% 0);  transform: translateX(-3px); }
          100% { clip-path: inset(0 0 0 0);     transform: translateX(0); }
        }
        @keyframes cursorBlink {
          0%,100% { opacity: 1; } 50% { opacity: 0; }
        }
        img { image-rendering: pixelated; image-rendering: crisp-edges; }
      `}</style>

            {/* ── DUNGEON STONE WALL BACKGROUND ── */}
            <div style={sc.stoneWall} />
            <div style={sc.vignette} />

            {/* ── CRT SCANLINES ── */}
            <div style={sc.crtBg} />



            {/* ── TITLE ── */}
            <div style={sc.title}>НИТЬ АРИАДНЫ</div>
            <div style={sc.subtitle}>пре-квест · найди ключ</div>

            {/* ── ARIADNE THREAD ── */}
            <AriadneThread chests={CHESTS} openedIds={openedIds} containerRef={containerRef} />

            {/* ── REGULAR CHESTS ── */}
            {CHESTS.filter(c => !c.isBox).map(chest => (
                <Chest
                    key={chest.id}
                    chest={chest}
                    isOpen={openedIds.includes(chest.id)}
                    isCooldown={cooldownIds.includes(chest.id)}
                    isFlying={flyingIds.includes(chest.id)}
                    isDisabled={showDice || !gameActive}
                    isCrit20={crit20Id === chest.id}
                    onChestClick={onChestClick}
                />
            ))}

            {/* ── WAX BOX ── */}
            {CHESTS.filter(c => c.isBox).map(chest => (
                <WaxBox
                    key={chest.id}
                    chest={chest}
                    isMelted={isBoxMelted}
                    isCandleLit={isCandleLit}
                    isFlying={flyingIds.includes(chest.id)}
                    isDisabled={showDice || !gameActive}
                    onChestClick={onChestClick}
                />
            ))}

            {/* ── NAT20 TOAST ── */}
            <AnimatePresence>
                {nat20Toast && (
                    <div style={{
                        position: 'absolute',
                        left: `${CHESTS.find(c => c.id === nat20Toast.chestId)?.x ?? 50}%`,
                        top: `${CHESTS.find(c => c.id === nat20Toast.chestId)?.y ?? 50}%`,
                        transform: 'translate(-50%, -100%)',
                        zIndex: 80,
                        pointerEvents: 'none',
                    }}>
                        <Nat20Toast
                            text={nat20Toast.text}
                            onDone={() => setNat20Toast(null)}
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* ── CANDLE BANNER ── */}
            <AnimatePresence>
                {isCandleLit && (
                    <motion.div style={sc.candleBanner}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <span style={{ fontSize: 22, animation: 'flamePulse 0.6s ease-in-out infinite' }}>🕯️</span>
                        <span style={sc.candleBannerText}>СВЕЧА ГОРИТ</span>
                        <span style={{ fontSize: 22, animation: 'flamePulse 0.6s ease-in-out infinite 0.3s' }}>🕯️</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── ITEM BAR ── */}
            <div style={sc.itemBar}>
                {Object.entries(ITEMS).map(([key, item]) => {
                    const obtained = key === 'matches' ? hasMatches
                        : key === 'rag' ? hasRag
                            : key === 'candle' ? hasCandle
                                : keyObtained;
                    return (
                        <div key={key} style={{ ...sc.itemSlot, opacity: obtained ? 1 : 0.22 }}>
                            <span style={{ fontSize: 18, filter: obtained ? `drop-shadow(0 0 7px ${item.color})` : 'none', transition: 'filter 0.5s' }}>
                                {item.emoji}
                            </span>
                            <span style={{ ...sc.itemSlotLabel, color: obtained ? item.color : '#555' }}>
                                {item.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* ── HINT ── */}
            <div style={sc.hint}>{hint}</div>

            {/* ── D20 OVERLAY ── */}
            <AnimatePresence>
                {showDice && <D20Overlay roll={diceRoll} onDone={onDiceAnimDone} />}
            </AnimatePresence>

            {/* ── CRAFT FLASH ── */}
            <AnimatePresence>
                {craftPhase === 'crafting' && (
                    <motion.div style={sc.craftFlash}
                        initial={{ opacity: 0 }} animate={{ opacity: [0, 0.65, 0] }} transition={{ duration: 0.9 }} />
                )}
            </AnimatePresence>

            {/* ── TV-OFF ── */}
            <AnimatePresence>
                {tvOff && !lavondOpen && (
                    <motion.div style={sc.tvOffOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                        <motion.div
                            style={sc.tvOffInner}
                            initial={{ scaleY: 1 }}
                            animate={{ scaleY: [1, 0.04, 0], scaleX: [1, 1.05, 0] }}
                            transition={{ duration: 1.2, ease: 'easeIn', delay: 0.3 }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── LAVOND SCENE (after key) ── */}
            <AnimatePresence>
                {lavondOpen && (
                    <LavondScene onDone={() => { setLavondOpen(false); onComplete?.(); }} />
                )}
            </AnimatePresence>

            {/* ── TROLL MODAL ── */}
            <AnimatePresence>
                {trollModal && (
                    <TrollModal chestId={trollModal} onClose={() => setTrollModal(null)} />
                )}
            </AnimatePresence>

            {/* ── SCROLL MODAL (start screen) ── */}
            <AnimatePresence>
                {scrollOpen && <ScrollModal onStart={handleScrollStart} />}
            </AnimatePresence>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
//  AUDIO
// ══════════════════════════════════════════════════════════════
function playSound(type) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        const now = ctx.currentTime;

        switch (type) {
            case 'success':
                osc.frequency.setValueAtTime(523, now);
                osc.frequency.exponentialRampToValueAtTime(1046, now + 0.22);
                gain.gain.setValueAtTime(0.14, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
                osc.start(); osc.stop(now + 0.56);
                break;

            case 'locked': {
                // Mechanical clunk + rattle
                osc.type = 'square';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.setValueAtTime(140, now + 0.05);
                osc.frequency.setValueAtTime(180, now + 0.10);
                osc.frequency.setValueAtTime(140, now + 0.15);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc.start(); osc.stop(now + 0.41);
                break;
            }

            case 'nat20': {
                // Rising fanfare — 5 notes
                const notes = [523, 659, 783, 1046, 1318];
                notes.forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.connect(g); g.connect(ctx.destination);
                    o.frequency.setValueAtTime(freq, now + i * 0.1);
                    g.gain.setValueAtTime(0, now + i * 0.1);
                    g.gain.linearRampToValueAtTime(0.13, now + i * 0.1 + 0.04);
                    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.55);
                    o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.56);
                });
                return; // early return — no main osc needed
            }

            case 'craft':
            case 'ignite':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(900, now + 0.18);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
                osc.start(); osc.stop(now + 0.43);
                break;

            case 'key':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.exponentialRampToValueAtTime(1760, now + 0.32);
                gain.gain.setValueAtTime(0.13, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
                osc.start(); osc.stop(now + 0.66);
                break;

            case 'melt':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.linearRampToValueAtTime(220, now + 0.55);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
                osc.start(); osc.stop(now + 0.66);
                break;

            case 'paper': {
                // Crinkle / rustle: filtered noise burst
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(3200, now);
                osc.frequency.linearRampToValueAtTime(800, now + 0.18);
                gain.gain.setValueAtTime(0.07, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
                osc.start(); osc.stop(now + 0.29);
                const osc2 = ctx.createOscillator();
                const g2 = ctx.createGain();
                osc2.type = 'sawtooth';
                osc2.connect(g2); g2.connect(ctx.destination);
                osc2.frequency.setValueAtTime(2600, now + 0.05);
                osc2.frequency.linearRampToValueAtTime(600, now + 0.22);
                g2.gain.setValueAtTime(0.05, now + 0.05);
                g2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc2.start(now + 0.05); osc2.stop(now + 0.31);
                break;
            }

            case 'jumpscare': {
                // Sharp sting: loud sawtooth burst + pitch drop
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(900, now);
                osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
                gain.gain.setValueAtTime(0.28, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc.start(); osc.stop(now + 0.41);
                break;
            }

            default: break;
        }
    } catch { /* audio not available */ }
}

// ══════════════════════════════════════════════════════════════
//  STYLES  (sc = style constants)
// ══════════════════════════════════════════════════════════════
const sc = {
    // ── Root ──────────────────────────────────────────────────
    root: {
        position: 'fixed', inset: 0,
        fontFamily: FONT,
        overflow: 'hidden',
        userSelect: 'none',
        background: '#0a0602',
    },

    // ── Stone wall + vignette ──────────────────────────────────
    stoneWall: {
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: "url('/assets/fon.png')",
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        opacity: 0.85,
        backgroundColor: '#0a0602',
    },
    vignette: {
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.72) 80%, rgba(0,0,0,0.92) 100%)',
    },

    // ── CRT ───────────────────────────────────────────────────
    crtBg: {
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 900,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.055) 2px, rgba(0,0,0,0.055) 4px)',
        animation: 'scanMove 8s linear infinite',
    },

    // ── Torches ───────────────────────────────────────────────
    torchLeft: { position: 'absolute', top: '8%', left: '3%', fontSize: 38, zIndex: 5, animation: 'torchFlicker 1.4s ease-in-out infinite', filter: 'drop-shadow(0 0 20px #f4a820)' },
    torchRight: { position: 'absolute', top: '8%', right: '3%', fontSize: 38, zIndex: 5, animation: 'torchFlicker 1.4s ease-in-out infinite 0.7s', filter: 'drop-shadow(0 0 20px #f4a820)' },

    // ── Title ─────────────────────────────────────────────────
    title: {
        position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)',
        fontSize: 'clamp(10px, 2vw, 18px)', color: '#c8860a',
        letterSpacing: '6px', textShadow: '0 0 24px #c8860a, 0 0 48px #c8860a55',
        zIndex: 10, whiteSpace: 'nowrap',
    },
    subtitle: {
        position: 'absolute', top: 'calc(5% + 34px)', left: '50%', transform: 'translateX(-50%)',
        fontSize: 'clamp(5px, 0.8vw, 8px)', color: '#7a5a20', letterSpacing: '4px',
        zIndex: 10, whiteSpace: 'nowrap',
    },

    // ── Chests ────────────────────────────────────────────────
    chestWrap: {
        position: 'absolute', transform: 'translate(-50%, -50%)',
        zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        transition: 'filter 0.4s',
    },
    chestSprite: {
        width: 'clamp(120px, 14vw, 200px)', height: 'clamp(120px, 14vw, 200px)',
        objectFit: 'contain', display: 'block', imageRendering: 'pixelated',
    },
    floatingItem: {
        position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 5, pointerEvents: 'none',
    },
    critIcon: {
        position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)',
        fontSize: 24, zIndex: 6, pointerEvents: 'none',
    },
    chestLabel: {
        fontSize: 'clamp(7px, 0.9vw, 11px)', color: '#8a6a30', letterSpacing: '1px',
        textAlign: 'center', maxWidth: 140, lineHeight: 1.5, marginTop: 2,
    },
    nat20Ring: {
        position: 'absolute', inset: -12, borderRadius: 6,
        border: '2px solid #ffd700',
        boxShadow: '0 0 28px #ffd70088, 0 0 56px #ffd70033, inset 0 0 14px #ffd70022',
        pointerEvents: 'none', zIndex: -1,
    },
    lockedTooltip: {
        position: 'absolute', bottom: -30, left: '50%', transform: 'translateX(-50%)',
        fontSize: 'clamp(8px, 1vw, 12px)', color: '#e8941a', letterSpacing: '1.5px',
        textShadow: '0 0 8px rgba(232,148,26,0.5)',
        whiteSpace: 'nowrap', textAlign: 'center',
    },
    glowRing: {
        position: 'absolute', inset: -8, borderRadius: 4,
        border: '2px solid #cc8800',
        boxShadow: '0 0 18px #cc880088, inset 0 0 10px #cc880022',
        pointerEvents: 'none', zIndex: -1,
    },

    // ── NAT 20 toast ─────────────────────────────────────────
    nat20Toast: {
        fontFamily: FONT, fontSize: 'clamp(8px, 1.5vw, 11px)',
        color: '#ffd700', letterSpacing: '2px',
        textShadow: '0 0 18px #ffd700, 0 0 36px #ffd70066',
        whiteSpace: 'nowrap', pointerEvents: 'none',
    },

    // ── Candle banner ─────────────────────────────────────────
    candleBanner: {
        position: 'absolute', top: '12%', left: '44%', transform: 'none',
        zIndex: 30, display: 'flex', alignItems: 'center', gap: 14,
        padding: '10px 26px', border: '1px solid rgb(200,134,10)',
        background: 'rgba(20,8,0,0.92)',
        boxShadow: 'rgba(200,134,10,0.267) 0px 0px 28px',
        whiteSpace: 'nowrap', width: 'max-content', textAlign: 'center',
    },
    candleBannerText: {
        fontSize: 'clamp(7px, 1vw, 10px)', color: '#f4a820', letterSpacing: '4px', textShadow: '0 0 12px #f4a820',
    },

    // ── Item bar ──────────────────────────────────────────────
    itemBar: {
        position: 'absolute', top: '4%', right: '3%', zIndex: 30,
        display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 18px',
        background: 'rgba(10,4,0,0.92)', border: '1px solid rgba(200,134,10,0.4)',
        boxShadow: '0 0 16px rgba(0,0,0,0.5), inset 0 0 8px rgba(200,134,10,0.06)',
        borderRadius: '4px',
    },
    itemSlot: { display: 'flex', alignItems: 'center', gap: 10, transition: 'opacity 0.5s' },
    itemSlotLabel: { fontSize: 'clamp(8px, 1vw, 11px)', letterSpacing: '1.5px', transition: 'color 0.4s' },

    // ── Hint ──────────────────────────────────────────────────
    hint: {
        position: 'absolute', bottom: '4%', left: '50%', transform: 'translateX(-50%)',
        fontSize: 'clamp(10px, 1.3vw, 15px)', color: '#c8a050', letterSpacing: '2px',
        textAlign: 'center', zIndex: 30, maxWidth: '80%', lineHeight: 2.0,
        background: 'rgba(5,2,0,0.75)',
        border: '1px solid rgba(200,134,10,0.25)',
        padding: '10px 24px',
        boxShadow: '0 0 24px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
    },

    // ── D20 ───────────────────────────────────────────────────
    d20Overlay: {
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    d20Wrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, position: 'relative' },
    d20Body: {
        width: 'min(44vw, 230px)', height: 'min(44vw, 230px)',
        background: 'radial-gradient(circle at 35% 30%, #f0ead8, #d4c8a0, #b0a060)',
        clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 44px rgba(240,228,180,0.45), 0 8px 36px rgba(0,0,0,0.65)',
        position: 'relative',
    },
    d20Number: { fontFamily: FONT, fontSize: 'clamp(28px, 8vw, 62px)', lineHeight: 1, textShadow: '1px 2px 4px rgba(0,0,0,0.4)' },
    d20Label: { fontFamily: FONT, fontSize: 'clamp(8px, 1.4vw, 12px)', color: '#3a2800', letterSpacing: '3px', marginTop: 5 },
    d20Result: { fontFamily: FONT, fontSize: 'clamp(8px, 1.4vw, 12px)', letterSpacing: '3px' },

    // ── Effects ───────────────────────────────────────────────
    craftFlash: {
        position: 'fixed', inset: 0, zIndex: 150, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, #ff8800, transparent)',
    },
    tvOffOverlay: { position: 'fixed', inset: 0, zIndex: 500, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    tvOffInner: { width: '100%', height: '100%', background: '#fff', transformOrigin: 'center center' },

    // ── Scroll modal ──────────────────────────────────────────
    scrollOverlay: {
        position: 'fixed', inset: 0, zIndex: 800,
        background: 'rgba(4,2,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
    },
    scroll: {
        position: 'relative',
        width: 'min(92vw, 560px)',
        maxHeight: '88vh',
        overflowY: 'auto',
        background: 'linear-gradient(160deg, #f4ebd8 0%, #e8d5b0 40%, #d9c090 100%)',
        border: '3px double #8b2200',
        outline: '1px solid #c89060',
        outlineOffset: '-6px',
        padding: '24px 48px',
        boxShadow: '0 0 80px rgba(0,0,0,0.9), inset 0 0 60px rgba(139,60,0,0.14)',
    },
    corner: {
        position: 'absolute', fontSize: 20,
        color: '#8b2200', fontFamily: 'serif', lineHeight: 1,
    },
    divider: {
        width: '100%', height: 1, margin: '8px 0',
        background: 'linear-gradient(90deg, transparent, #8b2200, #c89060, #8b2200, transparent)',
    },
    scrollTitle: {
        fontFamily: FONT, fontSize: 'clamp(12px, 3vw, 20px)',
        color: '#5a0a00', letterSpacing: '5px',
        textAlign: 'center', marginBottom: 4,
        textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
    },
    scrollSubtitle: {
        fontFamily: SERIF, fontSize: 'clamp(12px, 2vw, 18px)',
        color: '#7a3800', textAlign: 'center', marginBottom: 0,
        fontStyle: 'italic', letterSpacing: '3px',
    },
    scrollBody: {
        fontFamily: SERIF,
        fontSize: 'clamp(14px, 2vw, 20px)',
        color: '#2a1200',
        lineHeight: 1.55,
        textAlign: 'justify',
        padding: '8px 0',
    },
    sealBtn: {
        display: 'block',
        margin: '12px auto 0',
        padding: '12px 32px',
        background: 'linear-gradient(180deg, #8b2200, #5a0a00)',
        border: '2px solid #c89060',
        color: '#f4ebd8',
        fontFamily: FONT,
        fontSize: 'clamp(10px, 1.8vw, 14px)',
        letterSpacing: '3px',
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(139,34,0,0.6)',
        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
    },

    // ── Troll modal ──────────────────────────────────────────────
    trollOverlay: {
        position: 'fixed', inset: 0, zIndex: 600,
        background: 'rgba(0,0,0,0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(2px)',
    },
    glitchBurst: {
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(90deg, transparent 30%, #00ff0011 50%, transparent 70%)',
        animation: 'glitch 0.4s steps(1) forwards',
        zIndex: 601,
    },
    trollCard: {
        position: 'relative',
        width: 'min(88vw, 480px)',
        background: 'linear-gradient(160deg, #f4ebd8, #e8d5b0)',
        border: '3px double #8b2200',
        outline: '1px solid #c89060',
        outlineOffset: '-5px',
        padding: '32px 40px',
        boxShadow: '0 0 80px rgba(0,0,0,0.9), 0 0 40px #8b000044',
        textAlign: 'center',
    },
    trollHand: {
        fontSize: 64, marginBottom: 8,
        display: 'block', textAlign: 'center',
    },
    trollTitle: {
        fontFamily: FONT,
        fontSize: 'clamp(12px, 2.5vw, 18px)',
        color: '#5a0a00', letterSpacing: '4px',
        marginBottom: 4,
    },
    trollText: {
        fontFamily: SERIF,
        fontSize: 'clamp(15px, 2.2vw, 22px)',
        color: '#2a0800',
        lineHeight: 1.7,
        padding: '8px 0',
        whiteSpace: 'pre-line',
    },

    // ── Final monologue ─────────────────────────────────────────
    monologueOverlay: {
        position: 'fixed', inset: 0, zIndex: 700,
        background: '#000',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 10vw',
        gap: 40,
    },
    monologueLine: {
        fontFamily: "'Cormorant Garamond', 'Georgia', serif",
        fontSize: 'clamp(18px, 3.2vw, 32px)',
        color: '#f0e6c8',
        lineHeight: 1.65,
        letterSpacing: '1px',
        textAlign: 'center',
        textShadow: '0 0 40px rgba(200,134,10,0.4)',
        minHeight: '2.5em',
    },
    cursor: {
        display: 'inline-block',
        color: '#c8860a',
        animation: 'cursorBlink 0.8s step-end infinite',
        marginLeft: 3,
    },
    monologueDots: {
        display: 'flex', gap: 8, justifyContent: 'center',
    },
    monoDot: {
        width: 8, height: 8, borderRadius: '50%',
        transition: 'background 0.3s, box-shadow 0.3s',
    },

    // ── Lavond shadow scene ────────────────────────────────────────
    lavondOverlay: {
        position: 'fixed', inset: 0, zIndex: 900,
        background: '#000',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 32, padding: '0 8vw',
        overflow: 'hidden',
    },
    lavondGlitch: {
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, transparent 40%, rgba(180,0,0,0.08) 50%, transparent 60%)',
        animation: 'glitch 0.4s steps(1) infinite',
        zIndex: 1,
    },
    lavondImgWrap: {
        position: 'relative', zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 'min(40vw, 280px)', height: 'min(40vw, 280px)',
    },
    lavondImg: {
        width: '100%', height: '100%', objectFit: 'contain',
        filter: 'drop-shadow(0 0 40px rgba(180,0,0,0.7)) saturate(0.3) brightness(0.6)',
        imageRendering: 'pixelated',
    },
    lavondFallback: {
        position: 'absolute', fontSize: 80,
        filter: 'drop-shadow(0 0 30px rgba(180,0,0,0.9))',
        opacity: 0.7,
    },
    lavondSpeech: {
        position: 'relative', zIndex: 3,
        maxWidth: 680, width: '100%',
        display: 'flex', flexDirection: 'column', gap: 8,
    },
    lavondText: {
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: 'clamp(18px, 3vw, 30px)',
        fontStyle: 'italic',
        color: '#cc2244',
        textAlign: 'center',
        lineHeight: 1.65,
        textShadow: '0 0 30px rgba(200,0,40,0.5)',
        minHeight: '2em',
    },
};

