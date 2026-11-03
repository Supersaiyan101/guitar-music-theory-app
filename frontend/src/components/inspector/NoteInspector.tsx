'use client';

import React from 'react';
import { useTheoryStore } from '@/store/useTheoryStore';
import { DEGREE_DESCRIPTIONS } from '@/lib/theory/pitchMath';
import { getDegreeColor } from '@/lib/theory/colorMap';
import { Volume2, Navigation, Info } from 'lucide-react';

export const NoteInspector: React.FC = () => {
  const {
    inspectedFret,
    playFretAudio,
    highlightedOctaveNote,
    setHighlightedOctaveNote,
  } = useTheoryStore();

  if (!inspectedFret) {
    return (
      <div className="flex items-center justify-between bg-zinc-950/70 border border-zinc-800/80 px-4 py-2.5 rounded-xl text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-zinc-500" />
          <span>Click any fret pin on the guitar neck to inspect its harmonic anatomy, hear the pluck, and trigger Octave GPS.</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-zinc-500 font-mono text-[11px]">
          <span>Standard: A4 = 440 Hz</span>
        </div>
      </div>
    );
  }

  const { coordinate, roleInChordOrScale } = inspectedFret;
  const isOctaveGPSActive = highlightedOctaveNote === coordinate.note;
  const color = getDegreeColor(coordinate.degree);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-950 border border-zinc-700/80 p-3 rounded-xl shadow-lg shadow-black/40">
      {/* Note Badge & Coordinates */}
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner ${color.badgeBg} ${color.badgeText}`}
        >
          {coordinate.note}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">
              String {coordinate.stringNumber}, Fret {coordinate.fretNumber}
            </span>
            <span className="text-xs font-mono text-zinc-400">
              ({coordinate.pitchWithOctave})
            </span>
            {coordinate.degree && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${color.badgeBg} ${color.badgeText}`}>
                Degree: {coordinate.degree}
              </span>
            )}
          </div>
          <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
            <span>
              {coordinate.degree ? DEGREE_DESCRIPTIONS[coordinate.degree] : 'Chromatic Fret'}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="font-mono text-zinc-400">{coordinate.frequency} Hz</span>
            {roleInChordOrScale && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="text-amber-400 font-medium">{roleInChordOrScale}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons: Audio Pluck & Octave GPS */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => playFretAudio(coordinate.pitchWithOctave)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-semibold transition-all shadow-sm"
        >
          <Volume2 className="w-3.5 h-3.5 text-amber-400" />
          Hear Pluck
        </button>

        <button
          onClick={() =>
            setHighlightedOctaveNote(isOctaveGPSActive ? null : coordinate.note)
          }
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-sm ${
            isOctaveGPSActive
              ? 'bg-purple-950/80 border-purple-500 text-purple-300 ring-1 ring-purple-400'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border-zinc-700'
          }`}
        >
          <Navigation className="w-3.5 h-3.5 text-purple-400" />
          {isOctaveGPSActive ? 'GPS Active' : 'Octave GPS'}
        </button>
      </div>
    </div>
  );
};
