'use client';

import React, { useState } from 'react';
import { useTheoryStore } from '@/store/useTheoryStore';
import { parseCustomProgressionString } from '@/lib/theory/progressionParser';

export const CustomProgressionModal: React.FC = () => {
  const { isCustomModalOpen, setIsCustomModalOpen, loadProgression } = useTheoryStore();
  const [inputText, setInputText] = useState('Dm7 - G7 - Cmaj7');
  const [selectedKey, setSelectedKey] = useState('C');
  const [tempo, setTempo] = useState(100);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isCustomModalOpen) return null;

  const quickTemplates = [
    { label: 'ii - V - I (Jazz)', text: 'Dm7 - G7 - Cmaj7', key: 'C' },
    { label: 'I - V - vi - IV (Pop)', text: 'C - G - Am - F', key: 'C' },
    { label: '12-Bar Blues (A)', text: '| A7 | D7 | A7 | A7 | D7 | D7 | A7 | A7 | E7 | D7 | A7 | E7 |', key: 'A' },
    { label: 'Minor 4th (Creep)', text: 'G - B - C - Cm', key: 'G' },
    { label: 'Andalusian (Flamenco)', text: 'Am - G - F - E7', key: 'A' },
    { label: 'Neo-Soul Turnaround', text: 'Dbmaj7 - C7 - Fm7 - Ebm7 Ab7', key: 'F' },
  ];

  const handleApplyTemplate = (text: string, key: string) => {
    setInputText(text);
    setSelectedKey(key);
    setErrorMsg(null);
  };

  const handleAnalyzeAndLoad = () => {
    try {
      setErrorMsg(null);
      const parsedProg = parseCustomProgressionString(inputText, selectedKey, tempo);
      loadProgression(parsedProg);
      setIsCustomModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse progression. Please check chord symbols.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎸</span>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Custom Chord Progression Studio
              </h2>
              <p className="text-xs text-zinc-400">
                Type or paste any chord sequence or Roman numerals
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCustomModalOpen(false)}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 text-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Quick Presets */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
            Quick Templates
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickTemplates.map((t, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyTemplate(t.text, t.key)}
                className="text-xs px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all font-mono"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Textarea */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Chord Sequence or Bar Syntax
            </label>
            <span className="text-[10px] text-zinc-400 font-mono">
              e.g. &apos;Dm7 - G7 - Cmaj7&apos; or &apos;| Dm7 G7 | Cmaj7 |&apos;
            </span>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={3}
            placeholder="e.g. Dm7 - G7 - Cmaj7 or | Dm7 G7 | Cmaj7 |"
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-3 font-mono text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>

        {/* Options Row (Key & Tempo) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Key Center
            </label>
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            >
              {['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'].map((k) => (
                <option key={k} value={k}>
                  Key of {k}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Default Tempo (BPM)
            </label>
            <input
              type="number"
              min={40}
              max={240}
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
          <button
            onClick={() => setIsCustomModalOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAnalyzeAndLoad}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shadow-lg shadow-cyan-500/20 transition-all"
          >
            Analyze &amp; Load into Flight-Path ➔
          </button>
        </div>
      </div>
    </div>
  );
};
