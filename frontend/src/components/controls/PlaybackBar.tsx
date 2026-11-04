'use client';

import React, { useMemo } from 'react';
import { useTheoryStore } from '@/store/useTheoryStore';
import {
  generateFretboardMatrix,
  getHarmonicProfile,
  noteToPitchClass,
  pitchToMidi,
} from '@/lib/theory/pitchMath';
import { soundEngine } from '@/lib/audio/soundEngine';
import { TonePreset, PlayDirection } from '@/types/theory';
import {
  Play,
  Square,
  Radio,
  Sliders,
  Volume2,
  Guitar,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';

export const PlaybackBar: React.FC = () => {
  const {
    currentKey,
    tuning,
    activeScale,
    activeChord,
    accidentalMode,
    playbackBpm,
    setPlaybackBpm,
    isPlaying,
    setIsPlaying,
    setActivePlayingPin,
    isDroneActive,
    toggleDrone,
    tonePreset,
    setTonePreset,
    playDirection,
    setPlayDirection,
    stopPlayback,
  } = useTheoryStore();

  const matrix = useMemo(() => {
    return generateFretboardMatrix(tuning, currentKey, accidentalMode);
  }, [tuning, currentKey, accidentalMode]);

  const harmonicProfile = useMemo(() => {
    return getHarmonicProfile(currentKey, activeScale, activeChord, accidentalMode);
  }, [currentKey, activeScale, activeChord, accidentalMode]);

  // Extract and sequence playable notes
  const getPlayableSequence = (chordTonesOnly = false) => {
    const allNotes: Array<{
      pitch: string;
      stringNumber: number;
      fretNumber: number;
      midi: number;
    }> = [];

    // Gather notes from register (frets 0 to 12 for clean melodic demonstration)
    matrix.forEach((stringFrets) => {
      stringFrets.forEach((coord) => {
        if (coord.fretNumber > 12) return; // Keep in comfortable 1-octave position

        const pc = noteToPitchClass(coord.note);
        const info = harmonicProfile.get(pc);
        if (!info) return;

        if (chordTonesOnly && !info.isChordTone) return;

        const midi = pitchToMidi(coord.pitchWithOctave);
        allNotes.push({
          pitch: coord.pitchWithOctave,
          stringNumber: coord.stringNumber,
          fretNumber: coord.fretNumber,
          midi,
        });
      });
    });

    // Deduplicate by pitch to create a clean ascending ladder
    const uniqueByMidi = new Map<number, { pitch: string; stringNumber: number; fretNumber: number; midi: number }>();
    allNotes.forEach((n) => {
      if (!uniqueByMidi.has(n.midi)) {
        uniqueByMidi.set(n.midi, n);
      }
    });

    let sorted = Array.from(uniqueByMidi.values()).sort((a, b) => a.midi - b.midi);

    if (playDirection === 'descending') {
      sorted.reverse();
    } else if (playDirection === 'both') {
      const reversed = [...sorted].reverse().slice(1);
      sorted = sorted.concat(reversed);
    }

    return sorted;
  };

  // Play Scale Sequence
  const handlePlayScale = async () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    const sequence = getPlayableSequence(false);
    if (sequence.length === 0) return;

    setIsPlaying(true);
    await soundEngine.playSequenceWithTracking(
      sequence,
      playbackBpm,
      (pin) => setActivePlayingPin(pin),
      () => {
        setIsPlaying(false);
        setActivePlayingPin(null);
      }
    );
  };

  // Play Arpeggio Sequence (Chord Tones Only)
  const handlePlayArpeggio = async () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    const sequence = getPlayableSequence(true);
    if (sequence.length === 0) return;

    setIsPlaying(true);
    await soundEngine.playSequenceWithTracking(
      sequence,
      playbackBpm,
      (pin) => setActivePlayingPin(pin),
      () => {
        setIsPlaying(false);
        setActivePlayingPin(null);
      }
    );
  };

  // Strum Voicing with Natural Pick Delay
  const handleStrumVoicing = async () => {
    if (isPlaying) stopPlayback();

    // Pick 1 note per string across the chord tones
    const strumNotes: string[] = [];
    matrix.forEach((stringFrets) => {
      const chordFret = stringFrets.find((c) => {
        if (c.fretNumber > 7) return false;
        const pc = noteToPitchClass(c.note);
        return harmonicProfile.get(pc)?.isChordTone;
      });
      if (chordFret) {
        strumNotes.push(chordFret.pitchWithOctave);
      }
    });

    if (strumNotes.length > 0) {
      await soundEngine.playChord(strumNotes);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950 p-3 rounded-2xl border border-zinc-800 shadow-xl">
      {/* 1. Playback Run Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Play/Stop Scale Button */}
        <button
          onClick={handlePlayScale}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
            isPlaying
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
          }`}
        >
          {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isPlaying ? 'Stop' : 'Play Scale'}</span>
        </button>

        {/* Play Arpeggio Button */}
        <button
          onClick={handlePlayArpeggio}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-amber-300 hover:text-white border border-zinc-800 hover:border-amber-500/50 transition-all shadow-sm"
          title="Play chord tones in sequence (1 - 3 - 5 - 7)"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Arpeggio</span>
        </button>

        {/* Strum Voicing Button */}
        <button
          onClick={handleStrumVoicing}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-sky-300 hover:text-white border border-zinc-800 hover:border-sky-500/50 transition-all shadow-sm"
          title="Strum chord tones with natural 35ms pick sweep"
        >
          <Guitar className="w-3.5 h-3.5 text-sky-400" />
          <span>Strum Voicing</span>
        </button>
      </div>

      {/* 2. Tonic Drone Pad (Ear Training Supercharger) */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleDrone}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
            isDroneActive
              ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-md shadow-amber-950/50 ring-1 ring-amber-400'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
          title="Continuous tonic root pad for practicing modal tension & resolution"
        >
          <Radio className={`w-3.5 h-3.5 ${isDroneActive ? 'text-amber-400 animate-pulse' : 'text-zinc-500'}`} />
          <span>Root Drone ({currentKey})</span>
          {isDroneActive && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>
      </div>

      {/* 3. Tempo, Direction & Tone Presets */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Playhead Direction */}
        <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
          <button
            onClick={() => setPlayDirection('ascending')}
            className={`p-1.5 rounded transition-all ${
              playDirection === 'ascending' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Ascending (Low to High)"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPlayDirection('descending')}
            className={`p-1.5 rounded transition-all ${
              playDirection === 'descending' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Descending (High to Low)"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPlayDirection('both')}
            className={`p-1.5 rounded transition-all ${
              playDirection === 'both' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Up & Down"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tone Preset: Electric Clean vs Acoustic Steel */}
        <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-xs">
          <button
            onClick={() => setTonePreset('electric_clean')}
            className={`px-2.5 py-1 rounded font-semibold transition-all ${
              tonePreset === 'electric_clean'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Electric
          </button>
          <button
            onClick={() => setTonePreset('acoustic_steel')}
            className={`px-2.5 py-1 rounded font-semibold transition-all ${
              tonePreset === 'acoustic_steel'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Acoustic
          </button>
        </div>

        {/* BPM Stepper */}
        <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg text-xs">
          <Sliders className="w-3 h-3 text-zinc-500" />
          <span className="font-bold text-zinc-300">{playbackBpm}</span>
          <span className="text-[10px] text-zinc-500 font-mono">BPM</span>
        </div>
      </div>
    </div>
  );
};

