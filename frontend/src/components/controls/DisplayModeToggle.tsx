'use client';

import React from 'react';
import { useTheoryStore } from '@/store/useTheoryStore';
import { DisplayMode, AccidentalMode } from '@/types/theory';
import { Eye, Hash } from 'lucide-react';

export const DisplayModeToggle: React.FC = () => {
  const {
    displayMode,
    setDisplayMode,
    accidentalMode,
    setAccidentalMode,
  } = useTheoryStore();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
      {/* Display Mode: Notes vs Degrees */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
          <Eye className="w-3.5 h-3.5 text-zinc-500" />
          Fretboard Labels:
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
            Note Names (A, C, E)
          </button>
          <button
            onClick={() => setDisplayMode('intervals')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
              displayMode === 'intervals'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Interval Degrees (1, ♭3, 5)
          </button>
        </div>
      </div>

      {/* Accidentals: Auto, Sharps, Flats */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
          <Hash className="w-3.5 h-3.5 text-zinc-500" />
          Accidentals:
        </span>
        <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
          {(['auto', 'sharps', 'flats'] as AccidentalMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setAccidentalMode(mode)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
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
  );
};
