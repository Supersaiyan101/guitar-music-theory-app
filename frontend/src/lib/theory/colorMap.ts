import { IntervalDegree } from '@/types/theory';

export interface DegreeColorConfig {
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  dotFill: string;
  dotStroke: string;
  label: string;
}

export const DEGREE_COLORS: Record<string, DegreeColorConfig> = {
  '1': {
    badgeBg: 'bg-red-500',
    badgeBorder: 'border-red-400',
    badgeText: 'text-white',
    dotFill: '#ef4444',
    dotStroke: '#fee2e2',
    label: 'Root (1)',
  },
  'b2': {
    badgeBg: 'bg-zinc-700',
    badgeBorder: 'border-zinc-500',
    badgeText: 'text-zinc-200',
    dotFill: '#52525b',
    dotStroke: '#a1a1aa',
    label: 'Minor 2nd (b2)',
  },
  '2': {
    badgeBg: 'bg-teal-600',
    badgeBorder: 'border-teal-400',
    badgeText: 'text-white',
    dotFill: '#0d9488',
    dotStroke: '#99f6e4',
    label: 'Major 2nd (2)',
  },
  'b3': {
    badgeBg: 'bg-sky-500',
    badgeBorder: 'border-sky-300',
    badgeText: 'text-white',
    dotFill: '#0ea5e9',
    dotStroke: '#e0f2fe',
    label: 'Minor 3rd (b3)',
  },
  '3': {
    badgeBg: 'bg-blue-600',
    badgeBorder: 'border-blue-400',
    badgeText: 'text-white',
    dotFill: '#2563eb',
    dotStroke: '#bfdbfe',
    label: 'Major 3rd (3)',
  },
  '4': {
    badgeBg: 'bg-emerald-600',
    badgeBorder: 'border-emerald-400',
    badgeText: 'text-white',
    dotFill: '#059669',
    dotStroke: '#a7f3d0',
    label: 'Perfect 4th (4)',
  },
  'b5': {
    badgeBg: 'bg-orange-500',
    badgeBorder: 'border-orange-300',
    badgeText: 'text-white',
    dotFill: '#f97316',
    dotStroke: '#ffedd5',
    label: 'Blue Note (b5)',
  },
  '5': {
    badgeBg: 'bg-amber-400',
    badgeBorder: 'border-amber-200',
    badgeText: 'text-zinc-950',
    dotFill: '#fbbf24',
    dotStroke: '#fef3c7',
    label: 'Perfect 5th (5)',
  },
  '#5': {
    badgeBg: 'bg-amber-600',
    badgeBorder: 'border-amber-400',
    badgeText: 'text-white',
    dotFill: '#d97706',
    dotStroke: '#fde68a',
    label: 'Augmented 5th (#5)',
  },
  '6': {
    badgeBg: 'bg-pink-500',
    badgeBorder: 'border-pink-300',
    badgeText: 'text-white',
    dotFill: '#ec4899',
    dotStroke: '#fbcfe8',
    label: 'Major 6th (6)',
  },
  'bb7': {
    badgeBg: 'bg-purple-800',
    badgeBorder: 'border-purple-600',
    badgeText: 'text-white',
    dotFill: '#6b21a8',
    dotStroke: '#e9d5ff',
    label: 'Diminished 7th (bb7)',
  },
  'b7': {
    badgeBg: 'bg-purple-600',
    badgeBorder: 'border-purple-400',
    badgeText: 'text-white',
    dotFill: '#9333ea',
    dotStroke: '#f3e8ff',
    label: 'Minor 7th (b7)',
  },
  '7': {
    badgeBg: 'bg-indigo-500',
    badgeBorder: 'border-indigo-300',
    badgeText: 'text-white',
    dotFill: '#6366f1',
    dotStroke: '#e0e7ff',
    label: 'Major 7th (7)',
  },
  '9': {
    badgeBg: 'bg-teal-500',
    badgeBorder: 'border-teal-300',
    badgeText: 'text-white',
    dotFill: '#14b8a6',
    dotStroke: '#ccfbf1',
    label: '9th Extension',
  },
  '#9': {
    badgeBg: 'bg-fuchsia-600',
    badgeBorder: 'border-fuchsia-400',
    badgeText: 'text-white',
    dotFill: '#c026d3',
    dotStroke: '#fae8ff',
    label: 'Hendrix #9',
  },
  '11': {
    badgeBg: 'bg-emerald-500',
    badgeBorder: 'border-emerald-300',
    badgeText: 'text-white',
    dotFill: '#10b981',
    dotStroke: '#d1fae5',
    label: '11th Extension',
  },
  '#11': {
    badgeBg: 'bg-lime-500',
    badgeBorder: 'border-lime-300',
    badgeText: 'text-zinc-950',
    dotFill: '#84cc16',
    dotStroke: '#ecfccb',
    label: 'Lydian #11',
  },
  '13': {
    badgeBg: 'bg-rose-500',
    badgeBorder: 'border-rose-300',
    badgeText: 'text-white',
    dotFill: '#f43f5e',
    dotStroke: '#ffe4e6',
    label: '13th Extension',
  },
};

export const DEFAULT_COLOR: DegreeColorConfig = {
  badgeBg: 'bg-zinc-800',
  badgeBorder: 'border-zinc-700',
  badgeText: 'text-zinc-300',
  dotFill: '#3f3f46',
  dotStroke: '#71717a',
  label: 'Passing Note',
};

export function getDegreeColor(degree?: IntervalDegree | string): DegreeColorConfig {
  if (!degree) return DEFAULT_COLOR;
  return DEGREE_COLORS[degree] || DEFAULT_COLOR;
}
