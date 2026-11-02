"""Unit tests for Chord Formula and Quality Parser (TASK-1.4)."""
import pytest
from backend.app.schemas.theory import ChordQuality
from backend.app.theory.chords import (
    parse_chord_symbol,
    deconstruct_chord,
    get_triad_inversion_notes,
    list_supported_chords,
)


def test_parse_chord_symbol_triads():
    assert parse_chord_symbol("C") == ("C", "maj", None)
    assert parse_chord_symbol("Am") == ("A", "min", None)
    assert parse_chord_symbol("Bdim") == ("B", "dim", None)
    assert parse_chord_symbol("Caug") == ("C", "aug", None)
    assert parse_chord_symbol("E5") == ("E", "5", None)


def test_parse_chord_symbol_accidentals():
    assert parse_chord_symbol("F#m") == ("F#", "min", None)
    assert parse_chord_symbol("Bbmaj7") == ("Bb", "maj7", None)
    assert parse_chord_symbol("Eb7") == ("Eb", "7", None)


def test_parse_chord_symbol_slash_chords():
    assert parse_chord_symbol("D/F#") == ("D", "maj", "F#")
    assert parse_chord_symbol("G/B") == ("G", "maj", "B")
    assert parse_chord_symbol("Am7/G") == ("A", "m7", "G")


def test_deconstruct_g_major_chord():
    chord = deconstruct_chord("G")
    assert chord.root == "G"
    assert chord.quality == ChordQuality.MAJOR
    assert chord.intervals == ["1", "3", "5"]
    assert chord.tones == ["G", "B", "D"]
    assert chord.bass is None


def test_deconstruct_a_minor_chord():
    chord = deconstruct_chord("Am")
    assert chord.root == "A"
    assert chord.quality == ChordQuality.MINOR
    assert chord.intervals == ["1", "b3", "5"]
    assert chord.tones == ["A", "C", "E"]


def test_deconstruct_hendrix_chord():
    chord = deconstruct_chord("E7#9")
    assert chord.root == "E"
    assert chord.quality == ChordQuality.ALTERED_DOMINANT
    assert chord.intervals == ["1", "3", "5", "b7", "#9"]
    # E7#9 has both G# (Major 3rd) and G (Sharp 9 / physical minor 3rd tone)
    assert chord.tones == ["E", "G#", "B", "D", "G"]


def test_deconstruct_7th_chords():
    # Dominant 7th
    g7 = deconstruct_chord("G7")
    assert g7.tones == ["G", "B", "D", "F"]

    # Major 7th
    cmaj7 = deconstruct_chord("Cmaj7")
    assert cmaj7.tones == ["C", "E", "G", "B"]

    # Minor 7th
    am7 = deconstruct_chord("Am7")
    assert am7.tones == ["A", "C", "E", "G"]

    # Half-diminished
    bm7b5 = deconstruct_chord("Bm7b5")
    assert bm7b5.tones == ["B", "D", "F", "A"]


def test_deconstruct_suspended_and_add_chords():
    dsus4 = deconstruct_chord("Dsus4")
    assert dsus4.tones == ["D", "G", "A"]

    dsus2 = deconstruct_chord("Dsus2")
    assert dsus2.tones == ["D", "E", "A"]

    cadd9 = deconstruct_chord("Cadd9")
    assert cadd9.tones == ["C", "E", "G", "D"]


def test_triad_inversions_g_major():
    # Root position (1 - 3 - 5)
    root_pos = get_triad_inversion_notes("G", quality="maj", inversion=0)
    assert root_pos == ["G", "B", "D"]

    # 1st Inversion G/B (3 - 5 - 1)
    first_inv = get_triad_inversion_notes("G", quality="maj", inversion=1)
    assert first_inv == ["B", "D", "G"]

    # 2nd Inversion G/D (5 - 1 - 3)
    second_inv = get_triad_inversion_notes("G", quality="maj", inversion=2)
    assert second_inv == ["D", "G", "B"]


def test_triad_inversions_a_minor():
    root_pos = get_triad_inversion_notes("A", quality="min", inversion=0)
    assert root_pos == ["A", "C", "E"]

    first_inv = get_triad_inversion_notes("A", quality="min", inversion=1)
    assert first_inv == ["C", "E", "A"]

    second_inv = get_triad_inversion_notes("A", quality="min", inversion=2)
    assert second_inv == ["E", "A", "C"]


def test_triad_inversion_invalid():
    with pytest.raises(ValueError):
        get_triad_inversion_notes("G", inversion=3)


def test_list_supported_chords():
    chords = list_supported_chords()
    assert "maj" in chords
    assert "min" in chords
    assert "7#9" in chords
    assert "m7b5" in chords
    assert len(chords) >= 20
