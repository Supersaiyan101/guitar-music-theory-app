"""Unit tests for Scale and Mode Generator (TASK-1.3)."""
import pytest
from backend.app.theory.pitch import NotationMode
from backend.app.theory.scales import (
    get_scale,
    get_relative_minor,
    get_relative_major,
    list_available_scales,
)


def test_full_c_major_scale():
    scale = get_scale("C", "major")
    assert scale.notes == ["C", "D", "E", "F", "G", "A", "B"]
    assert scale.intervals == ["1", "2", "3", "4", "5", "6", "7"]
    assert scale.formula == [0, 2, 4, 5, 7, 9, 11]
    assert scale.category == "major"


def test_full_a_natural_minor_scale():
    scale = get_scale("A", "minor")
    assert scale.notes == ["A", "B", "C", "D", "E", "F", "G"]
    assert scale.intervals == ["1", "2", "b3", "4", "5", "b6", "b7"]
    assert scale.formula == [0, 2, 3, 5, 7, 8, 10]
    assert scale.category == "minor"


def test_a_harmonic_minor_scale():
    scale = get_scale("A", "harmonic_minor")
    assert scale.notes == ["A", "B", "C", "D", "E", "F", "G#"]
    assert "7" in scale.intervals
    assert scale.character_notes == ["7", "b6"]


def test_a_melodic_minor_scale():
    scale = get_scale("A", "melodic_minor")
    assert scale.notes == ["A", "B", "C", "D", "E", "F#", "G#"]
    assert "6" in scale.intervals
    assert "7" in scale.intervals


def test_a_minor_pentatonic():
    scale = get_scale("A", "minor_pentatonic")
    assert scale.notes == ["A", "C", "D", "E", "G"]
    assert scale.intervals == ["1", "b3", "4", "5", "b7"]


def test_a_blues_scale():
    scale = get_scale("A", "blues")
    assert scale.notes == ["A", "C", "D", "Eb", "E", "G"]
    assert "b5" in scale.intervals
    assert scale.character_notes == ["b5"]


def test_e_blues_scale():
    scale = get_scale("E", "blues")
    assert scale.notes == ["E", "G", "A", "Bb", "B", "D"]


def test_a_hybrid_blues_scale():
    # Blends A Minor & Major Pentatonic: A, B, C, C#, D, E, F#, G
    scale = get_scale("A", "hybrid_blues")
    assert scale.notes == ["A", "B", "C", "C#", "D", "E", "F#", "G"]
    assert scale.intervals == ["1", "2", "b3", "3", "4", "5", "6", "b7"]
    assert "b3" in scale.character_notes
    assert "3" in scale.character_notes


def test_g_bebop_dominant_scale():
    # Mixolydian + natural 7 passing tone: G, A, B, C, D, E, F, F#
    scale = get_scale("G", "bebop_dominant")
    assert scale.notes == ["G", "A", "B", "C", "D", "E", "F", "F#"]
    assert scale.intervals == ["1", "2", "3", "4", "5", "6", "b7", "7"]
    assert len(scale.notes) == 8


def test_modes_of_c_major():
    c_notes = set(["C", "D", "E", "F", "G", "A", "B"])
    
    dorian = get_scale("D", "dorian")
    assert set(dorian.notes) == c_notes
    assert dorian.notes == ["D", "E", "F", "G", "A", "B", "C"]
    
    phrygian = get_scale("E", "phrygian")
    assert set(phrygian.notes) == c_notes
    assert phrygian.notes == ["E", "F", "G", "A", "B", "C", "D"]
    
    lydian = get_scale("F", "lydian")
    assert set(lydian.notes) == c_notes
    assert lydian.notes == ["F", "G", "A", "B", "C", "D", "E"]
    
    mixolydian = get_scale("G", "mixolydian")
    assert set(mixolydian.notes) == c_notes
    assert mixolydian.notes == ["G", "A", "B", "C", "D", "E", "F"]
    
    locrian = get_scale("B", "locrian")
    assert set(locrian.notes) == c_notes
    assert locrian.notes == ["B", "C", "D", "E", "F", "G", "A"]


def test_phrygian_dominant():
    scale = get_scale("E", "phrygian_dominant")
    assert scale.notes == ["E", "F", "G#", "A", "B", "C", "D"]
    assert "b2" in scale.character_notes
    assert "3" in scale.character_notes


def test_relative_keys():
    assert get_relative_minor("C") == "A"
    assert get_relative_minor("G") == "E"
    assert get_relative_minor("F") == "D"
    
    assert get_relative_major("A") == "C"
    assert get_relative_major("E") == "G"
    assert get_relative_major("D") == "F"


def test_f_sharp_major_practical_vs_academic():
    scale_practical = get_scale("F#", "major", mode=NotationMode.PRACTICAL)
    assert scale_practical.notes[-1] == "F"

    scale_academic = get_scale("F#", "major", mode=NotationMode.ACADEMIC)
    assert scale_academic.notes[-1] == "E#"


def test_scale_aliases():
    s1 = get_scale("C", "major_scale")
    s2 = get_scale("C", "ionian")
    assert s1.notes == s2.notes

    s3 = get_scale("A", "jazz_minor")
    s4 = get_scale("A", "melodic_minor")
    assert s3.notes == s4.notes

    s5 = get_scale("A", "hybrid_pentatonic")
    s6 = get_scale("A", "hybrid_blues")
    assert s5.notes == s6.notes

    s7 = get_scale("G", "bebop")
    s8 = get_scale("G", "bebop_dominant")
    assert s7.notes == s8.notes


def test_invalid_scale():
    with pytest.raises(ValueError):
        get_scale("C", "non_existent_scale")
