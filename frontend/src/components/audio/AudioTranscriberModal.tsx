'use client';

import React, { useState, useRef } from 'react';
import { useTheoryStore } from '@/store/useTheoryStore';
import { audioApi, TranscribedLickResponse, TranscribedProgressionResponse } from '@/lib/api/audioClient';
import { soundEngine } from '@/lib/audio/soundEngine';
import { SongProgression } from '@/types/theory';

export const AudioTranscriberModal: React.FC = () => {
  const {
    isAudioModalOpen,
    setIsAudioModalOpen,
    loadProgression,
    setHighlightedCoachTarget,
    saveCurrentLick,
    setIsCoachOpen,
  } = useTheoryStore();

  const [inputMode, setInputMode] = useState<'upload' | 'record'>('upload');
  const [transcribeTarget, setTranscribeTarget] = useState<'lick' | 'progression'>('lick');
  const [targetZone, setTargetZone] = useState<number>(7);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Results State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lickResult, setLickResult] = useState<TranscribedLickResponse | null>(null);
  const [progResult, setProgResult] = useState<TranscribedProgressionResponse | null>(null);
  const [activeTabNoteIndex, setActiveTabNoteIndex] = useState<number | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  if (!isAudioModalOpen) return null;

  // File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setAudioUrl(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  // Browser Microphone Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const file = new File([audioBlob], 'guitar_recording.wav', { type: 'audio/wav' });
        setSelectedFile(file);
        setAudioUrl(URL.createObjectURL(audioBlob));
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setErrorMsg('Microphone access denied. Please allow microphone permissions or upload an audio file.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  // Run Transcription
  const handleTranscribe = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select or record an audio file first.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setLickResult(null);
    setProgResult(null);

    try {
      if (transcribeTarget === 'lick') {
        const res = await audioApi.transcribeLick(selectedFile, targetZone);
        if (!res) throw new Error('Transcription returned no data.');
        setLickResult(res);
      } else {
        const res = await audioApi.transcribeProgression(selectedFile, 120.0);
        if (!res) throw new Error('Progression transcription returned no data.');
        setProgResult(res);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Transcription failed. Please check backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Playback single transcribed note on fretboard
  const handlePlayNote = async (note: any, idx: number) => {
    setActiveTabNoteIndex(idx);
    if (note.tab_position) {
      setHighlightedCoachTarget({
        string: note.tab_position.string,
        fret: note.tab_position.fret,
        note: note.pitch_name,
      });
    }
    await soundEngine.playNote(note.pitch_name);
  };

  // Load transcribed progression into timeline
  const handleLoadProgression = () => {
    if (!progResult) return;

    const newSong: SongProgression = {
      id: `transcribed_${Date.now()}`,
      title: `Audio Ingestion (${progResult.detected_key} ${progResult.detected_mode})`,
      artist: 'You (Transcribed via basic-pitch)',
      genre: 'classic_rock',
      difficulty: 'intermediate',
      key: progResult.detected_key,
      mode: (progResult.detected_mode === 'minor' ? 'minor' : 'major'),
      default_tempo: progResult.detected_bpm,
      time_signature: '4/4',
      chords_sequence: progResult.chords_sequence,
      chord_durations: progResult.chords_sequence.map(() => 4),
      bars: progResult.bars,
      soloing_tip: progResult.harmonic_summary,
    };

    loadProgression(newSong);
    setIsAudioModalOpen(false);
    setIsCoachOpen(true);
  };

  // Save transcribed lick to personal vault
  const handleSaveToVault = () => {
    if (!lickResult) return;
    saveCurrentLick(`Transcribed Lick: ${lickResult.primary_caged_box || 'Lead'} Box (${lickResult.hand_position_zone})`);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🎙️</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white uppercase tracking-wider">
                  Audio Ingestion & Polyphonic Transcriber
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Spotify basic-pitch ONNX
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Upload guitar audio or record directly to solve tablature & harmonic flight-paths
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAudioModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-sm transition-all"
          >
            ✕
          </button>
        </div>

        {/* Configuration Toolbar */}
        <div className="p-3 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between gap-2 flex-wrap text-xs">
          {/* Target Mode */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => setTranscribeTarget('lick')}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                transcribeTarget === 'lick'
                  ? 'bg-sky-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🎸 Lead Lick (Tab & Bends)
            </button>
            <button
              type="button"
              onClick={() => setTranscribeTarget('progression')}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                transcribeTarget === 'progression'
                  ? 'bg-purple-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🎵 Chord Progression
            </button>
          </div>

          {/* Fret Target Zone (for licks) */}
          {transcribeTarget === 'lick' && (
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 text-[11px] font-mono">Fret Anchor:</span>
              <select
                value={targetZone}
                onChange={(e) => setTargetZone(Number(e.target.value))}
                className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
              >
                <option value={3}>Frets 1–4 (Cowboy / Open)</option>
                <option value={7}>Frets 5–8 (Mid-Neck / Box 1)</option>
                <option value={10}>Frets 9–12 (Upper Lead)</option>
                <option value={15}>Frets 14–17 (High Solo)</option>
              </select>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Input Method Switcher */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                inputMode === 'upload'
                  ? 'bg-zinc-800 border-zinc-600 text-white'
                  : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>📁</span>
              <span>Upload Audio File</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode('record')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                inputMode === 'record'
                  ? 'bg-red-950/40 border-red-500/50 text-red-300'
                  : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>🔴</span>
              <span>Record Live Guitar</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          {inputMode === 'upload' ? (
            <div className="border-2 border-dashed border-zinc-800 hover:border-sky-500/60 rounded-xl p-6 text-center transition-all bg-zinc-950/40 flex flex-col items-center justify-center gap-2">
              <span className="text-3xl">🎸</span>
              <p className="text-xs font-bold text-zinc-200">
                Drag and drop your guitar audio (.wav, .mp3, .m4a)
              </p>
              <p className="text-[10px] text-zinc-500">Supports polyphonic chords, fingerpicking, and bends</p>
              <label className="mt-2 px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg border border-zinc-700 cursor-pointer transition-all shadow-sm">
                Browse Files
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {selectedFile && (
                <p className="text-xs font-mono text-emerald-400 mt-2 font-semibold">
                  ✓ Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>
          ) : (
            /* Live Record Panel */
            <div className="border border-zinc-800 rounded-xl p-6 text-center bg-zinc-950/50 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-zinc-600'}`} />
                <span className="text-xs font-mono font-bold text-zinc-300">
                  {isRecording ? `Recording... 00:${recordingSeconds.toString().padStart(2, '0')}` : 'Ready to record guitar'}
                </span>
              </div>

              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  <span>🔴</span> Start Recording
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-5 py-2 bg-zinc-700 hover:bg-zinc-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  <span>⏹</span> Stop & Transcribe
                </button>
              )}
            </div>
          )}

          {/* Audio Player Preview */}
          {audioUrl && (
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-3">
              <audio controls src={audioUrl} className="w-full h-8" />
            </div>
          )}

          {/* Transcribe Trigger Button */}
          {selectedFile && !isLoading && (
            <button
              type="button"
              onClick={handleTranscribe}
              className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-purple-600 hover:opacity-90 active:scale-[0.99] text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>⚡</span> Run Neural Transcription
            </button>
          )}

          {/* Loading Animation */}
          {isLoading && (
            <div className="py-8 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-sky-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono text-sky-400 font-bold">
                Running basic-pitch ONNX inference & solving Viterbi guitar tabs...
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800/60 text-red-300 text-xs">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Lead Lick Results */}
          {lickResult && (
            <div className="space-y-3 bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white uppercase">Transcribed Guitar Tab</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      CAGED Box {lickResult.primary_caged_box || 'G'} ({lickResult.hand_position_zone})
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    {lickResult.notes.length} notes transcribed • Key: {lickResult.detected_key} {lickResult.detected_mode}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveToVault}
                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold rounded-lg border border-amber-500/40 flex items-center gap-1 transition-all"
                >
                  <span>{savedToast ? '★' : '☆'}</span>
                  <span>{savedToast ? 'Saved!' : 'Save to Vault'}</span>
                </button>
              </div>

              {/* Tablature Horizontal Strip */}
              <div className="overflow-x-auto pb-2 flex gap-1.5 scrollbar-thin">
                {lickResult.notes.map((note, idx) => {
                  const pos = note.tab_position;
                  const isPlayingThis = activeTabNoteIndex === idx;

                  return (
                    <button
                      key={`tab-${idx}`}
                      type="button"
                      onClick={() => handlePlayNote(note, idx)}
                      className={`min-w-[65px] p-2 rounded-lg border flex flex-col items-center gap-1 transition-all text-center ${
                        isPlayingThis
                          ? 'bg-sky-500 text-zinc-950 font-black border-white shadow-lg'
                          : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-200'
                      }`}
                    >
                      <span className="text-xs font-mono font-bold">{note.pitch_name}</span>
                      {pos && (
                        <div className="text-[10px] font-mono">
                          <p>Str {pos.string}</p>
                          <p className="font-bold text-amber-400">Fret {pos.fret}</p>
                        </div>
                      )}
                      {note.articulation !== 'normal' && (
                        <span className="text-[9px] font-mono uppercase bg-purple-950/60 text-purple-300 px-1 rounded border border-purple-800">
                          {note.articulation.replace('bend_', 'b')}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Progression Results */}
          {progResult && (
            <div className="space-y-3 bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div>
                  <h3 className="text-xs font-black text-white uppercase">Transcribed Progression</h3>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    Key: <strong className="text-sky-400">{progResult.detected_key} {progResult.detected_mode}</strong> • {progResult.chords_sequence.length} Chords
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLoadProgression}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-lg shadow transition-all flex items-center gap-1.5"
                >
                  <span>🚀</span> Ingest into Flight-Path
                </button>
              </div>

              {/* Chord Progression Badges */}
              <div className="flex flex-wrap gap-2">
                {progResult.raw_chords.map((chord, idx) => (
                  <div
                    key={`chord-${idx}`}
                    className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-center min-w-[70px]"
                  >
                    <span className="text-xs font-bold text-white block">{chord.chord_symbol}</span>
                    {chord.roman_numeral && (
                      <span className="text-[10px] font-mono text-purple-400">{chord.roman_numeral}</span>
                    )}
                    <span className="text-[9px] font-mono text-zinc-500 block">{chord.duration}s</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-zinc-400 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800 font-sans">
                💡 {progResult.harmonic_summary}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
