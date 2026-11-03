import { create } from 'zustand';
import {
  NoteName,
  TuningName,
  ScaleType,
  ChordType,
  DisplayMode,
  DensityMode,
  AccidentalMode,
  SoloOverlay,
  CagedShape,
  ThreeNpsShape,
  TriadStringSet,
  StringOrientation,
  Handedness,
  FretRange,
  InspectedFretInfo,
} from '@/types/theory';
import { soundEngine } from '@/lib/audio/soundEngine';

export interface TheoryState {
  // Musical Context
  currentKey: NoteName;
  tuning: TuningName;
  activeScale: ScaleType | null;
  activeChord: ChordType | null;

  // Visual & Fretboard Display Modes
  displayMode: DisplayMode;
  densityMode: DensityMode;
  highlightChordTones: boolean;
  accidentalMode: AccidentalMode;
  activeOverlay: SoloOverlay;
  cagedShape: CagedShape;
  cagedShowAll: boolean;
  threeNpsShape: ThreeNpsShape;
  triadStringSet: TriadStringSet;
  stringOrientation: StringOrientation;
  handedness: Handedness;
  fretRange: FretRange;

  // Interactive Inspection & Octave GPS
  highlightedOctaveNote: NoteName | null;
  inspectedFret: InspectedFretInfo | null;

  // Playback & Sound
  playbackBpm: number;
  isPlaying: boolean;
  isMuted: boolean;
  audioReady: boolean;
  activePlayingPin: { stringNumber: number; fretNumber: number } | null;

  // Actions
  setKey: (key: NoteName) => void;
  setTuning: (tuning: TuningName) => void;
  setScale: (scale: ScaleType | null) => void;
  setChord: (chord: ChordType | null) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setDensityMode: (mode: DensityMode) => void;
  setHighlightChordTones: (highlight: boolean) => void;
  setAccidentalMode: (mode: AccidentalMode) => void;
  setOverlay: (overlay: SoloOverlay) => void;
  setCagedShape: (shape: CagedShape) => void;
  setCagedShowAll: (showAll: boolean) => void;
  setThreeNpsShape: (shape: ThreeNpsShape) => void;
  setTriadStringSet: (set: TriadStringSet) => void;
  setStringOrientation: (orientation: StringOrientation) => void;
  setHandedness: (handedness: Handedness) => void;
  setFretRange: (range: FretRange) => void;
  setHighlightedOctaveNote: (note: NoteName | null) => void;
  setInspectedFret: (info: InspectedFretInfo | null) => void;
  setPlaybackBpm: (bpm: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setMuted: (muted: boolean) => void;
  setAudioReady: (ready: boolean) => void;
  setActivePlayingPin: (pin: { stringNumber: number; fretNumber: number } | null) => void;
  playFretAudio: (pitchWithOctave: string) => Promise<void>;
  resetDefaults: () => void;
}

const DEFAULT_STATE = {
  currentKey: 'A' as NoteName,
  tuning: 'Standard' as TuningName,
  activeScale: 'minor_pentatonic' as ScaleType | null,
  activeChord: null as ChordType | null,
  displayMode: 'notes' as DisplayMode,
  densityMode: 'isolated' as DensityMode,
  highlightChordTones: false,
  accidentalMode: 'auto' as AccidentalMode,
  activeOverlay: 'none' as SoloOverlay,
  cagedShape: 'A' as CagedShape,
  cagedShowAll: false,
  threeNpsShape: 1 as ThreeNpsShape,
  triadStringSet: '123' as TriadStringSet,
  stringOrientation: 'tab' as StringOrientation,
  handedness: 'right' as Handedness,
  fretRange: 'full' as FretRange,
  highlightedOctaveNote: null as NoteName | null,
  inspectedFret: null as InspectedFretInfo | null,
  playbackBpm: 120,
  isPlaying: false,
  isMuted: false,
  audioReady: false,
  activePlayingPin: null as { stringNumber: number; fretNumber: number } | null,
};

export const useTheoryStore = create<TheoryState>((set, get) => ({
  ...DEFAULT_STATE,

  setKey: (key: NoteName) => {
    set({ currentKey: key });
    // If an inspected fret is active, clear it so there's no stale role
    if (get().inspectedFret) {
      set({ inspectedFret: null });
    }
  },

  setTuning: (tuning: TuningName) => set({ tuning }),

  setScale: (scale: ScaleType | null) => {
    // When activating a scale, deactivate chord mode to keep context focused
    set({ activeScale: scale, activeChord: null });
  },

  setChord: (chord: ChordType | null) => {
    // When activating a chord, deactivate scale mode
    set({ activeChord: chord, activeScale: null });
  },

  setDisplayMode: (mode: DisplayMode) => set({ displayMode: mode }),

  setDensityMode: (mode: DensityMode) => set({ densityMode: mode }),

  setHighlightChordTones: (highlight: boolean) => set({ highlightChordTones: highlight }),

  setAccidentalMode: (mode: AccidentalMode) => set({ accidentalMode: mode }),

  setOverlay: (overlay: SoloOverlay) => set({ activeOverlay: overlay }),

  setCagedShape: (shape: CagedShape) => set({ cagedShape: shape }),

  setCagedShowAll: (showAll: boolean) => set({ cagedShowAll: showAll }),

  setThreeNpsShape: (shape: ThreeNpsShape) => set({ threeNpsShape: shape }),

  setTriadStringSet: (setGroup: TriadStringSet) => set({ triadStringSet: setGroup }),

  setStringOrientation: (orientation: StringOrientation) =>
    set({ stringOrientation: orientation }),

  setHandedness: (handedness: Handedness) => set({ handedness }),

  setFretRange: (fretRange: FretRange) => set({ fretRange }),

  setHighlightedOctaveNote: (note: NoteName | null) =>
    set({ highlightedOctaveNote: note }),

  setInspectedFret: (info: InspectedFretInfo | null) =>
    set({ inspectedFret: info }),

  setPlaybackBpm: (bpm: number) =>
    set({ playbackBpm: Math.min(240, Math.max(40, bpm)) }),

  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),

  setMuted: (muted: boolean) => {
    soundEngine.setMuted(muted);
    set({ isMuted: muted });
  },

  setAudioReady: (ready: boolean) => set({ audioReady: ready }),

  setActivePlayingPin: (pin: { stringNumber: number; fretNumber: number } | null) =>
    set({ activePlayingPin: pin }),

  playFretAudio: async (pitchWithOctave: string) => {
    await soundEngine.playNote(pitchWithOctave);
    if (!get().audioReady) {
      set({ audioReady: true });
    }
  },

  resetDefaults: () => set(DEFAULT_STATE),
}));
