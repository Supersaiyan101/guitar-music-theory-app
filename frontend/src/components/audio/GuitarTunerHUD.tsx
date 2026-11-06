'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LivePitchTracker, PitchDetectionResult } from '@/lib/audio/pitchDetector';
import { useTheoryStore } from '@/store/useTheoryStore';

interface TuningPreset {
  name: string;
  notes: { stringNum: number; note: string; freq: number }[];
}

const TUNING_PRESETS: TuningPreset[] = [
  {
    name: 'Standard (E A D G B E)',
    notes: [
      { stringNum: 6, note: 'E2', freq: 82.41 },
      { stringNum: 5, note: 'A2', freq: 110.0 },
      { stringNum: 4, note: 'D3', freq: 146.83 },
      { stringNum: 3, note: 'G3', freq: 196.0 },
      { stringNum: 2, note: 'B3', freq: 246.94 },
      { stringNum: 1, note: 'E4', freq: 329.63 },
    ],
  },
  {
    name: 'Drop D (D A D G B E)',
    notes: [
      { stringNum: 6, note: 'D2', freq: 73.42 },
      { stringNum: 5, note: 'A2', freq: 110.0 },
      { stringNum: 4, note: 'D3', freq: 146.83 },
      { stringNum: 3, note: 'G3', freq: 196.0 },
      { stringNum: 2, note: 'B3', freq: 246.94 },
      { stringNum: 1, note: 'E4', freq: 329.63 },
    ],
  },
  {
    name: 'Half-Step Down / Eb',
    notes: [
      { stringNum: 6, note: 'D#2', freq: 77.78 },
      { stringNum: 5, note: 'G#2', freq: 103.83 },
      { stringNum: 4, note: 'C#3', freq: 138.59 },
      { stringNum: 3, note: 'F#3', freq: 185.0 },
      { stringNum: 2, note: 'A#3', freq: 233.08 },
      { stringNum: 1, note: 'D#4', freq: 311.13 },
    ],
  },
  {
    name: 'DADGAD (Celtic / Fingerstyle)',
    notes: [
      { stringNum: 6, note: 'D2', freq: 73.42 },
      { stringNum: 5, note: 'A2', freq: 110.0 },
      { stringNum: 4, note: 'D3', freq: 146.83 },
      { stringNum: 3, note: 'G3', freq: 196.0 },
      { stringNum: 2, note: 'A3', freq: 220.0 },
      { stringNum: 1, note: 'D4', freq: 293.66 },
    ],
  },
];

export const GuitarTunerHUD: React.FC = () => {
  const { setLiveMicNote, evaluateLiveMicNote } = useTheoryStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentPitch, setCurrentPitch] = useState<PitchDetectionResult | null>(null);
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  const trackerRef = useRef<LivePitchTracker | null>(null);
  const lastGradedTimeRef = useRef<number>(0);

  const activePreset = TUNING_PRESETS[selectedPresetIdx];

  const handleToggleListening = async () => {
    if (isListening) {
      trackerRef.current?.stop();
      setIsListening(false);
      setCurrentPitch(null);
      setLiveMicNote(null);
    } else {
      setMicError(null);
      if (!trackerRef.current) {
        trackerRef.current = new LivePitchTracker(0.015);
      }
      const ok = await trackerRef.current.start((result) => {
        setCurrentPitch(result);
        setLiveMicNote(result);

        if (result) {
          const now = Date.now();
          if (now - lastGradedTimeRef.current > 700) {
            evaluateLiveMicNote(result.pitchClass);
            lastGradedTimeRef.current = now;
          }
        }
      });
      if (ok) {
        setIsListening(true);
      } else {
        setMicError('Could not access microphone. Please check browser permissions.');
      }
    }
  };

  useEffect(() => {
    return () => {
      trackerRef.current?.stop();
      setLiveMicNote(null);
    };
  }, [setLiveMicNote]);

  // Determine closest string in active tuning
  const closestString = currentPitch
    ? activePreset.notes.reduce((closest, curr) => {
        const diffCurr = Math.abs(curr.freq - currentPitch.frequency);
        const diffClosest = Math.abs(closest.freq - currentPitch.frequency);
        return diffCurr < diffClosest ? curr : closest;
      }, activePreset.notes[0])
    : null;

  return (
    <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl overflow-hidden shadow-lg transition-all">
      {/* Tuner Header Toggle */}
      <div className="p-3 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎛️</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Precision Strobe Guitar Tuner
              </h3>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                60 FPS Live YIN
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono">
              Real-time cents offset & string detection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleListening}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
              isListening
                ? 'bg-red-500 hover:bg-red-400 text-white animate-pulse'
                : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
            }`}
          >
            <span>{isListening ? '⏹ Mute Mic' : '🎤 Listen to Guitar'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold border border-zinc-700"
          >
            {isOpen ? '▲ Hide' : '▼ Expand'}
          </button>
        </div>
      </div>

      {/* Tuner Body */}
      {isOpen && (
        <div className="p-4 space-y-4 animate-fadeIn">
          {/* Preset Selector */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-mono text-zinc-400">Tuning Preset:</span>
            <div className="flex gap-1.5 flex-wrap">
              {TUNING_PRESETS.map((preset, idx) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setSelectedPresetIdx(idx)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                    selectedPresetIdx === idx
                      ? 'bg-sky-500/20 text-sky-300 border-sky-400/50'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {preset.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Main Needle / Strobe Display Area */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
            {currentPitch ? (
              <div className="flex flex-col items-center gap-2 w-full max-w-sm">
                {/* Big Note Badge */}
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-5xl font-black font-mono tracking-tight transition-colors ${
                      currentPitch.isInTune
                        ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]'
                        : Math.abs(currentPitch.cents) < 15
                        ? 'text-sky-300'
                        : 'text-amber-400'
                    }`}
                  >
                    {currentPitch.pitchClass}
                  </span>
                  <span className="text-lg font-mono text-zinc-400 font-bold">
                    {currentPitch.octave}
                  </span>
                </div>

                {/* Frequency & Status text */}
                <div className="text-center font-mono">
                  <p className="text-xs text-zinc-400 font-bold">
                    {currentPitch.frequency} Hz •{' '}
                    <span
                      className={`font-black ${
                        currentPitch.isInTune
                          ? 'text-emerald-400'
                          : currentPitch.cents < 0
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {currentPitch.isInTune
                        ? 'PERFECT (IN TUNE)'
                        : currentPitch.cents < 0
                        ? `${currentPitch.cents}c (FLAT 🡒 TUNE UP)`
                        : `+${currentPitch.cents}c (SHARP 🡐 TUNE DOWN)`}
                    </span>
                  </p>
                </div>

                {/* Strobe Cents Arc / Needle Bar */}
                <div className="w-full mt-3">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1 px-1">
                    <span>-50c</span>
                    <span>-25c</span>
                    <span className="text-emerald-400 font-bold">0c</span>
                    <span>+25c</span>
                    <span>+50c</span>
                  </div>

                  <div className="w-full h-3 bg-zinc-950 rounded-full border border-zinc-800 relative overflow-hidden flex items-center">
                    {/* Center in-tune notch */}
                    <div className="absolute left-1/2 -translate-x-1/2 w-1 h-full bg-emerald-500/80 z-10" />

                    {/* Dynamic Moving Needle */}
                    <div
                      className={`absolute top-0 bottom-0 w-2.5 rounded-full transition-all duration-75 shadow-md ${
                        currentPitch.isInTune
                          ? 'bg-emerald-400 shadow-emerald-500/80'
                          : 'bg-sky-400 shadow-sky-500/80'
                      }`}
                      style={{
                        left: `calc(50% + ${(currentPitch.cents / 50) * 45}%)`,
                        transform: 'translateX(-50%)',
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : isListening ? (
              <div className="text-center py-4 space-y-2">
                <span className="w-3 h-3 rounded-full bg-sky-400 animate-ping inline-block" />
                <p className="text-xs font-mono text-zinc-400">
                  Listening... Pluck any guitar string.
                </p>
              </div>
            ) : (
              <div className="text-center py-4 space-y-1">
                <p className="text-xs text-zinc-400 font-semibold">
                  Click &ldquo;Listen to Guitar&rdquo; to tune your physical instrument.
                </p>
                <p className="text-[10px] text-zinc-500 font-mono">
                  Sub-30ms real-time pitch detection via WebAudio YIN
                </p>
              </div>
            )}
          </div>

          {/* String Badges for Current Tuning */}
          <div className="grid grid-cols-6 gap-1.5 text-center">
            {activePreset.notes.map((strNote) => {
              const isTargetString =
                closestString && closestString.stringNum === strNote.stringNum && !!currentPitch;

              return (
                <div
                  key={`str-${strNote.stringNum}`}
                  className={`p-2 rounded-lg border transition-all ${
                    isTargetString
                      ? currentPitch?.isInTune
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-black ring-1 ring-emerald-500/50'
                        : 'bg-sky-950/60 border-sky-500 text-sky-300 font-black ring-1 ring-sky-500/50'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <span className="text-[10px] font-mono block text-zinc-500">
                    Str {strNote.stringNum}
                  </span>
                  <span className="text-xs font-bold block">{strNote.note}</span>
                  <span className="text-[9px] font-mono text-zinc-500 block">
                    {strNote.freq}Hz
                  </span>
                </div>
              );
            })}
          </div>

          {/* Mic Error Alert */}
          {micError && (
            <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-800/60 text-red-300 text-xs">
              ⚠️ {micError}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
