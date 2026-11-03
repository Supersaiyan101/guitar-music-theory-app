'use client';

import React from 'react';
import { useTheoryStore } from '@/store/useTheoryStore';
import { CagedShape, ThreeNpsShape, TriadStringSet } from '@/types/theory';
import { CAGED_COLORS, THREE_NPS_MODES } from '@/lib/theory/overlayMath';
import { Sparkles, Layers, ArrowRight, CornerRightUp, Eye, ZoomIn } from 'lucide-react';

export const OverlayControls: React.FC = () => {
  const {
    activeOverlay,
    cagedShape,
    setCagedShape,
    cagedShowAll,
    setCagedShowAll,
    threeNpsShape,
    setThreeNpsShape,
    triadStringSet,
    setTriadStringSet,
    fretRange,
    setFretRange,
  } = useTheoryStore();

  if (activeOverlay === 'none') return null;

  return (
    <div className="flex flex-col gap-2.5 bg-gradient-to-r from-purple-950/40 via-zinc-950/90 to-purple-950/40 border border-purple-800/40 p-3 rounded-xl shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Title & Description of Current Overlay */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            {activeOverlay === 'caged' && 'CAGED System Navigator'}
            {activeOverlay === 'three_nps' && '3-Notes-Per-String Modal Engine'}
            {activeOverlay === 'diagonal_highway' && 'The Diagonal Pentatonic Highway'}
            {activeOverlay === 'bb_king_box' && 'B.B. King Sweet-Spot Box'}
            {activeOverlay === 'albert_king_box' && 'Albert King High-Register Cry Box'}
            {activeOverlay === 'triads' && 'Movable 3-String Triad Inversions'}
          </span>
        </div>

        {/* Quick Zoom into Active Box */}
        <button
          onClick={() => setFretRange(fretRange === 'box_focus' ? 'full' : 'box_focus')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all border ${
            fretRange === 'box_focus'
              ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
              : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white'
          }`}
          title="Zoom camera directly onto this soloing box"
        >
          <ZoomIn className="w-3.5 h-3.5" />
          <span>{fretRange === 'box_focus' ? 'Zoomed in Box' : 'Zoom into Box'}</span>
        </button>
      </div>

      {/* Sub-toolbar: CAGED Shapes */}
      {activeOverlay === 'caged' && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-purple-900/40">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-zinc-400">Select Shape:</span>
            <div className="flex items-center gap-1 bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800">
              {(['C', 'A', 'G', 'E', 'D'] as CagedShape[]).map((shape) => {
                const isSelected = cagedShape === shape && !cagedShowAll;
                const color = CAGED_COLORS[shape];
                return (
                  <button
                    key={shape}
                    onClick={() => {
                      setCagedShape(shape);
                      if (cagedShowAll) setCagedShowAll(false);
                    }}
                    className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                      isSelected
                        ? 'text-white shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: color.stroke, border: `1px solid ${color.stroke}` }
                        : {}
                    }
                  >
                    {shape}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggle All 5 Interlocking */}
          <button
            onClick={() => setCagedShowAll(!cagedShowAll)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
              cagedShowAll
                ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Show All 5 Interlocking</span>
          </button>
        </div>
      )}

      {/* Sub-toolbar: 3NPS Modes */}
      {activeOverlay === 'three_nps' && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-purple-900/40">
          <span className="text-xs font-semibold text-zinc-400">3NPS Modal Shape:</span>
          <div className="flex flex-wrap items-center gap-1">
            {([1, 2, 3, 4, 5, 6, 7] as ThreeNpsShape[]).map((idx) => {
              const isSelected = threeNpsShape === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setThreeNpsShape(idx)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {THREE_NPS_MODES[idx]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-toolbar: Diagonal Highway Info */}
      {activeOverlay === 'diagonal_highway' && (
        <div className="flex items-center gap-3 text-xs text-emerald-300/90 pt-1 border-t border-emerald-900/40">
          <div className="flex items-center gap-1.5">
            <ArrowRight className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Continuous 2-notes-per-string highway. Slide on <strong>String 5</strong> (Box 5→1), <strong>String 3</strong> (Box 1→2), and <strong>String 1</strong> (Box 2→3).</span>
          </div>
        </div>
      )}

      {/* Sub-toolbar: B.B. King Box Info */}
      {activeOverlay === 'bb_king_box' && (
        <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-purple-900/40">
          <div className="flex items-center gap-1.5 text-red-300">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Anchor: <strong>Root on String 2</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-300">
            <CornerRightUp className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>Signature Bend: <strong>Major 6th on String 1</strong> (Bend to Root)</span>
          </div>
          <div className="flex items-center gap-1.5 text-sky-300">
            <span>Slide: <strong>Major 3rd slip on String 3</strong></span>
          </div>
        </div>
      )}

      {/* Sub-toolbar: Albert King Box Info */}
      {activeOverlay === 'albert_king_box' && (
        <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-purple-900/40">
          <div className="flex items-center gap-1.5 text-red-300">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>High Anchor: <strong>Root on String 1</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-orange-300">
            <CornerRightUp className="w-3.5 h-3.5 text-orange-400 animate-bounce" />
            <span>Signature Cry: <strong>1.5-Step Overbend on String 2 (♭7 → ♭9)</strong></span>
          </div>
        </div>
      )}

      {/* Sub-toolbar: Movable Triad String Sets */}
      {activeOverlay === 'triads' && (
        <div className="flex items-center gap-2 pt-1 border-t border-purple-900/40">
          <span className="text-xs font-semibold text-zinc-400">String Set:</span>
          <div className="flex items-center gap-1.5 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
            {[
              { id: '123', label: 'Strings 1-2-3 (Lead / Melodic Fills)' },
              { id: '234', label: 'Strings 2-3-4 (Hendrix / R&B Fills)' },
              { id: '345', label: 'Strings 3-4-5 (Rhythm Body)' },
            ].map((ts) => (
              <button
                key={ts.id}
                onClick={() => setTriadStringSet(ts.id as TriadStringSet)}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  triadStringSet === ts.id
                    ? 'bg-amber-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {ts.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
