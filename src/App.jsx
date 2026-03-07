import React, { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';
import { GameProvider } from './GameContext';
import { useGame } from './GameContext';
import BackgroundWall from './components/BackgroundWall';
import Wardrobe from './components/Wardrobe';
import PuzzleDrawers from './components/PuzzleDrawers';
import FinaleDrawers from './components/FinaleDrawers';
import PhaseHUD from './components/PhaseHUD';
import ModalRouter from './components/ModalRouter';
import RoomScene from './components/RoomScene';
import AriadneQuest from './components/AriadneQuest';
import BeaconOverlay from './components/BeaconOverlay';

export default function App() {
  return (
    <GameProvider>
      <AppInner />
    </GameProvider>
  );
}

function AppInner() {
  const { isWardrobeOpen } = useGame();

  // 'prequest' → 'idle' → 'zooming' → 'flashing' → 'reveal' → 'done'
  const [trans, setTrans] = useState('prequest');

  // ── Background music (3 tracks) ───────────────────────────
  // track1 = prequest (AriadneQuest), track2 = 2D-квест, track3 = 3D комната
  const track1Ref = useRef(null); // background.mp3
  const track2Ref = useRef(null); // background2.mp3
  const track3Ref = useRef(null); // background3.mp3
  const startedRef = useRef(false); // флаг: пользователь уже кликнул

  const TARGET_VOL = 0.55;
  const FADE_STEP = 0.025;
  const FADE_MS = 55;

  // Утилита: плавное изменение громкости аудио до targetVol за ~1 сек
  const fadeTo = useCallback((audio, targetVol, onDone) => {
    if (!audio) return;
    const interval = setInterval(() => {
      const diff = targetVol - audio.volume;
      if (Math.abs(diff) <= FADE_STEP) {
        audio.volume = targetVol;
        if (targetVol === 0) audio.pause();
        clearInterval(interval);
        onDone?.();
      } else {
        audio.volume += diff > 0 ? FADE_STEP : -FADE_STEP;
      }
    }, FADE_MS);
    return interval;
  }, []);

  // Инициализация треков один раз
  useEffect(() => {
    const t1 = new Audio('/assets/background.mp3');
    t1.loop = true;
    t1.volume = 0;
    track1Ref.current = t1;

    const t2 = new Audio('/assets/background2.mp3');
    t2.loop = true;
    t2.volume = 0;
    track2Ref.current = t2;

    const t3 = new Audio('/assets/background3.mp3');
    t3.loop = true;
    t3.volume = 0;
    track3Ref.current = t3;

    // Автостарт при первом взаимодействии — запускаем трек для текущей стадии
    const startOnInteraction = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      // Запускаем track1 (мы всегда стартуем с prequest)
      t1.play().then(() => fadeTo(t1, TARGET_VOL)).catch(() => { });
      document.removeEventListener('click', startOnInteraction);
      document.removeEventListener('keydown', startOnInteraction);
      document.removeEventListener('touchstart', startOnInteraction);
    };

    document.addEventListener('click', startOnInteraction);
    document.addEventListener('keydown', startOnInteraction);
    document.addEventListener('touchstart', startOnInteraction);

    return () => {
      t1.pause(); t1.src = '';
      t2.pause(); t2.src = '';
      t3.pause(); t3.src = '';
      document.removeEventListener('click', startOnInteraction);
      document.removeEventListener('keydown', startOnInteraction);
      document.removeEventListener('touchstart', startOnInteraction);
    };
  }, []);

  // Реагируем на смену стадии
  useEffect(() => {
    const t1 = track1Ref.current;
    const t2 = track2Ref.current;
    const t3 = track3Ref.current;
    if (!t1 || !t2 || !t3) return;

    if (trans === 'prequest') {
      // Стадия 1: track1 играет, остальные молчат
      if (startedRef.current && t1.paused) {
        t1.play().then(() => fadeTo(t1, TARGET_VOL)).catch(() => { });
      }
      fadeTo(t2, 0);
      fadeTo(t3, 0);
    } else if (trans === 'idle') {
      // Стадия 2: кросс-фейд track1 → track2
      fadeTo(t1, 0);
      fadeTo(t3, 0);
      t2.currentTime = 0;
      if (startedRef.current) {
        t2.play().then(() => fadeTo(t2, TARGET_VOL)).catch(() => { });
      }
    } else if (trans === 'reveal') {
      // 3D комната: track1/2 затухают, track3 нарастает
      fadeTo(t1, 0);
      fadeTo(t2, 0);
      t3.currentTime = 0;
      t3.play().then(() => fadeTo(t3, TARGET_VOL)).catch(() => { });
    } else if (trans === 'done') {
      // Полная 3D — track3 продолжает играть (уже запущена в reveal)
    }
  }, [trans]);

  // Called when AriadneQuest pre-quest is completed
  const onPreQuestComplete = useCallback(() => {
    setTrans('idle');
  }, []);

  // Full cinematic transition (used by wardrobe click)
  const startTransition = useCallback(() => {
    if (trans !== 'idle' || !isWardrobeOpen) return;
    runTransition();
  }, [trans, isWardrobeOpen]);

  // Skip straight to 3D — no level check (debug / dev shortcut)
  const jumpTo3D = useCallback(() => {
    if (trans !== 'idle') return;
    runTransition();
  }, [trans]);

  function runTransition() {
    setTrans('zooming');
    setTimeout(() => setTrans('flashing'), 900);
    setTimeout(() => setTrans('reveal'), 1400);
    setTimeout(() => setTrans('done'), 2800);

    // Звук перехода с fade-in до 0.5
    try {
      const sfx = new Audio('/assets/transition.mp3');
      sfx.volume = 0;
      sfx.play().then(() => {
        const TARGET = 0.5;
        const STEP = 0.025;
        const tick = setInterval(() => {
          if (sfx.volume + STEP >= TARGET) {
            sfx.volume = TARGET;
            clearInterval(tick);
          } else {
            sfx.volume += STEP;
          }
        }, 60);
      }).catch(() => { });
    } catch { /* audio unavailable */ }
  }

  // Return from 3D back to 2D quest
  const backTo2D = useCallback(() => setTrans('idle'), []);

  const isDone = trans === 'done';
  const show3D = trans === 'reveal' || isDone;
  const show2D = !isDone;

  const isPreQuest = trans === 'prequest';

  return (
    <div className="app-shell">

      {/* ── PRE-QUEST (AriadneQuest) ── */}
      {isPreQuest && (
        <>
          <AriadneQuest onComplete={onPreQuestComplete} />
          {/* DEV SKIP for pre-quest */}
          <button
            id="dev-skip-prequest-btn"
            className="dev-skip-btn"
            style={{ zIndex: 1000 }}
            onClick={onPreQuestComplete}
            title="Пропустить пре-квест"
          >
            пропустить пре-квест →
          </button>
        </>
      )}

      {/* ── LAYER 1: 3D scene (RoomScene = finale) ── */}
      {!isPreQuest && (
        <div
          className="layer-3d"
          style={{ opacity: show3D ? 1 : 0, transition: show3D ? 'opacity 1.3s ease' : 'none' }}
        >
          {show3D && <RoomScene onBack={backTo2D} />}
        </div>
      )}

      {/* ── LAYER 2: 2D quest ── */}
      {!isPreQuest && show2D && (
        <div className="quest-container layer-2d">
          <div className="scanlines" aria-hidden="true" />
          <BackgroundWall />
          <Wardrobe zooming={trans === 'zooming'} onEnter={startTransition} />
          <PuzzleDrawers />
          <FinaleDrawers />
          <PhaseHUD />
          <ModalRouter />
          <BeaconOverlay />

          {/* ── DEV SKIP BUTTON ── */}
          <button
            id="dev-skip-btn"
            className="dev-skip-btn"
            onClick={jumpTo3D}
            title="Перейти в 3D без прохождения"
          >
            залезть в шкаф →
          </button>
        </div>
      )}

      {/* ── LAYER 3: white flash ── */}
      <div className={`flash-overlay flash-${trans}`} aria-hidden="true" />
    </div>
  );
}