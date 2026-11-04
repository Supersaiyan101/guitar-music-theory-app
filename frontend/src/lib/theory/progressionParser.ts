/**
 * Client-Side Custom Progression Parser for Guitar Theory Kingdom.
 * Parses user input strings (pipes, hyphens, commas, Roman numerals) into structured bars.
 */
import { SongBarChord, SongProgression } from '@/types/theory';

const ROMAN_TO_SEMITONES: Record<string, { semitones: number; quality: string }> = {
  i: { semitones: 0, quality: 'm' },
  i7: { semitones: 0, quality: 'm7' },
  im7: { semitones: 0, quality: 'm7' },
  I: { semitones: 0, quality: '' },
  I7: { semitones: 0, quality: '7' },
  Imaj7: { semitones: 0, quality: 'maj7' },
  bII: { semitones: 1, quality: '' },
  bII7: { semitones: 1, quality: '7' },
  ii: { semitones: 2, quality: 'm' },
  ii7: { semitones: 2, quality: 'm7' },
  iim7: { semitones: 2, quality: 'm7' },
  iiø: { semitones: 2, quality: 'm7b5' },
  iiø7: { semitones: 2, quality: 'm7b5' },
  II: { semitones: 2, quality: '' },
  II7: { semitones: 2, quality: '7' },
  bIII: { semitones: 3, quality: '' },
  bIII7: { semitones: 3, quality: '7' },
  iii: { semitones: 4, quality: 'm' },
  iii7: { semitones: 4, quality: 'm7' },
  III: { semitones: 4, quality: '' },
  III7: { semitones: 4, quality: '7' },
  iv: { semitones: 5, quality: 'm' },
  iv7: { semitones: 5, quality: 'm7' },
  IV: { semitones: 5, quality: '' },
  IV7: { semitones: 5, quality: '7' },
  IVmaj7: { semitones: 5, quality: 'maj7' },
  bV: { semitones: 6, quality: '7' },
  v: { semitones: 7, quality: 'm' },
  v7: { semitones: 7, quality: 'm7' },
  V: { semitones: 7, quality: '' },
  V7: { semitones: 7, quality: '7' },
  bVI: { semitones: 8, quality: '' },
  bVI7: { semitones: 8, quality: '7' },
  vi: { semitones: 9, quality: 'm' },
  vi7: { semitones: 9, quality: 'm7' },
  VI: { semitones: 9, quality: '' },
  VI7: { semitones: 9, quality: '7' },
  bVII: { semitones: 10, quality: '' },
  bVII7: { semitones: 10, quality: '7' },
  vii: { semitones: 11, quality: 'm' },
  'vii°': { semitones: 11, quality: 'dim' },
  viiø: { semitones: 11, quality: 'm7b5' },
  viiø7: { semitones: 11, quality: 'm7b5' },
  VII: { semitones: 11, quality: '' },
  VII7: { semitones: 11, quality: '7' },
};

const NOTE_TO_PC: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1,
  D: 2, 'D#': 3, Eb: 3,
  E: 4,
  F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8,
  A: 9, 'A#': 10, Bb: 10,
  B: 11,
};

const PC_TO_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const PC_TO_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function romanToChord(roman: string, keyRoot: string): string {
  const trimmed = roman.trim();
  const entry = ROMAN_TO_SEMITONES[trimmed];
  if (!entry) return roman;

  const keyPc = NOTE_TO_PC[keyRoot] ?? 0;
  const chordPc = (keyPc + entry.semitones) % 12;
  const preferFlats = keyRoot.includes('b');
  const rootName = preferFlats ? PC_TO_FLAT[chordPc] : PC_TO_SHARP[chordPc];

  return `${rootName}${entry.quality}`;
}

export function parseCustomProgressionString(
  rawInput: string,
  key: string = 'C',
  defaultBpm: number = 100
): SongProgression {
  const clean = rawInput.trim();
  if (!clean) {
    throw new Error('Progression cannot be empty.');
  }

  const bars: SongBarChord[][] = [];

  // Pipe delimiter
  if (clean.includes('|')) {
    const rawMeasures = clean.split('|').map((m) => m.trim()).filter(Boolean);
    for (const m of rawMeasures) {
      const tokens = m.split(/[\s,]+/).filter(Boolean);
      if (!tokens.length) continue;
      const beatsPerChord = Math.max(1, Math.floor(4 / tokens.length));
      bars.push(
        tokens.map((t) => ({
          chord: romanToChord(t, key),
          beats: beatsPerChord,
        }))
      );
    }
  } else {
    // Hyphens, commas, or whitespace
    const tokens = clean.split(/[\s,\-]+/).filter(Boolean);
    if (!tokens.length) {
      throw new Error('No valid chords found.');
    }
    for (const t of tokens) {
      bars.push([{ chord: romanToChord(t, key), beats: 4 }]);
    }
  }

  if (!bars.length) {
    throw new Error('Failed to parse measures.');
  }

  const chords_sequence = bars.flatMap((b) => b.map((c) => c.chord));
  const chord_durations = bars.flatMap((b) => b.map((c) => c.beats));

  return {
    id: 'custom_user_progression',
    title: 'Custom Progression',
    artist: 'User',
    genre: 'custom',
    difficulty: 'intermediate',
    default_tempo: defaultBpm,
    time_signature: '4/4',
    key,
    mode: 'major',
    bars,
    chords_sequence,
    chord_durations,
    soloing_tip: `Practice targeting 3rd and 7th guide tones over ${chords_sequence.join(' - ')}.`,
    iconic_tone: 'Custom tone.',
  };
}

