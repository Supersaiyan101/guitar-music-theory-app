'use client';

import React, { useState } from 'react';
import { useTheoryStore } from '@/store/useTheoryStore';

export const PracticeDrillCard: React.FC = () => {
  const {
    coachResponse,
    isProgressionPlaying,
    setIsProgressionPlaying,
    setHighlightedCoachTarget,
    setFretRange,
  } = useTheoryStore();

  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const drillSteps = coachResponse?.practice_drill || [];
  if (drillSteps.length === 0) return null;

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  const handleStartBackingLoop = () => {
    setIsProgressionPlaying(true);
    setCompletedSteps((prev) => ({ ...prev, 1: true }));
  };

  const handleSpotlightResolution = () => {
    const primary = coachResponse?.target_notes[0];
    if (primary) {
      setHighlightedCoachTarget({
        string: primary.string,
        fret: primary.fret,
        note: primary.note,
      });
      setFretRange('box_focus');
      setCompletedSteps((prev) => ({ ...prev, 3: true }));
    }
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;

  return (
    <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 border border-zinc-800 rounded-xl p-3.5 shadow-md">
      {/* Drill Header & Progress Bar */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <span className="text-xs font-black uppercase tracking-wider text-white">
            Actionable 3-Step Practice Routine
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/50">
            {completedCount} / 3 Complete
          </span>
        </div>
      </div>

      {/* Progress Track Line */}
      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mb-3">
        <div
          className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full transition-all duration-300"
          style={{ width: `${(completedCount / 3) * 100}%` }}
        />
      </div>

      {/* Checklist Steps */}
      <div className="space-y-2">
        {drillSteps.map((step) => {
          const isDone = !!completedSteps[step.step_number];

          return (
            <div
              key={`drill-step-${step.step_number}`}
              onClick={() => toggleStep(step.step_number)}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                isDone
                  ? 'bg-emerald-950/30 border-emerald-500/40 opacity-90'
                  : 'bg-zinc-900/80 hover:bg-zinc-850 border-zinc-800'
              }`}
            >
              {/* Step Number Checkbox */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStep(step.step_number);
                }}
                className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs font-black shrink-0 transition-all ${
                  isDone
                    ? 'bg-emerald-500 text-zinc-950 shadow-md'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}
              >
                {isDone ? '✓' : step.step_number}
              </button>

              {/* Step Instruction */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-semibold leading-snug ${
                    isDone ? 'line-through text-zinc-400' : 'text-zinc-200'
                  }`}
                >
                  {step.action}
                </p>
                <p className="text-[10px] font-medium text-sky-300/80 mt-0.5 font-mono">
                  🔍 Focus: {step.fretboard_focus}
                </p>
              </div>

              {/* Step Action Buttons */}
              {step.step_number === 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartBackingLoop();
                  }}
                  className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider shrink-0 transition-all shadow-sm ${
                    isProgressionPlaying
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
                  }`}
                >
                  {isProgressionPlaying ? '⏸ Looping...' : '▶ Start Loop'}
                </button>
              )}

              {step.step_number === 3 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpotlightResolution();
                  }}
                  className="px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/40 hover:bg-sky-500/30 shrink-0 transition-all"
                >
                  🎯 Spotlight
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
