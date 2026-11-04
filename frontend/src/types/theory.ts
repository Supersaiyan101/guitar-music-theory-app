/**
 * Theory TypeScript Type Contracts for Guitar Theory Kingdom
 * Strictly aligned with Phase 1 Python Deterministic Theory Core
 */

export type NoteName =
  | 'C'
  | 'C#'
  | 'Db'
  | 'D'
  | 'D#'
  | 'Eb'
  | 'E'
  | 'F'
  | 'F#'
  | 'Gb'
  | 'G'
  | 'G#'
  | 'Ab'
  | 'A'
  | 'A#'
  | 'Bb'
  | 'B';

export type NaturalNote = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

export type IntervalDegree =
  | '1'
  | 'b2'
  | '2'
  | 'b3'
  | '3'
  | '4'
  | 'b5'
  | '5'
  | '#5'
  | '6'
  | 'bb7'
  | 'b7'
  | '7'
  | 'b9'
  | '9'
  | '#9'
  | '11'
  | '#11'
  | 'b13'
  | '13';

export type TuningName =
  | 'Standard'
  | 'Drop D'
  | 'Eb Standard'
  | 'D Standard'
  | 'DADGAD'
  | 'Open G';

export interface TuningConfig {
  name: TuningName;
  description: string;
  strings: string[]; // High E (String 1) to Low E (String 6) with octaves, e.g. ['E4', 'B3', 'G3', 'D3', 'A2', 'E2']
}

export type ScaleCategory =
  | 'diatonic'
  | 'pentatonic_blues'
  | 'modes'
  | 'soloing_hybrid';

export type ScaleType =
  // Diatonic
  | 'major'
  | 'natural_minor'
  | 'harmonic_minor'
  | 'melodic_minor'
  // Pentatonic & Blues
  | 'major_pentatonic'
  | 'minor_pentatonic'
  | 'blues'
  // Church Modes
  | 'dorian'
  | 'phrygian'
  | 'lydian'
  | 'mixolydian'
  | 'locrian'
  // Intermediate / Advanced Soloing
  | 'phrygian_dominant'
  | 'bebop_dominant'
  | 'hybrid_blues';

export interface ScaleDefinition {
  id: ScaleType;
  name: string;
  category: ScaleCategory;
  formula: number[]; // semitone offsets from root
  degrees: IntervalDegree[];
  description: string;
}

export type ChordType =
  // Basic Triads & Power
  | 'maj'
  | 'min'
  | 'dim'
  | 'aug'
  | '5'
  | 'sus2'
  | 'sus4'
  // 7th Chords
  | '7'
  | 'maj7'
  | 'min7'
  | 'm7b5'
  | 'dim7'
  // Extensions
  | 'add9'
  | '9'
  | 'min9'
  | 'maj9'
  | '11'
  | '13'
  | '7b9'
  | '7#9'
  // Guitar Special Voicings (Phase 1 features)
  | 'hendrix_sus4'
  | 'shell_voicing'
  | 'spread_triad';

export interface ChordDefinition {
  id: ChordType;
  name: string;
  symbol: string;
  formula: number[]; // semitone offsets
  degrees: IntervalDegree[];
  description: string;
}

export type CagedShape = 'C' | 'A' | 'G' | 'E' | 'D';
export type ThreeNpsShape = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type TriadStringSet = '123' | '234' | '345';

export type SoloOverlay =
  | 'none'
  | 'caged'
  | 'three_nps'
  | 'bb_king_box'
  | 'albert_king_box'
  | 'diagonal_highway'
  | 'triads';

export type StringOrientation = 'tab' | 'player'; // tab = Low E on bottom; player = Low E on top
export type Handedness = 'right' | 'left'; // left flips the nut to the right
export type FretRange = 'full' | 'open_to_12' | 'upper_12_24' | 'box_focus';
export type AccidentalMode = 'auto' | 'sharps' | 'flats';
export type DisplayMode = 'notes' | 'intervals';
export type DensityMode = 'isolated' | 'ghost' | 'all';
export type TonePreset = 'electric_clean' | 'acoustic_steel';
export type PlayDirection = 'ascending' | 'descending' | 'both';

export interface FretCoordinate {
  stringNumber: number; // 1 (High E) to 6 (Low E)
  fretNumber: number;   // 0 to 24
  note: NoteName;
  octave: number;
  pitchWithOctave: string; // e.g. "A4"
  frequency: number;       // in Hz
  degree?: IntervalDegree;
  isRoot?: boolean;
  isInOverlay?: boolean;
}

export interface InspectedFretInfo {
  coordinate: FretCoordinate;
  degreeName?: string;
  roleInChordOrScale?: string;
  cagedShapes?: CagedShape[];
}

export interface CagedAnchor {
  shape: CagedShape;
  rootString: number;
  rootFret: number;
  fretSpan: [number, number];
}

// ---------------------------------------------------------------------------
// Phase 3 Progression & Voice-Leading Contracts
// ---------------------------------------------------------------------------

export type HarmonicFunction =
  | 'Tonic'
  | 'Subdominant'
  | 'Dominant'
  | 'Secondary Dominant'
  | 'Modal Interchange'
  | 'Tritone Substitution'
  | 'Neapolitan'
  | 'Passing';

export type VoiceLeadingMovement =
  | 'common_tone'
  | 'half_step_down'
  | 'half_step_up'
  | 'whole_step_down'
  | 'whole_step_up'
  | 'leap';

export interface VoiceLeadingStep {
  from_note: string;
  from_degree: string;
  to_note: string;
  to_degree: string;
  semitone_distance: number;
  movement_type: VoiceLeadingMovement;
  is_guide_tone_resolution: boolean;
}

export interface ScaleRecommendations {
  parent: string;
  modal: string;
  blues: string;
  spicy: string;
}

export interface ChordAnalysis {
  symbol: string;
  root: string;
  quality: string;
  chord_tones: string[];
  guide_tones: string[];
  roman_numeral: string;
  harmonic_function: HarmonicFunction;
  pedagogical_insight: string;
  common_tones_with_next: string[];
  voice_leading_to_next: VoiceLeadingStep[];
  recommended_scales: ScaleRecommendations;
}

export interface ProgressionAnalysisResult {
  key: string;
  mode: string;
  confidence: number;
  total_bars: number;
  chords: ChordAnalysis[];
  summary_description: string;
}

export type SongGenre =
  | 'classic_rock'
  | 'blues_funk'
  | 'jazz_neosoul'
  | 'pop_modern'
  | 'custom';

export type SongDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface SongBarChord {
  chord: string;
  beats: number;
}

export interface SongProgression {
  id: string;
  title: string;
  artist?: string;
  genre: SongGenre;
  difficulty: SongDifficulty;
  default_tempo: number;
  time_signature: string;
  key: string;
  mode: 'major' | 'minor';
  bars: SongBarChord[][];
  chords_sequence: string[];
  chord_durations: number[];
  soloing_tip: string;
  iconic_tone?: string;
}


