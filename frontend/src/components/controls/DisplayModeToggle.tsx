'use client';

import React from 'react';
import { useTheoryStore } from '@/store/useTheoryStore';
import { DisplayMode, AccidentalMode, DensityMode } from '@/types/theory';
import { Eye, Hash, Target, Sparkles, Filter } from 'lucide-react';

export const DisplayModeToggle: React.FC = () => {
  const {
    displayMode,
    setDisplayMode,
    densityMode,
    setDensityMode,
    highlightChordTones,
    setHighlightChordTones,
    accidentalMode,
    setAccidentalMode,
  } = useTheoryStore();

  return (
    <div className="flex flex-col gap-2.5 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Fretboard Labels: Note Names vs Interval Degrees */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-zinc-500" />
            Labels:
          </span>
          <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
            <button
              onClick={() => setDisplayMode('notes')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                displayMode === 'notes'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Notes (A, C, E)
            </button>
            <button
              onClick={() => setDisplayMode('intervals')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                displayMode === 'intervals'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Degrees (1, ♭3, 5)
            </button>
          </div>
        </div>

        {/* Target Chord Tone Soloing Spotlight Toggle */}
        <button
          onClick={() => setHighlightChordTones(!highlightChordTones)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
            highlightChordTones
              ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-md shadow-amber-950/40 ring-1 ring-amber-400'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
          }`}
          title="Spotlight Chord Tones (1, 3, 5, 7) and dim passing notes"
        >
          <Target className={`w-3.5 h-3.5 ${highlightChordTones ? 'text-amber-400 animate-pulse' : 'text-zinc-500'}`} />
          <span>Target Chord Tones</span>
          {highlightChordTones && (
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">
              ON
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-900">
        {/* Visual Density: Isolated vs Ghost vs All */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            Density:
          </span>
          <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
            {[
              { id: 'isolated', label: 'Scale Only' },
              { id: 'ghost', label: 'Ghost Notes (Pro)' },
              { id: 'all', label: 'Full Board' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setDensityMode(m.id as DensityMode)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  densityMode === m.id
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accidentals: Auto, Sharps, Flats */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
            <Hash className="w-3.5 h-3.5 text-zinc-500" />
            Spelling:
          </span>
          <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
            {(['auto', 'sharps', 'flats'] as AccidentalMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setAccidentalMode(mode)}
                className={`px-2 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                  accidentalMode === mode
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {mode === 'sharps' ? '♯ Sharps' : mode === 'flats' ? '♭ Flats' : 'Auto'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
