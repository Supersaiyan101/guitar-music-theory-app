# 📋 Guitar Theory Kingdom — Live Task Tracker & Changelog

> **Core Philosophy:** Built for intermediate & advanced guitarists focusing on **soloing, improvisation, and fretboard freedom**.  
> **Repository:** [github.com/Supersaiyan101/guitar-music-theory-app](https://github.com/Supersaiyan101/guitar-music-theory-app)  
> **Workflow:** Select Micro-Task $\rightarrow$ Fine-Tune Spec $\rightarrow$ Code $\rightarrow$ Test (100% Pass) $\rightarrow$ Micro-Commit & Push to GitHub $\rightarrow$ Update Tracker.

---

## 🚦 Live Status Board

| Status | Task ID | Name | Focus Area |
|---|---|---|---|
| 🟢 **COMPLETE** | **`TASK-1.1`** | **Pitch Class Algebra & Voice Leading Math** | Note math, enharmonics, shortest voice-leading, circle of fifths |
| 🟢 **COMPLETE** | **`TASK-1.2`** | **Interval Engine & Diads** | Rule of 9 inversions, double-stop diads (3rds, 6ths, 4ths, octaves) |
| 🟢 **COMPLETE** | **`TASK-1.3`** | **Scale & Mode Generator** | Hybrid Pentatonic Blues (B.B. King/SRV) & Dominant Bebop scales |
| 🟢 **COMPLETE** | **`TASK-1.4`** | **Chord Formula & Inversion Parser** | Triad inversions, sequential arpeggios, Hendrix/Mayer embellishments |
| 🔄 **IN REVIEW** | **`TASK-1.5`** | **Fretboard Matrix & Soloing Boxes** | Adding Diagonal Pentatonic runs, 3NPS, & B.B. King box |

---

## 📜 Detailed Architecture & Feature Changelog (Reference Archive)

### `TASK-1.1` Refinements (Commits: `b50453d`, `46802b5`)
1. **`shortest_semitone_distance(from_note, to_note) -> int`**: Voice-leading minimal fret delta ($-6$ to $+6$).
2. **`are_enharmonic(note_a, note_b) -> bool`**: Pitch equivalence checker (`C# == Db`, `E# == F`).
3. **`get_key_accidentals(key) -> Dict`**: Key signature accidentals via Order of Sharps and Flats.
4. **`normalize_note_name(note) -> str`**: Automatic case-insensitivity (`c#` $\rightarrow$ `C#`).
5. **`transpose_note(note, -semitones)`**: Full support for transposing down frets.
6. **`get_circle_of_fifths()` & `get_key_neighbors()`**: 12-hour clock and $I, IV, V$ jamming chords.

### `TASK-1.2` Refinements (Commit: `ca75b47`)
1. **`invert_interval(degree) -> str`**: Classical and guitar **Rule of 9**:
   - Minor 3rd ($b3$) inverts to Major 6th ($6$) — the essential Hendrix/Mayer double-stop flip!
   - Major 3rd ($3$) inverts to Minor 6th ($b6$).
   - 4th ($4$) inverts to 5th ($5$), 5th ($5$) inverts to 4th ($4$).
   - Minor 7th ($b7$) inverts to Major 2nd ($2$).
2. **`classify_diad(degree) -> Dict`**: Identifies guitar double-stop types:
   - `3rd_harmony` (Sweet vocal rock/country harmony)
   - `6th_sliding` (Soul/gospel sliding diads on skipped strings 1 & 3 or 2 & 4)
   - `4th_stab` (Rock/funk riff double stops - Smoke on the Water)
   - `5th_power` (Power chord diad)
   - `octave` (Wes Montgomery / Hendrix octave riffs)
3. **`get_double_stop_notes(root, degree) -> Tuple[str, str]`**: Generates harmonized pairs.

### `TASK-1.3` Refinements (Commit: `5ff5a74`)
1. **`hybrid_blues` (The Major/Minor Hybrid Blues Scale)**:
   - Formula: `[1, 2, b3, 3, 4, 5, 6, b7]` (8/9-note blues scale).
   - Character notes: `['b3', '3', '6', 'b7']`.
   - The iconic B.B. King, Clapton, SRV, and Duane Allman soloing scale blending sweet major notes with raw blues bending.
2. **`bebop_dominant` (The Dominant Bebop Scale)**:
   - Formula: `[1, 2, 3, 4, 5, 6, b7, 7]` (8 notes).
   - Character notes: `['b7', '7']`.
   - Adds the natural 7 chromatic passing tone between b7 and root, forcing all chord tones onto rhythmic downbeats in 8th-note runs.

### `TASK-1.4` Refinements (Commit: `0eceb63`)
1. **`get_chord_arpeggio(symbol)`**: Generates sequential chord tones for single-note sweep and picking runs over chord changes.
2. **`get_chord_embellishments(symbol)`**: Calculates Hendrix / Mayer hammer-on targets right inside the chord grip:
   - **`sus4`**: Hammering from 3rd to 4th (Classic Little Wing suspended fill)
   - **`add9`**: Hammering from Root to 9th/2nd (Acoustic ballad color)
   - **`sixth`**: Hammering from 5th to 6th (Curtis Mayfield / R&B soul fill)

---

## 🎯 Queued Intermediate Soloing Upgrades for `TASK-1.5`:

* **For `TASK-1.5` (`fretboard.py`):**
  - **The Diagonal / Extended Pentatonic Run:** 2-notes-per-string sliding highway connecting Box 5 $\rightarrow$ Box 1 $\rightarrow$ Box 2 $\rightarrow$ Box 3 across all 6 strings.
  - **The B.B. King Box:** Precomputed sweet spot on strings 1-2-3 around the root on string 2 with the characteristic major 6th.
  - **3-Notes-Per-String (3NPS):** 7 picking shapes for fast, fluid alternate-picked modal runs.

---

## ✅ Completed Tasks Registry

| Task ID | Name | Completed At | Tests Passed | Key Deliverables |
|---|---|---|---|---|
| **`TASK-0.1`** | Monorepo Scaffolding & Virtualenv | 2026-11-02 | Python/Node OK | `backend/`, `data/`, `frontend/`, `.gitignore`, `requirements.txt`, `.venv` with `fastapi`, `pydantic`, `pytest` |
| **`TASK-0.2`** | Core Theory Data Schemas | 2026-11-02 | Type Checked | `backend/app/schemas/theory.py` (`ScaleDefinition`, `ChordDefinition`, `FretCoordinate`, `CagedBoxDefinition`, `ProgressionSection`) |
| **`TASK-1.1`** | Pitch Class Algebra & Voice Leading Math | 2026-11-02 | 16/16 `pytest` | `backend/app/theory/pitch.py` (Practical Mode E#->F, Case-insensitivity, Shortest voice-leading distance, Enharmonic equality, Circle of Fifths, Key accidentals) |
| **`TASK-1.2`** | Interval Engine & Diads | 2026-11-02 | 10/10 `pytest` | `backend/app/theory/intervals.py` (Rule of 9 inversions, double-stop diads: 3rds, 6ths, 4ths, octaves, compound #9/13) |
| **`TASK-1.3`** | Scale & Mode Generator | 2026-11-02 | 15/15 `pytest` | `backend/app/theory/scales.py` (Full Major/Minor, Modes, Hybrid Blues scale, Dominant Bebop, Relative keys) |
| **`TASK-1.4`** | Chord Formula & Quality Parser | 2026-11-02 | 10/10 `pytest` | `backend/app/theory/chords.py` (Triad deconstruction, Hendrix 7#9, altered chords, 1st/2nd triad inversions, arpeggios, Hendrix/Mayer embellishments) |
| **`TASK-1.5`** | 24-Fret Guitar Matrix & CAGED 5-Box Engine | 2026-11-02 | 7/7 `pytest` | `backend/app/theory/fretboard.py` (Standard/Drop-D/Eb tunings, 24-fret matrix, CAGED box spans, movable string triads) |
| **Total** | **Phase 1 Deterministic Engine** | | **58/58 Passing** | Complete mathematical and physical foundation |
