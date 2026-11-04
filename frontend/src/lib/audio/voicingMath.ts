/**
 * Deterministic Guitar Voicing & Register Calculator for Tone.js Comping Engine
 */

const NOTE_TO_PC: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

const PC_TO_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const PC_TO_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export function parseChordRootAndQuality(chord: string): { root: string; quality: string } {
  const trimmed = chord.trim();
  let root = trimmed[0].toUpperCase();
  let rest = trimmed.slice(1);
  if (rest.startsWith('#') || rest.startsWith('b')) {
    root += rest[0];
    rest = rest.slice(1);
  }
  return { root, quality: rest || 'maj' };
}

/**
 * Returns a 4-to-5 note rich guitar-like voicing for rhythm comping.
 */
export function getGuitarChordVoicing(chord: string): string[] {
  const { root, quality } = parseChordRootAndQuality(chord);
  const rootPc = NOTE_TO_PC[root] ?? 0;
  const preferFlats = root.includes('b');
  const pcNames = preferFlats ? PC_TO_FLAT : PC_TO_SHARP;

  const q = quality.toLowerCase();
  const isMinor = (q.includes('m') || q.includes('min')) && !q.includes('maj');
  const isDim = q.includes('dim') || q.includes('m7b5');
  const isSus4 = q.includes('sus4');
  const isSus2 = q.includes('sus2');
  const isMaj7 = q.includes('maj7');
  const is7 = q.includes('7') && !isMaj7;
  const is7Sharp9 = q.includes('7#9') || q.includes('7(#9)');

  // Determine offsets
  let thirdOffset = 4; // Major 3rd
  if (isMinor || isDim) thirdOffset = 3;
  else if (isSus4) thirdOffset = 5;
  else if (isSus2) thirdOffset = 2;

  let fifthOffset = 7; // Perfect 5th
  if (isDim) fifthOffset = 6;
  else if (q.includes('aug') || q.includes('+') || q.includes('#5')) fifthOffset = 8;

  let seventhOffset: number | null = null;
  if (isMaj7) seventhOffset = 11;
  else if (is7 || is7Sharp9) seventhOffset = 10;
  else if (q.includes('dim7')) seventhOffset = 9;

  // Guitar-friendly bass root octave:
  // E, F, F#, G, Ab, A, Bb, B roots start in octave 2 (like Low E / A string on guitar)
  // C, C#, D, Eb roots start in octave 3 (like A / D string on guitar)
  const bassOctave = rootPc >= 4 ? 2 : 3;

  const notes: string[] = [];

  // 1. Fundamental root note
  notes.push(`${root}${bassOctave}`);

  // 2. Fifth in mid register
  const fifthPc = (rootPc + fifthOffset) % 12;
  const fifthOctave = rootPc + fifthOffset >= 12 ? bassOctave + 1 : bassOctave;
  notes.push(`${pcNames[fifthPc]}${fifthOctave}`);

  // 3. Seventh or doubled root
  if (seventhOffset !== null) {
    const seventhPc = (rootPc + seventhOffset) % 12;
    const seventhOctave = rootPc + seventhOffset >= 12 ? bassOctave + 1 : bassOctave;
    notes.push(`${pcNames[seventhPc]}${seventhOctave}`);
  } else {
    // Doubled root an octave higher
    notes.push(`${root}${bassOctave + 1}`);
  }

  // 4. Color 3rd in upper register
  const thirdPc = (rootPc + thirdOffset) % 12;
  const thirdOctave = bassOctave + 1;
  notes.push(`${pcNames[thirdPc]}${thirdOctave}`);

  // 5. Hendrix #9 spice
  if (is7Sharp9) {
    const sharpNinePc = (rootPc + 3) % 12; // #9 sounds enharmonically as minor 3rd in octave 4
    notes.push(`${pcNames[sharpNinePc]}${bassOctave + 2}`);
  }

  return notes;
}

/**
 * Returns the fundamental or fifth bass pitch for the walking bass / downbeat.
 */
export function getBassPitch(chord: string, isFifth = false): string {
  const { root } = parseChordRootAndQuality(chord);
  const rootPc = NOTE_TO_PC[root] ?? 0;
  const preferFlats = root.includes('b');
  const pcNames = preferFlats ? PC_TO_FLAT : PC_TO_SHARP;

  if (!isFifth) {
    const octave = rootPc >= 4 ? 1 : 2;
    return `${root}${octave}`;
  } else {
    const fifthPc = (rootPc + 7) % 12;
    const octave = fifthPc >= 4 ? 1 : 2;
    return `${pcNames[fifthPc]}${octave}`;
  }
}

