'use client';

import React, { useState } from 'react';
import { useTheoryStore } from '@/store/useTheoryStore';
import { soundEngine } from '@/lib/audio/soundEngine';

export const InstantCardHUD: React.FC = () => {
  const {
    coachInstantCard,
    coachResponse,
    activeProgression,
    currentChordIndex,
    progressionAnalysis,
  } = useTheoryStore();

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const card = coachResponse?.instant_card || coachInstantCard;
  if (!card) return null;

  const currentChord = activeProgression.chords_sequence[currentChordIndex] || 'Chord';
  const currentAnalysis = progressionAnalysis?.chords[currentChordIndex];
  const romanNumeral = currentAnalysis?.roman_numeral || '';

  // Extract fromNote and toNote for audio voice-leading preview
  const handlePlayVoiceLeading = async () => {
    setIsPlayingAudio(true);
    try {
      const match = card.target_degree_motion.match(/([A-G][b#]?)\s*->\s*([A-G][b#]?)/i);
      if (match) {
        await soundEngine.playVoiceLeadingResolution(match[1], match[2]);
      } else if (currentAnalysis?.guide_tones?.[0]) {
        // Fallback: play root then guide tone
        await soundEngine.playVoiceLeadingResolution(
          currentAnalysis.root,
          currentAnalysis.guide_tones[0]
        );
      }
    } finally {
      setTimeout(() => setIsPlayingAudio(false), 800);
    }
  };

  return (
    <div className="bg-gradient-to-r from-sky-950/70 via-zinc-900/90 to-zinc-900/90 border border-sky-500/30 rounded-xl p-3.5 shadow-xl backdrop-blur-md">
      {/* Header Pill & Degree Motion */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
            Instant Insight (&lt;10ms)
          </span>
          <span className="font-mono text-xs font-black text-white bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">
            {currentChord} {romanNumeral && `(${romanNumeral})`}
          </span>
        </div>

        {card.target_degree_motion && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30">
              ⚡ Motion: {card.target_degree_motion}
            </span>
            <button
              onClick={handlePlayVoiceLeading}
              disabled={isPlayingAudio}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                isPlayingAudio
                  ? 'bg-sky-500 text-white scale-95'
                  : 'bg-zinc-800 hover:bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:border-sky-400'
              }`}
              title="Hear the half-step or whole-step voice leading resolution"
            >
              <span>{isPlayingAudio ? '🔊 Playing...' : '🔊 Hear Shift'}</span>
            </button>
          </div>
        )}
      </div>

      {/* The Emotional Vibe */}
      <div className="mb-2">
        <div className="text-[13px] font-semibold text-sky-100 flex items-center gap-2">
          <span className="text-base">✨</span>
          <span>{card.vibe}</span>
        </div>
      </div>

      {/* The Hero Move */}
      <div className="bg-black/30 border border-zinc-800 rounded-lg p-2.5 mb-2.5 flex items-start gap-2.5">
        <span className="text-base leading-none mt-0.5">🎸</span>
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block mb-0.5">
            Hero Move on Fretboard:
          </span>
          <p className="text-xs font-medium text-zinc-200 leading-relaxed">
            {card.hero_move}
          </p>
        </div>
      </div>

      {/* Iconic Twin Songs */}
      {card.twin_songs && card.twin_songs.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-800/80">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 mr-1">
            Famous Twin Tracks:
          </span>
          {card.twin_songs.map((song, idx) => (
            <span
              key={`twin-song-${idx}`}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 shadow-sm"
            >
              🎶 {song}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
