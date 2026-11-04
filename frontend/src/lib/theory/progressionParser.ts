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

// ---------------------------------------------------------------------------
// Client-Side Harmonic & Voice-Leading Analyzer
// ---------------------------------------------------------------------------

import {
  ChordAnalysis,
  HarmonicFunction,
  ProgressionAnalysisResult,
  VoiceLeadingStep,
} from '@/types/theory';

function parseChordRootAndQuality(chord: string): { root: string; quality: string } {
  let root = chord[0].toUpperCase();
  let rest = chord.slice(1);
  if (rest.startsWith('#') || rest.startsWith('b')) {
    root += rest[0];
    rest = rest.slice(1);
  }
  return { root, quality: rest || 'maj' };
}

function getChordTonesClient(root: string, quality: string): { tones: string[]; guideTones: string[] } {
  const rootPc = NOTE_TO_PC[root] ?? 0;
  const isMinor = quality.includes('m') && !quality.includes('maj');
  const is7 = quality.includes('7');
  const isMaj7 = quality.includes('maj7');
  const isDim = quality.includes('dim') || quality.includes('m7b5');

  // Semitone offsets
  const thirdOffset = isMinor || isDim ? 3 : 4;
  const fifthOffset = isDim ? 6 : 7;
  const seventhOffset = isMaj7 ? 11 : is7 ? 10 : null;

  const thirdPc = (rootPc + thirdOffset) % 12;
  const fifthPc = (rootPc + fifthOffset) % 12;
  const preferFlats = root.includes('b');

  const thirdNote = preferFlats ? PC_TO_FLAT[thirdPc] : PC_TO_SHARP[thirdPc];
  const fifthNote = preferFlats ? PC_TO_FLAT[fifthPc] : PC_TO_SHARP[fifthPc];

  const tones = [root, thirdNote, fifthNote];
  const guideTones = [thirdNote];

  if (seventhOffset !== null) {
    const seventhPc = (rootPc + seventhOffset) % 12;
    const seventhNote = preferFlats ? PC_TO_FLAT[seventhPc] : PC_TO_SHARP[seventhPc];
    tones.push(seventhNote);
    guideTones.push(seventhNote);
  }

  return { tones, guideTones };
}

export function analyzeProgressionClient(
  chords: string[],
  key: string = 'C',
  mode: 'major' | 'minor' = 'major',
  durations?: number[]
): ProgressionAnalysisResult {
  const durs = durations ?? chords.map(() => 4);
  const total_bars = Math.max(1, Math.floor(durs.reduce((a, b) => a + b, 0) / 4));
  const keyPc = NOTE_TO_PC[key] ?? 0;

  const analyzedChords: ChordAnalysis[] = chords.map((chordSym, i) => {
    const { root, quality } = parseChordRootAndQuality(chordSym);
    const { tones, guideTones } = getChordTonesClient(root, quality);

    const nextChordSym = chords[(i + 1) % chords.length];
    const nextParsed = parseChordRootAndQuality(nextChordSym);
    const nextTonesInfo = getChordTonesClient(nextParsed.root, nextParsed.quality);

    // Semitones from key root
    const rootPc = NOTE_TO_PC[root] ?? 0;
    const semitones = (rootPc - keyPc + 12) % 12;

    let roman = chordSym;
    let func: HarmonicFunction = 'Tonic';
    let insight = 'Tonal center.';

    const isMin = quality.includes('m') && !quality.includes('maj');
    const is7 = quality.includes('7');
    const sev = is7 ? (quality.includes('maj7') ? 'maj7' : '7') : '';

    if (mode === 'major') {
      if (semitones === 0) {
        roman = isMin ? `i${sev}` : `I${sev}`;
        func = isMin ? 'Modal Interchange' : (is7 ? 'Dominant' : 'Tonic');
        insight = isMin ? 'Borrowed parallel minor tonic.' : 'Tonic center of the key. Resolves harmonic tension.';
      } else if (semitones === 2) {
        roman = isMin ? `ii${sev}` : `II${sev}`;
        func = isMin ? 'Subdominant' : 'Secondary Dominant';
        insight = isMin ? 'Diatonic supertonic predominant setup chord.' : 'Secondary dominant (V7/V) leading into V.';
      } else if (semitones === 3) {
        roman = `bIII${sev}`;
        func = 'Modal Interchange';
        insight = 'Borrowed mediant from parallel minor. Classic rock anthem chord.';
      } else if (semitones === 4) {
        roman = isMin ? `iii${sev}` : `III${sev}`;
        func = isMin ? 'Tonic' : 'Secondary Dominant';
        insight = isMin ? 'Diatonic mediant chord. Soft tonic substitute.' : 'Secondary dominant (V7/vi) pulling into relative minor vi.';
      } else if (semitones === 5) {
        roman = isMin ? `iv${sev}` : `IV${sev}`;
        func = isMin ? 'Modal Interchange' : 'Subdominant';
        insight = isMin ? 'The bittersweet minor 4th borrowed from parallel minor.' : 'Diatonic subdominant chord. Bright, expansive lift.';
      } else if (semitones === 6) {
        roman = `bV${sev || '7'}`;
        func = 'Tritone Substitution';
        insight = 'Tritone substitution dominant resolving down by a half-step.';
      } else if (semitones === 7) {
        roman = isMin ? `v${sev}` : `V${sev}`;
        func = isMin ? 'Modal Interchange' : 'Dominant';
        insight = isMin ? 'Minor v chord from Aeolian.' : 'Diatonic dominant chord. Maximum tension demanding resolution to I.';
      } else if (semitones === 8) {
        roman = `bVI${sev}`;
        func = 'Modal Interchange';
        insight = 'Borrowed submediant from parallel minor. Epic, cinematic resolution.';
      } else if (semitones === 9) {
        roman = isMin ? `vi${sev}` : `VI${sev}`;
        func = isMin ? 'Tonic' : 'Secondary Dominant';
        insight = isMin ? 'Diatonic submediant chord. Relative minor tonic substitute.' : 'Secondary dominant (V7/ii) leading to ii.';
      } else if (semitones === 10) {
        roman = `bVII${sev}`;
        func = 'Modal Interchange';
        insight = 'Subtonic chord borrowed from Mixolydian. The quintessential classic rock power chord.';
      } else if (semitones === 11) {
        roman = `vii°${sev}`;
        func = 'Dominant';
        insight = 'Diatonic leading-tone chord sharing dominant pull.';
      }
    } else {
      // Minor key
      if (semitones === 0) {
        roman = `i${sev}`;
        func = 'Tonic';
        insight = 'Minor tonic center.';
      } else if (semitones === 2) {
        roman = `ii°${sev}`;
        func = 'Subdominant';
        insight = 'Diatonic minor supertonic chord.';
      } else if (semitones === 3) {
        roman = `bIII${sev}`;
        func = 'Tonic';
        insight = 'Relative major chord. Uplifting tonic substitute in minor.';
      } else if (semitones === 5) {
        roman = `iv${sev}`;
        func = 'Subdominant';
        insight = 'Diatonic minor subdominant chord.';
      } else if (semitones === 7) {
        roman = isMin ? `v${sev}` : `V${sev}`;
        func = 'Dominant';
        insight = isMin ? 'Natural minor v chord.' : 'Harmonic minor dominant V7 chord with raised leading tone.';
      } else if (semitones === 8) {
        roman = `bVI${sev}`;
        func = 'Subdominant';
        insight = 'Diatonic submediant chord. Key anchor of Andalusian cadence.';
      } else if (semitones === 10) {
        roman = `bVII${sev}`;
        func = 'Subdominant';
        insight = 'Diatonic subtonic chord from natural minor.';
      } else if (semitones === 11) {
        roman = `vii°${sev}`;
        func = 'Dominant';
        insight = 'Harmonic minor leading-tone chord.';
      }
    }

    // Common tones
    const currentPcs = new Set(tones.map((t) => NOTE_TO_PC[t] ?? -1));
    const commonTones = nextTonesInfo.tones.filter((t) => currentPcs.has(NOTE_TO_PC[t] ?? -1));

    // Voice leading steps to next chord
    const voiceLeadingSteps: VoiceLeadingStep[] = [];
    guideTones.forEach((gToneA) => {
      nextTonesInfo.guideTones.forEach((gToneB) => {
        const pcA = NOTE_TO_PC[gToneA] ?? 0;
        const pcB = NOTE_TO_PC[gToneB] ?? 0;
        let diff = (pcB - pcA + 12) % 12;
        if (diff > 6) diff -= 12;

        if (diff === 0) {
          voiceLeadingSteps.push({
            from_note: gToneA,
            from_degree: 'guide',
            to_note: gToneB,
            to_degree: 'guide',
            semitone_distance: 0,
            movement_type: 'common_tone',
            is_guide_tone_resolution: true,
          });
        } else if (diff === -1) {
          voiceLeadingSteps.push({
            from_note: gToneA,
            from_degree: 'guide',
            to_note: gToneB,
            to_degree: 'guide',
            semitone_distance: -1,
            movement_type: 'half_step_down',
            is_guide_tone_resolution: true,
          });
        } else if (diff === 1) {
          voiceLeadingSteps.push({
            from_note: gToneA,
            from_degree: 'guide',
            to_note: gToneB,
            to_degree: 'guide',
            semitone_distance: 1,
            movement_type: 'half_step_up',
            is_guide_tone_resolution: true,
          });
        }
      });
    });

    // Recommended scales
    let modalScale = `${root} Major`;
    let spicyScale = `${root} Major Pentatonic`;

    if (is7 && !quality.includes('maj7')) {
      modalScale = `${root} Mixolydian`;
      spicyScale = semitones === 7 ? `${root} Altered (Super Locrian)` : `${root} Lydian Dominant`;
    } else if (isMin) {
      modalScale = semitones === 2 ? `${root} Dorian` : `${root} Aeolian (Natural Minor)`;
      spicyScale = semitones === 5 ? `${root} Melodic Minor` : `${root} Dorian`;
    }

    return {
      symbol: chordSym,
      root,
      quality,
      chord_tones: tones,
      guide_tones: guideTones,
      roman_numeral: roman,
      harmonic_function: func,
      pedagogical_insight: insight,
      common_tones_with_next: commonTones,
      voice_leading_to_next: voiceLeadingSteps,
      recommended_scales: {
        parent: `${key} ${mode === 'major' ? 'Major' : 'Natural Minor'}`,
        modal: modalScale,
        blues: `${root} Minor Blues`,
        spicy: spicyScale,
      },
    };
  });

  return {
    key,
    mode,
    confidence: 0.9,
    total_bars,
    chords: analyzedChords,
    summary_description: `Key of ${key} ${mode} with ${chords.length} chord changes.`,
  };
}


