'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheoryStore } from '@/store/useTheoryStore';
import { CURATED_SONGS, getCuratedSong } from '@/lib/theory/songLibrary';
import { CustomProgressionModal } from '@/components/progression/CustomProgressionModal';
import { soundEngine } from '@/lib/audio/soundEngine';

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
    showGuideToneHalos,
    showCommonToneBadges,
    showVoiceLeadingVectors,
    staticPositionFret,
    setShowGuideToneHalos,
    setShowCommonToneBadges,
    setShowVoiceLeadingVectors,
    setStaticPositionFret,
    backingChordsMuted,
    backingBassMuted,
    backingDrumsMuted,
    setBackingChordsMuted,
    setBackingBassMuted,
    setBackingDrumsMuted,
    targetDrillActive,
    targetDrillScore,
    targetDrillStreak,
    targetDrillFeedback,
    setTargetDrillActive,
    resetTargetDrill,
  } = useTheoryStore();

  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  // ---------------------------------------------------------------------------
  // Playhead Clock Engine (Tick by Beat based on BPM) with Multi-Voice Comping
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isProgressionPlaying) {
      soundEngine.stopComping();
      return;
    }

    const msPerBeat = (60 / progressionBpm) * 1000;

    // Immediately trigger comping audio on the active beat
    const bars = activeProgression.bars;
    const curBar = bars[currentBarIndex % bars.length];
    const totalBarBeats = curBar.reduce((acc, c) => acc + c.beats, 4);

    let accumulatedBeats = 0;
    let activeChord = curBar[0];
    for (const c of curBar) {
      accumulatedBeats += c.beats;
      if (currentBeat <= accumulatedBeats) {
        activeChord = c;
        break;
      }
    }
    soundEngine.playCompingBeat(activeChord.chord, currentBeat, totalBarBeats);

    const interval = setInterval(() => {
      const barsList = activeProgression.bars;
      const bar = barsList[currentBarIndex % barsList.length];
      const beatsInBar = bar.reduce((acc, c) => acc + c.beats, 4);

      if (currentBeat < beatsInBar) {
        const nextBeat = currentBeat + 1;
        setCurrentBeat(nextBeat);
        let acc = 0;
        let chordAtBeat = bar[0];
        for (const c of bar) {
          acc += c.beats;
          if (nextBeat <= acc) {
            chordAtBeat = c;
            break;
          }
        }
        soundEngine.playCompingBeat(chordAtBeat.chord, nextBeat, beatsInBar);
      } else {
        // Advance to next bar
        setCurrentBeat(1);
        if (currentBarIndex < barsList.length - 1) {
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

        {/* Backing Band Stem Toggles */}
        <div className="flex items-center gap-1.5 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800/80 text-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-500 px-1.5">Band:</span>
          
          <button
            onClick={() => setBackingChordsMuted(!backingChordsMuted)}
            className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-medium ${
              !backingChordsMuted
                ? 'bg-amber-950/70 border border-amber-600/60 text-amber-300'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Toggle Rhythm Guitar Chord Comping"
          >
            <span>🎸</span>
            <span>Chords</span>
          </button>

          <button
            onClick={() => setBackingBassMuted(!backingBassMuted)}
            className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-medium ${
              !backingBassMuted
                ? 'bg-cyan-950/70 border border-cyan-600/60 text-cyan-300'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Toggle Electric Bassline Downbeats"
          >
            <span>🎸</span>
            <span>Bass</span>
          </button>

          <button
            onClick={() => setBackingDrumsMuted(!backingDrumsMuted)}
            className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-medium ${
              !backingDrumsMuted
                ? 'bg-emerald-950/70 border border-emerald-600/60 text-emerald-300'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Toggle Drum & Metronome Groove"
          >
            <span>🥁</span>
            <span>Groove</span>
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

      {/* 4. Voice-Leading Overlays & Hand-Position Lock Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/60 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mr-1">
            Fretboard Flight-Path:
          </span>

          {/* Guide Tone Halos Toggle */}
          <button
            onClick={() => setShowGuideToneHalos(!showGuideToneHalos)}
            className={`px-2.5 py-1.5 rounded-lg font-medium border transition-colors flex items-center gap-1.5 ${
              showGuideToneHalos
                ? 'bg-amber-950/70 border-amber-500/80 text-amber-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Highlight 3rd (golden halo) and 7th (purple halo) on fretboard"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-400/40" />
            <span>Guide Targets (3rd & 7th)</span>
          </button>

          {/* Common Tone Badges Toggle */}
          <button
            onClick={() => setShowCommonToneBadges(!showCommonToneBadges)}
            className={`px-2.5 py-1.5 rounded-lg font-medium border transition-colors flex items-center gap-1.5 ${
              showCommonToneBadges
                ? 'bg-emerald-950/70 border-emerald-500/80 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Spotlight pivot notes shared with the next chord"
          >
            <span>💎</span>
            <span>Common Tones</span>
          </button>

          {/* Voice-Leading Vectors Toggle */}
          <button
            onClick={() => setShowVoiceLeadingVectors(!showVoiceLeadingVectors)}
            className={`px-2.5 py-1.5 rounded-lg font-medium border transition-colors flex items-center gap-1.5 ${
              showVoiceLeadingVectors
                ? 'bg-cyan-950/70 border-cyan-500/80 text-cyan-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Draw half-step and whole-step shift arrows to the next chord"
          >
            <span>➔</span>
            <span>Shift Vectors</span>
          </button>

          {/* Target Tone Drill Game Toggle */}
          <button
            onClick={() => setTargetDrillActive(!targetDrillActive)}
            className={`px-2.5 py-1.5 rounded-lg font-medium border transition-colors flex items-center gap-1.5 ${
              targetDrillActive
                ? 'bg-purple-950/80 border-purple-500/80 text-purple-200 shadow-md shadow-purple-900/30 ring-1 ring-purple-400/50'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Interactive game: Practice landing on the 3rd or 7th as chords change"
          >
            <span>🎯</span>
            <span className="font-semibold">Target Drill</span>
          </button>
        </div>

        {/* Static Hand Position Lock Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            🎯 Hand Lock:
          </span>
          <select
            value={staticPositionFret === null ? '' : String(staticPositionFret)}
            onChange={(e) =>
              setStaticPositionFret(e.target.value === '' ? null : Number(e.target.value))
            }
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs font-mono focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="">Full Neck (Frets 1–24)</option>
            <option value="1">Frets 1–5 (Nut Box)</option>
            <option value="5">Frets 5–9 (5th Fret Pentatonic Box)</option>
            <option value="7">Frets 7–11 (7th Fret Position)</option>
            <option value="9">Frets 9–13 (9th Fret Position)</option>
            <option value="12">Frets 12–16 (12th Fret Octave Box)</option>
          </select>
        </div>
      </div>

      {/* 5. Target the 3rd Practice Drill Interactive Game Banner */}
      {targetDrillActive && (
        <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-purple-950/50 to-cyan-950/40 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">🎯</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Target Tone Drill:
                </span>
                <span className="text-xs font-bold text-white">
                  Click the 3rd ({progressionAnalysis?.chords[currentChordIndex]?.guide_tones[0] || 'Guide Tone'}) or 7th of{' '}
                  <span className="text-cyan-400 font-mono underline decoration-cyan-400/60">
                    {activeProgression.chords_sequence[currentChordIndex] || ''}
                  </span>{' '}
                  on the fretboard!
                </span>
              </div>
              {targetDrillFeedback && (
                <p
                  className={`text-xs font-medium mt-0.5 ${
                    targetDrillFeedback.type === 'perfect'
                      ? 'text-emerald-300 font-bold'
                      : targetDrillFeedback.type === 'great'
                      ? 'text-amber-300 font-bold'
                      : targetDrillFeedback.type === 'anchor'
                      ? 'text-cyan-300'
                      : 'text-zinc-400'
                  }`}
                >
                  {targetDrillFeedback.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 self-end sm:self-auto">
            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 text-amber-300">
                <span className="text-[10px] text-zinc-500 uppercase mr-1">Score:</span>
                <span className="font-extrabold">{targetDrillScore}</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 text-emerald-300">
                <span className="text-[10px] text-zinc-500 uppercase mr-1">Streak:</span>
                <span className="font-extrabold">🔥 {targetDrillStreak}</span>
              </div>
            </div>
            <button
              onClick={resetTargetDrill}
              className="text-[10px] text-zinc-400 hover:text-white underline font-mono cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Modal Dialog for Custom Progressions */}
      <CustomProgressionModal />
    </div>
  );
};

