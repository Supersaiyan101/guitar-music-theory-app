'use client';

import React from 'react';
import { useTheoryStore } from '@/store/useTheoryStore';
import { NoteName } from '@/types/theory';

const KEYS: { display: string; value: NoteName }[] = [
  { display: 'C', value: 'C' },
  { display: 'C♯/D♭', value: 'C#' },
  { display: 'D', value: 'D' },
  { display: 'D♯/E♭', value: 'Eb' },
  { display: 'E', value: 'E' },
  { display: 'F', value: 'F' },
  { display: 'F♯/G♭', value: 'F#' },
  { display: 'G', value: 'G' },
  { display: 'G♯/A♭', value: 'Ab' },
  { display: 'A', value: 'A' },
  { display: 'A♯/B♭', value: 'Bb' },
  { display: 'B', value: 'B' },
];

export const KeySelector: React.FC = () => {
  const { currentKey, setKey } = useTheoryStore();

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Root Key
        </label>
        <span className="text-xs font-mono text-red-400 font-bold">
          {currentKey}
        </span>
      </div>
      <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80">
        {KEYS.map((k) => {
          const isSelected =
            currentKey === k.value ||
            (k.value === 'C#' && currentKey === 'Db') ||
            (k.value === 'Eb' && currentKey === 'D#') ||
            (k.value === 'F#' && currentKey === 'Gb') ||
            (k.value === 'Ab' && currentKey === 'G#') ||
            (k.value === 'Bb' && currentKey === 'A#');

          return (
            <button
              key={k.value}
              onClick={() => setKey(k.value)}
              className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center ${
                isSelected
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30 ring-1 ring-red-400'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800/60'
              }`}
            >
              {k.display}
            </button>
          );
        })}
      </div>
    </div>
  );
};
