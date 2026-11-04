'use client';

import React from 'react';
import { useTheoryStore } from '@/store/useTheoryStore';

export const HarmonicContextHUD: React.FC = () => {
  const {
    activeProgression,
    progressionAnalysis,
    currentChordIndex,
    applyScaleFromHud,
  } = useTheoryStore();

  if (!progressionAnalysis || !progressionAnalysis.chords.length) {
    return null;
  }

  const activeAnalysis =
    progressionAnalysis.chords[currentChordIndex % progressionAnalysis.chords.length];
  const nextAnalysis =
    progressionAnalysis.chords[(currentChordIndex + 1) % progressionAnalysis.chords.length];

  // Function badge colors
  const getFunctionBadgeColor = (fn: string) => {
    switch (fn) {
      case 'Tonic':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
      case 'Dominant':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
      case 'Subdominant':
        return 'bg-sky-950/80 text-sky-300 border-sky-700/60';
      case 'Secondary Dominant':
        return 'bg-rose-950/80 text-rose-300 border-rose-700/60';
      case 'Modal Interchange':
        return 'bg-purple-950/80 text-purple-300 border-purple-700/60';
      case 'Tritone Substitution':
        return 'bg-orange-950/80 text-orange-300 border-orange-700/60';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md flex flex-col gap-4">
      {/* HUD Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800/80 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <h3 className="text-xs font-bold tracking-wider uppercase text-zinc-200">
            Harmonic Context & Soloing Roadmap
          </h3>
          <span className="text-xs text-zinc-400 font-mono">
            Song Key: <strong className="text-white">{activeProgression.key} {activeProgression.mode}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
            Tempo: <strong className="text-amber-400">{activeProgression.default_tempo} BPM</strong>
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
            Genre: <strong className="text-sky-400 uppercase">{activeProgression.genre.replace('_', ' ')}</strong>
          </span>
        </div>
      </div>

      {/* 3-Column Harmonic Flight Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Column 1: Active Chord Deep-Dive (4 cols) */}
        <div className="lg:col-span-4 bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3.5 flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block mb-0.5">
                Current Active Chord
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {activeAnalysis.symbol}
                </span>
                <span className="text-sm font-bold font-mono text-zinc-300 px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700">
                  {activeAnalysis.roman_numeral}
                </span>
              </div>
            </div>

            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${getFunctionBadgeColor(
                activeAnalysis.harmonic_function
              )}`}
            >
              {activeAnalysis.harmonic_function}
            </span>
          </div>

          {/* Constituent Tones */}
          <div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">
              Chord Tones
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeAnalysis.chord_tones.map((t, idx) => {
                const isGuide = activeAnalysis.guide_tones.includes(t);
                return (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 text-xs font-mono font-bold rounded ${
                      isGuide
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 ring-1 ring-amber-500/30'
                        : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                    }`}
                  >
                    {t} {isGuide && <span className="text-[9px] text-amber-400 font-sans ml-0.5">Guide</span>}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Pedagogical Insight */}
          <p className="text-xs text-zinc-300 leading-relaxed italic bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800/50">
            &ldquo;{activeAnalysis.pedagogical_insight}&rdquo;
          </p>
        </div>

        {/* Column 2: Voice-Leading Flight-Path Preview (4 cols) */}
        <div className="lg:col-span-4 bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3.5 flex flex-col justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block mb-0.5">
              Next Voice-Leading Transition
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-zinc-200">
                Approaching <strong className="text-cyan-400 text-xl">{nextAnalysis.symbol}</strong>
              </span>
              <span className="text-xs font-mono text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-800">
                {nextAnalysis.roman_numeral}
              </span>
            </div>
          </div>

          {/* Voice Leading Step Connectors */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              Anticipated Target Steps
            </span>
            {activeAnalysis.voice_leading_to_next.length > 0 ? (
              activeAnalysis.voice_leading_to_next.slice(0, 3).map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs bg-zinc-950/60 px-2.5 py-1.5 rounded border border-zinc-800"
                >
                  <div className="flex items-center gap-1.5 font-mono">
                    <strong className="text-amber-300">{step.from_note}</strong>
                    <span className="text-zinc-400 text-[10px]">→</span>
                    <strong className="text-cyan-300">{step.to_note}</strong>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      step.movement_type === 'common_tone'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {step.movement_type === 'common_tone'
                      ? 'Hold (0 frets)'
                      : step.movement_type === 'half_step_down'
                      ? 'Half-step down (-1)'
                      : step.movement_type === 'half_step_up'
                      ? 'Half-step up (+1)'
                      : step.movement_type.replace('_', ' ')}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-zinc-400 italic py-1">
                Cadence turnaround step connecting cleanly back to top.
              </div>
            )}
          </div>

          {/* Common Tone Anchor Badge */}
          {activeAnalysis.common_tones_with_next.length > 0 && (
            <div className="text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-800/40">
              <span className="text-sm">💎</span>
              <span>
                Common Tones (Keep finger planted):{' '}
                <strong>{activeAnalysis.common_tones_with_next.join(', ')}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Column 3: 4-Tier Solo Scale Roadmap (4 cols) */}
        <div className="lg:col-span-4 bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3.5 flex flex-col justify-between gap-2.5">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block mb-0.5">
              1-Click Soloing Scale Applicator
            </span>
            <span className="text-xs text-zinc-400">
              Click any scale to project it directly onto the 24-fret neck:
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {/* Tier 1: Parent */}
            <button
              onClick={() => applyScaleFromHud(activeAnalysis.recommended_scales.parent)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-800 hover:border-emerald-500/60 hover:bg-emerald-950/20 text-left transition-all group"
            >
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-400">
                  Tier 1: Parent Song Key
                </span>
                <span className="text-xs font-bold text-zinc-200 group-hover:text-emerald-300">
                  {activeAnalysis.recommended_scales.parent}
                </span>
              </div>
              <span className="text-xs text-zinc-400 group-hover:text-emerald-400 font-mono">Load ➔</span>
            </button>

            {/* Tier 2: Modal */}
            <button
              onClick={() => applyScaleFromHud(activeAnalysis.recommended_scales.modal)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-800 hover:border-sky-500/60 hover:bg-sky-950/20 text-left transition-all group"
            >
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold tracking-wider text-sky-400">
                  Tier 2: Chord-Tone Mode
                </span>
                <span className="text-xs font-bold text-zinc-200 group-hover:text-sky-300">
                  {activeAnalysis.recommended_scales.modal}
                </span>
              </div>
              <span className="text-xs text-zinc-400 group-hover:text-sky-400 font-mono">Load ➔</span>
            </button>

            {/* Tier 3: Blues */}
            <button
              onClick={() => applyScaleFromHud(activeAnalysis.recommended_scales.blues)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-800 hover:border-amber-500/60 hover:bg-amber-950/20 text-left transition-all group"
            >
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold tracking-wider text-amber-400">
                  Tier 3: Vocal Blues Bends
                </span>
                <span className="text-xs font-bold text-zinc-200 group-hover:text-amber-300">
                  {activeAnalysis.recommended_scales.blues}
                </span>
              </div>
              <span className="text-xs text-zinc-400 group-hover:text-amber-400 font-mono">Load ➔</span>
            </button>

            {/* Tier 4: Spicy Outside */}
            <button
              onClick={() => applyScaleFromHud(activeAnalysis.recommended_scales.spicy)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-800 hover:border-purple-500/60 hover:bg-purple-950/20 text-left transition-all group"
            >
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold tracking-wider text-purple-400">
                  Tier 4: Pro Outside Tension
                </span>
                <span className="text-xs font-bold text-zinc-200 group-hover:text-purple-300 truncate max-w-[200px]">
                  {activeAnalysis.recommended_scales.spicy}
                </span>
              </div>
              <span className="text-xs text-zinc-400 group-hover:text-purple-400 font-mono">Load ➔</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
