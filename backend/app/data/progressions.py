"""Curated Master Song Encyclopedia & Custom Progression Parser for Guitar Theory Kingdom.

Provides:
- 16 curated high-fidelity song progressions across 4 genres
- Intelligent custom progression parser (delimiters, bars, Roman numeral translation)
- Full integration with backend.app.theory.progression.analyze_progression
"""
import re
from typing import Dict, List, Optional, Tuple

from backend.app.schemas.theory import (
    BarChord,
    ProgressionAnalysisResult,
    SongProgressionDefinition,
)
from backend.app.theory.progression import analyze_progression

# ---------------------------------------------------------------------------
# 16 Curated Master Song Progressions
# ---------------------------------------------------------------------------

_SONGS_RAW: List[Dict] = [
    # --- 1. Classic Rock & Guitar Anthems ---
    {
        "id": "little_wing",
        "title": "Little Wing",
        "artist": "Jimi Hendrix",
        "genre": "classic_rock",
        "difficulty": "advanced",
        "default_tempo": 72,
        "time_signature": "4/4",
        "key": "G",
        "mode": "major",
        "bars": [
            [{"chord": "Em", "beats": 4}],
            [{"chord": "G", "beats": 4}],
            [{"chord": "Am", "beats": 4}],
            [{"chord": "Em", "beats": 4}],
            [{"chord": "Bm", "beats": 4}],
            [{"chord": "Am", "beats": 2}, {"chord": "C", "beats": 2}],
            [{"chord": "G", "beats": 2}, {"chord": "F", "beats": 2}],
            [{"chord": "C", "beats": 4}],
            [{"chord": "D", "beats": 4}],
            [{"chord": "D", "beats": 4}],
        ],
        "soloing_tip": "Anchor your thumb over the neck in CAGED shapes and use sus4/add9 hammer-ons. Target the F natural note in Bar 7 (borrowed bVII relative to G) for that signature floating Hendrix ballad sound!",
        "iconic_tone": "Fender Stratocaster neck pickup through a clean tube amp with subtle Uni-Vibe rotary modulation and warm germanium fuzz.",
    },
    {
        "id": "comfortably_numb_outro",
        "title": "Comfortably Numb (Outro Solo)",
        "artist": "Pink Floyd / David Gilmour",
        "genre": "classic_rock",
        "difficulty": "intermediate",
        "default_tempo": 65,
        "time_signature": "4/4",
        "key": "B",
        "mode": "minor",
        "bars": [
            [{"chord": "Bm", "beats": 4}],
            [{"chord": "A", "beats": 4}],
            [{"chord": "G", "beats": 4}],
            [{"chord": "Em", "beats": 4}],
        ],
        "soloing_tip": "Hit the F# (5th of Bm) right on the downbeat with singing sustain. Over the G chord, bend the A (9th) up to B (3rd) with slow, expressive Gilmour vibrato.",
        "iconic_tone": "Black Strat bridge pickup with Electro-Harmonix Big Muff fuzz, subtle digital delay (440ms), and electric chorus.",
    },
    {
        "id": "hotel_california",
        "title": "Hotel California",
        "artist": "Eagles / Don Felder & Joe Walsh",
        "genre": "classic_rock",
        "difficulty": "advanced",
        "default_tempo": 75,
        "time_signature": "4/4",
        "key": "B",
        "mode": "minor",
        "bars": [
            [{"chord": "Bm", "beats": 4}],
            [{"chord": "F#7", "beats": 4}],
            [{"chord": "A", "beats": 4}],
            [{"chord": "E7", "beats": 4}],
            [{"chord": "G", "beats": 4}],
            [{"chord": "D", "beats": 4}],
            [{"chord": "Em", "beats": 4}],
            [{"chord": "F#7", "beats": 4}],
        ],
        "soloing_tip": "When the F#7 chord hits, switch immediately from B Minor Pentatonic to B Harmonic Minor (or F# Phrygian Dominant) to target the crucial A# leading tone!",
        "iconic_tone": "Gibson Les Paul neck pickup into a Fender Tweed Deluxe with smooth overdrive.",
    },
    {
        "id": "hey_joe",
        "title": "Hey Joe",
        "artist": "Jimi Hendrix",
        "genre": "classic_rock",
        "difficulty": "intermediate",
        "default_tempo": 84,
        "time_signature": "4/4",
        "key": "E",
        "mode": "major",
        "bars": [
            [{"chord": "C", "beats": 4}],
            [{"chord": "G", "beats": 4}],
            [{"chord": "D", "beats": 4}],
            [{"chord": "A", "beats": 4}],
            [{"chord": "E", "beats": 4}],
        ],
        "soloing_tip": "The famous Circle of Fourths reverse cascade (C-G-D-A-E). E Minor Blues works across the entire loop, but target the Major 3rd of each chord as it arrives to outline the changes.",
        "iconic_tone": "Stratocaster middle/bridge pickup through a Marshall Plexi with Dallas Arbiter Fuzz Face.",
    },

    # --- 2. Blues & Funk ---
    {
        "id": "blues_12_bar_a",
        "title": "12-Bar Blues in A (Quick Change)",
        "artist": "Blues Standard",
        "genre": "blues_funk",
        "difficulty": "intermediate",
        "default_tempo": 116,
        "time_signature": "4/4",
        "key": "A",
        "mode": "major",
        "bars": [
            [{"chord": "A7", "beats": 4}],
            [{"chord": "D7", "beats": 4}],
            [{"chord": "A7", "beats": 4}],
            [{"chord": "A7", "beats": 4}],
            [{"chord": "D7", "beats": 4}],
            [{"chord": "D7", "beats": 4}],
            [{"chord": "A7", "beats": 4}],
            [{"chord": "A7", "beats": 4}],
            [{"chord": "E7", "beats": 4}],
            [{"chord": "D7", "beats": 4}],
            [{"chord": "A7", "beats": 4}],
            [{"chord": "E7", "beats": 4}],
        ],
        "soloing_tip": "Slip between A Minor Pentatonic and A Major Pentatonic! On the A7 chord, slide the minor 3rd (C) up a half-step to the sweet Major 3rd (C#) on String 3 Fret 6.",
        "iconic_tone": "Gibson ES-335 or Fender Telecaster on edge-of-breakup tube amp with light spring reverb.",
    },
    {
        "id": "thrill_is_gone",
        "title": "The Thrill is Gone",
        "artist": "B.B. King",
        "genre": "blues_funk",
        "difficulty": "intermediate",
        "default_tempo": 90,
        "time_signature": "4/4",
        "key": "B",
        "mode": "minor",
        "bars": [
            [{"chord": "Bm", "beats": 4}],
            [{"chord": "Bm", "beats": 4}],
            [{"chord": "Bm", "beats": 4}],
            [{"chord": "Bm", "beats": 4}],
            [{"chord": "Em", "beats": 4}],
            [{"chord": "Em", "beats": 4}],
            [{"chord": "Bm", "beats": 4}],
            [{"chord": "Bm", "beats": 4}],
            [{"chord": "Gmaj7", "beats": 4}],
            [{"chord": "F#7", "beats": 4}],
            [{"chord": "Bm", "beats": 4}],
            [{"chord": "Bm", "beats": 4}],
        ],
        "soloing_tip": "Anchor in the B.B. King Box at Fret 12 on String 2. Over Gmaj7, target the high D note, and over F#7, hit the C# or bend the E to F# with butterfly vibrato.",
        "iconic_tone": "Gibson Lucille semi-hollow body on Varitone position 2 through a Fender Twin Reverb.",
    },
    {
        "id": "oye_como_va",
        "title": "Oye Como Va",
        "artist": "Santana",
        "genre": "blues_funk",
        "difficulty": "intermediate",
        "default_tempo": 128,
        "time_signature": "4/4",
        "key": "A",
        "mode": "minor",
        "bars": [
            [{"chord": "Am7", "beats": 4}],
            [{"chord": "D9", "beats": 4}],
        ],
        "soloing_tip": "The ultimate 2-chord Dorian modal masterclass. Play A Dorian throughout, and target the F# note (the Sweet Major 6th) every time the D9 chord hits!",
        "iconic_tone": "PRS Custom 24 or Yamaha SG2000 neck pickup into a cranked Mesa/Boogie Mark I with infinite singing sustain.",
    },
    {
        "id": "funk_vamp_e7sharp9",
        "title": "Funk Groove in E7#9",
        "artist": "James Brown / Hendrix",
        "genre": "blues_funk",
        "difficulty": "advanced",
        "default_tempo": 105,
        "time_signature": "4/4",
        "key": "E",
        "mode": "major",
        "bars": [
            [{"chord": "E7#9", "beats": 4}],
            [{"chord": "E7#9", "beats": 4}],
            [{"chord": "A13", "beats": 4}],
            [{"chord": "B7#9", "beats": 4}],
        ],
        "soloing_tip": "Lock into tight 16th-note scratch rhythm comping. Target the G natural note (the sharp-9 tension) on the E chord, and outline the F# note (13th) on A13.",
        "iconic_tone": "Fender Stratocaster in position 4 (neck + middle) through an optical compressor and envelope filter wah.",
    },

    # --- 3. Jazz & Neo-Soul ---
    {
        "id": "autumn_leaves",
        "title": "Autumn Leaves",
        "artist": "Jazz Standard",
        "genre": "jazz_neosoul",
        "difficulty": "advanced",
        "default_tempo": 120,
        "time_signature": "4/4",
        "key": "G",
        "mode": "minor",
        "bars": [
            [{"chord": "Cm7", "beats": 4}],
            [{"chord": "F7", "beats": 4}],
            [{"chord": "Bbmaj7", "beats": 4}],
            [{"chord": "Ebmaj7", "beats": 4}],
            [{"chord": "Am7b5", "beats": 4}],
            [{"chord": "D7", "beats": 4}],
            [{"chord": "Gm", "beats": 4}],
            [{"chord": "Gm", "beats": 4}],
        ],
        "soloing_tip": "The master study in guide-tone voice leading: Bars 1-4 form a Major ii-V-I-IV in Bb, and Bars 5-8 form a Minor ii-V-i in G Minor. Connect the 7ths to the 3rds by half-steps across every change!",
        "iconic_tone": "Gibson L-5 archtop hollow-body with flatwound strings and tone knob rolled back to 4.",
    },
    {
        "id": "just_the_two_of_us",
        "title": "Just the Two of Us",
        "artist": "Grover Washington Jr. / Bill Withers",
        "genre": "jazz_neosoul",
        "difficulty": "advanced",
        "default_tempo": 96,
        "time_signature": "4/4",
        "key": "F",
        "mode": "minor",
        "bars": [
            [{"chord": "Dbmaj7", "beats": 4}],
            [{"chord": "C7", "beats": 4}],
            [{"chord": "Fm7", "beats": 4}],
            [{"chord": "Ebm7", "beats": 2}, {"chord": "Ab7", "beats": 2}],
        ],
        "soloing_tip": "Neo-soul gold! Over C7 (secondary dominant V7/vi), target the E natural note pulling into F on the Fm7. Over Ebm7-Ab7, run quick 2-beat arpeggios resolving back into Db.",
        "iconic_tone": "D'Angelico semi-hollow or Telecaster middle position through a Fender Rhodes-style clean tone with analog tape delay.",
    },
    {
        "id": "jazz_turnaround_c",
        "title": "Classic Jazz Turnaround",
        "artist": "Jazz Standard (I-vi-ii-V)",
        "genre": "jazz_neosoul",
        "difficulty": "intermediate",
        "default_tempo": 130,
        "time_signature": "4/4",
        "key": "C",
        "mode": "major",
        "bars": [
            [{"chord": "Cmaj7", "beats": 4}],
            [{"chord": "Am7", "beats": 4}],
            [{"chord": "Dm7", "beats": 4}],
            [{"chord": "G7", "beats": 4}],
        ],
        "soloing_tip": "Use shell voicings on strings 4, 3, and 2. On G7, introduce the G Altered scale (Super Locrian) to create tension that pulls seamlessly back into the Cmaj7 root.",
        "iconic_tone": "Warm jazz archtop with subtle chorus and room reverb.",
    },
    {
        "id": "giant_steps_intro",
        "title": "Giant Steps (Intro Cycle)",
        "artist": "John Coltrane",
        "genre": "jazz_neosoul",
        "difficulty": "advanced",
        "default_tempo": 200,
        "time_signature": "4/4",
        "key": "B",
        "mode": "major",
        "bars": [
            [{"chord": "Bmaj7", "beats": 2}, {"chord": "D7", "beats": 2}],
            [{"chord": "Gmaj7", "beats": 2}, {"chord": "Bb7", "beats": 2}],
            [{"chord": "Ebmaj7", "beats": 4}],
            [{"chord": "Am7", "beats": 2}, {"chord": "D7", "beats": 2}],
        ],
        "soloing_tip": "The famous Coltrane Matrix: moves rapidly between three key centers a Major 3rd apart (B -> G -> Eb). Do not try to play one scale—outline the 1-3-5-7 arpeggio of each chord cleanly!",
        "iconic_tone": "Pristine clean jazz solid-state amp (Roland JC-120) with fast attack.",
    },

    # --- 4. Pop & Modern Progressions ---
    {
        "id": "creep",
        "title": "Creep",
        "artist": "Radiohead",
        "genre": "pop_modern",
        "difficulty": "beginner",
        "default_tempo": 92,
        "time_signature": "4/4",
        "key": "G",
        "mode": "major",
        "bars": [
            [{"chord": "G", "beats": 4}],
            [{"chord": "G", "beats": 4}],
            [{"chord": "B", "beats": 4}],
            [{"chord": "B", "beats": 4}],
            [{"chord": "C", "beats": 4}],
            [{"chord": "C", "beats": 4}],
            [{"chord": "Cm", "beats": 4}],
            [{"chord": "Cm", "beats": 4}],
        ],
        "soloing_tip": "The quintessential lesson in borrowed chords: Over the B major, target the D# note. When the C major changes to Cm, drop your finger one fret from E to Eb (the minor 4th) for that legendary heartbreaking moment!",
        "iconic_tone": "Telecaster Plus with Lace Sensor pickups into a Fender Twin, then kicking on a Marshall ShredMaster distortion on the chorus.",
    },
    {
        "id": "four_chord_anthem",
        "title": "4-Chord Pop Anthem (I-V-vi-IV)",
        "artist": "Axis of Awesome / Pop Standard",
        "genre": "pop_modern",
        "difficulty": "beginner",
        "default_tempo": 120,
        "time_signature": "4/4",
        "key": "C",
        "mode": "major",
        "bars": [
            [{"chord": "C", "beats": 4}],
            [{"chord": "G", "beats": 4}],
            [{"chord": "Am", "beats": 4}],
            [{"chord": "F", "beats": 4}],
        ],
        "soloing_tip": "The foundation of hundreds of global hit songs (Don't Stop Believin', With or Without You). C Major Pentatonic works over everything, but target the 3rds: E on C, B on G, C on Am, A on F.",
        "iconic_tone": "Acoustic steel-string dreadnought layered with clean electric chime.",
    },
    {
        "id": "andalusian_cadence",
        "title": "Andalusian Cadence (i-bVII-bVI-V)",
        "artist": "Flamenco / Spanish Traditional",
        "genre": "pop_modern",
        "difficulty": "intermediate",
        "default_tempo": 110,
        "time_signature": "4/4",
        "key": "A",
        "mode": "minor",
        "bars": [
            [{"chord": "Am", "beats": 4}],
            [{"chord": "G", "beats": 4}],
            [{"chord": "F", "beats": 4}],
            [{"chord": "E7", "beats": 4}],
        ],
        "soloing_tip": "The descending four-chord Spanish progression. Play A Natural Minor over Am, G, and F, then unleash the E Phrygian Dominant scale (featuring G#) over the E7 chord!",
        "iconic_tone": "Nylon-string Spanish classical guitar or Stratocaster neck pickup with slapback delay.",
    },
    {
        "id": "doo_wop_50s",
        "title": "50s Doo-Wop Cadence (I-vi-IV-V)",
        "artist": "50s Ballad Standard",
        "genre": "pop_modern",
        "difficulty": "beginner",
        "default_tempo": 85,
        "time_signature": "4/4",
        "key": "C",
        "mode": "major",
        "bars": [
            [{"chord": "C", "beats": 4}],
            [{"chord": "Am", "beats": 4}],
            [{"chord": "F", "beats": 4}],
            [{"chord": "G7", "beats": 4}],
        ],
        "soloing_tip": "Classic slow-dance progression. Practice moving between C Major triad inversions across strings 1, 2, and 3 without jumping your hand across the neck.",
        "iconic_tone": "Gretsch hollow-body with Bigsby vibrato into an analog tape echo.",
    },
]


def _build_song_model(raw: Dict) -> SongProgressionDefinition:
    """Builds a validated SongProgressionDefinition and flattens chord sequences."""
    bars_models = [
        [BarChord(chord=c["chord"], beats=c["beats"]) for c in bar]
        for bar in raw["bars"]
    ]
    chords_seq = [c.chord for bar in bars_models for c in bar]
    durs_seq = [c.beats for bar in bars_models for c in bar]

    return SongProgressionDefinition(
        id=raw["id"],
        title=raw["title"],
        artist=raw.get("artist"),
        genre=raw["genre"],
        difficulty=raw.get("difficulty", "intermediate"),
        default_tempo=raw.get("default_tempo", 100),
        time_signature=raw.get("time_signature", "4/4"),
        key=raw["key"],
        mode=raw.get("mode", "major"),
        bars=bars_models,
        chords_sequence=chords_seq,
        chord_durations=durs_seq,
        soloing_tip=raw["soloing_tip"],
        iconic_tone=raw.get("iconic_tone"),
    )


# Master Song Catalog Lookup Dictionary
SONG_ENCYCLOPEDIA: Dict[str, SongProgressionDefinition] = {
    s["id"]: _build_song_model(s) for s in _SONGS_RAW
}


def list_curated_songs(genre: Optional[str] = None) -> List[SongProgressionDefinition]:
    """Returns all curated songs, optionally filtered by genre."""
    songs = list(SONG_ENCYCLOPEDIA.values())
    if genre:
        return [s for s in songs if s.genre.lower() == genre.lower()]
    return songs


def get_curated_song(song_id: str) -> Optional[SongProgressionDefinition]:
    """Retrieves a single curated song progression by its unique slug ID."""
    return SONG_ENCYCLOPEDIA.get(song_id)


# ---------------------------------------------------------------------------
# Custom Progression String Parser
# ---------------------------------------------------------------------------

# Roman numeral degree map relative to Major scale intervals
_ROMAN_TO_SEMITONES: Dict[str, Tuple[int, str]] = {
    "i": (0, "min"),
    "i7": (0, "min7"),
    "im7": (0, "min7"),
    "I": (0, "maj"),
    "I7": (0, "7"),
    "Imaj7": (0, "maj7"),
    "bII": (1, "maj"),
    "bII7": (1, "7"),
    "ii": (2, "min"),
    "ii7": (2, "min7"),
    "iim7": (2, "min7"),
    "iiø": (2, "m7b5"),
    "iiø7": (2, "m7b5"),
    "II": (2, "maj"),
    "II7": (2, "7"),
    "bIII": (3, "maj"),
    "bIII7": (3, "7"),
    "iii": (4, "min"),
    "iii7": (4, "min7"),
    "III": (4, "maj"),
    "III7": (4, "7"),
    "iv": (5, "min"),
    "iv7": (5, "min7"),
    "IV": (5, "maj"),
    "IV7": (5, "7"),
    "IVmaj7": (5, "maj7"),
    "#IV": (6, "dim"),
    "bV": (6, "7"),
    "v": (7, "min"),
    "v7": (7, "min7"),
    "V": (7, "maj"),
    "V7": (7, "7"),
    "bVI": (8, "maj"),
    "bVI7": (8, "7"),
    "vi": (9, "min"),
    "vi7": (9, "min7"),
    "VI": (9, "maj"),
    "VI7": (9, "7"),
    "bVII": (10, "maj"),
    "bVII7": (10, "7"),
    "vii°": (11, "dim"),
    "viiø": (11, "m7b5"),
    "viiø7": (11, "m7b5"),
    "vii": (11, "min"),
    "VII": (11, "maj"),
    "VII7": (11, "7"),
}


def _roman_to_chord(roman: str, key_root: str) -> str:
    """Translates a Roman numeral string (e.g. 'ii', 'V7', 'bVII') into a concrete chord symbol in key_root."""
    from backend.app.theory.pitch import note_to_pitch_class, pitch_class_to_note

    clean_roman = roman.strip()
    if clean_roman not in _ROMAN_TO_SEMITONES:
        # Try stripping punctuation
        clean_roman = clean_roman.replace("ø", "ø7").replace("°", "°7")
        if clean_roman not in _ROMAN_TO_SEMITONES:
            return roman  # Fallback to literal

    semitones, quality = _ROMAN_TO_SEMITONES[clean_roman]
    key_pc = note_to_pitch_class(key_root)
    chord_pc = (key_pc + semitones) % 12
    chord_root = pitch_class_to_note(chord_pc, prefer_flats="b" in key_root)

    if quality == "maj":
        return chord_root
    elif quality == "min":
        return f"{chord_root}m"
    elif quality == "7":
        return f"{chord_root}7"
    elif quality == "maj7":
        return f"{chord_root}maj7"
    elif quality == "min7":
        return f"{chord_root}m7"
    elif quality == "m7b5":
        return f"{chord_root}m7b5"
    elif quality == "dim":
        return f"{chord_root}dim"
    return f"{chord_root}{quality}"


def parse_progression_input(
    raw_input: str,
    key: Optional[str] = None,
    mode: Optional[str] = None,
    default_bpm: int = 100,
) -> Tuple[SongProgressionDefinition, ProgressionAnalysisResult]:
    """Parses a user progression string into a validated SongProgressionDefinition
    and executes harmonic analysis via analyze_progression.
    
    Supports:
        - Pipe delimiter: '| Dm7 | G7 | Cmaj7 |'
        - Hyphen delimiter: 'Dm7 - G7 - Cmaj7'
        - Commas/spaces: 'Dm7, G7, Cmaj7' or 'Dm7 G7 Cmaj7'
        - Multi-chord bars: '| Dm7 G7 | Cmaj7 |'
        - Roman numerals: 'ii - V - I' in key of C -> translates to Dm7, G7, Cmaj7
    """
    clean = raw_input.strip()
    if not clean:
        raise ValueError("Progression input cannot be empty.")

    bars_list: List[List[BarChord]] = []

    # 1. Check if input contains measure pipes '|'
    if "|" in clean:
        raw_measures = [m.strip() for m in clean.split("|") if m.strip()]
        for m in raw_measures:
            # Tokenize chords within the measure
            chords_in_bar = re.split(r"[\s,]+", m)
            chords_in_bar = [c for c in chords_in_bar if c]
            if not chords_in_bar:
                continue

            # Calculate beats per chord in standard 4/4
            beats_per_chord = max(1, 4 // len(chords_in_bar))
            bar_events = []
            for c in chords_in_bar:
                actual_chord = _roman_to_chord(c, key or "C") if (key and c in _ROMAN_TO_SEMITONES) else c
                bar_events.append(BarChord(chord=actual_chord, beats=beats_per_chord))
            bars_list.append(bar_events)

    # 2. Otherwise split on hyphens, commas, or spaces
    else:
        tokens = re.split(r"[\s,\-]+", clean)
        tokens = [t for t in tokens if t]
        if not tokens:
            raise ValueError("No valid chord tokens found in progression.")

        for t in tokens:
            actual_chord = _roman_to_chord(t, key or "C") if (key and t in _ROMAN_TO_SEMITONES) else t
            bars_list.append([BarChord(chord=actual_chord, beats=4)])

    if not bars_list:
        raise ValueError("Failed to parse any chord measures from input.")

    # Flatten for analysis
    chords_seq = [c.chord for bar in bars_list for c in bar]
    durs_seq = [c.beats for bar in bars_list for c in bar]

    # Run deterministic harmonic analysis
    analysis_res = analyze_progression(
        chords=chords_seq,
        key=key,
        mode=mode,
        durations=durs_seq,
    )

    prog_def = SongProgressionDefinition(
        id="custom_progression",
        title="Custom Progression",
        artist="User",
        genre="custom",
        difficulty="intermediate",
        default_tempo=default_bpm,
        time_signature="4/4",
        key=analysis_res.key,
        mode=analysis_res.mode,
        bars=bars_list,
        chords_sequence=chords_seq,
        chord_durations=durs_seq,
        soloing_tip=f"Analyze chord transitions in {analysis_res.key} {analysis_res.mode.capitalize()}. Target the 3rd and 7th guide tones across changes!",
        iconic_tone="Custom user setting.",
    )

    return prog_def, analysis_res
