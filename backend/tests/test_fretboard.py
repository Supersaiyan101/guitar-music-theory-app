"""Unit tests for Fretboard Matrix and CAGED System Engine (TASK-1.5)."""
import pytest
from backend.app.theory.fretboard import (
    FretboardMatrix,
    TuningPreset,
)
from backend.app.theory.scales import get_scale
from backend.app.theory.chords import deconstruct_chord


def test_standard_tuning_open_strings():
    fretboard = FretboardMatrix(tuning=TuningPreset.STANDARD)
    
    # String 1 (High E)
    s1 = fretboard.get_coordinate(string=1, fret=0)
    assert s1.note == "E"
    assert s1.octave == 4

    # String 2 (B)
    s2 = fretboard.get_coordinate(string=2, fret=0)
    assert s2.note == "B"
    assert s2.octave == 3

    # String 3 (G)
    s3 = fretboard.get_coordinate(string=3, fret=0)
    assert s3.note == "G"
    assert s3.octave == 3

    # String 4 (D)
    s4 = fretboard.get_coordinate(string=4, fret=0)
    assert s4.note == "D"
    assert s4.octave == 3

    # String 5 (A)
    s5 = fretboard.get_coordinate(string=5, fret=0)
    assert s5.note == "A"
    assert s5.octave == 2

    # String 6 (Low E)
    s6 = fretboard.get_coordinate(string=6, fret=0)
    assert s6.note == "E"
    assert s6.octave == 2


def test_fret_12_octave_harmony():
    fretboard = FretboardMatrix(tuning=TuningPreset.STANDARD)
    for string_num in range(1, 7):
        open_string = fretboard.get_coordinate(string=string_num, fret=0)
        fret_12 = fretboard.get_coordinate(string=string_num, fret=12)
        # Pitch class must be identical
        assert open_string.pitch_class == fret_12.pitch_class
        # Octave must be exactly +1
        assert fret_12.octave == open_string.octave + 1


def test_drop_d_tuning():
    fretboard = FretboardMatrix(tuning=TuningPreset.DROP_D)
    low_d = fretboard.get_coordinate(string=6, fret=0)
    assert low_d.note == "D"
    assert low_d.octave == 2
    # High E should still be E4
    high_e = fretboard.get_coordinate(string=1, fret=0)
    assert high_e.note == "E"
    assert high_e.octave == 4


def test_overlay_a_minor_pentatonic():
    fretboard = FretboardMatrix()
    scale = get_scale("A", "minor_pentatonic")
    coords = fretboard.overlay_scale(scale, max_fret=12)
    
    # Check classic Hendrix Box 1 note positions on Low E string (String 6)
    box1_root = [c for c in coords if c.string == 6 and c.fret == 5][0]
    assert box1_root.note == "A"
    assert box1_root.is_root is True
    assert box1_root.interval == "1"

    box1_m3 = [c for c in coords if c.string == 6 and c.fret == 8][0]
    assert box1_m3.note == "C"
    assert box1_m3.interval == "b3"

    # String 5 frets 5 (D) and 7 (E)
    d_note = [c for c in coords if c.string == 5 and c.fret == 5][0]
    assert d_note.note == "D"
    assert d_note.interval == "4"

    e_note = [c for c in coords if c.string == 5 and c.fret == 7][0]
    assert e_note.note == "E"
    assert e_note.interval == "5"


def test_overlay_g_major_chord():
    fretboard = FretboardMatrix()
    chord = deconstruct_chord("G")
    coords = fretboard.overlay_chord(chord, max_fret=3)
    
    # Verify open G major chord grip
    # String 6 Fret 3 = G (Root)
    c6 = [c for c in coords if c.string == 6 and c.fret == 3][0]
    assert c6.note == "G"
    assert c6.is_root is True
    assert c6.interval == "1"

    # String 5 Fret 2 = B (3rd)
    c5 = [c for c in coords if c.string == 5 and c.fret == 2][0]
    assert c5.note == "B"
    assert c5.interval == "3"

    # String 4 Fret 0 = D (5th)
    c4 = [c for c in coords if c.string == 4 and c.fret == 0][0]
    assert c4.note == "D"
    assert c4.interval == "5"


def test_caged_box_spans_for_a():
    fretboard = FretboardMatrix()
    spans = fretboard.get_caged_box_spans("A")
    
    # Box 1 (E-shape) for A starts on fret 5 (Low E string root)
    box1_shape, (b1_min, b1_max) = spans[1]
    assert box1_shape == "E"
    assert b1_min == 5
    assert b1_max == 8

    # Box 2 (D-shape)
    box2_shape, (b2_min, b2_max) = spans[2]
    assert box2_shape == "D"
    assert b2_min == 7
    assert b2_max == 10


def test_triad_shapes_on_top_three_strings():
    fretboard = FretboardMatrix()
    chord = deconstruct_chord("G")
    # Search for G major triads on strings 1, 2, 3
    triads = fretboard.get_triad_shapes_on_strings(chord, string_set=(1, 2, 3), max_fret=15)
    
    assert len(triads) >= 3  # Root position, 1st inversion, 2nd inversion
    
    # Verify the classic root position triad (Frets 3 on high E, 3 on B, 4 on G)
    root_triad = [
        t for t in triads 
        if any(c.string == 1 and c.fret == 3 for c in t) and
           any(c.string == 2 and c.fret == 3 for c in t) and
           any(c.string == 3 and c.fret == 4 for c in t)
    ]
    assert len(root_triad) == 1


def test_caged_root_anchors():
    fretboard = FretboardMatrix()
    a_anchors = fretboard.get_caged_root_anchors("A")
    
    # E-shape has roots on Strings 6, 4, 1 at frets 5, 7, 5
    assert (6, 5) in a_anchors["E"]
    assert (4, 7) in a_anchors["E"]
    assert (1, 5) in a_anchors["E"]
    
    # D-shape has roots on Strings 4 and 2 at frets 7 and 10
    assert (4, 7) in a_anchors["D"]
    assert (2, 10) in a_anchors["D"]
    
    # C-shape has roots on Strings 5 and 2 at frets 0/12 and 10
    assert (2, 10) in a_anchors["C"]
    
    # A-shape has roots on Strings 5 and 3
    assert any(string == 5 for string, _ in a_anchors["A"])
    assert any(string == 3 for string, _ in a_anchors["A"])


def test_caged_chord_voicings():
    fretboard = FretboardMatrix()
    
    # A Major in E-shape (fret 5 barre chord)
    # Frets: 6: 5, 5: 7, 4: 7, 3: 6, 2: 5, 1: 5
    a_e_shape = fretboard.get_caged_chord_voicing("A", "E", "maj")
    assert len(a_e_shape) == 6
    frets_map = {c.string: c.fret for c in a_e_shape}
    assert frets_map == {6: 5, 5: 7, 4: 7, 3: 6, 2: 5, 1: 5}
    assert any(c.is_root and c.string == 6 for c in a_e_shape)
    
    # A Minor in E-shape (fret 5 minor barre chord)
    # Frets: 6: 5, 5: 7, 4: 7, 3: 5, 2: 5, 1: 5
    a_min_e = fretboard.get_caged_chord_voicing("A", "E", "min")
    assert {c.string: c.fret for c in a_min_e} == {6: 5, 5: 7, 4: 7, 3: 5, 2: 5, 1: 5}
    
    # D Major in A-shape (fret 5 barre chord rooted on String 5)
    # Frets: 5: 5, 4: 7, 3: 7, 2: 7, 1: 5
    d_a_shape = fretboard.get_caged_chord_voicing("D", "A", "maj")
    assert {c.string: c.fret for c in d_a_shape} == {5: 5, 4: 7, 3: 7, 2: 7, 1: 5}


def test_diagonal_pentatonic_run_minor():
    fretboard = FretboardMatrix()
    # A Minor Pentatonic Highway: sliding diagonal across 6 strings
    highway = fretboard.get_diagonal_pentatonic_run("A", "minor")
    
    # Total notes: 2 on str 6, 3 on str 5 (with slide), 2 on str 4, 3 on str 3 (slide), 2 on str 2, 3 on str 1 (slide) = 15 notes
    assert len(highway) == 15
    
    # Check String 6: frets 3 (G, b7) and 5 (A, root)
    s6_notes = [c for c in highway if c.string == 6]
    assert [c.fret for c in s6_notes] == [3, 5]
    assert s6_notes[1].is_root is True
    assert s6_notes[1].interval == "1"
    
    # Check String 5: frets 3, 5, and sliding to 7
    s5_notes = [c for c in highway if c.string == 5]
    assert [c.fret for c in s5_notes] == [3, 5, 7]
    assert s5_notes[2].technique == "slide"
    assert s5_notes[2].interval == "5"
    
    # Check String 3 slide note
    s3_slide = [c for c in highway if c.string == 3 and c.technique == "slide"][0]
    assert s3_slide.fret == 9
    assert s3_slide.note == "E"
    
    # Check String 1 slide note (fret 12)
    s1_slide = [c for c in highway if c.string == 1 and c.technique == "slide"][0]
    assert s1_slide.fret == 12


def test_diagonal_pentatonic_run_major():
    fretboard = FretboardMatrix()
    highway_maj = fretboard.get_diagonal_pentatonic_run("A", "major")
    assert len(highway_maj) == 15
    # String 6 frets 2 (F#, 6) and 5 (A, 1)
    s6_notes = [c for c in highway_maj if c.string == 6]
    assert [c.fret for c in s6_notes] == [2, 5]
    assert s6_notes[1].is_root is True


def test_bb_king_box():
    fretboard = FretboardMatrix()
    bb_box = fretboard.get_bb_king_box("A")
    
    assert bb_box["name"] == "B.B. King Box"
    assert bb_box["root"] == "A"
    assert bb_box["root_fret"] == 10  # String 2 fret 10 is Root A
    assert bb_box["string_span"] == (1, 3)
    
    coords = bb_box["coordinates"]
    # Verify root anchor on String 2
    root_c = [c for c in coords if c.string == 2 and c.fret == 10][0]
    assert root_c.is_root is True
    assert root_c.interval == "1"
    assert root_c.technique == "root_anchor"
    
    # Verify sweet Major 3rd on String 1 fret 9
    sweet_3rd = [c for c in coords if c.string == 1 and c.fret == 9][0]
    assert sweet_3rd.interval == "3"
    assert sweet_3rd.note == "C#"
    
    # Verify signature Major 6th bend target on String 1 fret 14
    bend_6th = [c for c in coords if c.string == 1 and c.fret == 14][0]
    assert bend_6th.interval == "6"
    assert bend_6th.technique == "bend"
    
    # Verify moves list
    assert len(bb_box["signature_moves"]) >= 3


def test_albert_king_box():
    fretboard = FretboardMatrix()
    ak_box = fretboard.get_albert_king_box("A")
    
    assert ak_box["name"] == "Albert King Box"
    assert ak_box["root_fret"] == 10
    
    coords = ak_box["coordinates"]
    # String 2 fret 8 is b7 with bend technique
    b7_bend = [c for c in coords if c.string == 2 and c.fret == 8][0]
    assert b7_bend.interval == "b7"
    assert b7_bend.technique == "bend"
    
    # String 1 fret 8 is 4th with bend technique
    p4_bend = [c for c in coords if c.string == 1 and c.fret == 8][0]
    assert p4_bend.interval == "4"
    assert p4_bend.technique == "bend"


def test_three_notes_per_string_shapes():
    fretboard = FretboardMatrix()
    shapes = fretboard.get_three_notes_per_string_shapes("C", "major")
    
    # Must generate all 7 modal positions
    assert len(shapes) == 7
    assert shapes[0]["mode_name"] == "Ionian"
    assert shapes[1]["mode_name"] == "Dorian"
    assert shapes[2]["mode_name"] == "Phrygian"
    assert shapes[3]["mode_name"] == "Lydian"
    assert shapes[4]["mode_name"] == "Mixolydian"
    assert shapes[5]["mode_name"] == "Aeolian"
    assert shapes[6]["mode_name"] == "Locrian"
    
    # Every shape must contain 18 notes (3 notes x 6 strings)
    for sh in shapes:
        assert len(sh["coordinates"]) == 18


def test_octave_coordinates_and_shapes():
    fretboard = FretboardMatrix()
    
    # A on String 6 fret 5
    octaves = fretboard.get_octave_coordinates(string=6, fret=5)
    assert octaves["source"].note == "A"
    assert octaves["source"].octave == 2
    
    # Check Wes Montgomery 6-to-4 shape: String 4 fret 7
    assert octaves["direct_shapes"]["wes_6_to_4"] == (4, 7)
    
    # Check horizontal octave: String 6 fret 17
    assert octaves["horizontal_octave"] == (6, 17)
    
    # Check 5-to-3 shape for A on String 5 fret 0
    oct_s5 = fretboard.get_octave_coordinates(string=5, fret=0)
    assert oct_s5["direct_shapes"]["wes_5_to_3"] == (3, 2)


def test_static_position_progression_shapes():
    fretboard = FretboardMatrix()
    # Play classic I - IV - V progression (C - F - G) around fret 5
    progression = fretboard.get_static_position_progression_shapes(["C", "F", "G"], target_fret=5)
    
    assert len(progression) == 3
    assert progression[0]["chord"] == "C"
    assert progression[1]["chord"] == "F"
    assert progression[2]["chord"] == "G"
    
    # All chords should have valid CAGED shapes and manageable distance from fret 5
    for item in progression:
        assert item["best_caged_shape"] in ("C", "A", "G", "E", "D")
        assert item["voicing"] is not None
        assert item["hand_position_distance"] <= 4.0

