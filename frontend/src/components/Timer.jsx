import { createElement, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, CircleX, Clock, Leaf, Minus, Play, Plus, RotateCcw, Sprout, Square, Trees, PlusCircle, X, PartyPopper } from 'lucide-react';
import ModelViewer, { PLANT_TYPES } from './ModelViewer';

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 major chord arpeggio
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.2);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.2 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.6);
    });
    // Final sustain chord
    setTimeout(() => {
      notes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.2);
      });
    }, 700);
  } catch (e) {
    // Web Audio not available
  }
}

const DEFAULT_CATEGORIES = ['Study', 'Coding', 'Reading', 'Other'];
const PRESETS = [10, 20, 25, 30, 45];
const DEFAULT_MINUTES = 25;
import { API_URL } from '../config';

function loadCategories() {
  try {
    const saved = localStorage.getItem('focusforest_categories');
    if (saved) return JSON.parse(saved);
  } catch (e) { /* ignore */ }
  return DEFAULT_CATEGORIES;
}

function saveCategories(cats) {
  localStorage.setItem('focusforest_categories', JSON.stringify(cats));
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

function getTreeStage(elapsedSeconds, totalSeconds, outcome, isActive) {
  if (outcome === 'failed') return 'dead';
  if (outcome === 'completed') return 'tree';
  // Show mature plant as preview when idle
  if (!isActive && elapsedSeconds === 0) return 'tree';

  const oneThird = totalSeconds / 3;
  if (elapsedSeconds < oneThird) return 'seed';
  if (elapsedSeconds < oneThird * 2) return 'plant';
  return 'tree';
}

function TreeVisual({ stage, progress, plantType = 'tree', onPlantChange, isActive }) {
  const captions = {
    seed: 'Seed planted',
    plant: 'In progress',
    tree: 'Planted',
    dead: 'Session failed',
  };

  // Track previous stage for fade transition
  const [visible, setVisible] = useState(true);
  const [displayedStage, setDisplayedStage] = useState(stage);
  const prevStageRef = useRef(stage);

  useEffect(() => {
    if (stage !== prevStageRef.current) {
      // Fade out
      setVisible(false);

      const timeout = setTimeout(() => {
        // Switch model while hidden
        setDisplayedStage(stage);
        prevStageRef.current = stage;
        // Fade in
        setVisible(true);
      }, 400);

      return () => clearTimeout(timeout);
    }
  }, [stage]);

  return (
    <div
      className="relative flex flex-col border-4 border-neo-black overflow-hidden rounded-sm"
      style={{
        minHeight: '400px',
        background: displayedStage === 'dead'
          ? 'linear-gradient(to bottom, #1a0505, #2d0a0a)'
          : 'linear-gradient(to bottom, #0a1f12, #0d2818, #081a0e)',
      }}
    >
      {/* Caption badge */}
      <div className="absolute left-4 top-4 z-20 border-2 border-white/20 bg-black/50 backdrop-blur-sm px-3 py-1 font-mono text-xs font-bold text-white/80 transition-opacity duration-300">
        {captions[displayedStage] || 'Seed planted'}
      </div>

      {/* 3D Model with fade transition */}
      <div
        className="flex-1"
        style={{
          minHeight: '300px',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.4s ease-in-out',
        }}
      >
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="text-white/50 font-mono text-sm animate-pulse">Loading model...</div>
          </div>
        }>
          <ModelViewer stage={displayedStage} plantType={plantType} />
        </Suspense>
      </div>

      {/* Bottom toolbar */}
      <div className="z-20 border-t-2 border-white/10 bg-black/40 backdrop-blur-md px-5 pb-5 pt-4 space-y-3">
        {/* Plant type selector */}
        {onPlantChange && (
          <div className="flex flex-wrap justify-center gap-2">
            {PLANT_TYPES.map(({ id, label, emoji }) => {
              const selected = plantType === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onPlantChange(id)}
                  disabled={isActive}
                  className={`flex items-center gap-1.5 border-3 px-3 py-1.5 font-mono text-xs font-black transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                    selected
                      ? 'border-neo-green bg-neo-green text-neo-black shadow-[2px_2px_0_rgba(255,255,255,0.3)]'
                      : 'border-white/20 bg-white/5 text-white/70 hover:border-neo-green/50 hover:bg-neo-green/10 hover:text-white'
                  }`}
                >
                  <span className="text-sm">{emoji}</span>
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between font-mono text-[10px] font-bold text-white/50">
            <span>{displayedStage === 'dead' ? 'Failed' : captions[displayedStage]}</span>
            <span>{Math.round(Math.min(Math.max(progress, 0), 100))}%</span>
          </div>
          <div className="h-3 w-full border-2 border-white/20 bg-black/40 overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ease-out ${
                displayedStage === 'dead'
                  ? 'bg-neo-red'
                  : 'bg-gradient-to-r from-neo-green/80 to-neo-green'
              }`}
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TimerComponent() {
  const [targetSeconds, setTargetSeconds] = useState(DEFAULT_MINUTES * 60);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_MINUTES * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [category, setCategory] = useState('Study');
  const [customMinutes, setCustomMinutes] = useState(DEFAULT_MINUTES);
  const [customInputValue, setCustomInputValue] = useState('');
  const [outcome, setOutcome] = useState(null);
  const [saveState, setSaveState] = useState('idle');
  const [categories, setCategories] = useState(loadCategories);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [plantType, setPlantType] = useState('tree');
  const completionHandledRef = useRef(false);

  const addCategory = () => {
    const name = newCategory.trim();
    if (!name || categories.includes(name)) return;
    const updated = [...categories, name];
    setCategories(updated);
    saveCategories(updated);
    setCategory(name);
    setNewCategory('');
    setShowCategoryInput(false);
  };

  const removeCategory = (name) => {
    const updated = categories.filter((c) => c !== name);
    setCategories(updated);
    saveCategories(updated);
    if (category === name) setCategory(updated[0] || 'Study');
  };

  const elapsedSeconds = targetSeconds - timeLeft;
  const progress = targetSeconds > 0 ? (elapsedSeconds / targetSeconds) * 100 : 0;
  const treeStage = useMemo(() => getTreeStage(elapsedSeconds, targetSeconds, outcome, isActive), [elapsedSeconds, targetSeconds, outcome, isActive]);

  const resetTimer = useCallback((nextSeconds = targetSeconds) => {
    completionHandledRef.current = false;
    setIsActive(false);
    setTargetSeconds(nextSeconds);
    setTimeLeft(nextSeconds);
    setSessionStartTime(null);
    setOutcome(null);
    setSaveState('idle');
    setShowPopup(false);
  }, [targetSeconds]);

  const finishSession = useCallback(async (status) => {
    if (!sessionStartTime || completionHandledRef.current) return;

    const endTime = new Date().toISOString();
    const duration = status === 'completed' ? targetSeconds : Math.max(targetSeconds - timeLeft, 0);

    completionHandledRef.current = true;
    setIsActive(false);
    setOutcome(status);

    if (status === 'completed') {
      playBeep();
      setShowPopup(true);
    }
    setSaveState('saving');

    try {
      await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: sessionStartTime,
          endTime,
          duration,
          category,
          status,
        }),
      });
      setSaveState('saved');
    } catch (error) {
      console.error('Failed to save session:', error);
      setSaveState('error');
    }
  }, [category, sessionStartTime, targetSeconds, timeLeft]);

  useEffect(() => {
    if (!isActive) return undefined;

    if (timeLeft <= 0) {
      const completionTimer = setTimeout(() => finishSession('completed'), 0);
      return () => clearTimeout(completionTimer);
    }

    const interval = setInterval(() => {
      setTimeLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [finishSession, isActive, timeLeft]);

  const startSession = () => {
    completionHandledRef.current = false;
    setSessionStartTime(new Date().toISOString());
    setIsActive(true);
    setOutcome(null);
    setSaveState('idle');
    if (timeLeft <= 0) setTimeLeft(targetSeconds);
  };

  const failSession = () => {
    const shouldStop = window.confirm('Ending now will mark this session as failed. Continue?');
    if (shouldStop) {
      finishSession('failed');
    }
  };

  const choosePreset = (minutes) => {
    if (isActive) return;
    setCustomMinutes(minutes);
    setCustomInputValue('');
    resetTimer(minutes * 60);
  };

  const adjustCustomMinutes = (amount) => {
    if (isActive) return;
    setCustomMinutes((current) => {
      const next = Math.min(Math.max(current + amount, 1), 180);
      setCustomInputValue('');
      return next;
    });
  };

  const useCustomTime = () => {
    if (isActive) return;
    resetTimer(customMinutes * 60);
  };

  const handleCustomInputChange = (e) => {
    const val = e.target.value;
    // Allow empty or numeric input only
    if (val === '' || /^\d+$/.test(val)) {
      setCustomInputValue(val);
    }
  };

  const handleCustomInputSubmit = () => {
    if (isActive) return;
    const parsed = parseInt(customInputValue, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 180) {
      setCustomMinutes(parsed);
      resetTimer(parsed * 60);
      setCustomInputValue('');
    }
  };

  const handleCustomInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCustomInputSubmit();
    }
  };

  const statusText = {
    idle: 'Ready when you are.',
    saving: 'Saving session...',
    saved: outcome === 'completed' ? 'Session complete. Tree added to your forest.' : 'Session saved as failed.',
    error: 'Session ended, but saving failed. Check the backend server.',
  }[saveState];

  return (
    <section className="grid w-full min-w-0 gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
      <div className="min-w-0 flex flex-col justify-between border-4 border-neo-black bg-white p-5 shadow-hard-lg sm:p-8">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b-4 border-neo-black pb-5">
            <div>
              <p className="font-mono text-sm font-bold text-forest">Focus session</p>
              <h1 className="mt-1 text-4xl font-black sm:text-6xl">Plant and focus</h1>
            </div>
            <div className="flex items-center gap-2 border-4 border-neo-black bg-neo-green px-3 py-2 font-mono text-sm font-bold">
              <Clock size={18} strokeWidth={2.5} aria-hidden="true" />
              {Math.round(targetSeconds / 60)} min
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {PRESETS.map((minutes) => {
              const activePreset = targetSeconds === minutes * 60;
              return (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => choosePreset(minutes)}
                  disabled={isActive}
                  className={`border-4 border-neo-black px-4 py-2 font-mono text-sm font-black shadow-hard-sm transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                    activePreset ? 'bg-neo-yellow' : 'bg-white hover:bg-neo-yellow'
                  } ${!isActive ? 'hover:translate-x-1 hover:translate-y-1 hover:shadow-none' : ''}`}
                >
                  {minutes} min
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-mono text-sm font-bold">Category</p>
            <div className="flex flex-wrap gap-3">
              {categories.map((item) => (
                <div key={item} className="relative">
                  <button
                    type="button"
                    onClick={() => setCategory(item)}
                    disabled={isActive}
                    className={`border-4 border-neo-black px-4 py-3 text-sm font-black shadow-hard-sm transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                      category === item ? 'bg-neo-green' : 'bg-white hover:bg-neo-yellow'
                    } ${!isActive ? 'hover:translate-x-1 hover:translate-y-1 hover:shadow-none' : ''}`}
                  >
                    {item}
                  </button>
                  {!DEFAULT_CATEGORIES.includes(item) && !isActive && (
                    <button
                      type="button"
                      onClick={() => removeCategory(item)}
                      className="absolute -top-2 -right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-neo-black bg-neo-red text-white"
                      aria-label={`Remove ${item}`}
                    >
                      <X size={10} strokeWidth={3} />
                    </button>
                  )}
                </div>
              ))}
              {/* Add custom category */}
              {!isActive && (
                showCategoryInput ? (
                  <div className="flex border-4 border-neo-black shadow-hard-sm">
                    <input
                      type="text"
                      maxLength={20}
                      placeholder="Category"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                      className="w-28 px-3 py-2 font-mono text-sm font-bold outline-none placeholder:text-gray-400"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={addCategory}
                      disabled={!newCategory.trim()}
                      className="border-l-4 border-neo-black bg-forest px-3 text-white disabled:opacity-50"
                    >
                      <Plus size={16} strokeWidth={3} />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowCategoryInput(false); setNewCategory(''); }}
                      className="border-l-4 border-neo-black bg-white px-3 hover:bg-neo-yellow"
                    >
                      <X size={16} strokeWidth={3} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCategoryInput(true)}
                    className="flex items-center gap-2 border-4 border-dashed border-neo-black px-4 py-3 text-sm font-black transition-all hover:border-solid hover:bg-neo-yellow"
                  >
                    <PlusCircle size={16} strokeWidth={2.5} />
                    Add custom
                  </button>
                )
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-mono text-sm font-bold">Custom time</p>
            <div className="grid grid-cols-[52px_1fr_52px] border-4 border-neo-black bg-white shadow-hard">
              <button
                type="button"
                onClick={() => adjustCustomMinutes(-5)}
                disabled={isActive || customMinutes <= 1}
                className="flex min-h-12 items-center justify-center border-r-4 border-neo-black bg-white transition-colors hover:bg-neo-yellow disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Decrease custom time"
              >
                <Minus size={20} strokeWidth={3} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={useCustomTime}
                disabled={isActive}
                className={`min-h-12 px-4 font-mono text-sm font-black transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  targetSeconds === customMinutes * 60 ? 'bg-neo-yellow' : 'bg-white hover:bg-neo-yellow'
                }`}
              >
                {customMinutes} min
              </button>
              <button
                type="button"
                onClick={() => adjustCustomMinutes(5)}
                disabled={isActive || customMinutes >= 180}
                className="flex min-h-12 items-center justify-center border-l-4 border-neo-black bg-white transition-colors hover:bg-neo-yellow disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Increase custom time"
              >
                <Plus size={20} strokeWidth={3} aria-hidden="true" />
              </button>
            </div>

            {/* Custom time input */}
            <div className="flex gap-3 items-stretch">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter minutes (1-180)"
                value={customInputValue}
                onChange={handleCustomInputChange}
                onKeyDown={handleCustomInputKeyDown}
                disabled={isActive}
                className="flex-1 min-h-12 px-4 border-4 border-neo-black font-mono text-sm font-bold bg-white shadow-hard-sm outline-none focus:bg-neo-yellow/30 transition-colors disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={handleCustomInputSubmit}
                disabled={isActive || !customInputValue}
                className="px-5 min-h-12 border-4 border-neo-black bg-forest text-white font-mono text-sm font-black shadow-hard-sm transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-hard-sm"
              >
                Set
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <div className="font-mono text-sm font-bold uppercase">Time remaining</div>
          <div className="mt-2 font-mono text-7xl font-black leading-none sm:text-8xl">
            {formatTime(timeLeft)}
          </div>

          <div className="mt-6 flex items-center gap-2 font-mono text-sm font-bold">
            {outcome === 'completed' && <CheckCircle2 size={18} strokeWidth={2.5} aria-hidden="true" />}
            {outcome === 'failed' && <CircleX size={18} strokeWidth={2.5} aria-hidden="true" />}
            {statusText}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {!isActive && !outcome && (
              <button
                type="button"
                onClick={startSession}
                className="flex items-center justify-center gap-3 border-4 border-neo-black bg-forest px-6 py-4 text-lg font-black text-white shadow-hard transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-neo-black hover:shadow-none sm:col-span-2"
              >
                <Play size={22} fill="currentColor" aria-hidden="true" />
                Start focus
              </button>
            )}

            {isActive && (
              <button
                type="button"
                onClick={failSession}
                className="flex items-center justify-center gap-3 border-4 border-neo-black bg-neo-red px-6 py-4 text-lg font-black text-white shadow-hard transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-neo-black hover:shadow-none sm:col-span-2"
              >
                <Square size={21} fill="currentColor" aria-hidden="true" />
                Stop early
              </button>
            )}

            {outcome && !isActive && (
              <button
                type="button"
                onClick={() => resetTimer()}
                className="flex items-center justify-center gap-3 border-4 border-neo-black bg-neo-yellow px-6 py-4 text-lg font-black shadow-hard transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-white hover:shadow-none sm:col-span-2"
              >
                <RotateCcw size={22} strokeWidth={2.5} aria-hidden="true" />
                Plant another tree
              </button>
            )}
          </div>
        </div>
      </div>

      <TreeVisual stage={treeStage} progress={progress} plantType={plantType} onPlantChange={setPlantType} isActive={isActive} />

      {/* Completion Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neo-black/60 backdrop-blur-sm" onClick={() => setShowPopup(false)}>
          <div
            className="relative mx-4 w-full max-w-md animate-bounce-in border-4 border-neo-black bg-white p-8 shadow-hard-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative corner squares */}
            <div className="absolute -top-3 -left-3 h-6 w-6 border-4 border-neo-black bg-neo-green" />
            <div className="absolute -top-3 -right-3 h-6 w-6 border-4 border-neo-black bg-neo-yellow" />
            <div className="absolute -bottom-3 -left-3 h-6 w-6 border-4 border-neo-black bg-neo-yellow" />
            <div className="absolute -bottom-3 -right-3 h-6 w-6 border-4 border-neo-black bg-neo-green" />

            <div className="flex flex-col items-center gap-4 text-center">
              {/* 3D Model Preview */}
              <div
                className="w-full border-4 border-neo-black overflow-hidden"
                style={{
                  height: '200px',
                  background: 'linear-gradient(to bottom, #0a1f12, #0d2818, #081a0e)',
                }}
              >
                <Suspense fallback={
                  <div className="flex items-center justify-center h-full">
                    <div className="text-white/50 font-mono text-sm animate-pulse">Loading...</div>
                  </div>
                }>
                  <ModelViewer stage="tree" plantType={plantType} />
                </Suspense>
              </div>

              <h2 className="text-3xl font-black">Session Complete!</h2>

              <p className="font-mono text-sm font-bold text-gray-600">
                You focused for <span className="text-forest">{Math.round(targetSeconds / 60)} minutes</span> on <span className="text-forest">{category}</span>.
                A new tree has been planted in your forest!
              </p>

              <div className="mt-2 flex w-full flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => { setShowPopup(false); resetTimer(); }}
                  className="flex flex-1 items-center justify-center gap-2 border-4 border-neo-black bg-forest px-5 py-3 font-black text-white shadow-hard transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                >
                  <RotateCcw size={18} strokeWidth={2.5} />
                  Plant another
                </button>
                <button
                  type="button"
                  onClick={() => setShowPopup(false)}
                  className="flex flex-1 items-center justify-center gap-2 border-4 border-neo-black bg-neo-yellow px-5 py-3 font-black shadow-hard transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                >
                  <CheckCircle2 size={18} strokeWidth={2.5} />
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
