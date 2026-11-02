"""Unit tests for Chord Formula and Quality Parser (TASK-1.4)."""
import pytest
from backend.app.schemas.theory import ChordQuality
from backend.app.theory.chords import (
    parse_chord_symbol,
    deconstruct_chord,
    get_chord_arpeggio,
    get_chord_embellishments,
    get_triad_inversion_notes,
    get_shell_voicing,
    get_superimposed_triads,
    get_tritone_substitution,
    get_spread_triad_notes,
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


def test_get_shell_voicings():
    # Guide tones: Root + 3rd + 7th (omits 5th)
    assert get_shell_voicing("G7") == ["G", "B", "F"]
    assert get_shell_voicing("Cmaj7") == ["C", "E", "B"]
    assert get_shell_voicing("Am7") == ["A", "C", "G"]
    assert get_shell_voicing("Bm7b5") == ["B", "D", "A"]


def test_get_superimposed_triads():
    # Over Cmaj7: mediant Em (3-5-7) and submediant Am (6-1-3)
    cmaj7_subs = get_superimposed_triads("Cmaj7")
    assert cmaj7_subs["chord"] == "Cmaj7"
    assert cmaj7_subs["superimposed_triads"]["mediant_triad"]["triad"] == "Em"
    assert cmaj7_subs["superimposed_triads"]["submediant_triad"]["triad"] == "Am"

    # Over Dm7: relative major F (b3-5-b7) and fifth triad Am (5-b7-9)
    dm7_subs = get_superimposed_triads("Dm7")
    assert dm7_subs["superimposed_triads"]["relative_major_triad"]["triad"] == "F"
    assert dm7_subs["superimposed_triads"]["fifth_triad"]["triad"] == "Am"

    # Over G7: leading tone Bdim and tritone sub Db
    g7_subs = get_superimposed_triads("G7")
    assert g7_subs["superimposed_triads"]["leading_tone_triad"]["triad"] == "Bdim"
    assert g7_subs["superimposed_triads"]["tritone_sub_triad"]["triad"] == "Db"


def test_get_tritone_substitution():
    # Dominant 7th tritone substitutions (6 semitones away)
    assert get_tritone_substitution("G7") == "Db7"
    assert get_tritone_substitution("C7") == "Gb7"
    assert get_tritone_substitution("E7") == "Bb7"
    assert get_tritone_substitution("A7") == "Eb7"
    # Non-dominant chords return None
    assert get_tritone_substitution("Cmaj7") is None
    assert get_tritone_substitution("Am7") is None


def test_get_spread_triad_notes():
    # Open-voiced Eric Johnson / Mateus Asato style: 1 - 5 - 10 (3rd + octave)
    assert get_spread_triad_notes("G", "maj") == ["G", "D", "B"]
    assert get_spread_triad_notes("C", "maj") == ["C", "G", "E"]
    assert get_spread_triad_notes("A", "min") == ["A", "E", "C"]

