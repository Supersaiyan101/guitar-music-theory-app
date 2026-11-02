"""Fretboard Matrix and CAGED System Engine for Guitar Theory Kingdom.

Maps physical guitar frets (0 to 24 frets across 6 strings) in Standard and alternate tunings.
Computes note coordinates, pitch octaves, scale/chord fretboard overlays,
and partitions the neck into the 5 interconnected CAGED boxes.
"""
from enum import Enum
from typing import Dict, List, Optional, Set, Tuple
from backend.app.schemas.theory import (
    CagedBoxDefinition,
    ChordDefinition,
    FretCoordinate,
    ScaleDefinition,
)
from backend.app.theory.pitch import (
    NotationMode,
    note_to_pitch_class,
    pitch_class_to_note,
    simplify_to_practical,
)
from backend.app.theory.intervals import (
    get_interval_between,
    interval_to_semitones,
)
from backend.app.theory.scales import get_scale
from backend.app.theory.chords import deconstruct_chord


class TuningPreset(str, Enum):
    STANDARD = "standard"        # E2, A2, D3, G3, B3, E4
    DROP_D = "drop_d"            # D2, A2, D3, G3, B3, E4
    HALF_STEP_DOWN = "eb_std"    # Eb2, Ab2, Db3, Gb3, Bb3, Eb4 (Hendrix / SRV)
    FULL_STEP_DOWN = "d_std"     # D2, G2, C3, F3, A3, D4
    DADGAD = "dadgad"            # D2, A2, D3, G3, A3, D4 (Celtic / Page)
    OPEN_G = "open_g"            # D2, G2, D3, G3, B3, D4 (Rolling Stones / Keith Richards)


# Open string note names, base octaves, and starting MIDI pitches
# Ordered from String 1 (High E) to String 6 (Low E)
TUNING_DEFINITIONS: Dict[TuningPreset, List[Tuple[str, int, int]]] = {
    TuningPreset.STANDARD: [
        ("E", 4, 64),  # String 1 (High E)
        ("B", 3, 59),  # String 2 (B)
        ("G", 3, 55),  # String 3 (G)
        ("D", 3, 50),  # String 4 (D)
        ("A", 2, 45),  # String 5 (A)
        ("E", 2, 40),  # String 6 (Low E)
    ],
    TuningPreset.DROP_D: [
        ("E", 4, 64),
        ("B", 3, 59),
        ("G", 3, 55),
        ("D", 3, 50),
        ("A", 2, 45),
        ("D", 2, 38),  # Low D
    ],
    TuningPreset.HALF_STEP_DOWN: [
        ("Eb", 4, 63),
        ("Bb", 3, 58),
        ("Gb", 3, 54),
        ("Db", 3, 49),
        ("Ab", 2, 44),
        ("Eb", 2, 39),
    ],
    TuningPreset.FULL_STEP_DOWN: [
        ("D", 4, 62),
        ("A", 3, 57),
        ("F", 3, 53),
        ("C", 3, 48),
        ("G", 2, 43),
        ("D", 2, 38),
    ],
    TuningPreset.DADGAD: [
        ("D", 4, 62),
        ("A", 3, 57),
        ("G", 3, 55),
        ("D", 3, 50),
        ("A", 2, 45),
        ("D", 2, 38),
    ],
    TuningPreset.OPEN_G: [
        ("D", 4, 62),
        ("B", 3, 59),
        ("G", 3, 55),
        ("D", 3, 50),
        ("G", 2, 43),
        ("D", 2, 38),
    ],
}


class FretboardMatrix:
    """Represents a 6-string guitar fretboard with 24 frets."""
    
    def __init__(
        self,
        tuning: TuningPreset = TuningPreset.STANDARD,
        num_frets: int = 24,
        mode: NotationMode = NotationMode.PRACTICAL
    ):
        self.tuning = tuning
        self.num_frets = num_frets
        self.mode = mode
        self.open_strings = TUNING_DEFINITIONS[tuning]
        # Precompute the complete physical matrix of notes
        self._matrix: List[List[FretCoordinate]] = self._build_matrix()

    def _build_matrix(self) -> List[List[FretCoordinate]]:
        """Computes every note, octave, and pitch class for all strings and frets."""
        matrix: List[List[FretCoordinate]] = []
        for str_idx, (open_note, open_oct, open_midi) in enumerate(self.open_strings):
            string_num = str_idx + 1  # 1 to 6
            open_pc = note_to_pitch_class(open_note)
            string_frets: List[FretCoordinate] = []
            
            for fret in range(self.num_frets + 1):
                fret_midi = open_midi + fret
                fret_pc = (open_pc + fret) % 12
                fret_octave = (fret_midi // 12) - 1
                
                # Format note name according to notation mode
                prefer_flats = (self.tuning in (TuningPreset.HALF_STEP_DOWN, TuningPreset.FULL_STEP_DOWN))
                raw_note = pitch_class_to_note(fret_pc, prefer_flats=prefer_flats)
                if self.mode == NotationMode.PRACTICAL:
                    raw_note = simplify_to_practical(raw_note)
                    
                coord = FretCoordinate(
                    string=string_num,
                    fret=fret,
                    note=raw_note,
                    pitch_class=fret_pc,
                    octave=fret_octave,
                    is_root=False,
                )
                string_frets.append(coord)
            matrix.append(string_frets)
        return matrix

    def get_coordinate(self, string: int, fret: int) -> FretCoordinate:
        """Returns the physical note coordinate at a given string and fret."""
        if not (1 <= string <= 6):
            raise ValueError(f"Invalid string number {string}. Must be 1 to 6.")
        if not (0 <= fret <= self.num_frets):
            raise ValueError(f"Invalid fret number {fret}. Must be 0 to {self.num_frets}.")
        return self._matrix[string - 1][fret].model_copy()

    def overlay_scale(
        self,
        scale: ScaleDefinition,
        max_fret: Optional[int] = None
    ) -> List[FretCoordinate]:
        """Projects all matching notes of a scale onto the fretboard."""
        limit_fret = max_fret if max_fret is not None else self.num_frets
        root_pc = note_to_pitch_class(scale.root)
        
        # Build pitch class to interval degree lookup
        pc_to_interval: Dict[int, str] = {}
        for note, interval in zip(scale.notes, scale.intervals):
            pc = note_to_pitch_class(note)
            pc_to_interval[pc] = interval
            
        matching_coords: List[FretCoordinate] = []
        for string_idx in range(6):
            for fret in range(limit_fret + 1):
                base_coord = self._matrix[string_idx][fret]
                if base_coord.pitch_class in pc_to_interval:
                    coord = base_coord.model_copy()
                    coord.interval = pc_to_interval[coord.pitch_class]
                    coord.is_root = (coord.pitch_class == root_pc)
                    matching_coords.append(coord)
        return matching_coords

    def overlay_chord(
        self,
        chord: ChordDefinition,
        max_fret: Optional[int] = None
    ) -> List[FretCoordinate]:
        """Projects all constituent chord tones of a chord onto the fretboard."""
        limit_fret = max_fret if max_fret is not None else self.num_frets
        root_pc = note_to_pitch_class(chord.root)
        
        # Build pitch class to interval degree lookup
        pc_to_interval: Dict[int, str] = {}
        for tone, interval in zip(chord.tones, chord.intervals):
            pc = note_to_pitch_class(tone)
            pc_to_interval[pc] = interval
            
        matching_coords: List[FretCoordinate] = []
        for string_idx in range(6):
            for fret in range(limit_fret + 1):
                base_coord = self._matrix[string_idx][fret]
                if base_coord.pitch_class in pc_to_interval:
                    coord = base_coord.model_copy()
                    coord.interval = pc_to_interval[coord.pitch_class]
                    coord.is_root = (coord.pitch_class == root_pc)
                    matching_coords.append(coord)
        return matching_coords

    def get_caged_box_spans(self, root_note: str) -> Dict[int, Tuple[str, Tuple[int, int]]]:
        """Calculates the 5 CAGED box fret spans for any root in standard tuning.
        
        The 5 interlocking shapes (C - A - G - E - D):
        Returns:
            Dict mapping box_number (1 to 5) to (shape_letter, (min_fret, max_fret))
        """
        root_pc = note_to_pitch_class(root_note)
        # In standard tuning, find where the root sits on String 6 (Low E, open pitch class 4)
        # e.g. For A: String 6 fret = (9 - 4) % 12 = 5
        e_string_root_fret = (root_pc - 4) % 12
        
        # Standard pentatonic box positions relative to the Low E root:
        # Box 1 (E-Shape): root on string 6 -> span [root_fret, root_fret + 3]
        # Box 2 (D-Shape): span [root_fret + 2, root_fret + 5]
        # Box 3 (C-Shape): span [root_fret + 4, root_fret + 7] (or 5 to 8)
        # Box 4 (A-Shape): span [root_fret + 7, root_fret + 10]
        # Box 5 (G-Shape): span [root_fret - 3, root_fret] (or +9 to +12)
        
        b1_min = e_string_root_fret
        b1_max = b1_min + 3
        
        b2_min = (b1_min + 2)
        b2_max = b2_min + 3
        
        b3_min = (b1_min + 5)
        b3_max = b3_min + 3
        
        b4_min = (b1_min + 7)
        b4_max = b4_min + 3
        
        b5_min = (b1_min + 9)
        b5_max = b5_min + 3
        
        return {
            1: ("E", (b1_min % 12, (b1_min % 12) + 3)),
            2: ("D", (b2_min % 12, (b2_min % 12) + 3)),
            3: ("C", (b3_min % 12, (b3_min % 12) + 3)),
            4: ("A", (b4_min % 12, (b4_min % 12) + 3)),
            5: ("G", (b5_min % 12, (b5_min % 12) + 3)),
        }

    def partition_scale_into_caged_boxes(
        self,
        scale: ScaleDefinition
    ) -> List[CagedBoxDefinition]:
        """Partitions all scale notes into the 5 interconnected CAGED boxes."""
        box_spans = self.get_caged_box_spans(scale.root)
        all_coords = self.overlay_scale(scale)
        
        boxes: List[CagedBoxDefinition] = []
        for box_num, (shape_letter, (min_fret, max_fret)) in box_spans.items():
            # Filter coordinates that fall within this box's fret span
            # Also support octave repetitions (frets 12+)
            box_coords = [
                c.model_copy(update={"caged_box": box_num})
                for c in all_coords
                if (min_fret <= (c.fret % 12) <= max_fret) and (c.fret <= 22)
            ]
            
            boxes.append(
                CagedBoxDefinition(
                    box_number=box_num,
                    shape_letter=shape_letter,
                    fret_span=(min_fret, max_fret),
                    coordinates=box_coords,
                )
            )
        return boxes

    def get_triad_shapes_on_strings(
        self,
        chord: ChordDefinition,
        string_set: Tuple[int, int, int] = (1, 2, 3),
        max_fret: int = 15
    ) -> List[List[FretCoordinate]]:
        """Finds all movable 3-note triad voicings for a chord on a specific 3-string set.
        
        Example: string_set=(1, 2, 3) finds all Root Position, 1st Inversion, and 2nd Inversion
        triads on the top 3 strings.
        """
        all_tones = self.overlay_chord(chord, max_fret=max_fret)
        s1, s2, s3 = string_set
        
        # Group coordinates by string
        notes_s1 = [c for c in all_tones if c.string == s1]
        notes_s2 = [c for c in all_tones if c.string == s2]
        notes_s3 = [c for c in all_tones if c.string == s3]
        
        triad_voicings: List[List[FretCoordinate]] = []
        
        # Search for compact 3-note grips within a 3-fret hand stretch
        for c3 in notes_s3:
            for c2 in notes_s2:
                for c1 in notes_s1:
                    # Pitch classes must be distinct and cover all 3 triad tones
                    pcs = {c1.pitch_class, c2.pitch_class, c3.pitch_class}
                    if len(pcs) == 3 and pcs == {note_to_pitch_class(t) for t in chord.tones[:3]}:
                        frets = [c1.fret, c2.fret, c3.fret]
                        # Must be playable within a 3 or 4 fret reach
                        if (max(frets) - min(frets)) <= 3:
                            triad_voicings.append([c3, c2, c1])
                            
        return triad_voicings
