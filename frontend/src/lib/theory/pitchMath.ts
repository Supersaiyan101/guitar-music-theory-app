import {
  NoteName,
  IntervalDegree,
  ScaleType,
  ScaleDefinition,
  ChordType,
  ChordDefinition,
  TuningName,
  TuningConfig,
  FretCoordinate,
  AccidentalMode,
} from '@/types/theory';

export const CHROMATIC_SHARPS: NoteName[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

export const CHROMATIC_FLATS: NoteName[] = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'
];

export const ENHARMONIC_EQUIVALENTS: Record<string, NoteName> = {
  'B#': 'C',
  'C': 'C',
  'C#': 'C#',
  'Db': 'Db',
  'D': 'D',
  'D#': 'D#',
  'Eb': 'Eb',
  'E': 'E',
  'Fb': 'E',
  'E#': 'F',
  'F': 'F',
  'F#': 'F#',
  'Gb': 'Gb',
  'G': 'G',
  'G#': 'G#',
  'Ab': 'Ab',
  'A': 'A',
  'A#': 'A#',
  'Bb': 'Bb',
  'B': 'B',
  'Cb': 'B',
};

// Maps any note to pitch class index 0-11
export function noteToPitchClass(note: string): number {
  const normalized = ENHARMONIC_EQUIVALENTS[note] || note;
  let idx = CHROMATIC_SHARPS.indexOf(normalized as NoteName);
  if (idx === -1) {
    idx = CHROMATIC_FLATS.indexOf(normalized as NoteName);
  }
  return idx === -1 ? 0 : idx;
}

// Flat-preferring keys in circle of fifths
export const FLAT_KEYS: NoteName[] = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'];

export function getPreferredPitchName(
  pitchClass: number,
  key: NoteName = 'C',
  mode: AccidentalMode = 'auto'
): NoteName {
  const pc = ((pitchClass % 12) + 12) % 12;
  if (mode === 'flats') return CHROMATIC_FLATS[pc];
  if (mode === 'sharps') return CHROMATIC_SHARPS[pc];
  // Auto mode: check if root key is flat-leaning
  if (FLAT_KEYS.includes(key)) {
    return CHROMATIC_FLATS[pc];
  }
  return CHROMATIC_SHARPS[pc];
}

// Semitones to Interval Degree mapping
export const SEMITONE_TO_DEGREE: Record<number, IntervalDegree> = {
  0: '1',
  1: 'b2',
  2: '2',
  3: 'b3',
  4: '3',
  5: '4',
  6: 'b5',
  7: '5',
  8: '#5',
  9: '6',
  10: 'b7',
  11: '7',
  12: '1',
  13: 'b9',
  14: '9',
  15: '#9',
  17: '11',
  18: '#11',
  20: 'b13',
  21: '13',
};

export const DEGREE_DESCRIPTIONS: Record<IntervalDegree, string> = {
  '1': 'Root / Tonic',
  'b2': 'Minor 2nd (Half step)',
  '2': 'Major 2nd (Whole step)',
  'b3': 'Minor 3rd (Minor quality)',
  '3': 'Major 3rd (Major quality)',
  '4': 'Perfect 4th',
  'b5': 'Diminished 5th / Blue Note',
  '5': 'Perfect 5th (Power foundation)',
  '#5': 'Augmented 5th',
  '6': 'Major 6th (Sweet Dorian / B.B. tone)',
  'bb7': 'Diminished 7th',
  'b7': 'Minor 7th (Dominant / Blues flavor)',
  '7': 'Major 7th (Dreamy / Jazzy)',
  'b9': 'Minor 9th (Phrygian tension)',
  '9': 'Major 9th (Smooth extension)',
  '#9': 'Sharp 9th (Hendrix Purple Haze chord)',
  '11': 'Perfect 11th',
  '#11': 'Lydian Sharp 11th',
  'b13': 'Minor 13th / Flat 13',
  '13': 'Major 13th (Dominant jazz resolution)',
};

// Tunings with string notes from String 1 (High E) to String 6 (Low E)
export const TUNINGS: Record<TuningName, TuningConfig> = {
  'Standard': {
    name: 'Standard',
    description: 'E4 - B3 - G3 - D3 - A2 - E2',
    strings: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
  },
  'Drop D': {
    name: 'Drop D',
    description: 'E4 - B3 - G3 - D3 - A2 - D2 (Heavy power chords on 6-5-4)',
    strings: ['E4', 'B3', 'G3', 'D3', 'A2', 'D2'],
  },
  'Eb Standard': {
    name: 'Eb Standard',
    description: 'Eb4 - Bb3 - Gb3 - Db3 - Ab2 - Eb2 (Hendrix / SRV tuning)',
    strings: ['Eb4', 'Bb3', 'Gb3', 'Db3', 'Ab2', 'Eb2'],
  },
  'D Standard': {
    name: 'D Standard',
    description: 'D4 - A3 - F3 - C3 - G2 - D2 (Full step down heavy tone)',
    strings: ['D4', 'A3', 'F3', 'C3', 'G2', 'D2'],
  },
  'DADGAD': {
    name: 'DADGAD',
    description: 'D4 - A3 - G3 - D3 - A2 - D2 (Celtic / Jimmy Page Kashmir)',
    strings: ['D4', 'A3', 'G3', 'D3', 'A2', 'D2'],
  },
  'Open G': {
    name: 'Open G',
    description: 'D4 - B3 - G3 - D3 - G2 - D2 (Keith Richards / Slide guitar)',
    strings: ['D4', 'B3', 'G3', 'D3', 'G2', 'D2'],
  },
};

// Scale Definitions
export const SCALE_DEFINITIONS: Record<ScaleType, ScaleDefinition> = {
  major: {
    id: 'major',
    name: 'Major (Ionian)',
    category: 'diatonic',
    formula: [0, 2, 4, 5, 7, 9, 11],
    degrees: ['1', '2', '3', '4', '5', '6', '7'],
    description: 'The foundation of Western harmony. Bright, resolved, and consonant.',
  },
  natural_minor: {
    id: 'natural_minor',
    name: 'Natural Minor (Aeolian)',
    category: 'diatonic',
    formula: [0, 2, 3, 5, 7, 8, 10],
    degrees: ['1', '2', 'b3', '4', '5', 'b13', 'b7'],
    description: 'Sad, dramatic, classic minor tonality. Relative minor of the major scale.',
  },
  harmonic_minor: {
    id: 'harmonic_minor',
    name: 'Harmonic Minor',
    category: 'diatonic',
    formula: [0, 2, 3, 5, 7, 8, 11],
    degrees: ['1', '2', 'b3', '4', '5', 'b13', '7'],
    description: 'Features a natural 7th leading tone. Exotic neoclassical / Spanish flair.',
  },
  melodic_minor: {
    id: 'melodic_minor',
    name: 'Melodic Minor',
    category: 'diatonic',
    formula: [0, 2, 3, 5, 7, 9, 11],
    degrees: ['1', '2', 'b3', '4', '5', '6', '7'],
    description: 'Jazz minor: Minor 3rd with bright major 6th and major 7th.',
  },
  major_pentatonic: {
    id: 'major_pentatonic',
    name: 'Major Pentatonic',
    category: 'pentatonic_blues',
    formula: [0, 2, 4, 7, 9],
    degrees: ['1', '2', '3', '5', '6'],
    description: 'Sweet, soulful, southern rock and country sound (Allman Brothers, Dickey Betts).',
  },
  minor_pentatonic: {
    id: 'minor_pentatonic',
    name: 'Minor Pentatonic',
    category: 'pentatonic_blues',
    formula: [0, 3, 5, 7, 10],
    degrees: ['1', 'b3', '4', '5', 'b7'],
    description: 'The universal language of rock, blues, and heavy metal soloing.',
  },
  blues: {
    id: 'blues',
    name: 'Blues Scale',
    category: 'pentatonic_blues',
    formula: [0, 3, 5, 6, 7, 10],
    degrees: ['1', 'b3', '4', 'b5', '5', 'b7'],
    description: 'Minor pentatonic plus the crying diminished 5th (b5) "Blue Note".',
  },
  dorian: {
    id: 'dorian',
    name: 'Dorian Mode',
    category: 'modes',
    formula: [0, 2, 3, 5, 7, 9, 10],
    degrees: ['1', '2', 'b3', '4', '5', '6', 'b7'],
    description: 'Minor with a bright Major 6th. The iconic Santana, Pink Floyd, funk minor sound.',
  },
  phrygian: {
    id: 'phrygian',
    name: 'Phrygian Mode',
    category: 'modes',
    formula: [0, 1, 3, 5, 7, 8, 10],
    degrees: ['1', 'b2', 'b3', '4', '5', 'b13', 'b7'],
    description: 'Dark, tense minor mode with a flat 2nd. Heavy metal and flamenco favorite.',
  },
  lydian: {
    id: 'lydian',
    name: 'Lydian Mode',
    category: 'modes',
    formula: [0, 2, 4, 6, 7, 9, 11],
    degrees: ['1', '2', '3', '#11', '5', '6', '7'],
    description: 'Major with a sharp 4th. Dreamy, cinematic, Steve Vai / Joe Satriani favorite.',
  },
  mixolydian: {
    id: 'mixolydian',
    name: 'Mixolydian Mode',
    category: 'modes',
    formula: [0, 2, 4, 5, 7, 9, 10],
    degrees: ['1', '2', '3', '4', '5', '6', 'b7'],
    description: 'Major with a flat 7th. Classic rock, blues-rock dominant (Grateful Dead, AC/DC).',
  },
  locrian: {
    id: 'locrian',
    name: 'Locrian Mode',
    category: 'modes',
    formula: [0, 1, 3, 5, 6, 8, 10],
    degrees: ['1', 'b2', 'b3', '4', 'b5', 'b13', 'b7'],
    description: 'Diminished triad foundation (b5). Extremely unstable, dissonant, and dark.',
  },
  phrygian_dominant: {
    id: 'phrygian_dominant',
    name: 'Phrygian Dominant (5th Mode of Harmonic Minor)',
    category: 'soloing_hybrid',
    formula: [0, 1, 4, 5, 7, 8, 10],
    degrees: ['1', 'b2', '3', '4', '5', 'b13', 'b7'],
    description: 'Major 3rd with b2 and b7. The quintessential Middle Eastern / Yngwie Malmsteen sound.',
  },
  bebop_dominant: {
    id: 'bebop_dominant',
    name: 'Dominant Bebop Scale',
    category: 'soloing_hybrid',
    formula: [0, 2, 4, 5, 7, 9, 10, 11],
    degrees: ['1', '2', '3', '4', '5', '6', 'b7', '7'],
    description: '8-note scale with natural 7 passing tone. Keeps chord tones on the downbeats.',
  },
  hybrid_blues: {
    id: 'hybrid_blues',
    name: 'Hybrid Blues (Major/Minor Blend)',
    category: 'soloing_hybrid',
    formula: [0, 2, 3, 4, 5, 6, 7, 9, 10],
    degrees: ['1', '2', 'b3', '3', '4', 'b5', '5', '6', 'b7'],
    description: 'The SRV & B.B. King secret sauce: blending Major 3rd & Minor 3rd, Major 6th, and b5.',
  },
};

// Chord Definitions
export const CHORD_DEFINITIONS: Record<ChordType, ChordDefinition> = {
  maj: {
    id: 'maj',
    name: 'Major Triad',
    symbol: 'maj',
    formula: [0, 4, 7],
    degrees: ['1', '3', '5'],
    description: 'Root, Major 3rd, Perfect 5th.',
  },
  min: {
    id: 'min',
    name: 'Minor Triad',
    symbol: 'm',
    formula: [0, 3, 7],
    degrees: ['1', 'b3', '5'],
    description: 'Root, Minor 3rd, Perfect 5th.',
  },
  dim: {
    id: 'dim',
    name: 'Diminished Triad',
    symbol: 'dim',
    formula: [0, 3, 6],
    degrees: ['1', 'b3', 'b5'],
    description: 'Root, Minor 3rd, Diminished 5th.',
  },
  aug: {
    id: 'aug',
    name: 'Augmented Triad',
    symbol: 'aug',
    formula: [0, 4, 8],
    degrees: ['1', '3', '#5'],
    description: 'Root, Major 3rd, Augmented 5th.',
  },
  '5': {
    id: '5',
    name: 'Power Chord',
    symbol: '5',
    formula: [0, 7],
    degrees: ['1', '5'],
    description: 'Root and 5th. No 3rd; works over major or minor.',
  },
  sus2: {
    id: 'sus2',
    name: 'Suspended 2nd',
    symbol: 'sus2',
    formula: [0, 2, 7],
    degrees: ['1', '2', '5'],
    description: 'Major 2nd replaces the 3rd. Open, airy feel.',
  },
  sus4: {
    id: 'sus4',
    name: 'Suspended 4th',
    symbol: 'sus4',
    formula: [0, 5, 7],
    degrees: ['1', '4', '5'],
    description: 'Perfect 4th replaces the 3rd. Builds tension needing resolution.',
  },
  '7': {
    id: '7',
    name: 'Dominant 7th',
    symbol: '7',
    formula: [0, 4, 7, 10],
    degrees: ['1', '3', '5', 'b7'],
    description: 'Major triad with minor 7th. The cornerstone of blues and funk.',
  },
  maj7: {
    id: 'maj7',
    name: 'Major 7th',
    symbol: 'maj7',
    formula: [0, 4, 7, 11],
    degrees: ['1', '3', '5', '7'],
    description: 'Lush, warm jazz and bossa nova sound.',
  },
  min7: {
    id: 'min7',
    name: 'Minor 7th',
    symbol: 'm7',
    formula: [0, 3, 7, 10],
    degrees: ['1', 'b3', '5', 'b7'],
    description: 'Mellow, soulful minor chord.',
  },
  m7b5: {
    id: 'm7b5',
    name: 'Half-Diminished (m7b5)',
    symbol: 'm7b5',
    formula: [0, 3, 6, 10],
    degrees: ['1', 'b3', 'b5', 'b7'],
    description: 'The ii chord of minor key ii-V-i progressions.',
  },
  dim7: {
    id: 'dim7',
    name: 'Diminished 7th',
    symbol: 'dim7',
    formula: [0, 3, 6, 9],
    degrees: ['1', 'b3', 'b5', 'bb7'],
    description: 'Symmetrical stack of minor 3rds; moves up or down by 3 frets identically.',
  },
  add9: {
    id: 'add9',
    name: 'Add9',
    symbol: 'add9',
    formula: [0, 4, 7, 14],
    degrees: ['1', '3', '5', '9'],
    description: 'Major triad plus 9th without 7th (Andy Summers / The Police shimmer).',
  },
  '9': {
    id: '9',
    name: 'Dominant 9th',
    symbol: '9',
    formula: [0, 4, 7, 10, 14],
    degrees: ['1', '3', '5', 'b7', '9'],
    description: 'Funk groove staple (James Brown / Prince chord).',
  },
  min9: {
    id: 'min9',
    name: 'Minor 9th',
    symbol: 'm9',
    formula: [0, 3, 7, 10, 14],
    degrees: ['1', 'b3', '5', 'b7', '9'],
    description: 'Sophisticated neo-soul and R&B chord.',
  },
  maj9: {
    id: 'maj9',
    name: 'Major 9th',
    symbol: 'maj9',
    formula: [0, 4, 7, 11, 14],
    degrees: ['1', '3', '5', '7', '9'],
    description: 'Sparkling, expansive jazz voicing.',
  },
  '11': {
    id: '11',
    name: 'Dominant 11th',
    symbol: '11',
    formula: [0, 7, 10, 14, 17],
    degrees: ['1', '5', 'b7', '9', '11'],
    description: 'Extended dominant without 3rd clash.',
  },
  '13': {
    id: '13',
    name: 'Dominant 13th',
    symbol: '13',
    formula: [0, 4, 7, 10, 14, 21],
    degrees: ['1', '3', '5', 'b7', '9', '13'],
    description: 'Big band / jazz dominant with the lush 13th (6th) color tone.',
  },
  '7b9': {
    id: '7b9',
    name: '7 Flat 9 (Altered Dominant)',
    symbol: '7b9',
    formula: [0, 4, 7, 10, 13],
    degrees: ['1', '3', '5', 'b7', 'b9'],
    description: 'Spicy minor-resolution dominant with tense flat 9.',
  },
  '7#9': {
    id: '7#9',
    name: 'Hendrix 7#9 Chord',
    symbol: '7#9',
    formula: [0, 4, 7, 10, 15],
    degrees: ['1', '3', '5', 'b7', '#9'],
    description: 'The Purple Haze chord! Major 3rd colliding with sharp 9 (enharmonic minor 3rd).',
  },
  hendrix_sus4: {
    id: 'hendrix_sus4',
    name: 'Hendrix Thumb-Over Sus4/Add9',
    symbol: 'Hendrix',
    formula: [0, 4, 5, 7, 14],
    degrees: ['1', '3', '4', '5', '9'],
    description: 'Little Wing / Bold As Love hammer-on embellishment cluster.',
  },
  shell_voicing: {
    id: 'shell_voicing',
    name: 'Freddie Green Shell Voicing',
    symbol: 'Shell (1-3-7)',
    formula: [0, 4, 10], // Root, 3rd, 7th guide tones
    degrees: ['1', '3', 'b7'],
    description: 'Stripped-down guide-tone comping (Root + 3rd + 7th). Leaves the 5th to the bass.',
  },
  spread_triad: {
    id: 'spread_triad',
    name: 'Open Spread Triad (1-5-10)',
    symbol: 'Spread (1-5-10)',
    formula: [0, 7, 16],
    degrees: ['1', '5', '3'],
    description: 'Eric Johnson wide-interval open triad with the 3rd raised an octave.',
  },
};

// Convert string pitch with octave (e.g. "E4") to MIDI note number
export function pitchToMidi(pitchWithOctave: string): number {
  const match = pitchWithOctave.match(/^([A-G][b#]?)(-?\d+)$/);
  if (!match) return 60; // Middle C fallback
  const note = match[1];
  const octave = parseInt(match[2], 10);
  const pc = noteToPitchClass(note);
  return (octave + 1) * 12 + pc;
}

// Convert MIDI note number to frequency in Hz (A4 = 440 Hz)
export function midiToFrequency(midi: number): number {
  return Math.round(440 * Math.pow(2, (midi - 69) / 12) * 100) / 100;
}

// Parse MIDI note to NoteName and octave
export function midiToPitch(
  midi: number,
  key: NoteName = 'C',
  mode: AccidentalMode = 'auto'
): { note: NoteName; octave: number; pitchWithOctave: string } {
  const pc = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  const note = getPreferredPitchName(pc, key, mode);
  return {
    note,
    octave,
    pitchWithOctave: `${note}${octave}`,
  };
}

// Fret distance physics: d_n = scaleLength * (1 - 2^(-n/12))
export function calculateFretDistance(
  fretNumber: number,
  scaleLengthPx: number = 1000
): number {
  if (fretNumber === 0) return 0;
  return scaleLengthPx * (1 - Math.pow(2, -fretNumber / 12));
}

// Generate the 6 x 25 fretboard matrix for any given tuning
export function generateFretboardMatrix(
  tuningName: TuningName = 'Standard',
  key: NoteName = 'C',
  mode: AccidentalMode = 'auto'
): FretCoordinate[][] {
  const tuning = TUNINGS[tuningName];
  const matrix: FretCoordinate[][] = [];

  for (let strIdx = 0; strIdx < 6; strIdx++) {
    const stringNum = strIdx + 1; // 1 = High E, 6 = Low E
    const openPitchStr = tuning.strings[strIdx];
    const openMidi = pitchToMidi(openPitchStr);
    const stringFrets: FretCoordinate[] = [];

    for (let fret = 0; fret <= 24; fret++) {
      const currentMidi = openMidi + fret;
      const { note, octave, pitchWithOctave } = midiToPitch(currentMidi, key, mode);
      const frequency = midiToFrequency(currentMidi);

      stringFrets.push({
        stringNumber: stringNum,
        fretNumber: fret,
        note,
        octave,
        pitchWithOctave,
        frequency,
      });
    }
    matrix.push(stringFrets);
  }

  return matrix;
}

export interface HarmonicNoteInfo {
  degree: IntervalDegree;
  isRoot: boolean;
  isChordTone: boolean;
  role: string;
  preferredNote: NoteName;
}

// Chord tones defining harmonic foundation: Roots, 3rds, 5ths, 7ths
const CHORD_TONE_DEGREES = new Set<IntervalDegree>([
  '1', 'b3', '3', 'b5', '5', '#5', 'bb7', 'b7', '7'
]);

export function getHarmonicProfile(
  rootKey: NoteName,
  activeScale: ScaleType | null,
  activeChord: ChordType | null,
  accidentalMode: AccidentalMode = 'auto'
): Map<number, HarmonicNoteInfo> {
  const profile = new Map<number, HarmonicNoteInfo>();
  const rootPc = noteToPitchClass(rootKey);

  let formula: number[] = [0];
  let degrees: IntervalDegree[] = ['1'];

  if (activeScale && SCALE_DEFINITIONS[activeScale]) {
    formula = SCALE_DEFINITIONS[activeScale].formula;
    degrees = SCALE_DEFINITIONS[activeScale].degrees;
  } else if (activeChord && CHORD_DEFINITIONS[activeChord]) {
    formula = CHORD_DEFINITIONS[activeChord].formula;
    degrees = CHORD_DEFINITIONS[activeChord].degrees;
  }

  formula.forEach((semitones, idx) => {
    const pc = (rootPc + semitones) % 12;
    const degree = degrees[idx] || '1';
    const isRoot = semitones % 12 === 0;
    const isChordTone = CHORD_TONE_DEGREES.has(degree);
    const role = DEGREE_DESCRIPTIONS[degree] || 'Chord Tone';
    const preferredNote = getPreferredPitchName(pc, rootKey, accidentalMode);

    profile.set(pc, {
      degree,
      isRoot,
      isChordTone,
      role,
      preferredNote,
    });
  });

  return profile;
}
