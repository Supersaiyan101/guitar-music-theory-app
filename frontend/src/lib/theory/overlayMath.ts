import { NoteName, CagedShape, ThreeNpsShape, TriadStringSet } from '@/types/theory';
import { noteToPitchClass } from './pitchMath';

export interface OverlayFretSpan {
  minFret: number;
  maxFret: number;
}

export interface CagedShapeData {
  shape: CagedShape;
  fretSpan: [number, number];
  rootCoordinates: Array<{ stringNumber: number; fretNumber: number }>;
  color: string;
}

export interface SlideVector {
  stringNumber: number;
  fromFret: number;
  toFret: number;
}

export interface DiagonalHighwayData {
  fretSpan: [number, number];
  notes: Array<{ stringNumber: number; fretNumber: number }>;
  slides: SlideVector[];
}

export interface BbKingBoxData {
  fretSpan: [number, number];
  root: { stringNumber: number; fretNumber: number };
  bendNotes: Array<{ stringNumber: number; fretNumber: number; label: string; bendType: string }>;
  slipNotes: Array<{ stringNumber: number; fretNumber: number; label: string }>;
  notes: Array<{ stringNumber: number; fretNumber: number }>;
}

export interface AlbertKingBoxData {
  fretSpan: [number, number];
  root: { stringNumber: number; fretNumber: number };
  cryBendNote: { stringNumber: number; fretNumber: number; label: string };
  notes: Array<{ stringNumber: number; fretNumber: number }>;
}

export interface ThreeNpsShapeData {
  shapeIndex: ThreeNpsShape;
  modeName: string;
  fretSpan: [number, number];
  notes: Array<{ stringNumber: number; fretNumber: number }>;
}

export interface TriadShapeData {
  inversion: string;
  fretSpan: [number, number];
  notes: Array<{ stringNumber: number; fretNumber: number; degree: string }>;
}

// Colors for the 5 interlocking CAGED shapes
export const CAGED_COLORS: Record<CagedShape, { fill: string; stroke: string; label: string }> = {
  C: { fill: 'rgba(239, 68, 68, 0.12)', stroke: '#ef4444', label: 'C Shape' },
  A: { fill: 'rgba(59, 130, 246, 0.12)', stroke: '#3b82f6', label: 'A Shape' },
  G: { fill: 'rgba(16, 185, 129, 0.12)', stroke: '#10b981', label: 'G Shape' },
  E: { fill: 'rgba(245, 158, 11, 0.12)', stroke: '#f59e0b', label: 'E Shape' },
  D: { fill: 'rgba(168, 85, 247, 0.12)', stroke: '#a855f7', label: 'D Shape' },
};

// 1. Calculate CAGED shapes across standard tuning
export function getCagedOverlays(rootKey: NoteName): Record<CagedShape, CagedShapeData> {
  const rootPc = noteToPitchClass(rootKey);
  // Standard tuning open string pitch classes: [E=4, B=11, G=7, D=2, A=9, E=4]
  // Root frets on primary strings:
  // Shape E root is on String 6 & 1: (rootPc - 4 + 12) % 12
  const s6RootFret = (rootPc - 4 + 12) % 12;
  // Shape A root is on String 5: (rootPc - 9 + 12) % 12
  const s5RootFret = (rootPc - 9 + 12) % 12;
  // Shape D root is on String 4: (rootPc - 2 + 12) % 12
  const s4RootFret = (rootPc - 2 + 12) % 12;
  // Shape G root is on String 6: same as s6RootFret
  // Shape C root is on String 5: same as s5RootFret

  const result: Record<CagedShape, CagedShapeData> = {
    // Shape C: root on string 5 and string 2
    C: {
      shape: 'C',
      fretSpan: [Math.max(0, s5RootFret - 3), s5RootFret + 1],
      rootCoordinates: [
        { stringNumber: 5, fretNumber: s5RootFret },
        { stringNumber: 2, fretNumber: (s5RootFret - 2 + 12) % 12 },
      ],
      color: CAGED_COLORS.C.stroke,
    },
    // Shape A: root on string 5 and string 3
    A: {
      shape: 'A',
      fretSpan: [s5RootFret, s5RootFret + 3],
      rootCoordinates: [
        { stringNumber: 5, fretNumber: s5RootFret },
        { stringNumber: 3, fretNumber: (s5RootFret + 2) % 12 },
      ],
      color: CAGED_COLORS.A.stroke,
    },
    // Shape G: root on string 6, string 3, string 1
    G: {
      shape: 'G',
      fretSpan: [Math.max(0, s6RootFret - 3), s6RootFret + 1],
      rootCoordinates: [
        { stringNumber: 6, fretNumber: s6RootFret },
        { stringNumber: 3, fretNumber: (s6RootFret - 3 + 12) % 12 },
        { stringNumber: 1, fretNumber: s6RootFret },
      ],
      color: CAGED_COLORS.G.stroke,
    },
    // Shape E: root on string 6, string 4, string 1
    E: {
      shape: 'E',
      fretSpan: [s6RootFret, s6RootFret + 3],
      rootCoordinates: [
        { stringNumber: 6, fretNumber: s6RootFret },
        { stringNumber: 4, fretNumber: (s6RootFret + 2) % 12 },
        { stringNumber: 1, fretNumber: s6RootFret },
      ],
      color: CAGED_COLORS.E.stroke,
    },
    // Shape D: root on string 4 and string 2
    D: {
      shape: 'D',
      fretSpan: [s4RootFret, s4RootFret + 3],
      rootCoordinates: [
        { stringNumber: 4, fretNumber: s4RootFret },
        { stringNumber: 2, fretNumber: (s4RootFret + 3) % 12 },
      ],
      color: CAGED_COLORS.D.stroke,
    },
  };

  return result;
}

// 2. The Diagonal Pentatonic Highway (Breaking Box 1)
export function getDiagonalHighway(rootKey: NoteName): DiagonalHighwayData {
  const rootPc = noteToPitchClass(rootKey);
  const s6Root = (rootPc - 4 + 12) % 12;

  // Box 5 on String 6: [s6Root - 2, s6Root]
  const n6 = [s6Root - 2, s6Root].map((f) => (f < 0 ? f + 12 : f));
  // Slide on String 5: [s6Root - 2, s6Root, s6Root + 2]
  const n5 = [s6Root - 2, s6Root, s6Root + 2].map((f) => (f < 0 ? f + 12 : f));
  // String 4: [s6Root, s6Root + 2]
  const n4 = [s6Root, s6Root + 2];
  // Slide on String 3: [s6Root, s6Root + 2, s6Root + 4]
  const n3 = [s6Root, s6Root + 2, s6Root + 4];
  // String 2: [s6Root + 3, s6Root + 5]
  const n2 = [s6Root + 3, s6Root + 5];
  // Slide on String 1: [s6Root + 3, s6Root + 5, s6Root + 7]
  const n1 = [s6Root + 3, s6Root + 5, s6Root + 7];

  const notes: Array<{ stringNumber: number; fretNumber: number }> = [];
  n6.forEach((f) => notes.push({ stringNumber: 6, fretNumber: f }));
  n5.forEach((f) => notes.push({ stringNumber: 5, fretNumber: f }));
  n4.forEach((f) => notes.push({ stringNumber: 4, fretNumber: f }));
  n3.forEach((f) => notes.push({ stringNumber: 3, fretNumber: f }));
  n2.forEach((f) => notes.push({ stringNumber: 2, fretNumber: f }));
  n1.forEach((f) => notes.push({ stringNumber: 1, fretNumber: f }));

  const slides: SlideVector[] = [
    { stringNumber: 5, fromFret: n5[1], toFret: n5[2] },
    { stringNumber: 3, fromFret: n3[1], toFret: n3[2] },
    { stringNumber: 1, fromFret: n1[1], toFret: n1[2] },
  ];

  const allFrets = notes.map((n) => n.fretNumber);
  const minFret = Math.max(0, Math.min(...allFrets));
  const maxFret = Math.min(24, Math.max(...allFrets));

  return {
    fretSpan: [minFret, maxFret],
    notes,
    slides,
  };
}

// 3. The B.B. King Box (Strings 1 & 2 Sweet Spot)
export function getBbKingBox(rootKey: NoteName): BbKingBoxData {
  const rootPc = noteToPitchClass(rootKey);
  // Root on String 2 (B string): open B is 11
  let s2Root = (rootPc - 11 + 12) % 12;
  // If root is low (e.g. frets 0-3), place it in comfortable soloing register (octave higher at +12)
  if (s2Root < 5) s2Root += 12;

  const notes: Array<{ stringNumber: number; fretNumber: number }> = [
    { stringNumber: 2, fretNumber: s2Root },     // Root
    { stringNumber: 2, fretNumber: s2Root - 2 }, // 4th
    { stringNumber: 1, fretNumber: s2Root - 2 }, // 5th
    { stringNumber: 1, fretNumber: s2Root },     // Major 6th (Signature Bend!)
    { stringNumber: 1, fretNumber: s2Root + 2 }, // 9th extension
    { stringNumber: 3, fretNumber: s2Root - 1 }, // b3
    { stringNumber: 3, fretNumber: s2Root },     // Major 3rd slip
  ];

  return {
    fretSpan: [s2Root - 3, s2Root + 3],
    root: { stringNumber: 2, fretNumber: s2Root },
    bendNotes: [
      {
        stringNumber: 1,
        fretNumber: s2Root,
        label: 'Maj 6th Bend',
        bendType: 'Full Bend to b7 / Root',
      },
    ],
    slipNotes: [
      {
        stringNumber: 3,
        fretNumber: s2Root,
        label: 'Maj 3rd Slip',
      },
    ],
    notes,
  };
}

// 4. The Albert King Box (High-Register Cry Bends)
export function getAlbertKingBox(rootKey: NoteName): AlbertKingBoxData {
  const rootPc = noteToPitchClass(rootKey);
  // Albert King Box anchored around high string 1 & 2
  let s1Root = (rootPc - 4 + 12) % 12;
  if (s1Root < 8) s1Root += 12; // High-register soloing territory

  const notes: Array<{ stringNumber: number; fretNumber: number }> = [
    { stringNumber: 1, fretNumber: s1Root },     // Root
    { stringNumber: 1, fretNumber: s1Root + 3 }, // Minor 3rd high cry
    { stringNumber: 2, fretNumber: s1Root + 1 }, // b7 (1.5-step cry bend)
    { stringNumber: 2, fretNumber: s1Root - 2 }, // 5th
    { stringNumber: 3, fretNumber: s1Root },     // 4th
  ];

  return {
    fretSpan: [s1Root - 3, s1Root + 4],
    root: { stringNumber: 1, fretNumber: s1Root },
    cryBendNote: {
      stringNumber: 2,
      fretNumber: s1Root + 1,
      label: '1.5-Step Overbend',
    },
    notes,
  };
}

// 5. 3-Notes-Per-String (3NPS) 7 Modal Speed Shapes
export const THREE_NPS_MODES: Record<ThreeNpsShape, string> = {
  1: 'Ionian (Major)',
  2: 'Dorian (Minor 6th)',
  3: 'Phrygian (Dark b2)',
  4: 'Lydian (#4 Dreamy)',
  5: 'Mixolydian (Dominant)',
  6: 'Aeolian (Natural Minor)',
  7: 'Locrian (Diminished)',
};

export function getThreeNpsShape(
  rootKey: NoteName,
  shapeIndex: ThreeNpsShape
): ThreeNpsShapeData {
  const rootPc = noteToPitchClass(rootKey);
  // Starting fret on String 6:
  // Shape 1 (Ionian) starts on Root: (rootPc - 4 + 12) % 12
  let baseFret = (rootPc - 4 + 12) % 12;
  // Offset based on modal degree (0, 2, 4, 5, 7, 9, 11)
  const modeOffsets = [0, 0, 2, 4, 5, 7, 9, 11];
  const offset = modeOffsets[shapeIndex];
  let startFret = (baseFret + offset) % 12;
  if (startFret < 3) startFret += 12;

  // Generate 3 notes per string
  const notes: Array<{ stringNumber: number; fretNumber: number }> = [];
  for (let str = 6; str >= 1; str--) {
    const f1 = startFret + (6 - str);
    notes.push({ stringNumber: str, fretNumber: f1 });
    notes.push({ stringNumber: str, fretNumber: f1 + 2 });
    notes.push({ stringNumber: str, fretNumber: f1 + 4 });
  }

  const allFrets = notes.map((n) => n.fretNumber);
  const minFret = Math.min(...allFrets);
  const maxFret = Math.max(...allFrets);

  return {
    shapeIndex,
    modeName: THREE_NPS_MODES[shapeIndex],
    fretSpan: [minFret, maxFret],
    notes,
  };
}

// 6. Movable Triad Inversions
export function getMovableTriadInversions(
  rootKey: NoteName,
  stringSet: TriadStringSet
): TriadShapeData[] {
  const rootPc = noteToPitchClass(rootKey);
  // Calculate root, 1st, and 2nd inversions for string set
  // e.g. for string set '123' (G, B, High E strings):
  let base = (rootPc - 7 + 12) % 12; // Root on String 3
  if (base < 3) base += 12;

  return [
    {
      inversion: 'Root Position (1 - 3 - 5)',
      fretSpan: [base, base + 4],
      notes: [
        { stringNumber: 3, fretNumber: base, degree: '1' },
        { stringNumber: 2, fretNumber: base + 2, degree: '3' },
        { stringNumber: 1, fretNumber: base + 3, degree: '5' },
      ],
    },
    {
      inversion: '1st Inversion (3 - 5 - 1)',
      fretSpan: [base + 4, base + 8],
      notes: [
        { stringNumber: 3, fretNumber: base + 4, degree: '3' },
        { stringNumber: 2, fretNumber: base + 5, degree: '5' },
        { stringNumber: 1, fretNumber: base + 8, degree: '1' },
      ],
    },
    {
      inversion: '2nd Inversion (5 - 1 - 3)',
      fretSpan: [base + 7, base + 12],
      notes: [
        { stringNumber: 3, fretNumber: base + 7, degree: '5' },
        { stringNumber: 2, fretNumber: base + 10, degree: '1' },
        { stringNumber: 1, fretNumber: base + 12, degree: '3' },
      ],
    },
  ];
}

