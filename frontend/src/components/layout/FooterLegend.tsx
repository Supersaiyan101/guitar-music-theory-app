'use client';

import React from 'react';
import { DEGREE_COLORS } from '@/lib/theory/colorMap';

export const FooterLegend: React.FC = () => {
  const legendItems = [
    { key: '1', label: '1 (Root)' },
    { key: 'b3', label: '♭3 (Minor 3rd)' },
    { key: '3', label: '3 (Major 3rd)' },
    { key: 'b5', label: '♭5 (Blue Note)' },
    { key: '5', label: '5 (Perfect 5th)' },
    { key: 'b7', label: '♭7 (Minor 7th)' },
    { key: '7', label: '7 (Major 7th)' },
    { key: '9', label: '9 / 11 / 13 (Extensions)' },
  ];

  return (
    <footer className="mt-6 border-t border-zinc-900 bg-zinc-950/80 px-6 py-3 rounded-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
          Harmonic Color Legend:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {legendItems.map((item) => {
            const config = DEGREE_COLORS[item.key] || DEGREE_COLORS['9'];
            return (
              <div
                key={item.key}
                className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800/80 px-2 py-1 rounded-md"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full ring-1 ring-white/20"
                  style={{ backgroundColor: config.dotFill }}
                />
                <span className="text-zinc-300 font-medium text-[11px]">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="text-[11px] text-zinc-500">
          Click any fret to play sound & inspect
        </div>
      </div>
    </footer>
  );
};
