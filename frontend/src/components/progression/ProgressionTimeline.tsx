'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheoryStore } from '@/store/useTheoryStore';
import { CURATED_SONGS, getCuratedSong } from '@/lib/theory/songLibrary';
import { CustomProgressionModal } from '@/components/progression/CustomProgressionModal';

export const ProgressionTimeline: React.FC = () => {
  const {
    activeProgression,
    progressionAnalysis,
    currentBarIndex,
    currentChordIndex,
    currentBeat,
    isProgressionPlaying,
    isProgressionLooping,
    progressionBpm,
    loadProgression,
    setBarIndex,
    setChordIndex,
    setCurrentBeat,
    setIsProgressionPlaying,
    setIsProgressionLooping,
    setProgressionBpm,
    setIsCustomModalOpen,
    nextBar,
    prevBar,
  } = useTheoryStore();

  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  // ---------------------------------------------------------------------------
  // Playhead Clock Engine (Tick by Beat based on BPM)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isProgressionPlaying) return;

    const msPerBeat = (60 / progressionBpm) * 1000;
    const interval = setInterval(() => {
      const bars = activeProgression.bars;
      const bar = bars[currentBarIndex % bars.length];
      const totalBarBeats = bar.reduce((acc, c) => acc + c.beats, 4);

      if (currentBeat < totalBarBeats) {
        setCurrentBeat(currentBeat + 1);
      } else {
        // Advance to next bar
        setCurrentBeat(1);
        if (currentBarIndex < bars.length - 1) {
          setBarIndex(currentBarIndex + 1);
        } else {
          // End of progression
          if (isProgressionLooping) {
            setBarIndex(0);
          } else {
            setIsProgressionPlaying(false);
          }
        }
      }
    }, msPerBeat);

    return () => clearInterval(interval);
  }, [
    isProgressionPlaying,
    progressionBpm,
    currentBeat,
    currentBarIndex,
    isProgressionLooping,
    activeProgression,
    setCurrentBeat,
    setBarIndex,
    setIsProgressionPlaying,
  ]);

  // Keyboard shortcut: Spacebar toggles playback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsProgressionPlaying(!isProgressionPlaying);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProgressionPlaying, setIsProgressionPlaying]);

  // Auto-scroll timeline to active bar
  useEffect(() => {
    if (timelineContainerRef.current) {
      const activeEl = timelineContainerRef.current.querySelector('[data-active-bar="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentBarIndex]);

  // Tap Tempo Handler
  const handleTapTempo = () => {
    const now = performance.now();
    const newTaps = [...tapTimes, now].slice(-4);
    setTapTimes(newTaps);

    if (newTaps.length >= 2) {
      const diffs = [];
      for (let i = 1; i < newTaps.length; i++) {
        diffs.push(newTaps[i] - newTaps[i - 1]);
      }
      const avgMs = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      const calculatedBpm = Math.round(60000 / avgMs);
      if (calculatedBpm >= 40 && calculatedBpm <= 240) {
        setProgressionBpm(calculatedBpm);
      }
    }
  };

  const handleSongSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const song = getCuratedSong(e.target.value);
    if (song) {
      loadProgression(song);
    }
  };

  return (
    <div className="w-full bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4">
      {/* 1. Header Toolbar (Song Selector & Badges) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Song / Progression:
          </label>
          <select
            value={activeProgression.id}
            onChange={handleSongSelect}
            className="bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-cyan-500 shadow-inner"
          >
            <optgroup label="🎸 Classic Rock & Guitar Anthems">
              {CURATED_SONGS.filter((s) => s.genre === 'classic_rock').map((s) => (
                <option key={s.id} value={s.id}>
                  {s.artist ? `${s.artist} — ` : ''}{s.title}
                </option>
              ))}
            </optgroup>
            <optgroup label="🎷 Blues & Funk">
              {CURATED_SONGS.filter((s) => s.genre === 'blues_funk').map((s) => (
                <option key={s.id} value={s.id}>
                  {s.artist ? `${s.artist} — ` : ''}{s.title}
                </option>
              ))}
            </optgroup>
            <optgroup label="🎹 Jazz & Neo-Soul">
              {CURATED_SONGS.filter((s) => s.genre === 'jazz_neosoul').map((s) => (
                <option key={s.id} value={s.id}>
                  {s.artist ? `${s.artist} — ` : ''}{s.title}
                </option>
              ))}
            </optgroup>
            <optgroup label="📻 Pop & Modern">
              {CURATED_SONGS.filter((s) => s.genre === 'pop_modern').map((s) => (
                <option key={s.id} value={s.id}>
                  {s.artist ? `${s.artist} — ` : ''}{s.title}
                </option>
              ))}
            </optgroup>
          </select>

          <button
            onClick={() => setIsCustomModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-cyan-500/50 text-cyan-400 transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>✍️</span> Type Custom Progression
          </button>
        </div>

        {/* Info Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
            Key: <strong className="text-white">{activeProgression.key}</strong>
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
            Bars: <strong className="text-amber-400">{activeProgression.bars.length}</strong>
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
            Meter: <strong className="text-zinc-400">{activeProgression.time_signature}</strong>
          </span>
        </div>
      </div>

      {/* 2. Interactive Measure Cards Strip */}
      <div
        ref={timelineContainerRef}
        className="w-full overflow-x-auto pb-2 flex gap-2.5 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900/50"
      >
        {activeProgression.bars.map((bar, barIdx) => {
          const isActiveBar = currentBarIndex === barIdx;
          const isSplit = bar.length > 1;

          return (
            <div
              key={barIdx}
              data-active-bar={isActiveBar}
              onClick={() => {
                setIsProgressionPlaying(false);
                setBarIndex(barIdx);
              }}
              className={`min-w-[125px] sm:min-w-[140px] flex-shrink-0 flex flex-col justify-between p-3 rounded-xl border transition-all cursor-pointer select-none group relative ${
                isActiveBar
                  ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500/50'
                  : 'bg-zinc-900/70 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              {/* Measure Number Badge */}
              <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/60 text-[10px] font-mono">
                <span className={isActiveBar ? 'text-cyan-400 font-bold' : 'text-zinc-400'}>
                  BAR {barIdx + 1}
                </span>
                {isActiveBar && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                )}
              </div>

              {/* Chords Layout inside the measure */}
              {isSplit ? (
                <div className="grid grid-cols-2 gap-2 my-2">
                  {bar.map((bc, cIdx) => (
                    <div key={cIdx} className="flex flex-col items-center">
                      <span className="text-sm font-bold text-white tracking-tight">
                        {bc.chord}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {bc.beats}b
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center my-2">
                  <span className="text-xl font-extrabold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                    {bar[0].chord}
                  </span>
                  {progressionAnalysis?.chords[barIdx] && (
                    <span className="text-xs font-mono font-semibold text-zinc-400">
                      {progressionAnalysis.chords[barIdx].roman_numeral}
                    </span>
                  )}
                </div>
              )}

              {/* Beat LED Indicator Dots */}
              <div className="flex items-center justify-center gap-1.5 pt-1.5 border-t border-zinc-800/60">
                {[1, 2, 3, 4].map((beatNum) => (
                  <span
                    key={beatNum}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      isActiveBar && currentBeat === beatNum
                        ? 'bg-cyan-400 scale-125 shadow-sm shadow-cyan-400 ring-2 ring-cyan-400/40'
                        : 'bg-zinc-700/60'
                    }`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Transport & Playback Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-zinc-800/80">
        {/* Playback Transport Buttons */}
        <div className="flex items-center gap-2">
          {/* Rewind */}
          <button
            onClick={() => setBarIndex(0)}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white transition-colors"
            title="Rewind to Bar 1"
          >
            ⏮
          </button>

          {/* Prev Bar */}
          <button
            onClick={prevBar}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white transition-colors"
            title="Previous Bar"
          >
            ◀
          </button>

          {/* Play / Pause Toggle */}
          <button
            onClick={() => setIsProgressionPlaying(!isProgressionPlaying)}
            className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg ${
              isProgressionPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20'
                : 'bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shadow-cyan-500/20'
            }`}
          >
            <span>{isProgressionPlaying ? '⏸' : '▶'}</span>
            <span>{isProgressionPlaying ? 'Pause' : 'Play Flight'}</span>
          </button>

          {/* Next Bar */}
          <button
            onClick={nextBar}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white transition-colors"
            title="Next Bar"
          >
            ▶
          </button>

          {/* Loop Toggle */}
          <button
            onClick={() => setIsProgressionLooping(!isProgressionLooping)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              isProgressionLooping
                ? 'bg-purple-950/80 border-purple-800 text-purple-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Toggle Continuous Loop"
          >
            <span>🔁</span>
            <span>Loop</span>
          </button>
        </div>

        {/* Tempo Slider & Tap Tempo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400 font-mono font-medium min-w-[55px]">
              {progressionBpm} BPM
            </span>
            <input
              type="range"
              min={40}
              max={240}
              value={progressionBpm}
              onChange={(e) => setProgressionBpm(Number(e.target.value))}
              className="w-24 sm:w-32 accent-cyan-400 cursor-pointer"
            />
          </div>

          <button
            onClick={handleTapTempo}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-mono transition-colors"
            title="Tap repeatedly to set tempo"
          >
            Tap Tempo
          </button>
        </div>
      </div>

      {/* Modal Dialog for Custom Progressions */}
      <CustomProgressionModal />
    </div>
  );
};
