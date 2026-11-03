'use client';

import React from 'react';
import { useTheoryStore } from '@/store/useTheoryStore';
import { StringOrientation, Handedness, FretRange } from '@/types/theory';
import { Guitar, Compass } from 'lucide-react';

export const FretboardSettings: React.FC = () => {
  const {
    stringOrientation,
    setStringOrientation,
    handedness,
    setHandedness,
    fretRange,
    setFretRange,
  } = useTheoryStore();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/80 p-2 rounded-xl border border-zinc-800/80 text-xs">
      {/* String Orientation (TAB vs Player) */}
      <div className="flex items-center gap-1.5">
        <span className="text-zinc-400 font-semibold flex items-center gap-1">
          <Guitar className="w-3.5 h-3.5 text-zinc-500" />
          Orientation:
        </span>
        <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
          <button
            onClick={() => setStringOrientation('tab')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              stringOrientation === 'tab'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Low E string at the bottom (standard guitar tablature view)"
          >
            TAB View (Low E Bottom)
          </button>
          <button
            onClick={() => setStringOrientation('player')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              stringOrientation === 'player'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Low E string at the top (looking down at guitar neck)"
          >
            Player View (Low E Top)
          </button>
        </div>
      </div>

      {/* Handedness (Righty vs Lefty) */}
      <div className="flex items-center gap-1.5">
        <span className="text-zinc-400 font-semibold">Handedness:</span>
        <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
          <button
            onClick={() => setHandedness('right')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              handedness === 'right'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Right-Handed
          </button>
          <button
            onClick={() => setHandedness('left')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              handedness === 'left'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Left-Handed (Lefty)
          </button>
        </div>
      </div>

      {/* Fret Range Focus */}
      <div className="flex items-center gap-1.5">
        <span className="text-zinc-400 font-semibold flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-zinc-500" />
          Fret Zoom:
        </span>
        <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
          {[
            { id: 'full', label: 'All 24 Frets' },
            { id: 'open_to_12', label: 'Frets 0–12' },
            { id: 'upper_12_24', label: 'Frets 12–24' },
            { id: 'box_focus', label: 'Box Focus' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setFretRange(r.id as FretRange)}
              className={`px-2 py-1 rounded-md font-semibold transition-all ${
                fretRange === r.id
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
