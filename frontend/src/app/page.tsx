'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { KeySelector } from '@/components/controls/KeySelector';
import { ScaleChordPicker } from '@/components/controls/ScaleChordPicker';
import { OverlayControls } from '@/components/controls/OverlayControls';
import { TuningSelector } from '@/components/controls/TuningSelector';
import { DisplayModeToggle } from '@/components/controls/DisplayModeToggle';
import { FretboardSettings } from '@/components/controls/FretboardSettings';
import { PlaybackBar } from '@/components/controls/PlaybackBar';
import { NoteInspector } from '@/components/inspector/NoteInspector';
import { FooterLegend } from '@/components/layout/FooterLegend';
import { Fretboard } from '@/components/fretboard/Fretboard';
import { ProgressionTimeline } from '@/components/progression/ProgressionTimeline';
import { HarmonicContextHUD } from '@/components/progression/HarmonicContextHUD';
import { GuitarCoachHUD } from '@/components/coach/GuitarCoachHUD';
import { LickVault } from '@/components/coach/LickVault';
import { AudioTranscriberModal } from '@/components/audio/AudioTranscriberModal';
import { GuitarTunerHUD } from '@/components/audio/GuitarTunerHUD';
import { useTheoryStore } from '@/store/useTheoryStore';

export default function Home() {
  const {
    studioMode,
    setStudioMode,
    currentKey,
    tuning,
    activeScale,
    activeChord,
    displayMode,
    activeOverlay,
    cagedShape,
    stringOrientation,
    activeProgression,
    initStoredData,
  } = useTheoryStore();

  React.useEffect(() => {
    initStoredData();
  }, [initStoredData]);

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex flex-col font-sans selection:bg-red-500/30 selection:text-red-200">
      {/* Studio Header */}
      <Header />

      {/* Main Studio Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">
        {/* Studio Mode Switcher */}
        <section className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/80 border border-zinc-800/80 p-2 sm:p-2.5 rounded-2xl shadow-xl shadow-black/40">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800">
            <button
              onClick={() => setStudioMode('explorer')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                studioMode === 'explorer'
                  ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>🔍</span>
              <span>Fretboard Explorer</span>
            </button>
            <button
              onClick={() => setStudioMode('progression')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                studioMode === 'progression'
                  ? 'bg-cyan-950/80 text-cyan-300 shadow-md border border-cyan-500/60 ring-1 ring-cyan-500/30'
                  : 'text-zinc-400 hover:text-cyan-300'
              }`}
            >
              <span>🎵</span>
              <span>Song Progression Flight-Path</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-500 text-zinc-950 text-[9px] font-extrabold uppercase tracking-tight">
                New
              </span>
            </button>
          </div>

          <div className="text-xs text-zinc-400 font-mono px-3 py-1 rounded-lg bg-zinc-900/50 border border-zinc-800/60 hidden sm:block">
            {studioMode === 'progression' ? (
              <span>
                Active Tune: <strong className="text-cyan-400">{activeProgression.title}</strong> ({activeProgression.key} {activeProgression.mode})
              </span>
            ) : (
              <span>
                Active Mode: <strong className="text-white">Static Scale/Chord Analysis</strong>
              </span>
            )}
          </div>
        </section>

        {/* Dynamic Studio Layout based on Studio Mode */}
        {studioMode === 'progression' ? (
          <>
            {/* Phase 3: Interactive Progression Timeline & Transport */}
            <section>
              <ProgressionTimeline />
            </section>

            {/* Phase 4: AI Guitar Coach & RAG Pedagogy Cockpit */}
            <section>
              <GuitarCoachHUD />
            </section>

            {/* Phase 3: Harmonic Context & Soloing Roadmap HUD */}
            <section>
              <HarmonicContextHUD />
            </section>
          </>
        ) : (
          <>
            {/* Phase 2: Static Key, Scale & Overlay Controls */}
            <section className="flex flex-col gap-3.5 bg-zinc-950/60 border border-zinc-800/80 p-4 sm:p-5 rounded-2xl shadow-xl shadow-black/50">
              <KeySelector />
              <ScaleChordPicker />
              <OverlayControls />
              <TuningSelector />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
                <DisplayModeToggle />
                <FretboardSettings />
              </div>
            </section>

            {/* Audio Engine, Arpeggiator & Tonic Drone Bar */}
            <section>
              <PlaybackBar />
            </section>

            {/* Real-Time Note Inspector HUD */}
            <section>
              <NoteInspector />
            </section>
          </>
        )}

        {/* Phase 6.2: Low-Latency Chromatic Guitar Tuner & Live Pitch Tracker HUD */}
        <section>
          <GuitarTunerHUD />
        </section>

        {/* 24-Fret Parallel SVG Fretboard Component */}
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

      {/* Phase 4: Personal Lick Vault Modal Drawer */}
      <LickVault />

      {/* Phase 6: Audio Transcriber & Ingestion Modal */}
      <AudioTranscriberModal />
    </main>
  );
}

