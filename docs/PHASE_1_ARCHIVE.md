# 🏛️ Phase 1 Deterministic Music Theory & Fretboard Engine — Permanent Archive

> **Status:** 🟢 **100% Complete & Verified**  
> **Repository:** [github.com/Supersaiyan101/guitar-music-theory-app](https://github.com/Supersaiyan101/guitar-music-theory-app)  
> **Total Unit Tests:** **71 / 71 Passing (`pytest`) in 0.21s**  
> **Git Milestone Commit:** `4ad8e3f` (`feat(theory): complete TASK-1.5 with CAGED root anchors, voicings, diagonal pentatonic highway, BB/Albert King boxes, 3NPS, and octave GPS`)

---

## 📖 Executive Summary
Phase 1 delivers the foundational mathematical, theoretical, and physical guitar engine for **Guitar Theory Kingdom**. Designed specifically for intermediate and advanced guitarists seeking soloing freedom, improvisation proficiency, and deep fretboard navigation, it completely avoids beginner distractions (no capos, no tuners) and delivers pure deterministic music theory directly mapped to the 24-fret guitar matrix.

---

## 🧩 Architectural Modules & API Reference

### 1. `backend/app/theory/pitch.py` (`TASK-1.1`)
*Test Suite:* `backend/tests/test_pitch.py` (16 / 16 tests passing)

- **`NotationMode` Enum:**
  - `PRACTICAL` (Default for guitarists): Simplifies theoretical double-sharps and enharmonics to physical frets ($E\sharp \rightarrow F, B\sharp \rightarrow C, C\flat \rightarrow B, F\mathbf{x} \rightarrow G$).
  - `ACADEMIC`: Preserves classical sheet music spellings (e.g., $E\sharp$ in $F\sharp$ Major).
- **`normalize_note_name(note: str) -> str`**: Case-insensitive note parsing (`"c#"` $\rightarrow$ `"C#"`, `"bb"` $\rightarrow$ `"Bb"`).
- **`note_to_pitch_class(note: str) -> int`**: Converts note name to chroma index ($0$ for $C$ through $11$ for $B$).
- **`pitch_class_to_note(pc: int, prefer_flats: bool = False) -> str`**: Inverse pitch-class mapping.
- **`are_enharmonic(note_a: str, note_b: str) -> bool`**: Pitch equivalence checker (`"C#" == "Db"`, `"E#" == "F"`).
- **`shortest_semitone_distance(from_note: str, to_note: str) -> int`**: Minimal voice-leading fret delta between two notes ($-6$ to $+6$ semitones).
- **`transpose_note(note: str, semitones: int, prefer_flats: bool = False) -> str`**: Transposes notes up or down frets with negative integer support.
- **`get_circle_of_fifths() -> List[str]`**: 12-hour clock of fifths ($C \rightarrow G \rightarrow D \dots$).
- **`get_key_neighbors(key: str) -> Dict[str, str]`**: Returns $I, IV, V$ jamming chords and relative minor.
- **`get_key_accidentals(key: str) -> Dict[str, Any]`**: Computes number of sharps/flats and specific altered notes via Order of Sharps ($FCGDAEB$) and Flats ($BEADGCF$).

---

### 2. `backend/app/theory/intervals.py` (`TASK-1.2`)
*Test Suite:* `backend/tests/test_intervals.py` (10 / 10 tests passing)

- **`interval_to_semitones(interval: str) -> int`**: Simple and compound interval parsing up to the 13th ($1, b2, 2, b3, 3, 4, b5, 5, #5, 6, b7, 7, b9, 9, #9, 11, #11, b13, 13$).
- **`semitones_to_interval(semitones: int, prefer_flats: bool = False) -> str`**: Inverse mapping.
- **`get_note_at_interval(root: str, interval: str, mode: NotationMode = PRACTICAL) -> str`**: Accurately calculates target note using diatonic letter degree offsets before applying accidental offsets (e.g. 5th of $E$ is $B\flat$, not $A\sharp$).
- **`invert_interval(degree: str) -> str`**: Classical and guitar **Rule of 9**:
  - Inverting a 3rd ($b3$) yields a 6th ($6$) — the essential Hendrix/Mayer sliding double-stop flip!
  - 4th $\leftrightarrow$ 5th, Major $\leftrightarrow$ Minor, Augmented $\leftrightarrow$ Diminished.
- **`classify_diad(degree: str) -> Dict[str, str]`**: Classifies guitar double-stops:
  - `3rd_harmony`: Sweet rock/country vocal harmony (e.g., Southern rock, Eagles, Allman Brothers).
  - `6th_sliding`: Soul/gospel sliding diads on skipped strings 1 & 3 or 2 & 4 (Hendrix / Mayer / Curtis Mayfield).
  - `4th_stab`: Rock/funk riff punch (Deep Purple / Smoke on the Water).
  - `5th_power`: Heavy rock power chord diad.
  - `octave`: Wes Montgomery / George Benson / Hendrix octave soloing.
- **`get_double_stop_notes(root: str, degree: str) -> Tuple[str, str]`**: Spells harmonized diad note pairs.

---

### 3. `backend/app/theory/scales.py` (`TASK-1.3`)
*Test Suite:* `backend/tests/test_scales.py` (15 / 15 tests passing)

- **Core Scales:** Major (Ionian), Natural Minor (Aeolian), Harmonic Minor, Melodic Minor (Jazz Minor).
- **All 7 Church Modes:** Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian (with characteristic flavor and avoid notes).
- **Pentatonics & Blues:** Major Pentatonic, Minor Pentatonic, Blues Scale (with $\flat 5$ blue note), Major Blues.
- **Altered Scales:** Phrygian Dominant (5th mode of Harmonic Minor — Flamenco / Metal).
- **Intermediate Soloing Scales:**
  - **`hybrid_blues` (Major/Minor Hybrid Blues Scale):** Formula `[1, 2, b3, 3, 4, 5, 6, b7]`. Blends sweet major notes with gritty minor blues bending (B.B. King, SRV, Clapton, Duane Allman).
  - **`bebop_dominant` (Dominant Bebop Scale):** Formula `[1, 2, 3, 4, 5, 6, b7, 7]`. Adds natural 7 chromatic passing tone between $\flat 7$ and Root so all chord tones land on rhythmic downbeats during 8th-note runs.
- **`get_relative_key(key: str, to_minor: bool = True) -> str`**: Instant relative Major/Minor conversion.

---

### 4. `backend/app/theory/chords.py` (`TASK-1.4`)
*Test Suite:* `backend/tests/test_chords.py` (14 / 14 tests passing)

- **25+ Chord Types:** Major, Minor, Diminished, Augmented, 5 (Power chord), Sus4, Sus2, 7, Maj7, Min7, m7b5, Dim7, 7#9 (Hendrix Chord), 7b9, 7alt, 9, Add9, Maj9, Min9, 11, 13, 6, Min6, 6/9.
- **Slash Chords:** Parses altered bass notes (e.g. $D/F\sharp, G/B, Am7/G$).
- **`get_triad_inversion_notes(root, quality, inversion)`**:
  - Root Position ($0$): $1 - 3 - 5$
  - 1st Inversion ($1$): $3 - 5 - 1$
  - 2nd Inversion ($2$): $5 - 1 - 3$
- **`get_chord_arpeggio(symbol)`**: Sequential chord tones for single-note sweep picking and outline runs.
- **`get_chord_embellishments(symbol)`**: Hendrix / Mayer hammer-on targets right inside the chord grip (`sus4`, `add9`, `sixth`).
- **`get_shell_voicing(symbol)`**: Guide tones ($Root + 3rd + 7th$, omitting the redundant 5th) for jazz, funk, and neo-soul comping without bass muddiness.
- **`get_superimposed_triads(symbol)`**: Simple 3-note triads played over chords to outline upper extensions ($9th, 11th, 13th$) without playing the root (e.g., $Em$ or $Am$ over $Cmaj7$, $Bdim$ or $D\flat$ over $G7$).
- **`get_tritone_substitution(symbol)`**: Dominant substitution located 6 semitones away sharing identical guide tones (e.g., $G7 \rightarrow D\flat 7$).
- **`get_spread_triad_notes(root, quality)`**: Eric Johnson / Mateus Asato open-voiced $1 - 5 - 10$ spread triads for resonant chord melodies.

---

### 5. `backend/app/theory/fretboard.py` (`TASK-1.5`)
*Test Suite:* `backend/tests/test_fretboard.py` (16 / 16 tests passing)

- **Physical 24-Fret Matrix:** Maps all 6 strings across 24 frets (150 playable coordinates) with MIDI note numbers, octaves ($E_2$ to $E_6$), and pitch classes.
- **6 Tunings Supported:** Standard, Drop D, Half-Step Down ($E\flat$), Full-Step Down ($D$), DADGAD, Open G.
- **`overlay_scale(scale)` & `overlay_chord(chord)`**: Overlays scale/chord intervals directly on the fretboard.
- **`get_caged_root_anchors(root)`**: Multi-layer CAGED system root map connecting all 5 shapes across strings 1 to 6.
- **`get_caged_chord_voicing(root, shape, quality)`**: Physical fretboard grips for all 5 CAGED shapes across `maj`, `min`, `7`, `min7`, and `maj7`.
- **`get_diagonal_pentatonic_run(root, quality)`**: The "Pentatonic Highway" — continuous 2-notes-per-string sliding diagonal connecting Box 5 $\rightarrow$ Box 1 $\rightarrow$ Box 2 $\rightarrow$ Box 3 across all 6 strings.
- **`get_bb_king_box(root)`**: B.B. King sweet spot on strings 1-2-3 centered around the root on string 2 with the signature Major 6th bend and sweet Major 3rd slip.
- **`get_albert_king_box(root)`**: High-register blues bending box on strings 1 & 2 featuring heavy 1.5-step / minor 3rd overbends.
- **`get_three_notes_per_string_shapes(root, scale_type)`**: 7 modal 3NPS shapes covering the entire neck with exactly 3 notes on every string for uniform alternate picking and speed legato.
- **`get_octave_coordinates(string, fret)`**: Octave GPS identifying the 4 Wes Montgomery / Jimi Hendrix octave shapes (6-to-4, 5-to-3, 4-to-2, 3-to-1) and horizontal 12-fret octaves.
- **`get_static_position_progression_shapes(chords, target_fret)`**: Pro voice-leading tool calculating the optimal CAGED shape for every chord in a progression to play over changes in a single hand position without jumping across the neck.
- **`get_triad_shapes_on_strings(chord, string_set)`**: Movable 3-string triad grips on top strings within playable hand spans ($\le 3$ frets).

---

## 🧪 Complete Test Verification Registry

```bash
$ pytest backend/tests/ -v
============================= 71 passed in 0.21s ==============================
```

| Micro-Task | Module | Tests Passed | Status |
|---|---|:---:|:---:|
| `TASK-1.1` | `backend/app/theory/pitch.py` | 16 / 16 | 🟢 PASS |
| `TASK-1.2` | `backend/app/theory/intervals.py` | 10 / 10 | 🟢 PASS |
| `TASK-1.3` | `backend/app/theory/scales.py` | 15 / 15 | 🟢 PASS |
| `TASK-1.4` | `backend/app/theory/chords.py` | 14 / 14 | 🟢 PASS |
| `TASK-1.5` | `backend/app/theory/fretboard.py` | 16 / 16 | 🟢 PASS |
| **Total** | **Phase 1 Deterministic Engine** | **71 / 71** | **🟢 100% COMPLETE** |

---

## 🚀 Readiness for Phase 2: Interactive SVG Fretboard & Tone.js WebAudio
The deterministic backend engine is self-contained, typed with Pydantic (`backend/app/schemas/theory.py`), and fully ready to serve REST API endpoints for the Phase 2 frontend:
- `GET /api/theory/scale?root=A&type=pentatonic_minor` $\rightarrow$ Returns note intervals & 24-fret coordinates.
- `GET /api/theory/fretboard/caged?root=A` $\rightarrow$ Returns 5 CAGED box bounding boxes.
- `GET /api/theory/fretboard/highway?root=A` $\rightarrow$ Returns the 15-note sliding pentatonic diagonal.
- `GET /api/theory/fretboard/bb-box?root=A` $\rightarrow$ Returns B.B. King sweet spot & bend markers.
- `GET /api/theory/fretboard/3nps?root=C&mode=ionian` $\rightarrow$ Returns 18-note 3NPS modal shapes.
