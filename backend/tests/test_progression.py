"""Unit tests for Deterministic Progression Engine & Harmonic Analysis Core (TASK-3.1)."""
import pytest
from backend.app.schemas.theory import HarmonicFunction
from backend.app.theory.progression import (
    analyze_progression,
    calculate_chord_voice_leading,
    detect_tonal_center,
    get_guide_tones,
    parse_roman_numeral,
    recommend_scales_for_chord,
)


def test_krumhansl_key_detection_major_ii_v_i():
    """Confirms Krumhansl-Schmuckler accurately identifies C Major from Dm7 - G7 - Cmaj7."""
    key, mode, confidence = detect_tonal_center(["Dm7", "G7", "Cmaj7"])
    assert key == "C"
    assert mode == "major"
    assert confidence > 0.6


def test_krumhansl_key_detection_andalusian_minor():
    """Confirms detection of A Minor from Andalusian cadence Am - G - F - E7."""
    key, mode, confidence = detect_tonal_center(["Am", "G", "F", "E7"])
    assert key == "A"
    assert mode == "minor"
    assert confidence > 0.6


def test_krumhansl_key_detection_12_bar_blues():
    """Confirms detection of A from 12-bar dominant blues chords A7 - D7 - E7."""
    key, mode, confidence = detect_tonal_center(["A7", "D7", "A7", "E7"])
    assert key == "A"
    assert confidence > 0.5


def test_roman_numeral_major_diatonic():
    """Verifies diatonic Roman numerals in C Major."""
    # ii chord
    roman, func, _ = parse_roman_numeral("Dm7", "C", "major")
    assert roman == "ii7"
    assert func == HarmonicFunction.SUBDOMINANT

    # V chord
    roman, func, _ = parse_roman_numeral("G7", "C", "major")
    assert roman == "V7"
    assert func == HarmonicFunction.DOMINANT

    # I chord
    roman, func, _ = parse_roman_numeral("Cmaj7", "C", "major")
    assert roman == "Imaj7"
    assert func == HarmonicFunction.TONIC

    # IV chord
    roman, func, _ = parse_roman_numeral("F", "C", "major")
    assert roman == "IV"
    assert func == HarmonicFunction.SUBDOMINANT


def test_roman_numeral_secondary_dominants():
    """Verifies secondary dominant classification in C Major."""
    # D7 -> V7/V (leads to G)
    roman, func, _ = parse_roman_numeral("D7", "C", "major")
    assert roman in ("II7", "V7/V")
    assert func == HarmonicFunction.SECONDARY_DOMINANT

    # E7 -> V7/vi (leads to Am)
    roman, func, _ = parse_roman_numeral("E7", "C", "major")
    assert roman in ("III7", "V7/vi")
    assert func == HarmonicFunction.SECONDARY_DOMINANT

    # A7 -> V7/ii (leads to Dm)
    roman, func, _ = parse_roman_numeral("A7", "C", "major")
    assert roman in ("VI7", "V7/ii")
    assert func == HarmonicFunction.SECONDARY_DOMINANT


def test_roman_numeral_modal_interchange():
    """Verifies borrowed chords from parallel minor (modal interchange) in C Major."""
    # bVII (Bb in C Major) - classic rock subtonic
    roman, func, _ = parse_roman_numeral("Bb", "C", "major")
    assert roman == "bVII"
    assert func == HarmonicFunction.MODAL_INTERCHANGE

    # iv (Fm in C Major) - minor 4th
    roman, func, _ = parse_roman_numeral("Fm", "C", "major")
    assert roman == "iv"
    assert func == HarmonicFunction.MODAL_INTERCHANGE

    # bVI (Ab in C Major) - epic borrowed submediant
    roman, func, _ = parse_roman_numeral("Ab", "C", "major")
    assert roman == "bVI"
    assert func == HarmonicFunction.MODAL_INTERCHANGE

    # bIII (Eb in C Major) - blues mediant
    roman, func, _ = parse_roman_numeral("Eb", "C", "major")
    assert roman == "bIII"
    assert func == HarmonicFunction.MODAL_INTERCHANGE


def test_tritone_substitution():
    """Verifies tritone substitution recognition (Db7 in C Major)."""
    roman, func, _ = parse_roman_numeral("Db7", "C", "major")
    assert "bV" in roman or "subV" in roman or "bII" in roman
    assert func in (HarmonicFunction.TRITONE_SUB, HarmonicFunction.NEAPOLITAN)


def test_guide_tones_extraction():
    """Verifies extraction of 3rd and 7th guide tones."""
    # Dm7: 3rd is F, 7th is C
    g_dm7 = get_guide_tones("Dm7")
    tones_dm7 = [t for t, _ in g_dm7]
    assert "F" in tones_dm7
    assert "C" in tones_dm7

    # G7: 3rd is B, 7th is F
    g_g7 = get_guide_tones("G7")
    tones_g7 = [t for t, _ in g_g7]
    assert "B" in tones_g7
    assert "F" in tones_g7

    # Cmaj7: 3rd is E, 7th is B
    g_cmaj7 = get_guide_tones("Cmaj7")
    tones_cmaj7 = [t for t, _ in g_cmaj7]
    assert "E" in tones_cmaj7
    assert "B" in tones_cmaj7


def test_voice_leading_dm7_to_g7():
    """Verifies smooth voice leading from Dm7 to G7 (ii -> V).
    - C (7th of Dm7) -> B (3rd of G7): -1 half step down (resolution)
    - F (3rd of Dm7) -> F (7th of G7): 0 semitones (common tone)
    """
    steps = calculate_chord_voice_leading("Dm7", "G7")
    assert len(steps) >= 2

    # Check 7th -> 3rd resolution (C -> B)
    step_c_b = next((s for s in steps if s.from_note == "C" and s.to_note == "B"), None)
    assert step_c_b is not None
    assert step_c_b.semitone_distance == -1
    assert step_c_b.movement_type == "half_step_down"
    assert step_c_b.is_guide_tone_resolution is True

    # Check 3rd -> 7th common tone (F -> F)
    step_f_f = next((s for s in steps if s.from_note == "F" and s.to_note == "F"), None)
    assert step_f_f is not None
    assert step_f_f.semitone_distance == 0
    assert step_f_f.movement_type == "common_tone"
    assert step_f_f.is_guide_tone_resolution is True


def test_voice_leading_g7_to_cmaj7():
    """Verifies smooth voice leading from G7 to Cmaj7 (V -> I).
    - F (7th of G7) -> E (3rd of Cmaj7): -1 half step down (resolution)
    - B (3rd of G7) -> C (Root of Cmaj7): +1 half step up (leading tone)
    """
    steps = calculate_chord_voice_leading("G7", "Cmaj7")
    assert len(steps) >= 2

    step_f_e = next((s for s in steps if s.from_note == "F" and s.to_note == "E"), None)
    assert step_f_e is not None
    assert step_f_e.semitone_distance == -1
    assert step_f_e.movement_type == "half_step_down"
    assert step_f_e.is_guide_tone_resolution is True


def test_scale_recommendations():
    """Verifies 4-tier solo scale suggestions."""
    # Dm7 in C
    rec_dm7 = recommend_scales_for_chord("Dm7", "C", "major")
    assert rec_dm7["modal"] == "D Dorian"
    assert "Blues" in rec_dm7["blues"]

    # G7 in C
    rec_g7 = recommend_scales_for_chord("G7", "C", "major")
    assert rec_g7["modal"] == "G Mixolydian"
    assert "Altered" in rec_g7["spicy"]

    # E7 (secondary dominant V7/vi) in C
    rec_e7 = recommend_scales_for_chord("E7", "C", "major")
    assert "Phrygian Dominant" in rec_e7["spicy"]

    # Fm (minor 4th) in C
    rec_fm = recommend_scales_for_chord("Fm", "C", "major")
    assert "Melodic Minor" in rec_fm["spicy"]


def test_full_progression_analysis_little_wing():
    """Tests complete progression analysis on Jimi Hendrix's Little Wing changes."""
    chords = ["Em", "G", "Am", "Em", "Bm7", "Am7", "C", "D"]
    res = analyze_progression(chords)

    assert len(res.chords) == len(chords)
    assert res.key in ("G", "E")  # G Major or E Minor relative
    assert res.total_bars >= 8

    # Each chord should have valid voice leading to the next
    for c in res.chords:
        assert len(c.voice_leading_to_next) > 0
        assert len(c.guide_tones) > 0
        assert "modal" in c.recommended_scales


def test_full_progression_analysis_comfortably_numb():
    """Tests complete progression analysis on Pink Floyd's Comfortably Numb verse."""
    chords = ["Bm", "A", "G", "Em", "Bm"]
    res = analyze_progression(chords)

    assert res.key in ("B", "D")  # B Minor or relative D Major
    assert len(res.chords) == 5
    # First chord should be tonic i
    assert res.chords[0].symbol == "Bm"


def test_empty_progression_raises():
    """Confirms error handling on empty progression list."""
    with pytest.raises(ValueError, match="Progression cannot be empty"):
        analyze_progression([])
