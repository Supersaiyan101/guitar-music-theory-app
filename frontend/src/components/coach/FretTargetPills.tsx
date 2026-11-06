'use client';

import React from 'react';
import { useTheoryStore } from '@/store/useTheoryStore';
import { FretTargetSuggestion } from '@/lib/api/coachClient';
import { soundEngine } from '@/lib/audio/soundEngine';

export const FretTargetPills: React.FC = () => {
  const {
    coachResponse,
    highlightedCoachTarget,
    setHighlightedCoachTarget,
    setFretRange,
  } = useTheoryStore();

  const targets = coachResponse?.target_notes || [];
  if (targets.length === 0) return null;

  const handlePillClick = async (target: FretTargetSuggestion) => {
    const isAlreadySelected =
      highlightedCoachTarget?.string === target.string &&
      highlightedCoachTarget?.fret === target.fret;

    if (isAlreadySelected) {
      setHighlightedCoachTarget(null);
    } else {
      setHighlightedCoachTarget({
        string: target.string,
        fret: target.fret,
        note: target.note,
      });
      // Automatically zoom camera onto target fret area
      setFretRange('box_focus');
      // Play note audio
      try {
        await soundEngine.playNote(`${target.note}4`);
      } catch {}
    }
  };

  const STRING_NAMES: Record<number, string> = {
    1: 'High E',
    2: 'B',
    3: 'G',
    4: 'D',
    5: 'A',
    6: 'Low E',
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span>🎯</span> Physical Fret Targets (Click to Spotlight &amp; Zoom):
        </span>
        <span className="text-[10px] text-sky-400 font-mono">
          {highlightedCoachTarget ? '✨ Fretboard Spotlight Active' : 'Click any fret to spotlight'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {targets.map((t, idx) => {
          const isSelected =
            highlightedCoachTarget?.string === t.string &&
            highlightedCoachTarget?.fret === t.fret;

          const isSlide = t.technique === 'slide';
          const isBend = t.technique.includes('bend');

          return (
            <button
              key={`target-pill-${idx}`}
              onClick={() => handlePillClick(t)}
              className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between shadow-sm group ${
                isSelected
                  ? 'bg-sky-950/80 border-sky-400 shadow-sky-900/40 ring-2 ring-sky-400/60'
                  : 'bg-zinc-900/70 hover:bg-zinc-850 border-zinc-800 hover:border-sky-500/50'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center justify-center font-mono text-[10px]">
                    {t.note}
                  </span>
                  <span>Fret {t.fret}</span>
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                  Str {t.string} ({STRING_NAMES[t.string] || ''})
                </span>
              </div>

              <div className="text-[10px] text-zinc-400 group-hover:text-zinc-200 line-clamp-2 leading-tight">
                {t.description}
              </div>

              <div className="mt-2 pt-1.5 border-t border-zinc-800/80 flex items-center justify-between text-[9px] font-bold">
                <span
                  className={
                    isSlide
                      ? 'text-cyan-400'
                      : isBend
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }
                >
                  {isSlide ? '⚡ Slide Technique' : isBend ? '⤴ Bend Resolution' : '🎯 Target Tone'}
                </span>
                <span className="text-sky-400 text-[10px] group-hover:translate-x-0.5 transition-transform">
                  {isSelected ? '✓ Spotlighting' : 'Spotlight →'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
