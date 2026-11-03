'use client';

import React from 'react';
import { useTheoryStore } from '@/store/useTheoryStore';
import { Volume2, VolumeX, RotateCcw, Music, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentKey,
    activeScale,
    activeChord,
    playbackBpm,
    setPlaybackBpm,
    isMuted,
    setMuted,
    audioReady,
    resetDefaults,
  } = useTheoryStore();

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md px-6 py-3.5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Studio Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-amber-600 to-purple-600 p-[1px] shadow-lg shadow-red-500/10">
            <div className="w-full h-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
              <Music className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Guitar Theory Kingdom
              </h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-red-950/60 text-red-400 border border-red-800/60">
                Studio V2
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Interactive Fretboard Navigation & Audio Engine
            </p>
          </div>
        </div>

        {/* Current Active Context Badge */}
        <div className="hidden md:flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 px-3.5 py-1.5 rounded-full text-xs">
          <span className="text-zinc-500 font-medium">Session:</span>
          <span className="font-bold text-red-400">{currentKey}</span>
          <span className="text-zinc-400 capitalize">
            {activeScale ? activeScale.replace(/_/g, ' ') : activeChord ? activeChord.replace(/_/g, ' ') : 'Free Play'}
          </span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </div>

        {/* Studio Controls: BPM, Audio Status, Reset */}
        <div className="flex items-center gap-3">
          {/* BPM Stepper */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg">
            <span className="text-[11px] font-semibold text-zinc-400">BPM</span>
            <input
              type="number"
              min={40}
              max={240}
              value={playbackBpm}
              onChange={(e) => setPlaybackBpm(Number(e.target.value))}
              className="w-12 bg-transparent text-sm font-mono text-zinc-200 text-center focus:outline-none focus:ring-1 focus:ring-red-500 rounded"
            />
          </div>

          {/* Audio Mute/Unmute */}
          <button
            onClick={() => setMuted(!isMuted)}
            className={`p-2 rounded-lg border transition-all ${
              isMuted
                ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                : audioReady
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400 hover:bg-emerald-900/50'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Reset Defaults */}
          <button
            onClick={resetDefaults}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
            title="Reset to defaults"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
