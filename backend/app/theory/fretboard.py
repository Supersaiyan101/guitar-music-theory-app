"""Fretboard Matrix and CAGED System Engine for Guitar Theory Kingdom.

Maps physical guitar frets (0 to 24 frets across 6 strings) in Standard and alternate tunings.
Computes note coordinates, pitch octaves, scale/chord fretboard overlays,
and partitions the neck into the 5 interconnected CAGED boxes.
"""
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple
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
    transpose_note,
)
from backend.app.theory.intervals import (
    get_interval_between,
    interval_to_semitones,
    get_note_at_interval,
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

    def get_caged_root_anchors(self, root_note: str) -> Dict[str, List[Tuple[int, int]]]:
        """Calculates the (string, fret) anchor coordinates of the root note
        for all 5 CAGED shapes (C, A, G, E, D) in standard tuning.
        
        Each shape has 2 or 3 root anchors:
            - E Shape: Strings 6, 4, 1
            - D Shape: Strings 4, 2
            - C Shape: Strings 5, 2
            - A Shape: Strings 5, 3
            - G Shape: Strings 6, 3, 1
        """
        root_pc = note_to_pitch_class(root_note)
        # Low E string root fret (0 to 11)
        s6_fret = (root_pc - 4) % 12
        
        # Calculate root fret on each string
        s5_fret = (root_pc - 9) % 12
        s4_fret = (root_pc - 2) % 12
        s3_fret = (root_pc - 7) % 12
        s2_fret = (root_pc - 11) % 12
        s1_fret = (root_pc - 4) % 12
        
        # Interlocking spans
        # E Shape (Box 1): centered around s6_fret
        e_roots = [(6, s6_fret), (4, (s6_fret + 2) % 12), (1, s6_fret)]
        
        # D Shape (Box 2): centered around s4_fret
        d_roots = [(4, (s6_fret + 2) % 12), (2, (s6_fret + 5) % 12)]
        
        # C Shape (Box 3): centered around s2_fret
        c_roots = [(5, (s6_fret + 7) % 12), (2, (s6_fret + 5) % 12)]
        
        # A Shape (Box 4): centered around s5_fret
        a_roots = [(5, (s6_fret + 7) % 12), (3, (s6_fret + 9) % 12)]
        
        # G Shape (Box 5): centered around s6_fret / s3_fret
        g_roots = [(6, s6_fret), (3, (s6_fret + 9) % 12), (1, s6_fret)]
        
        return {
            "E": e_roots,
            "D": d_roots,
            "C": c_roots,
            "A": a_roots,
            "G": g_roots,
        }

    def get_caged_chord_voicing(
        self,
        root: str,
        shape: str,
        quality: str = "maj"
    ) -> List[FretCoordinate]:
        """Generates the full playable CAGED chord voicing for any shape
        (C, A, G, E, D) and chord quality (maj, min, 7, min7, maj7).
        """
        root_pc = note_to_pitch_class(root)
        shape_upper = shape.upper().strip()
        quality_lower = quality.lower().strip()
        
        # Base root frets on Low E (string 6) and A (string 5)
        s6_fret = (root_pc - 4) % 12
        s5_fret = (root_pc - 9) % 12
        s4_fret = (root_pc - 2) % 12
        
        string_fret_map: Dict[int, int] = {}
        
        if shape_upper == "E":
            f = s6_fret
            if quality_lower in ("maj", "major"):
                string_fret_map = {6: f, 5: f + 2, 4: f + 2, 3: f + 1, 2: f, 1: f}
            elif quality_lower in ("min", "m", "minor"):
                string_fret_map = {6: f, 5: f + 2, 4: f + 2, 3: f, 2: f, 1: f}
            elif quality_lower in ("7", "dom7"):
                string_fret_map = {6: f, 5: f + 2, 4: f, 3: f + 1, 2: f, 1: f}
            elif quality_lower in ("min7", "m7"):
                string_fret_map = {6: f, 5: f + 2, 4: f, 3: f, 2: f, 1: f}
            elif quality_lower in ("maj7", "major7"):
                string_fret_map = {6: f, 5: f + 2, 4: f + 1, 3: f + 1, 2: f, 1: f}
                
        elif shape_upper == "A":
            f = s5_fret
            if quality_lower in ("maj", "major"):
                string_fret_map = {5: f, 4: f + 2, 3: f + 2, 2: f + 2, 1: f}
            elif quality_lower in ("min", "m", "minor"):
                string_fret_map = {5: f, 4: f + 2, 3: f + 2, 2: f + 1, 1: f}
            elif quality_lower in ("7", "dom7"):
                string_fret_map = {5: f, 4: f + 2, 3: f, 2: f + 2, 1: f}
            elif quality_lower in ("min7", "m7"):
                string_fret_map = {5: f, 4: f + 2, 3: f, 2: f + 1, 1: f}
            elif quality_lower in ("maj7", "major7"):
                string_fret_map = {5: f, 4: f + 2, 3: f + 1, 2: f + 2, 1: f}
                
        elif shape_upper == "D":
            f = s4_fret
            if quality_lower in ("maj", "major"):
                string_fret_map = {4: f, 3: f + 2, 2: f + 3, 1: f + 2}
            elif quality_lower in ("min", "m", "minor"):
                string_fret_map = {4: f, 3: f + 2, 2: f + 3, 1: f + 1}
            elif quality_lower in ("7", "dom7"):
                string_fret_map = {4: f, 3: f + 2, 2: f + 1, 1: f + 2}
            elif quality_lower in ("min7", "m7"):
                string_fret_map = {4: f, 3: f + 2, 2: f + 1, 1: f + 1}
            elif quality_lower in ("maj7", "major7"):
                string_fret_map = {4: f, 3: f + 2, 2: f + 2, 1: f + 2}
                
        elif shape_upper == "C":
            # Barre fret index where C open shape would rest
            barre_fret = (s5_fret - 3)
            if barre_fret < 0:
                barre_fret += 12
            if quality_lower in ("maj", "major"):
                string_fret_map = {5: barre_fret + 3, 4: barre_fret + 2, 3: barre_fret, 2: barre_fret + 1, 1: barre_fret}
            elif quality_lower in ("7", "dom7"):
                string_fret_map = {5: barre_fret + 3, 4: barre_fret + 2, 3: barre_fret + 3, 2: barre_fret + 1, 1: barre_fret}
            elif quality_lower in ("maj7", "major7"):
                string_fret_map = {5: barre_fret + 3, 4: barre_fret + 2, 3: barre_fret, 2: barre_fret, 1: barre_fret}
            else:
                string_fret_map = {5: barre_fret + 3, 4: barre_fret + 2, 3: barre_fret, 2: barre_fret + 1, 1: barre_fret}
                
        elif shape_upper == "G":
            barre_fret = (s6_fret - 3)
            if barre_fret < 0:
                barre_fret += 12
            # Practical top 4 strings of G shape
            if quality_lower in ("7", "dom7"):
                string_fret_map = {4: barre_fret, 3: barre_fret, 2: barre_fret + 3, 1: barre_fret + 1}
            else:
                string_fret_map = {4: barre_fret, 3: barre_fret, 2: barre_fret, 1: barre_fret + 3}
                
        # Build coordinates
        voicing_coords: List[FretCoordinate] = []
        caged_num_map = {"E": 1, "D": 2, "C": 3, "A": 4, "G": 5}
        box_num = caged_num_map.get(shape_upper, 1)
        
        for string_num, fret_num in sorted(string_fret_map.items()):
            # Bound fret within 0..24
            actual_fret = fret_num % 24
            base_coord = self.get_coordinate(string_num, actual_fret)
            
            # Compute interval relative to root
            semitones = (base_coord.pitch_class - root_pc) % 12
            interval_str = get_interval_between(root, base_coord.note)
            
            coord = base_coord.model_copy(update={
                "interval": interval_str,
                "is_root": (base_coord.pitch_class == root_pc),
                "caged_box": box_num,
            })
            voicing_coords.append(coord)
            
        return voicing_coords

    def get_diagonal_pentatonic_run(
        self,
        root: str,
        quality: str = "minor"
    ) -> List[FretCoordinate]:
        """Calculates the continuous 2-notes-per-string sliding diagonal run
        ("The Pentatonic Highway") across the entire neck.
        
        Connects Box 5 -> Box 1 -> Box 2 -> Box 3 using slides on strings 5, 3, and 1.
        Essential for intermediate guitarists to break out of the vertical Box 1 rut!
        """
        root_pc = note_to_pitch_class(root)
        s6_root = (root_pc - 4) % 12
        if s6_root < 3:
            s6_root += 12
            
        coords: List[FretCoordinate] = []
        is_minor = quality.lower() in ("min", "minor")
        
        if is_minor:
            # Pattern in Minor:
            # Strings 6: [s6_root-2, s6_root] (b7, 1)
            # Strings 5: [s6_root-2, s6_root, s6_root+2] (b3, 4, slide to 5)
            # Strings 4: [s6_root, s6_root+2] (b7, 1)
            # Strings 3: [s6_root, s6_root+2, s6_root+4] (b3, 4, slide to 5)
            # Strings 2: [s6_root+3, s6_root+5] (b7, 1)
            # Strings 1: [s6_root+3, s6_root+5, s6_root+7] (b3, 4, slide to 5)
            pattern = [
                (6, [s6_root - 2, s6_root], [False, False]),
                (5, [s6_root - 2, s6_root, s6_root + 2], [False, False, True]),
                (4, [s6_root, s6_root + 2], [False, False]),
                (3, [s6_root, s6_root + 2, s6_root + 4], [False, False, True]),
                (2, [s6_root + 3, s6_root + 5], [False, False]),
                (1, [s6_root + 3, s6_root + 5, s6_root + 7], [False, False, True]),
            ]
        else:
            # Pattern in Major:
            # Strings 6: [s6_root-3, s6_root] (6, 1)
            # Strings 5: [s6_root-3, s6_root-1, s6_root+2] (2, 3, slide to 5)
            # Strings 4: [s6_root-1, s6_root+2] (6, 1)
            # Strings 3: [s6_root-1, s6_root+1, s6_root+4] (2, 3, slide to 5)
            # Strings 2: [s6_root+2, s6_root+5] (6, 1)
            # Strings 1: [s6_root+2, s6_root+4, s6_root+7] (2, 3, slide to 5)
            pattern = [
                (6, [s6_root - 3, s6_root], [False, False]),
                (5, [s6_root - 3, s6_root - 1, s6_root + 2], [False, False, True]),
                (4, [s6_root - 1, s6_root + 2], [False, False]),
                (3, [s6_root - 1, s6_root + 1, s6_root + 4], [False, False, True]),
                (2, [s6_root + 2, s6_root + 5], [False, False]),
                (1, [s6_root + 2, s6_root + 4, s6_root + 7], [False, False, True]),
            ]
            
        for str_num, frets, slides in pattern:
            for fret, is_slide in zip(frets, slides):
                base_c = self.get_coordinate(str_num, fret)
                interval_str = get_interval_between(root, base_c.note)
                c = base_c.model_copy(update={
                    "interval": interval_str,
                    "is_root": (base_c.pitch_class == root_pc),
                    "technique": "slide" if is_slide else None,
                })
                coords.append(c)
                
        return coords

    def get_bb_king_box(self, root: str) -> Dict[str, Any]:
        """Calculates the B.B. King blues sweet-spot box on strings 1, 2, and 3
        centered around the root note on String 2.
        
        Features B.B.'s signature Major 6th, sweet Major 3rd, and butterfly vibrato.
        """
        root_pc = note_to_pitch_class(root)
        # Root on String 2 (B string, open pitch class 11)
        r2_fret = (root_pc - 11) % 12
        if r2_fret < 3:
            r2_fret += 12
            
        coords: List[FretCoordinate] = []
        
        # String 2: Root (1) and 9th/2nd (2)
        c_r2_root = self.get_coordinate(2, r2_fret).model_copy(update={
            "interval": "1",
            "is_root": True,
            "technique": "root_anchor",
        })
        c_r2_9th = self.get_coordinate(2, r2_fret + 2).model_copy(update={
            "interval": "2",
            "is_root": False,
        })
        coords.extend([c_r2_root, c_r2_9th])
        
        # String 1: Major 3rd (sweet tone), 4th, 5th, and bent Major 6th
        c_s1_3rd = self.get_coordinate(1, r2_fret - 1).model_copy(update={
            "interval": "3",
            "is_root": False,
        })
        c_s1_4th = self.get_coordinate(1, r2_fret).model_copy(update={
            "interval": "4",
            "is_root": False,
        })
        c_s1_5th = self.get_coordinate(1, r2_fret + 2).model_copy(update={
            "interval": "5",
            "is_root": False,
        })
        c_s1_6th = self.get_coordinate(1, r2_fret + 4).model_copy(update={
            "interval": "6",
            "is_root": False,
            "technique": "bend",
        })
        coords.extend([c_s1_3rd, c_s1_4th, c_s1_5th, c_s1_6th])
        
        # String 3: 5th, Major 6th, Minor 7th
        c_s3_5th = self.get_coordinate(3, r2_fret - 1).model_copy(update={
            "interval": "5",
            "is_root": False,
        })
        c_s3_6th = self.get_coordinate(3, r2_fret + 1).model_copy(update={
            "interval": "6",
            "is_root": False,
        })
        c_s3_b7 = self.get_coordinate(3, r2_fret + 2).model_copy(update={
            "interval": "b7",
            "is_root": False,
        })
        coords.extend([c_s3_5th, c_s3_6th, c_s3_b7])
        
        return {
            "name": "B.B. King Box",
            "root": root,
            "root_fret": r2_fret,
            "string_span": (1, 3),
            "fret_span": (r2_fret - 1, r2_fret + 4),
            "coordinates": coords,
            "signature_moves": [
                "Anchor index finger on String 2 at the root note.",
                "Pick String 1 at the 5th and bend up a full whole step to the Major 6th with butterfly vibrato.",
                "Slip index finger down 1 fret on String 1 to resolve sweetly on the Major 3rd over the I chord.",
                "Slide from the 9th to the root on String 2, then hit the 5th on String 3.",
            ]
        }

    def get_albert_king_box(self, root: str) -> Dict[str, Any]:
        """Calculates the Albert King blues bending box on strings 1 and 2."""
        root_pc = note_to_pitch_class(root)
        r2_fret = (root_pc - 11) % 12
        if r2_fret < 3:
            r2_fret += 12
            
        coords: List[FretCoordinate] = []
        
        # String 2: b7 (heavy whole-step bend) and Root
        c_s2_b7 = self.get_coordinate(2, r2_fret - 2).model_copy(update={
            "interval": "b7",
            "is_root": False,
            "technique": "bend",
        })
        c_s2_root = self.get_coordinate(2, r2_fret).model_copy(update={
            "interval": "1",
            "is_root": True,
            "technique": "root_anchor",
        })
        coords.extend([c_s2_b7, c_s2_root])
        
        # String 1: 4th (1.5 step / minor 3rd overbend), 5th, and b6
        c_s1_4th = self.get_coordinate(1, r2_fret - 2).model_copy(update={
            "interval": "4",
            "is_root": False,
            "technique": "bend",
        })
        c_s1_5th = self.get_coordinate(1, r2_fret).model_copy(update={
            "interval": "5",
            "is_root": False,
        })
        c_s1_b6 = self.get_coordinate(1, r2_fret + 1).model_copy(update={
            "interval": "b6",
            "is_root": False,
        })
        coords.extend([c_s1_4th, c_s1_5th, c_s1_b6])
        
        return {
            "name": "Albert King Box",
            "root": root,
            "root_fret": r2_fret,
            "string_span": (1, 2),
            "fret_span": (r2_fret - 2, r2_fret + 1),
            "coordinates": coords,
            "signature_moves": [
                "Albert King Unison Bend: Bend String 2 at the b7 up a whole step to match the pitch of the Root on String 1.",
                "The Cry of Blues: Heavy minor-third overbend on String 1 at the 4th, pushing up to the b6.",
            ]
        }

    def get_three_notes_per_string_shapes(
        self,
        root: str,
        scale_type: str = "major"
    ) -> List[Dict[str, Any]]:
        """Generates the 7 Three-Notes-Per-String (3NPS) modal shapes across the neck.
        
        Each shape has exactly 3 notes per string on all 6 strings (18 notes per shape),
        providing uniform picking hand economy for fast alternate picking and legato.
        """
        scale = get_scale(root, scale_type)
        scale_pcs = [note_to_pitch_class(n) for n in scale.notes]
        mode_names = ["Ionian", "Dorian", "Phrygian", "Lydian", "Mixolydian", "Aeolian", "Locrian"]
        
        shapes: List[Dict[str, Any]] = []
        root_pc = note_to_pitch_class(root)
        
        for m in range(7):
            # Degree m on String 6 (Low E)
            deg_m_pc = scale_pcs[m]
            start_fret = (deg_m_pc - 4) % 12
            if start_fret < 1:
                start_fret += 12
                
            shape_coords: List[FretCoordinate] = []
            
            # String 6 has 3 consecutive scale notes
            s6_deg_indices = [m, (m + 1) % 7, (m + 2) % 7]
            s6_frets = [(scale_pcs[d] - 4) % 12 for d in s6_deg_indices]
            # Normalize so frets are strictly ascending
            for i in range(1, len(s6_frets)):
                if s6_frets[i] < s6_frets[i - 1]:
                    s6_frets[i] += 12
                    
            min_pos_fret = min(s6_frets)
            max_pos_fret = max(s6_frets)
            
            # For each string from 6 down to 1, find the 3 scale notes in this position window
            for str_num in range(6, 0, -1):
                open_pc = note_to_pitch_class(self.open_strings[str_num - 1][0])
                
                string_notes_in_reach: List[FretCoordinate] = []
                # Search frets in the ergonomic window [min_pos_fret - 1, max_pos_fret + 2]
                for f in range(max(0, min_pos_fret - 1), min(24, max_pos_fret + 4)):
                    coord = self.get_coordinate(str_num, f)
                    if coord.pitch_class in scale_pcs:
                        deg_idx = scale_pcs.index(coord.pitch_class)
                        c = coord.model_copy(update={
                            "interval": scale.intervals[deg_idx],
                            "is_root": (coord.pitch_class == root_pc),
                        })
                        string_notes_in_reach.append(c)
                        
                # Take exactly 3 consecutive scale notes
                if len(string_notes_in_reach) >= 3:
                    shape_coords.extend(string_notes_in_reach[:3])
                else:
                    shape_coords.extend(string_notes_in_reach)
                    
            shapes.append({
                "shape_index": m + 1,
                "mode_name": mode_names[m],
                "starting_degree": scale.intervals[m],
                "fret_span": (min_pos_fret, max_pos_fret),
                "coordinates": shape_coords,
            })
            
        return shapes

    def get_octave_coordinates(
        self,
        string: int,
        fret: int
    ) -> Dict[str, Any]:
        """Calculates all octave twins across the neck for any target fret,
        identifying the 4 classic Wes Montgomery / guitar octave shapes.
        """
        src = self.get_coordinate(string, fret)
        target_pc = src.pitch_class
        
        # All occurrences of this note across all 6 strings
        all_octaves = [
            c for str_frets in self._matrix
            for c in str_frets
            if c.pitch_class == target_pc and (c.string != string or c.fret != fret)
        ]
        
        direct_shapes: Dict[str, Optional[Tuple[int, int]]] = {}
        
        # 1. Wes Montgomery 6-to-4 (string 6 -> string 4, +2 frets)
        if string == 6 and fret + 2 <= self.num_frets:
            direct_shapes["wes_6_to_4"] = (4, fret + 2)
        # 2. Wes Montgomery 5-to-3 (string 5 -> string 3, +2 frets)
        elif string == 5 and fret + 2 <= self.num_frets:
            direct_shapes["wes_5_to_3"] = (3, fret + 2)
        # 3. Octave 4-to-2 (string 4 -> string 2, +3 frets)
        elif string == 4 and fret + 3 <= self.num_frets:
            direct_shapes["octave_4_to_2"] = (2, fret + 3)
        # 4. Octave 3-to-1 (string 3 -> string 1, +3 frets)
        elif string == 3 and fret + 3 <= self.num_frets:
            direct_shapes["octave_3_to_1"] = (1, fret + 3)
            
        # Horizontal octave (+12 frets on same string)
        horiz_octave = (string, fret + 12) if fret + 12 <= self.num_frets else None
        
        return {
            "source": src,
            "all_octaves": all_octaves,
            "direct_shapes": direct_shapes,
            "horizontal_octave": horiz_octave,
        }

    def get_static_position_progression_shapes(
        self,
        chords: List[str],
        target_fret: int = 5
    ) -> List[Dict[str, Any]]:
        """Calculates the optimal CAGED shape for every chord in a progression
        so a guitarist can play over the changes in a single hand position
        without leaping up and down the neck.
        """
        results: List[Dict[str, Any]] = []
        shapes_order = ["E", "D", "C", "A", "G"]
        
        for chord_sym in chords:
            chord = deconstruct_chord(chord_sym)
            root = chord.root
            quality = "min" if "min" in chord.quality.value or "m" in chord_sym else "maj"
            if "7" in chord_sym:
                quality = "7"
                
            best_shape = None
            best_voicing = None
            best_dist = 999
            
            for sh in shapes_order:
                voicing = self.get_caged_chord_voicing(root, sh, quality)
                if voicing:
                    avg_fret = sum(c.fret for c in voicing) / len(voicing)
                    dist = abs(avg_fret - target_fret)
                    if dist < best_dist:
                        best_dist = dist
                        best_shape = sh
                        best_voicing = voicing
                        
            results.append({
                "chord": chord_sym,
                "best_caged_shape": best_shape,
                "fret_span": (min(c.fret for c in best_voicing), max(c.fret for c in best_voicing)) if best_voicing else None,
                "voicing": best_voicing,
                "hand_position_distance": round(best_dist, 1),
            })
            
        return results

