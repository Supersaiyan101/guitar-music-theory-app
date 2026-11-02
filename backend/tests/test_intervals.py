"""Unit tests for Interval Engine (TASK-1.2)."""
import pytest
from backend.app.theory.pitch import NotationMode
from backend.app.theory.intervals import (
    interval_to_semitones,
    semitones_to_interval,
    get_interval_between,
    get_note_at_interval,
    get_interval_name,
    is_chord_tone,
)


def test_interval_to_semitones():
    assert interval_to_semitones("1") == 0
    assert interval_to_semitones("R") == 0
    assert interval_to_semitones("b3") == 3
    assert interval_to_semitones("3") == 4
    assert interval_to_semitones("4") == 5
    assert interval_to_semitones("b5") == 6
    assert interval_to_semitones("5") == 7
    assert interval_to_semitones("b7") == 10
    assert interval_to_semitones("7") == 11
    # Compound intervals
    assert interval_to_semitones("9") == 14
    assert interval_to_semitones("#9") == 15
    assert interval_to_semitones("13") == 21


def test_interval_to_semitones_invalid():
    with pytest.raises(ValueError):
        interval_to_semitones("xyz")


def test_semitones_to_interval():
    assert semitones_to_interval(0) == "1"
    assert semitones_to_interval(3) == "b3"
    assert semitones_to_interval(4) == "3"
    assert semitones_to_interval(5) == "4"
    assert semitones_to_interval(6) == "b5"
    assert semitones_to_interval(7) == "5"
    assert semitones_to_interval(10) == "b7"
    assert semitones_to_interval(11) == "7"
    # Octave wraps
    assert semitones_to_interval(15) == "b3"


def test_get_interval_between():
    # A blues / rock intervals
    assert get_interval_between("A", "A") == "1"
    assert get_interval_between("A", "C") == "b3"
    assert get_interval_between("A", "C#") == "3"
    assert get_interval_between("A", "D") == "4"
    assert get_interval_between("A", "Eb") == "b5"
    assert get_interval_between("A", "E") == "5"
    assert get_interval_between("A", "G") == "b7"
    # E minor / major intervals
    assert get_interval_between("E", "G") == "b3"
    assert get_interval_between("E", "G#") == "3"
    assert get_interval_between("E", "B") == "5"
    assert get_interval_between("E", "D#") == "7"


def test_get_note_at_interval():
    assert get_note_at_interval("A", "b3") == "C"
    assert get_note_at_interval("A", "3") == "C#"
    assert get_note_at_interval("A", "5") == "E"
    assert get_note_at_interval("A", "b7") == "G"
    assert get_note_at_interval("E", "b5") == "Bb"
    # Practical guitar mode: Major 7th of F# is F (not E#)
    assert get_note_at_interval("F#", "7", mode=NotationMode.PRACTICAL) == "F"


def test_get_interval_name():
    assert get_interval_name("b3") == "Minor 3rd"
    assert get_interval_name("3") == "Major 3rd"
    assert get_interval_name("#9") == "Sharp 9th (Hendrix Note)"
    assert get_interval_name("5") == "Perfect 5th"


def test_is_chord_tone():
    # Primary chord tones
    assert is_chord_tone("1") is True
    assert is_chord_tone("b3") is True
    assert is_chord_tone("3") is True
    assert is_chord_tone("5") is True
    assert is_chord_tone("b7") is True
    assert is_chord_tone("7") is True
    # Non-chord tones / passing notes
    assert is_chord_tone("2") is False
    assert is_chord_tone("4") is False
