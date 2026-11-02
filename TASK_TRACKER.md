# 📋 Guitar Theory Kingdom — Live Task Tracker & Changelog

> **Core Philosophy:** Built for intermediate & advanced guitarists focusing on **soloing, improvisation, and fretboard freedom**.  
> **Repository:** [github.com/Supersaiyan101/guitar-music-theory-app](https://github.com/Supersaiyan101/guitar-music-theory-app)  
> **Workflow:** Select Micro-Task $\rightarrow$ Fine-Tune Spec $\rightarrow$ Code $\rightarrow$ Test (100% Pass) $\rightarrow$ Micro-Commit & Push to GitHub $\rightarrow$ Update Tracker.

---

## 🚦 Live Status Board

| Status | Task ID | Name | Focus Area |
|---|---|---|---|
| 🟢 **COMPLETE** | **`TASK-1.1`** | **Pitch Class Algebra & Voice Leading Math** | Note math, enharmonics, shortest voice-leading, circle of fifths |
| 🔄 **IN REVIEW** | **`TASK-1.2`** | **Interval Engine** | Target chord tones, tensions (#9, 13), degree spelling |
| ⚪ **QUEUED** | **`TASK-1.3`** | **Scale & Mode Generator** | Adding Hybrid Pentatonic & Bebop scales |
| ⚪ **QUEUED** | **`TASK-1.4`** | **Chord Formula & Inversion Parser** | Triad inversions & voice-leading grips |
| ⚪ **QUEUED** | **`TASK-1.5`** | **Fretboard Matrix & Soloing Boxes** | Adding Diagonal Pentatonic runs, 3NPS, & B.B. King box |

---

## 📜 Detailed Architecture & Feature Changelog (Reference Archive)

### `TASK-1.1` Refinements & Additions (Latest Commits: `b50453d`, `46802b5`)
1. **`shortest_semitone_distance(from_note, to_note) -> int`**:
   - Calculates the minimal voice-leading fret delta ($-6$ to $+6$).
   - e.g. `C` to `B` returns `-1` (slide 1 fret down instead of jumping 11 frets up).
   - Essential for intermediate soloing when targeting chord tones over changes.
2. **`are_enharmonic(note_a, note_b) -> bool`**:
   - Checks if two note names vibrate at the identical pitch class (e.g. `C#` == `Db`, `E#` == `F`).
   - Prevents soloing and chord comparison bugs when matching player tabs.
3. **`get_key_accidentals(key) -> Dict`**:
   - Returns exact accidental count and altered note list via the standard order of sharps (`F#, C#, G#, D#, A#, E#, B#`) and flats (`Bb, Eb, Ab, Db, Gb, Cb, Fb`).
   - e.g. Key of `E` $\rightarrow$ 4 sharps (`F#, C#, G#, D#`).
4. **`normalize_note_name(note) -> str`**:
   - Automatic case-insensitivity: converts `c#` $\rightarrow$ `C#`, `bb` $\rightarrow$ `Bb`, `  f# ` $\rightarrow$ `F#`.
5. **Negative Transpositions**:
   - `transpose_note("C", -1)` $\rightarrow$ `"B"` (going down frets).
6. **Circle of Fifths Helpers**:
   - `get_circle_of_fifths()` (all 12 keys clockwise).
   - `get_key_neighbors(key)` (instant $I, IV, V$ chords for jamming).

---

## 🎯 Queued Intermediate Soloing Upgrades for Upcoming Tasks:

* **For `TASK-1.3` (`scales.py`):**
  - **Hybrid Pentatonic Scale:** Blends Minor Pentatonic ($1, b3, 4, 5, b7$) and Major Pentatonic ($1, 2, 3, 5, 6$) into a 9-note blues/rock soloing scale ($1, 2, b3, 3, 4, 5, 6, b7$).
  - **Dominant Bebop Scale:** $1, 2, 3, 4, 5, 6, b7, 7$ (adds the natural 7 passing tone to align chord tones with downbeats).
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
| **`TASK-1.1`** | Pitch Class Algebra & Enharmonic Resolution | 2026-11-02 | 16/16 `pytest` | `backend/app/theory/pitch.py` (Practical Mode E#->F, Case-insensitivity, Shortest voice-leading distance, Enharmonic equality, Circle of Fifths, Key accidentals) |
| **`TASK-1.2`** | Interval Engine | 2026-11-02 | 7/7 `pytest` | `backend/app/theory/intervals.py`, compound extensions (#9, 13), degree letter resolution |
| **`TASK-1.3`** | Scale & Mode Generator | 2026-11-02 | 13/13 `pytest` | `backend/app/theory/scales.py` (Full Major, Natural/Harmonic/Melodic Minor, Pentatonics, Blues, 7 Modes, Phrygian Dominant) |
| **`TASK-1.4`** | Chord Formula & Quality Parser | 2026-11-02 | 12/12 `pytest` | `backend/app/theory/chords.py` (Triad deconstruction, Hendrix 7#9, altered chords, 1st/2nd triad inversions, slash chords) |
| **`TASK-1.5`** | 24-Fret Guitar Matrix & CAGED 5-Box Engine | 2026-11-02 | 7/7 `pytest` | `backend/app/theory/fretboard.py` (Standard/Drop-D/Eb tunings, 24-fret matrix, CAGED box spans, movable string triads) |
| **Total** | **Phase 1 Deterministic Engine** | | **55/55 Passing** | Complete mathematical and physical foundation |
