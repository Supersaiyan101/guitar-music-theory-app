'use client';

import React, { useState } from 'react';
import { useTheoryStore, SavedLick } from '@/store/useTheoryStore';
import { soundEngine } from '@/lib/audio/soundEngine';

export const LickVault: React.FC = () => {
  const {
    isLickVaultOpen,
    setIsLickVaultOpen,
    savedLicks,
    removeSavedLick,
    loadSavedLick,
    setFretRange,
  } = useTheoryStore();

  const [searchFilter, setSearchFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isLickVaultOpen) return null;

  const filteredLicks = savedLicks.filter((lick) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      lick.title.toLowerCase().includes(q) ||
      lick.activeChord.toLowerCase().includes(q) ||
      lick.targetNote.toLowerCase().includes(q) ||
      lick.heroMove.toLowerCase().includes(q) ||
      lick.persona.toLowerCase().includes(q)
    );
  });

  const handleSpotlight = (lick: SavedLick) => {
    loadSavedLick(lick);
    setFretRange('box_focus');
  };

  const handlePlayAudio = async (lick: SavedLick) => {
    const fromPitch = lick.progression[0]?.replace(/[^A-Ga-g#b]/g, '') || 'G';
    await soundEngine.playVoiceLeadingResolution(fromPitch, lick.targetNote);
  };

  const handleCopyLick = (lick: SavedLick) => {
    const text = `[Guitar Theory Kingdom Lick Vault]\nMove: ${lick.title}\nChord: ${lick.activeChord} (${lick.romanNumeral})\nTarget: ${lick.targetNote} on String ${lick.targetCoordinates[0]?.string}, Fret ${lick.targetCoordinates[0]?.fret}\nHero Move: ${lick.heroMove}\nWhy: ${lick.theMusicalWhy}`;
    navigator.clipboard.writeText(text);
    setCopiedId(lick.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportAll = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedLicks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'guitar_theory_lick_vault.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getPersonaColor = (persona: string) => {
    switch (persona) {
      case 'blues_rock':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'jazz_fusion':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
      case 'neo_soul':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📁</span>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                Personal Lick Vault
              </h2>
              <p className="text-xs text-zinc-400">
                Your saved voice-leading unlocks, target frets & persona moves ({savedLicks.length})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {savedLicks.length > 0 && (
              <button
                type="button"
                onClick={handleExportAll}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition-all flex items-center gap-1"
                title="Export vault as JSON"
              >
                <span>💾</span>
                <span>Export</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsLickVaultOpen(false)}
              className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-sm transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter Input */}
        {savedLicks.length > 0 && (
          <div className="p-3 border-b border-zinc-800/80 bg-zinc-900/60">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search by chord (e.g. Fm, G7), target note, or persona..."
              className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-sky-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
            />
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedLicks.length === 0 ? (
            <div className="text-center py-12 px-4">
              <span className="text-4xl block mb-2">🎸</span>
              <h3 className="text-sm font-bold text-zinc-300">Your Lick Vault is Empty</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                While consulting the AI Coach on any harmonic chord transition, click the{' '}
                <span className="text-amber-400 font-bold">★ Save Lick</span> button to store the
                target fret, hero move, and voice-leading analysis here!
              </p>
            </div>
          ) : filteredLicks.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 text-xs">
              No saved licks matching &ldquo;{searchFilter}&rdquo;
            </div>
          ) : (
            filteredLicks.map((lick) => {
              const primaryCoord = lick.targetCoordinates[0];

              return (
                <div
                  key={lick.id}
                  className="bg-zinc-950/80 border border-zinc-800/90 hover:border-zinc-700 rounded-xl p-3.5 flex flex-col gap-2 transition-all shadow-md"
                >
                  {/* Top Row: Title, Persona Pill, Date */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-black text-white">{lick.title}</h4>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${getPersonaColor(
                            lick.persona
                          )}`}
                        >
                          {lick.persona.replace('_', ' ')}
                        </span>
                        {lick.romanNumeral && (
                          <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded border border-zinc-700">
                            {lick.romanNumeral}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        Saved {lick.savedAt} • Key: {lick.key}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {primaryCoord && (
                        <button
                          type="button"
                          onClick={() => handleSpotlight(lick)}
                          title="Spotlight fret coordinates on fretboard"
                          className="px-2 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[11px] font-bold rounded border border-sky-400/30 flex items-center gap-1 transition-all"
                        >
                          <span>🎯</span>
                          <span>Spotlight</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handlePlayAudio(lick)}
                        title="Play audio resolution"
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold rounded border border-zinc-700 flex items-center gap-1 transition-all"
                      >
                        <span>🎧</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyLick(lick)}
                        title="Copy lick summary"
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold rounded border border-zinc-700 flex items-center gap-1 transition-all"
                      >
                        <span>{copiedId === lick.id ? '✓' : '📋'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => removeSavedLick(lick.id)}
                        title="Delete from vault"
                        className="px-1.5 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-400 text-[11px] font-bold rounded border border-red-800/40 transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Hero Move and Coordinates */}
                  {lick.heroMove && (
                    <div className="bg-zinc-900/80 rounded-lg p-2 border border-zinc-800">
                      <p className="text-xs font-semibold text-emerald-300">
                        ⚡ {lick.heroMove}
                      </p>
                      {primaryCoord && (
                        <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                          📍 String {primaryCoord.string}, Fret {primaryCoord.fret} ({lick.targetNote})
                        </p>
                      )}
                    </div>
                  )}

                  {/* Musical Why explanation */}
                  {lick.theMusicalWhy && (
                    <p className="text-[11px] text-zinc-400 line-clamp-2">
                      {lick.theMusicalWhy}
                    </p>
                  )}

                  {/* User Note if present */}
                  {lick.userNotes && (
                    <p className="text-[10px] text-sky-400/90 italic font-mono bg-sky-950/20 px-2 py-1 rounded border border-sky-900/30">
                      📝 {lick.userNotes}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
