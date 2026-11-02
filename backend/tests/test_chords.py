"""Unit tests for Chord Formula and Quality Parser (TASK-1.4)."""
import pytest
from backend.app.schemas.theory import ChordQuality
from backend.app.theory.chords import (
    parse_chord_symbol,
    deconstruct_chord,
    get_chord_arpeggio,
    get_chord_embellishments,
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
    assert chord.tones == ["E", "G#", "B", "D", "G"]


def test_get_chord_arpeggio():
    # Sequential single notes for soloing sweeps and lines
    arpeggio_am7 = get_chord_arpeggio("Am7")
    assert arpeggio_am7 == ["A", "C", "E", "G", "A"]

    arpeggio_g = get_chord_arpeggio("G")
    assert arpeggio_g == ["G", "B", "D", "G"]


def test_get_chord_embellishments():
    # Hendrix / Mayer fills for C Major: sus4 is F, add9 is D, 6th is A
    c_emb = get_chord_embellishments("C")
    assert c_emb["chord"] == "C"
    assert c_emb["embellishments"]["sus4"]["note"] == "F"
    assert c_emb["embellishments"]["add9"]["note"] == "D"
    assert c_emb["embellishments"]["sixth"]["note"] == "A"

    # Fills for A Major: sus4 is D, add9 is B, 6th is F#
    a_emb = get_chord_embellishments("A")
    assert a_emb["embellishments"]["sus4"]["note"] == "D"
    assert a_emb["embellishments"]["add9"]["note"] == "B"
    assert a_emb["embellishments"]["sixth"]["note"] == "F#"


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


def test_list_supported_chords():
    chords = list_supported_chords()
    assert "maj" in chords
    assert "min" in chords
    assert "7#9" in chords
    assert "m7b5" in chords
    assert len(chords) >= 20
