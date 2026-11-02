"""Unit tests for Pitch Class Algebra and Enharmonic Resolution (TASK-1.1)."""
import pytest
from backend.app.theory.pitch import (
    NotationMode,
    normalize_note_name,
    note_to_pitch_class,
    pitch_class_to_note,
    semitones_between,
    parse_note,
    simplify_to_practical,
    spell_note_with_letter,
    spell_diatonic_scale,
    transpose_note,
    get_circle_of_fifths,
    get_key_neighbors,
)

# Major scale interval formula in semitones (W-W-H-W-W-W-H)
MAJOR_SCALE_OFFSETS = [0, 2, 4, 5, 7, 9, 11]


def test_normalize_note_name():
    assert normalize_note_name("c") == "C"
    assert normalize_note_name("c#") == "C#"
    assert normalize_note_name("bb") == "Bb"
    assert normalize_note_name("  f#  ") == "F#"
    assert normalize_note_name("ab") == "Ab"
    assert normalize_note_name("eb") == "Eb"


def test_note_to_pitch_class_naturals():
    assert note_to_pitch_class("C") == 0
    assert note_to_pitch_class("D") == 2
    assert note_to_pitch_class("E") == 4
    assert note_to_pitch_class("F") == 5
    assert note_to_pitch_class("G") == 7
    assert note_to_pitch_class("A") == 9
    assert note_to_pitch_class("B") == 11


def test_note_to_pitch_class_case_insensitive():
    # Lowercase inputs must be accepted cleanly
    assert note_to_pitch_class("c") == 0
    assert note_to_pitch_class("c#") == 1
    assert note_to_pitch_class("db") == 1
    assert note_to_pitch_class("eb") == 3
    assert note_to_pitch_class("  g# ") == 8


def test_note_to_pitch_class_accidentals():
    assert note_to_pitch_class("C#") == 1
    assert note_to_pitch_class("Db") == 1
    assert note_to_pitch_class("F#") == 6
    assert note_to_pitch_class("Gb") == 6
    assert note_to_pitch_class("Bb") == 10
    assert note_to_pitch_class("A#") == 10
    # Classical enharmonic equivalents
    assert note_to_pitch_class("B#") == 0
    assert note_to_pitch_class("Cb") == 11
    assert note_to_pitch_class("E#") == 5
    assert note_to_pitch_class("Fb") == 4


def test_note_to_pitch_class_invalid():
    with pytest.raises(ValueError):
        note_to_pitch_class("H#")
    with pytest.raises(ValueError):
        note_to_pitch_class("")


def test_semitones_between():
    assert semitones_between("C", "G") == 7   # Perfect 5th
    assert semitones_between("A", "C") == 3   # Minor 3rd
    assert semitones_between("E", "G#") == 4  # Major 3rd
    assert semitones_between("B", "C") == 1   # Half-step wrap
    assert semitones_between("G", "F") == 10  # Minor 7th ascending


def test_parse_note():
    assert parse_note("C") == ("C", "")
    assert parse_note("F#") == ("F", "#")
    assert parse_note("Bb") == ("B", "b")
    assert parse_note("G##") == ("G", "##")
    # Case-insensitive
    assert parse_note("c#") == ("C", "#")
    assert parse_note("bb") == ("B", "b")


def test_practical_simplifications():
    assert simplify_to_practical("E#") == "F"
    assert simplify_to_practical("B#") == "C"
    assert simplify_to_practical("Cb") == "B"
    assert simplify_to_practical("Fb") == "E"
    assert simplify_to_practical("Fx") == "G"
    assert simplify_to_practical("A") == "A"


def test_f_sharp_major_practical_vs_academic():
    # In PRACTICAL guitar mode: E# is simplified to F
    f_sharp_practical = spell_diatonic_scale("F#", MAJOR_SCALE_OFFSETS, mode=NotationMode.PRACTICAL)
    assert f_sharp_practical == ["F#", "G#", "A#", "B", "C#", "D#", "F"]
    
    # In ACADEMIC mode: strict 7-letter sequence is preserved
    f_sharp_academic = spell_diatonic_scale("F#", MAJOR_SCALE_OFFSETS, mode=NotationMode.ACADEMIC)
    assert f_sharp_academic == ["F#", "G#", "A#", "B", "C#", "D#", "E#"]


def test_f_major_scale():
    # In both modes, F major should have Bb (not A#)
    notes_practical = spell_diatonic_scale("F", MAJOR_SCALE_OFFSETS, mode=NotationMode.PRACTICAL)
    assert notes_practical == ["F", "G", "A", "Bb", "C", "D", "E"]

    notes_academic = spell_diatonic_scale("F", MAJOR_SCALE_OFFSETS, mode=NotationMode.ACADEMIC)
    assert notes_academic == ["F", "G", "A", "Bb", "C", "D", "E"]


def test_c_major_scale():
    notes = spell_diatonic_scale("C", MAJOR_SCALE_OFFSETS)
    assert notes == ["C", "D", "E", "F", "G", "A", "B"]


def test_g_major_scale():
    notes = spell_diatonic_scale("G", MAJOR_SCALE_OFFSETS)
    assert notes == ["G", "A", "B", "C", "D", "E", "F#"]


def test_transpose_note_positive_and_negative():
    # Transposing up (positive)
    assert transpose_note("A", 3) == "C"
    assert transpose_note("E", 1) == "F"
    assert transpose_note("D", 7) == "A"
    assert transpose_note("G", 11) == "F#"
    # Transposing down (negative semitones - going down frets)
    assert transpose_note("C", -1) == "B"   # 1 fret down from C is B
    assert transpose_note("E", -2) == "D"   # 2 frets down from E is D
    assert transpose_note("A", -3) == "F#"  # 3 frets down from A is F#
    assert transpose_note("D", -5) == "A"   # 5 frets down from D is A


def test_circle_of_fifths():
    circle = get_circle_of_fifths()
    assert len(circle) == 12
    assert circle[0] == "C"
    assert circle[1] == "G"
    assert circle[2] == "D"
    assert circle[3] == "A"
    assert circle[4] == "E"
    assert circle[5] == "B"
    assert circle[-1] == "F"


def test_key_neighbors_i_iv_v():
    # In C Major: I = C, IV = F, V = G
    c_neighbors = get_key_neighbors("C")
    assert c_neighbors == {"I": "C", "IV": "F", "V": "G"}

    # In G Major: I = G, IV = C, V = D
    g_neighbors = get_key_neighbors("G")
    assert g_neighbors == {"I": "G", "IV": "C", "V": "D"}

    # In E Major: I = E, IV = A, V = B (Blues in E chords!)
    e_neighbors = get_key_neighbors("E")
    assert e_neighbors == {"I": "E", "IV": "A", "V": "B"}

    # Case-insensitive
    a_neighbors = get_key_neighbors("a")
    assert a_neighbors == {"I": "A", "IV": "D", "V": "E"}
