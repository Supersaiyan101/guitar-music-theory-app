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
  TonePreset,
  PlayDirection,
  SongProgression,
  ProgressionAnalysisResult,
} from '@/types/theory';
import { soundEngine } from '@/lib/audio/soundEngine';
import { CURATED_SONGS } from '@/lib/theory/songLibrary';
import { analyzeProgressionClient } from '@/lib/theory/progressionParser';

export interface TheoryState {
  // Studio View Mode (Phase 2 Explorer vs Phase 3 Song Progression)
  studioMode: 'explorer' | 'progression';

  // Musical Context
  currentKey: NoteName;
  tuning: TuningName;
  activeScale: ScaleType | null;
  activeChord: ChordType | null;

  // Phase 3 Progression State
  activeProgression: SongProgression;
  progressionAnalysis: ProgressionAnalysisResult | null;
  currentBarIndex: number;
  currentChordIndex: number;
  currentBeat: number;
  isProgressionPlaying: boolean;
  isProgressionLooping: boolean;
  progressionBpm: number;
  isCustomModalOpen: boolean;

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
  isDroneActive: boolean;
  tonePreset: TonePreset;
  playDirection: PlayDirection;
  activePlayingPin: { stringNumber: number; fretNumber: number } | null;

  // Actions
  setStudioMode: (mode: 'explorer' | 'progression') => void;
  loadProgression: (progression: SongProgression) => void;
  setBarIndex: (index: number) => void;
  setChordIndex: (index: number) => void;
  setCurrentBeat: (beat: number) => void;
  setIsProgressionPlaying: (playing: boolean) => void;
  setIsProgressionLooping: (looping: boolean) => void;
  setProgressionBpm: (bpm: number) => void;
  setIsCustomModalOpen: (open: boolean) => void;
  nextBar: () => void;
  prevBar: () => void;
  applyScaleFromHud: (scaleName: string) => void;

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
  setTonePreset: (preset: TonePreset) => void;
  setPlayDirection: (dir: PlayDirection) => void;
  toggleDrone: () => Promise<void>;
  stopPlayback: () => void;
  setActivePlayingPin: (pin: { stringNumber: number; fretNumber: number } | null) => void;
  playFretAudio: (pitchWithOctave: string) => Promise<void>;
  resetDefaults: () => void;
}

const DEFAULT_STATE = {
  // Phase 3 Progression Mode Defaults
  studioMode: 'explorer' as 'explorer' | 'progression',
  activeProgression: CURATED_SONGS[0],
  progressionAnalysis: analyzeProgressionClient(
    CURATED_SONGS[0].chords_sequence,
    CURATED_SONGS[0].key,
    CURATED_SONGS[0].mode,
    CURATED_SONGS[0].chord_durations
  ),
  currentBarIndex: 0,
  currentChordIndex: 0,
  currentBeat: 1,
  isProgressionPlaying: false,
  isProgressionLooping: true,
  progressionBpm: CURATED_SONGS[0].default_tempo,
  isCustomModalOpen: false,

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
  isDroneActive: false,
  tonePreset: 'electric_clean' as TonePreset,
  playDirection: 'ascending' as PlayDirection,
  activePlayingPin: null as { stringNumber: number; fretNumber: number } | null,
};

export const useTheoryStore = create<TheoryState>((set, get) => ({
  ...DEFAULT_STATE,

  setStudioMode: (studioMode: 'explorer' | 'progression') => set({ studioMode }),

  loadProgression: (progression: SongProgression) => {
    const analysis = analyzeProgressionClient(
      progression.chords_sequence,
      progression.key,
      progression.mode,
      progression.chord_durations
    );
    set({
      activeProgression: progression,
      progressionAnalysis: analysis,
      currentBarIndex: 0,
      currentChordIndex: 0,
      currentBeat: 1,
      progressionBpm: progression.default_tempo,
      isProgressionPlaying: false,
    });
    if (progression.chords_sequence.length > 0) {
      get().setChordIndex(0);
    }
  },

  setBarIndex: (barIndex: number) => {
    const { activeProgression } = get();
    const clamped = Math.max(0, Math.min(activeProgression.bars.length - 1, barIndex));
    let chordIdx = 0;
    for (let b = 0; b < clamped; b++) {
      chordIdx += activeProgression.bars[b].length;
    }
    set({ currentBarIndex: clamped, currentChordIndex: chordIdx, currentBeat: 1 });
    get().setChordIndex(chordIdx);
  },

  setChordIndex: (chordIndex: number) => {
    const { activeProgression } = get();
    const clamped = Math.max(0, Math.min(activeProgression.chords_sequence.length - 1, chordIndex));
    const chordSym = activeProgression.chords_sequence[clamped];

    let count = 0;
    let foundBar = 0;
    for (let b = 0; b < activeProgression.bars.length; b++) {
      const barLen = activeProgression.bars[b].length;
      if (clamped >= count && clamped < count + barLen) {
        foundBar = b;
        break;
      }
      count += barLen;
    }

    set({ currentChordIndex: clamped, currentBarIndex: foundBar });

    let root = chordSym[0].toUpperCase();
    let rest = chordSym.slice(1);
    if (rest.startsWith('#') || rest.startsWith('b')) {
      root += rest[0];
      rest = rest.slice(1);
    }
    let quality: ChordType = 'maj';
    if (rest.includes('m7b5')) quality = 'm7b5';
    else if (rest.includes('dim7')) quality = 'dim7';
    else if (rest.includes('maj7')) quality = 'maj7';
    else if (rest.includes('m7') || rest.includes('min7')) quality = 'min7';
    else if (rest.includes('7#9')) quality = '7#9';
    else if (rest.includes('7b9')) quality = '7b9';
    else if (rest.includes('7')) quality = '7';
    else if (rest.includes('m') || rest.includes('min')) quality = 'min';
    else if (rest.includes('dim')) quality = 'dim';
    else if (rest.includes('sus4')) quality = 'sus4';
    else if (rest.includes('sus2')) quality = 'sus2';
    else if (rest.includes('add9')) quality = 'add9';
    else if (rest.includes('9')) quality = '9';
    else if (rest.includes('13')) quality = '13';

    set({
      currentKey: root as NoteName,
      activeChord: quality,
      activeScale: null,
      highlightChordTones: true,
    });
  },

  setCurrentBeat: (beat: number) => set({ currentBeat: beat }),
  setIsProgressionPlaying: (isProgressionPlaying: boolean) => set({ isProgressionPlaying }),
  setIsProgressionLooping: (isProgressionLooping: boolean) => set({ isProgressionLooping }),
  setProgressionBpm: (progressionBpm: number) => set({ progressionBpm }),
  setIsCustomModalOpen: (isCustomModalOpen: boolean) => set({ isCustomModalOpen }),

  nextBar: () => {
    const { currentBarIndex, activeProgression } = get();
    const next = (currentBarIndex + 1) % activeProgression.bars.length;
    get().setBarIndex(next);
  },

  prevBar: () => {
    const { currentBarIndex, activeProgression } = get();
    const prev = (currentBarIndex - 1 + activeProgression.bars.length) % activeProgression.bars.length;
    get().setBarIndex(prev);
  },

  applyScaleFromHud: (scaleName: string) => {
    const parts = scaleName.split(' ');
    const root = parts[0] as NoteName;
    const rest = scaleName.slice(root.length).trim().toLowerCase();

    let targetScale: ScaleType = 'major';
    if (rest.includes('dorian')) targetScale = 'dorian';
    else if (rest.includes('mixolydian')) targetScale = 'mixolydian';
    else if (rest.includes('phrygian dominant')) targetScale = 'phrygian_dominant';
    else if (rest.includes('phrygian')) targetScale = 'phrygian';
    else if (rest.includes('lydian')) targetScale = 'lydian';
    else if (rest.includes('locrian')) targetScale = 'locrian';
    else if (rest.includes('minor blues') || rest.includes('blues')) targetScale = 'blues';
    else if (rest.includes('minor pentatonic')) targetScale = 'minor_pentatonic';
    else if (rest.includes('major pentatonic')) targetScale = 'major_pentatonic';
    else if (rest.includes('natural minor') || rest.includes('aeolian')) targetScale = 'natural_minor';
    else if (rest.includes('harmonic minor')) targetScale = 'harmonic_minor';
    else if (rest.includes('melodic minor')) targetScale = 'melodic_minor';
    else if (rest.includes('altered') || rest.includes('super locrian')) targetScale = 'phrygian_dominant';

    set({
      currentKey: root,
      activeScale: targetScale,
      activeChord: null,
    });
  },


  setKey: (key: NoteName) => {
    set({ currentKey: key });
    if (get().isDroneActive) {
      soundEngine.startDrone(key);
    }
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

  setTonePreset: (preset: TonePreset) => {
    soundEngine.setTonePreset(preset);
    set({ tonePreset: preset });
  },

  setPlayDirection: (playDirection: PlayDirection) => set({ playDirection }),

  toggleDrone: async () => {
    const nextState = !get().isDroneActive;
    if (nextState) {
      await soundEngine.startDrone(get().currentKey);
      set({ isDroneActive: true, audioReady: true });
    } else {
      soundEngine.stopDrone();
      set({ isDroneActive: false });
    }
  },

  stopPlayback: () => {
    soundEngine.stopSequence();
    set({ isPlaying: false, activePlayingPin: null });
  },

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
