'use client';

import React, { useState } from 'react';
import { useTheoryStore } from '@/store/useTheoryStore';
import {
  SCALE_DEFINITIONS,
  CHORD_DEFINITIONS,
} from '@/lib/theory/pitchMath';
import { ScaleType, ChordType, SoloOverlay, CagedShape } from '@/types/theory';
import { Sparkles, Layers, Box, Disc } from 'lucide-react';

export const ScaleChordPicker: React.FC = () => {
  const [tab, setTab] = useState<'scales' | 'chords' | 'overlays'>('scales');

  const {
    activeScale,
    setScale,
    activeChord,
    setChord,
    activeOverlay,
    setOverlay,
    cagedShape,
    setCagedShape,
  } = useTheoryStore();

  const CAGED_SHAPES: CagedShape[] = ['C', 'A', 'G', 'E', 'D'];

  return (
    <div className="flex flex-col gap-2">
      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800/80">
        <button
          onClick={() => setTab('scales')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            tab === 'scales'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Disc className="w-3.5 h-3.5 text-sky-400" />
          Scales & Modes
        </button>
        <button
          onClick={() => setTab('chords')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            tab === 'chords'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          Chords & Voicings
        </button>
        <button
          onClick={() => setTab('overlays')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            tab === 'overlays'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Box className="w-3.5 h-3.5 text-purple-400" />
          Soloing Overlays
        </button>
      </div>

      {/* Tab Content: Scales */}
      {tab === 'scales' && (
        <div className="flex flex-col gap-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
            {Object.values(SCALE_DEFINITIONS).map((scale) => {
              const isSelected = activeScale === scale.id;
              return (
                <button
                  key={scale.id}
                  onClick={() => setScale(scale.id as ScaleType)}
                  className={`px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-all border ${
                    isSelected
                      ? 'bg-sky-950/80 border-sky-500 text-sky-300 font-bold shadow-md shadow-sky-950/40'
                      : 'bg-zinc-900/60 border-zinc-800/70 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <div className="truncate">{scale.name}</div>
                  <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                    {scale.degrees.join(' - ')}
                  </div>
                </button>
              );
            })}
          </div>
          {activeScale && (
            <p className="text-[11px] text-zinc-400 italic px-1 pt-1 border-t border-zinc-800/60">
              {SCALE_DEFINITIONS[activeScale]?.description}
            </p>
          )}
        </div>
      )}

      {/* Tab Content: Chords & Voicings */}
      {tab === 'chords' && (
        <div className="flex flex-col gap-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
            {Object.values(CHORD_DEFINITIONS).map((chord) => {
              const isSelected = activeChord === chord.id;
              return (
                <button
                  key={chord.id}
                  onClick={() => setChord(chord.id as ChordType)}
                  className={`px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-all border ${
                    isSelected
                      ? 'bg-amber-950/80 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-950/40'
                      : 'bg-zinc-900/60 border-zinc-800/70 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <div className="truncate font-semibold">{chord.name}</div>
                  <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                    {chord.degrees.join(' - ')}
                  </div>
                </button>
              );
            })}
          </div>
          {activeChord && (
            <p className="text-[11px] text-zinc-400 italic px-1 pt-1 border-t border-zinc-800/60">
              {CHORD_DEFINITIONS[activeChord]?.description}
            </p>
          )}
        </div>
      )}

      {/* Tab Content: Soloing Overlays (CAGED, 3NPS, Blues Boxes) */}
      {tab === 'overlays' && (
        <div className="flex flex-col gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'none', label: 'None (Full Matrix)', desc: 'View all active notes across neck' },
              { id: 'caged', label: 'CAGED System', desc: '5 interlocking chord & scale shapes' },
              { id: 'three_nps', label: '3-Notes-Per-String', desc: 'Symmetrical 7-mode picking runs' },
              { id: 'bb_king_box', label: 'B.B. King Box', desc: 'Strings 1-2 sweet spot & bends' },
              { id: 'albert_king_box', label: 'Albert King Box', desc: 'Deep whole/1.5-step cry bends' },
              { id: 'diagonal_highway', label: 'Diagonal Highway', desc: 'Sliding pentatonic across strings 5-3-1' },
            ].map((ov) => {
              const isSelected = activeOverlay === ov.id;
              return (
                <button
                  key={ov.id}
                  onClick={() => setOverlay(ov.id as SoloOverlay)}
                  className={`p-2.5 rounded-lg text-xs font-medium text-left transition-all border ${
                    isSelected
                      ? 'bg-purple-950/80 border-purple-500 text-purple-300 font-bold shadow-md shadow-purple-950/40'
                      : 'bg-zinc-900/60 border-zinc-800/70 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{ov.label}</span>
                    {isSelected && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5 leading-snug">
                    {ov.desc}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sub-selector for CAGED Shape when CAGED is active */}
          {activeOverlay === 'caged' && (
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/70">
              <span className="text-xs font-semibold text-zinc-400">CAGED Shape:</span>
              <div className="flex items-center gap-1.5">
                {CAGED_SHAPES.map((shape) => (
                  <button
                    key={shape}
                    onClick={() => setCagedShape(shape)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                      cagedShape === shape
                        ? 'bg-purple-600 text-white ring-1 ring-purple-400 shadow-md shadow-purple-600/30'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {shape}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
