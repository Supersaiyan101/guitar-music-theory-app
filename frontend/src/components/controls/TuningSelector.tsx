'use client';

import React from 'react';
import { useTheoryStore } from '@/store/useTheoryStore';
import { TUNINGS } from '@/lib/theory/pitchMath';
import { TuningName } from '@/types/theory';
import { Sliders } from 'lucide-react';

export const TuningSelector: React.FC = () => {
  const { tuning, setTuning } = useTheoryStore();

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-zinc-500" />
          Guitar Tuning
        </label>
        <span className="text-xs font-mono text-zinc-400">
          {TUNINGS[tuning]?.description}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80">
        {(Object.keys(TUNINGS) as TuningName[]).map((tName) => {
          const isSelected = tuning === tName;
          return (
            <button
              key={tName}
              onClick={() => setTuning(tName)}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all text-center border ${
                isSelected
                  ? 'bg-zinc-800 border-zinc-500 text-white shadow-sm'
                  : 'bg-zinc-900/60 border-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              {tName}
            </button>
          );
        })}
      </div>
    </div>
  );
};
