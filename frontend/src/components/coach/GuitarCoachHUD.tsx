'use client';

import React from 'react';
import { useTheoryStore } from '@/store/useTheoryStore';
import { PersonaSelector } from '@/components/coach/PersonaSelector';
import { InstantCardHUD } from '@/components/coach/InstantCardHUD';
import { FretTargetPills } from '@/components/coach/FretTargetPills';
import { PracticeDrillCard } from '@/components/coach/PracticeDrillCard';
import { StreamingCoachAdvice } from '@/components/coach/StreamingCoachAdvice';

export const GuitarCoachHUD: React.FC = () => {
  const {
    isCoachOpen,
    setIsCoachOpen,
    coachPersona,
    savedLicks,
    setIsLickVaultOpen,
    activeProgression,
    currentChordIndex,
  } = useTheoryStore();

  const currentChord = activeProgression?.chords_sequence?.[currentChordIndex] || '';

  const getPersonaBadgeColor = () => {
    switch (coachPersona) {
      case 'blues_rock':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'jazz_fusion':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
      case 'neo_soul':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  return (
    <section className="bg-zinc-950/90 border border-zinc-800/90 rounded-2xl overflow-hidden shadow-2xl transition-all">
      {/* HUD Header Bar */}
      <div className="p-3.5 sm:p-4 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500/20 to-purple-500/20 border border-sky-500/30 flex items-center justify-center text-lg">
            🎸
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                AI Guitar Coach & Theory RAG
              </h2>
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${getPersonaBadgeColor()}`}
              >
                {coachPersona.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Active Chord: <strong className="text-emerald-400 font-mono">{currentChord}</strong> • Real-time target
              tones, physical fret GPS & custom pedagogy
            </p>
          </div>
        </div>

        {/* Controls: Lick Vault Shortcut & Collapse Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLickVaultOpen(true)}
            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold rounded-lg border border-amber-500/30 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <span>📁</span>
            <span>Lick Vault</span>
            <span className="bg-amber-400/20 px-1.5 py-0.2 rounded-full text-[10px] font-mono text-amber-200">
              {savedLicks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsCoachOpen(!isCoachOpen)}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold rounded-lg border border-zinc-700 transition-all flex items-center gap-1"
          >
            <span>{isCoachOpen ? '▲ Collapse' : '▼ Expand Coach'}</span>
          </button>
        </div>
      </div>

      {/* Expandable Coach Cockpit Body */}
      {isCoachOpen && (
        <div className="p-4 sm:p-5 flex flex-col gap-4 animate-fadeIn">
          {/* Persona Switcher Bar */}
          <PersonaSelector />

          {/* Tier-2 Instant Card HUD */}
          <InstantCardHUD />

          {/* Dual-Column Cockpit: Left = Fret Targets & Routine; Right = Live Streamed Advice */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column: Tactical Fretboard Mechanics */}
            <div className="flex flex-col gap-4">
              <FretTargetPills />
              <PracticeDrillCard />
            </div>

            {/* Right Column: Live Streaming Dialogue & Interactive Audio */}
            <div className="flex flex-col gap-4">
              <StreamingCoachAdvice />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
