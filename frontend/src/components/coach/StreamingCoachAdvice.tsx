'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheoryStore } from '@/store/useTheoryStore';
import { coachApi, CoachExplainRequest } from '@/lib/api/coachClient';
import { soundEngine } from '@/lib/audio/soundEngine';

const QUICK_PROMPTS = [
  '🎯 Target the money note',
  '🎸 How to voice-lead smoothly?',
  '✨ Why does this chord change work?',
  '🔥 Show me a signature lick',
];

export const StreamingCoachAdvice: React.FC = () => {
  const {
    activeProgression,
    currentChordIndex,
    progressionAnalysis,
    coachPersona,
    coachResponse,
    setCoachResponse,
    setCoachInstantCard,
    isCoachStreaming,
    setIsCoachStreaming,
    streamingText,
    setStreamingText,
    appendStreamingToken,
    saveCurrentLick,
    savedLicks,
    setIsLickVaultOpen,
  } = useTheoryStore();

  const [customQuestion, setCustomQuestion] = useState('');
  const [saveToast, setSaveToast] = useState(false);
  const cancelStreamRef = useRef<(() => void) | null>(null);
  const textEndRef = useRef<HTMLDivElement | null>(null);

  const chords = activeProgression?.chords_sequence || [];
  const currentChord = chords[currentChordIndex] || '';
  const prevChord = chords[(currentChordIndex - 1 + chords.length) % chords.length] || '';
  const analysis = progressionAnalysis?.chords[currentChordIndex];

  // Auto-scroll streaming text into view
  useEffect(() => {
    if (isCoachStreaming && textEndRef.current) {
      textEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [streamingText, isCoachStreaming]);

  // Request explanation from coach
  const triggerCoachExplanation = useCallback(
    (question?: string) => {
      if (cancelStreamRef.current) {
        cancelStreamRef.current();
      }

      setIsCoachStreaming(true);
      setStreamingText('');

      const req: CoachExplainRequest = {
        progression: chords,
        active_chord_index: currentChordIndex,
        from_chord: prevChord,
        to_chord: currentChord,
        key: activeProgression?.key || 'C',
        mode: activeProgression?.mode || 'major',
        persona: coachPersona,
        user_question: question || undefined,
        target_fret_zone: 7,
      };

      const cancel = coachApi.streamExplainTransition(req, {
        onInstantCard: (data) => {
          setCoachInstantCard(data.instant_card);
        },
        onToken: (token) => {
          appendStreamingToken(token);
        },
        onComplete: (resp) => {
          setCoachResponse(resp);
          setCoachInstantCard(resp.instant_card);
          setIsCoachStreaming(false);
        },
        onError: () => {
          setIsCoachStreaming(false);
          // If no streaming text arrived, provide high-value offline advice
          if (!streamingText) {
            setStreamingText(
              `Target ${analysis?.guide_tones?.[0] || 'the 3rd'} over ${currentChord}. Move by half-step from ${prevChord}'s guide tone for clean, vocal voice leading.`
            );
          }
        },
      });

      cancelStreamRef.current = cancel;
    },
    [
      chords,
      currentChordIndex,
      prevChord,
      currentChord,
      activeProgression,
      coachPersona,
      setIsCoachStreaming,
      setStreamingText,
      setCoachInstantCard,
      appendStreamingToken,
      setCoachResponse,
      analysis,
      streamingText,
    ]
  );

  // Auto-fetch if no explanation exists for current state
  useEffect(() => {
    if (!coachResponse && chords.length > 0 && !isCoachStreaming && !streamingText) {
      triggerCoachExplanation();
    }
  }, [coachPersona, currentChordIndex, activeProgression?.id]);

  // Audio preview for the transition
  const handlePlayVoiceLeading = async () => {
    const prevGuide = chords[(currentChordIndex - 1 + chords.length) % chords.length];
    const targetNote = coachResponse?.target_notes?.[0]?.note || analysis?.guide_tones?.[0] || 'C';
    await soundEngine.playVoiceLeadingResolution(prevGuide.replace(/[^A-Ga-g#b]/g, '') || 'G', targetNote);
  };

  const handleSaveLick = () => {
    saveCurrentLick(customQuestion ? `Q: ${customQuestion}` : undefined);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2400);
  };

  const handleAskCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim() || isCoachStreaming) return;
    triggerCoachExplanation(customQuestion);
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-xl flex flex-col gap-3">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎙️</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Real-Time Coach Dialogue
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Advisor
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Harmonic transition: <span className="font-mono text-amber-400 font-bold">{prevChord || 'Start'}</span> →{' '}
              <span className="font-mono text-emerald-400 font-bold">{currentChord}</span>
            </p>
          </div>
        </div>

        {/* Vault & Audio Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePlayVoiceLeading}
            title="Listen to 2-note guide tone voice leading resolution"
            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 text-xs font-bold rounded-lg border border-zinc-700 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <span>🎧</span>
            <span className="hidden sm:inline">Hear Resolution</span>
          </button>

          <button
            type="button"
            onClick={handleSaveLick}
            title="Save this unlock to your Personal Lick Vault"
            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 text-amber-300 text-xs font-bold rounded-lg border border-amber-500/40 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <span>{saveToast ? '★' : '☆'}</span>
            <span>{saveToast ? 'Saved!' : 'Save Lick'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsLickVaultOpen(true)}
            className="px-2 py-1 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg border border-zinc-700/60 flex items-center gap-1 transition-all"
          >
            <span>📁</span>
            <span className="bg-zinc-700 text-[10px] px-1 rounded-full font-mono">{savedLicks.length}</span>
          </button>
        </div>
      </div>

      {/* Quick Prompt Inquiries */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={isCoachStreaming}
            onClick={() => {
              setCustomQuestion(prompt);
              triggerCoachExplanation(prompt);
            }}
            className="px-2.5 py-1 bg-zinc-800/80 hover:bg-zinc-700 active:bg-zinc-650 disabled:opacity-50 text-[11px] font-medium text-zinc-300 hover:text-white rounded-full border border-zinc-700/50 transition-all shadow-sm cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Advice Streaming View Area */}
      <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-lg p-3 min-h-[110px] max-h-[220px] overflow-y-auto text-xs leading-relaxed font-sans text-zinc-300 relative select-text">
        {isCoachStreaming && !streamingText && (
          <div className="flex items-center gap-2 text-zinc-400 py-4 justify-center">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span className="text-xs font-mono">Synthesizing fretboard voice-leading strategy...</span>
          </div>
        )}

        {streamingText ? (
          <div className="space-y-2 whitespace-pre-wrap">
            <p className="text-zinc-200">
              {streamingText}
              {isCoachStreaming && (
                <span className="inline-block w-2 h-3.5 ml-1 bg-sky-400 animate-pulse align-middle" />
              )}
            </p>
          </div>
        ) : coachResponse ? (
          <div className="space-y-2.5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block mb-0.5">
                The Musical Why
              </span>
              <p className="text-zinc-200">{coachResponse.the_musical_why}</p>
            </div>
            {coachResponse.fretboard_gps && (
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block mb-0.5">
                  Fretboard GPS Target
                </span>
                <p className="text-zinc-300 font-mono text-[11px]">{coachResponse.fretboard_gps}</p>
              </div>
            )}
          </div>
        ) : !isCoachStreaming ? (
          <div className="text-center py-4 text-zinc-400">
            <p className="text-xs">Select a chord transition or click any quick inquiry above.</p>
            <button
              type="button"
              onClick={() => triggerCoachExplanation()}
              className="mt-2 px-3 py-1 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs rounded-md shadow transition-all"
            >
              Ask Teacher Now
            </button>
          </div>
        ) : null}

        <div ref={textEndRef} />
      </div>

      {/* Custom Question Input */}
      <form onSubmit={handleAskCustom} className="flex gap-2">
        <input
          type="text"
          value={customQuestion}
          onChange={(e) => setCustomQuestion(e.target.value)}
          placeholder={`Ask the ${coachPersona.replace('_', ' ')} coach about this chord move...`}
          disabled={isCoachStreaming}
          className="flex-1 bg-zinc-950/70 border border-zinc-800 focus:border-sky-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isCoachStreaming || !customQuestion.trim()}
          className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold text-xs rounded-lg transition-all shadow-sm shrink-0 flex items-center gap-1"
        >
          {isCoachStreaming ? (
            <span className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            'Ask'
          )}
        </button>
      </form>
    </div>
  );
};
