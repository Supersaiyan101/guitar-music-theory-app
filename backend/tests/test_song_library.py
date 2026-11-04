"""Unit tests for Curated Master Song Encyclopedia & Custom Progression Parser (TASK-3.2)."""
import pytest
from backend.app.data.progressions import (
    SONG_ENCYCLOPEDIA,
    get_curated_song,
    list_curated_songs,
    parse_progression_input,
)
from backend.app.theory.progression import analyze_progression


def test_catalog_contains_all_16_songs():
    """Confirms all 16 curated songs exist in the catalog."""
    assert len(SONG_ENCYCLOPEDIA) == 16

    expected_ids = [
        "little_wing",
        "comfortably_numb_outro",
        "hotel_california",
        "hey_joe",
        "blues_12_bar_a",
        "thrill_is_gone",
        "oye_como_va",
        "funk_vamp_e7sharp9",
        "autumn_leaves",
        "just_the_two_of_us",
        "jazz_turnaround_c",
        "giant_steps_intro",
        "creep",
        "four_chord_anthem",
        "andalusian_cadence",
        "doo_wop_50s",
    ]
    for song_id in expected_ids:
        assert song_id in SONG_ENCYCLOPEDIA, f"Missing song '{song_id}' in encyclopedia"


def test_all_curated_songs_parse_cleanly():
    """Validates that every curated song in the encyclopedia passes full harmonic analysis."""
    for song_id, song in SONG_ENCYCLOPEDIA.items():
        assert len(song.bars) > 0
        assert len(song.chords_sequence) > 0
        assert len(song.chord_durations) == len(song.chords_sequence)

        # Run full progression analysis through our deterministic engine
        analysis = analyze_progression(
            chords=song.chords_sequence,
            key=song.key,
            mode=song.mode,
            durations=song.chord_durations,
        )
        assert analysis.key == song.key
        assert len(analysis.chords) == len(song.chords_sequence)
        for c in analysis.chords:
            assert c.roman_numeral is not None
            assert c.harmonic_function is not None
            assert len(c.voice_leading_to_next) > 0


def test_list_curated_songs_genre_filter():
    """Verifies genre filtering across the 4 core shelves."""
    rock = list_curated_songs(genre="classic_rock")
    assert len(rock) == 4
    for s in rock:
        assert s.genre == "classic_rock"

    blues = list_curated_songs(genre="blues_funk")
    assert len(blues) == 4

    jazz = list_curated_songs(genre="jazz_neosoul")
    assert len(jazz) == 4

    pop = list_curated_songs(genre="pop_modern")
    assert len(pop) == 4


def test_get_curated_song_by_id():
    """Verifies detailed metadata retrieval for iconic songs."""
    lw = get_curated_song("little_wing")
    assert lw is not None
    assert lw.artist == "Jimi Hendrix"
    assert lw.default_tempo == 72
    assert len(lw.bars) == 10
    assert "F natural" in lw.soloing_tip

    hc = get_curated_song("hotel_california")
    assert hc is not None
    assert hc.artist == "Eagles / Don Felder & Joe Walsh"
    assert hc.key == "B"
    assert hc.mode == "minor"
    assert len(hc.bars) == 8


def test_parse_progression_input_hyphen_delimiters():
    """Tests parsing 'Dm7 - G7 - Cmaj7' into measures and analysis."""
    song_def, analysis = parse_progression_input("Dm7 - G7 - Cmaj7")
    assert len(song_def.bars) == 3
    assert song_def.chords_sequence == ["Dm7", "G7", "Cmaj7"]
    assert analysis.key == "C"
    assert analysis.chords[0].roman_numeral == "ii7"
    assert analysis.chords[1].roman_numeral == "V7"
    assert analysis.chords[2].roman_numeral == "Imaj7"


def test_parse_progression_input_pipe_measures():
    """Tests parsing '| Dm7 G7 | Cmaj7 |' with 2-beat sub-divisions in bar 1."""
    song_def, analysis = parse_progression_input("| Dm7 G7 | Cmaj7 |")
    assert len(song_def.bars) == 2
    # Bar 1 has 2 chords of 2 beats
    assert len(song_def.bars[0]) == 2
    assert song_def.bars[0][0].chord == "Dm7"
    assert song_def.bars[0][0].beats == 2
    assert song_def.bars[0][1].chord == "G7"
    assert song_def.bars[0][1].beats == 2

    # Bar 2 has 1 chord of 4 beats
    assert len(song_def.bars[1]) == 1
    assert song_def.bars[1][0].chord == "Cmaj7"
    assert song_def.bars[1][0].beats == 4


def test_parse_progression_input_roman_numerals():
    """Tests parsing Roman numeral string 'ii7 - V7 - Imaj7' with explicit key 'C'."""
    song_def, analysis = parse_progression_input("ii7 - V7 - Imaj7", key="C")
    assert song_def.chords_sequence == ["Dm7", "G7", "Cmaj7"]
    assert analysis.key == "C"


def test_parse_progression_input_empty_raises():
    """Confirms error handling on empty or whitespace string."""
    with pytest.raises(ValueError, match="cannot be empty"):
        parse_progression_input("   ")

