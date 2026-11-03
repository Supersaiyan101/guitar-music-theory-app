'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { KeySelector } from '@/components/controls/KeySelector';
import { ScaleChordPicker } from '@/components/controls/ScaleChordPicker';
import { TuningSelector } from '@/components/controls/TuningSelector';
import { DisplayModeToggle } from '@/components/controls/DisplayModeToggle';
import { FretboardSettings } from '@/components/controls/FretboardSettings';
import { NoteInspector } from '@/components/inspector/NoteInspector';
import { FooterLegend } from '@/components/layout/FooterLegend';
import { Fretboard } from '@/components/fretboard/Fretboard';
import { useTheoryStore } from '@/store/useTheoryStore';

export default function Home() {
  const {
    currentKey,
    tuning,
    activeScale,
    activeChord,
    displayMode,
    activeOverlay,
    cagedShape,
    stringOrientation,
  } = useTheoryStore();

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex flex-col font-sans selection:bg-red-500/30 selection:text-red-200">
      {/* Studio Header */}
      <Header />

      {/* Main Studio Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">
        {/* Top Control Bar Grid */}
        <section className="flex flex-col gap-3.5 bg-zinc-950/60 border border-zinc-800/80 p-4 sm:p-5 rounded-2xl shadow-xl shadow-black/50">
          <KeySelector />
          <ScaleChordPicker />
          <TuningSelector />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
            <DisplayModeToggle />
            <FretboardSettings />
          </div>
        </section>

        {/* Real-Time Note Inspector HUD */}
        <section>
          <NoteInspector />
        </section>

        {/* 24-Fret SVG Fretboard Canvas Container (Target for Task 2.2) */}
        <section className="relative flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm font-bold tracking-tight text-white uppercase">
                Interactive 24-Fret Instrument Canvas
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                Key: <strong className="text-red-400">{currentKey}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                Mode: <strong className="text-sky-400">{displayMode}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                View: <strong className="text-amber-400">{stringOrientation.toUpperCase()}</strong>
              </span>
              {activeOverlay !== 'none' && (
                <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-300">
                  Overlay: <strong>{activeOverlay === 'caged' ? `CAGED (${cagedShape})` : activeOverlay}</strong>
                </span>
              )}
            </div>
          </div>

          {/* 24-Fret Parallel SVG Fretboard Component */}
          <div className="pt-2">
            <Fretboard />
          </div>
        </section>

        {/* Harmonic Color Legend */}
        <FooterLegend />
      </div>
    </main>
  );
}
