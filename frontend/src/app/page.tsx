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
import { useTheoryStore } from '@/store/useTheoryStore';
import { soundEngine } from '@/lib/audio/soundEngine';
import { Volume2, Sparkles, SlidersHorizontal } from 'lucide-react';

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
    handedness,
    fretRange,
    playFretAudio,
    setInspectedFret,
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

          {/* Canvas Placeholder & Quick Interactive Test Bench */}
          <div className="py-12 px-6 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-zinc-800 to-zinc-900 border border-zinc-700/80 flex items-center justify-center shadow-lg">
              <SlidersHorizontal className="w-7 h-7 text-red-500" />
            </div>

            <div className="max-w-md">
              <h3 className="text-base font-bold text-white mb-1 flex items-center justify-center gap-1.5">
                <span>Task 2.1 Complete: Reactive Engine Online</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                State store and audio bridge are wired. Test the WebAudio plucks below or change keys and scales above to watch the reactive context update. Ready for <strong>TASK-2.2 (SVG Fretboard Canvas)</strong>.
              </p>
            </div>

            {/* Interactive Audio Pluck Test Bench */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {[
                { note: 'E2', label: 'Low E (String 6)' },
                { note: 'A2', label: 'A2 (Root 5th str)' },
                { note: 'D3', label: 'D3' },
                { note: 'G3', label: 'G3' },
                { note: 'B3', label: 'B3' },
                { note: 'E4', label: 'High E (String 1)' },
                { note: 'A4', label: 'A4 (440 Hz)' },
              ].map((sample) => (
                <button
                  key={sample.note}
                  onClick={() => {
                    playFretAudio(sample.note);
                    setInspectedFret({
                      coordinate: {
                        stringNumber: 1,
                        fretNumber: 5,
                        note: sample.note.slice(0, -1) as any,
                        octave: parseInt(sample.note.slice(-1)),
                        pitchWithOctave: sample.note,
                        frequency: 440,
                        degree: '1',
                      },
                      roleInChordOrScale: 'Pluck Test',
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-xs font-semibold transition-all shadow-sm"
                >
                  <Volume2 className="w-3.5 h-3.5 text-red-400" />
                  {sample.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Harmonic Color Legend */}
        <FooterLegend />
      </div>
    </main>
  );
}
