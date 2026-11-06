'use client';

import React from 'react';
import { useTheoryStore } from '@/store/useTheoryStore';
import { TeacherPersonaEnum } from '@/lib/api/coachClient';

interface PersonaOption {
  id: TeacherPersonaEnum;
  name: string;
  avatar: string;
  shortTag: string;
  heroes: string;
}

const PERSONA_OPTIONS: PersonaOption[] = [
  {
    id: 'blues_rock',
    name: 'Blues-Rock Veteran',
    avatar: '🎸',
    shortTag: 'Vocal Bends & B.B. Box',
    heroes: 'B.B. King, SRV, Clapton',
  },
  {
    id: 'jazz_fusion',
    name: 'Jazz-Fusion Virtuoso',
    avatar: '🎷',
    shortTag: 'Guide-Tone Cascades & Triads',
    heroes: 'Joe Pass, Larry Carlton',
  },
  {
    id: 'neo_soul',
    name: 'Neo-Soul Balladeer',
    avatar: '🕊️',
    shortTag: 'Thumb Grips & R&B Fills',
    heroes: 'Jimi Hendrix, John Mayer',
  },
];

interface PersonaSelectorProps {
  onPersonaChange?: (newPersona: TeacherPersonaEnum) => void;
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({ onPersonaChange }) => {
  const { coachPersona, setCoachPersona, isCoachStreaming, isCoachLoading } = useTheoryStore();

  const handleSelect = (id: TeacherPersonaEnum) => {
    if (isCoachStreaming || isCoachLoading) return;
    setCoachPersona(id);
    onPersonaChange?.(id);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span>👨‍🏫</span> Select Teacher Persona:
        </span>
        <span className="text-[10px] text-zinc-500 font-mono">
          Changes teaching voice & solo suggestions
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {PERSONA_OPTIONS.map((p) => {
          const isActive = coachPersona === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handleSelect(p.id)}
              disabled={isCoachStreaming || isCoachLoading}
              className={`p-2 rounded-xl text-left transition-all border flex items-start gap-2.5 shadow-sm ${
                isActive
                  ? 'bg-gradient-to-br from-sky-900/60 to-zinc-900/90 border-sky-400/80 shadow-sky-950/50 ring-1 ring-sky-400/50'
                  : 'bg-zinc-900/60 hover:bg-zinc-850 border-zinc-800/80 hover:border-zinc-700 text-zinc-400'
              }`}
            >
              <span className="text-xl p-1 bg-black/40 rounded-lg border border-zinc-800 leading-none">
                {p.avatar}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-black truncate ${
                      isActive ? 'text-white' : 'text-zinc-300'
                    }`}
                  >
                    {p.name}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                  )}
                </div>
                <div className="text-[10px] font-medium text-sky-300/90 truncate">
                  {p.shortTag}
                </div>
                <div className="text-[9px] text-zinc-500 font-mono truncate">
                  {p.heroes}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
