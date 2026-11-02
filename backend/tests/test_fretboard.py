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
