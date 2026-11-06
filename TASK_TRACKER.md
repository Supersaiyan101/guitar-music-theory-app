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
| 🟢 **COMPLETE** | **`TASK-1.4`** | **Chord Formula & Inversion Parser** | Triad inversions, sequential arpeggios, Hendrix/Mayer embellishments, shell voicings |
| 🟢 **COMPLETE** | **`TASK-1.5`** | **Fretboard Matrix & Soloing Boxes** | CAGED anchors & voicings, Diagonal Highway, B.B./Albert King boxes, 3NPS, Octave GPS |
| 🟢 **COMPLETE** | **`TASK-2.1`** | **Next.js 14 App + Zustand Store + Studio Shell** | Reactive theory store, lefty/TAB view ergonomics, Tone.js SSR-safe bridge, studio controls |
| 🟢 **COMPLETE** | **`TASK-2.2`** | **Parallel 24-Fret SVG Fretboard Component** | Physics scale ($L=2200$px, min width $\ge 32$px), crowned nickel wires, top binding side dots, full-cell hitboxes, dynamic viewBox zoom |
| 🟢 **COMPLETE** | **`TASK-2.3`** | **Interactive Note Pins & Scale/Degree Color Engine** | Color coding harmonic functions (Root Crimson, 3rd Blue, 5th Gold, 7th Purple, b5 Orange), scale/chord filtering, Target Chord Tones mode, Ghost notes |
| 🟢 **COMPLETE** | **`TASK-2.4`** | **Visual Soloing Overlays** | Bounding zones & connectors for CAGED (5 shapes + roots), 3NPS (7 modes), Diagonal Highway, B.B./Albert King boxes, Triads |
| 🟢 **COMPLETE** | **`TASK-2.5`** | **Tone.js WebAudio Pluck & Arpeggiator Engine** | Interactive scale/arpeggio playback, animated dancing playhead cursor, modal tonic drone pad, natural pick-sweep strum |
| 🟢 **COMPLETE** | **`TASK-3.1`** | **Progression Engine & Harmonic Function Parser** | Roman numeral analysis, Krumhansl-Schmuckler key detection, guide tones 3 & 7, scale tiers |
| 🟢 **COMPLETE** | **`TASK-3.2`** | **Song Encyclopedia & Custom Parser** | 16 curated classic tracks (Rock/Blues/Jazz/Pop), custom chord parser, bar sub-divisions |
| 🟢 **COMPLETE** | **`TASK-3.3`** | **Progression Timeline & Harmonic HUD** | Beat LEDs, transport controls, 4-tier scale applicator, anticipation window, custom chord modal |
| 🟢 **COMPLETE** | **`TASK-3.4`** | **Dynamic Voice-Leading Spotlight & Shift Vectors** | Guide tone halos (3rd gold, 7th purple), 💎 common tones, ½ & whole step shift arcs, 5-fret hand lock |
| 🟢 **COMPLETE** | **`TASK-3.5`** | **Backing Comping Engine & Target Practice Drill** | Multi-voice backing band (rhythm, bass, drums), stem mixer, "Target the 3rd" gamified practice drill |
| 🟡 **NEXT** | **`TASK-4.1`** | **Qdrant Vector Pipeline & Theory Embeddings** | FastEmbed local embeddings, Qdrant collection, theory chunking schema & indexing script |

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

### `TASK-1.4` Refinements (Commits: `0eceb63`, `feat(theory)`)
1. **`get_chord_arpeggio(symbol)`**: Generates sequential chord tones for single-note sweep and picking runs over chord changes.
2. **`get_chord_embellishments(symbol)`**: Calculates Hendrix / Mayer hammer-on targets right inside the chord grip:
   - **`sus4`**: Hammering from 3rd to 4th (Classic Little Wing suspended fill)
   - **`add9`**: Hammering from Root to 9th/2nd (Acoustic ballad color)
   - **`sixth`**: Hammering from 5th to 6th (Curtis Mayfield / R&B soul fill)
3. **`get_shell_voicing(symbol)`**: Guide tones (Root + 3rd + 7th, dropping redundant 5th) for jazz/funk/neo-soul comping without muddiness.
4. **`get_superimposed_triads(symbol)`**: Outlines upper extensions (9ths, 11ths, 13ths) by playing simple 3-note triads over changes (e.g. Em or Am over Cmaj7, Bdim or Db over G7).
5. **`get_tritone_substitution(symbol)`**: Calculates the dominant chord 6 semitones away sharing identical guide tones (e.g. G7 $\rightarrow$ Db7).
6. **`get_spread_triad_notes(root, quality)`**: Eric Johnson / Mateus Asato open-voiced $1 - 5 - 10$ spread triads for resonant chord melodies.

### `TASK-1.5` Refinements (Commit: `feat(theory)`)
1. **`get_caged_root_anchors(root)`**: Multi-layer CAGED system root map connecting all 5 shapes across strings 1 to 6.
2. **`get_caged_chord_voicing(root, shape, quality)`**: Generates physical fretboard grips for all 5 CAGED shapes across major, minor, dominant 7th, minor 7th, and major 7th.
3. **`get_diagonal_pentatonic_run(root, quality)`**: The "Pentatonic Highway" — continuous 2-notes-per-string sliding diagonal connecting Box 5 $\rightarrow$ Box 1 $\rightarrow$ Box 2 $\rightarrow$ Box 3 across all 6 strings.
4. **`get_bb_king_box(root)`**: B.B. King sweet spot on strings 1-2-3 centered around the root on string 2 with the signature Major 6th bend and sweet Major 3rd slip.
5. **`get_albert_king_box(root)`**: High-register blues bending box on strings 1 & 2 featuring heavy 1.5-step / minor 3rd overbends.
6. **`get_three_notes_per_string_shapes(root, scale_type)`**: 7 modal 3NPS shapes covering the entire neck with exactly 3 notes on every string for uniform alternate picking and speed legato.
7. **`get_octave_coordinates(string, fret)`**: Octave GPS identifying the 4 Wes Montgomery / Jimi Hendrix octave shapes (6-to-4, 5-to-3, 4-to-2, 3-to-1) and horizontal 12-fret octaves.
8. **`get_static_position_progression_shapes(chords, target_fret)`**: Pro voice-leading tool calculating the optimal CAGED shape for every chord in a progression to play over changes in a single hand position without jumping across the neck.

---

## ✅ Completed Tasks Registry

| Task ID | Name | Completed At | Tests Passed | Key Deliverables |
|---|---|---|---|---|
| **`TASK-0.1`** | Monorepo Scaffolding & Virtualenv | 2026-11-02 | Python/Node OK | `backend/`, `data/`, `frontend/`, `.gitignore`, `requirements.txt`, `.venv` with `fastapi`, `pydantic`, `pytest` |
| **`TASK-0.2`** | Core Theory Data Schemas | 2026-11-02 | Type Checked | `backend/app/schemas/theory.py` (`ScaleDefinition`, `ChordDefinition`, `FretCoordinate`, `CagedBoxDefinition`, `ProgressionSection`) |
| **`TASK-1.1`** | Pitch Class Algebra & Voice Leading Math | 2026-11-02 | 16/16 `pytest` | `backend/app/theory/pitch.py` (Practical Mode E#->F, Case-insensitivity, Shortest voice-leading distance, Enharmonic equality, Circle of Fifths, Key accidentals) |
| **`TASK-1.2`** | Interval Engine & Diads | 2026-11-02 | 10/10 `pytest` | `backend/app/theory/intervals.py` (Rule of 9 inversions, double-stop diads: 3rds, 6ths, 4ths, octaves, compound #9/13) |
| **`TASK-1.3`** | Scale & Mode Generator | 2026-11-02 | 15/15 `pytest` | `backend/app/theory/scales.py` (Full Major/Minor, Modes, Hybrid Blues scale, Dominant Bebop, Relative keys) |
| **`TASK-1.4`** | Chord Formula & Quality Parser | 2026-11-02 | 14/14 `pytest` | `backend/app/theory/chords.py` (Triad deconstruction, Hendrix 7#9, altered chords, 1st/2nd triad inversions, arpeggios, Hendrix/Mayer embellishments, shell voicings, superimposed triads, tritone substitutions, spread triads) |
| **`TASK-1.5`** | 24-Fret Guitar Matrix & Soloing Boxes | 2026-11-02 | 16/16 `pytest` | `backend/app/theory/fretboard.py` (Standard/Drop-D/Eb tunings, 24-fret matrix, CAGED root anchors & voicings, Diagonal Highway, B.B./Albert King boxes, 3NPS, Octave GPS, static voice-leading) |
| **`TASK-2.1`** | Frontend App Router, Zustand Theory Store & Studio Shell | 2026-11-03 | Build Clean (0 err) | `frontend/` (Next.js 16/14 App Router, TypeScript, Tailwind CSS, `useTheoryStore.ts`, SSR-safe `soundEngine.ts`, studio controls: key, scale/chord, tuning, display mode, lefty/TAB view, note inspector HUD, color legend) |
| **`TASK-2.2`** | Parallel 24-Fret SVG Fretboard Component | 2026-11-03 | Build Clean (0 err) | `frontend/src/components/fretboard/Fretboard.tsx` (Physics scale $L=2200$px with min width $\ge 32$px, crowned nickel wires, top binding side dots, bone nut string notches, full-cell hover hitboxes, dynamic SVG viewBox zoom, headstock tuning badges) |
| **`TASK-2.3`** | Interactive Note Pins & Scale/Degree Color Engine | 2026-11-03 | Build Clean (0 err) | `frontend/src/components/fretboard/Fretboard.tsx`, `DisplayModeToggle.tsx` (Harmonic degree colors: Root Crimson, 3rd Blue, 5th Gold, Blue Note Orange, 7th Purple, Extensions Emerald; real-time scale/chord filtering; Target Chord Tones soloing spotlight; Isolated vs Ghost vs Full density modes; Note vs Degree toggle) |
| **`TASK-2.4`** | Visual Soloing Overlays | 2026-11-03 | Build Clean (0 err) | `frontend/src/components/fretboard/Fretboard.tsx`, `OverlayControls.tsx`, `overlayMath.ts` (CAGED 5 shapes + root anchors + All 5 Interlocking mode; Diagonal Highway with slide vectors on 5-3-1; B.B. King Box with Major 6th bend and Major 3rd slip; Albert King Box with 1.5-step cry overbend; 3NPS 7 modal zones; Movable Triads on 123/234/345; Box Focus auto-zoom) |
| **`TASK-2.5`** | Tone.js WebAudio Pluck & Arpeggiator Engine | 2026-11-03 | Build Clean (0 err) | `frontend/src/lib/audio/soundEngine.ts`, `PlaybackBar.tsx` (Scale and arpeggio sequence runner with synchronized dancing SVG playhead cursor, continuous modal tonic drone pad, natural 35ms pick-sweep strum, electric/acoustic presets) |
| **`TASK-3.1`** | Deterministic Progression Engine & Harmonic Function Parser | 2026-11-04 | 14/14 `pytest` | `backend/app/theory/progression.py`, `backend/tests/test_progression.py` (Krumhansl-Schmuckler empirical key detection, Roman numeral analysis, guide tones 3 & 7 voice leading, common tone tracking, 4-tier solo scale recommendations) |
| **`TASK-3.2`** | Curated Master Song Encyclopedia & Custom Progression Parser | 2026-11-04 | 8/8 `pytest` | `backend/app/data/progressions.py`, `backend/tests/test_song_library.py`, `frontend/src/lib/theory/songLibrary.ts`, `frontend/src/lib/theory/progressionParser.ts` (16 curated songs across 4 genres: Rock, Blues, Jazz, Pop; custom pipe/hyphen/Roman numeral parser; bar beat sub-divisions) |
| **`TASK-3.3`** | Interactive Progression Timeline & Harmonic Context HUD | 2026-11-04 | Build Clean (0 err) | `frontend/src/components/progression/ProgressionTimeline.tsx`, `HarmonicContextHUD.tsx`, `CustomProgressionModal.tsx`, `useTheoryStore.ts` (Interactive measure strip with click-to-freeze scrubbing, beat LEDs, transport controls, 4-tier 1-click scale applicator, voice-leading anticipation window, custom chord syntax modal) |
| **`TASK-3.4`** | Dynamic Fretboard Voice-Leading Spotlight & Vector Overlays | 2026-11-05 | Build Clean (0 err) | `frontend/src/components/fretboard/Fretboard.tsx`, `ProgressionTimeline.tsx`, `useTheoryStore.ts` (Guide tone halos for 3rd and 7th with badges; common tone pivot badges 💎; dynamic scalar/voice shift vector arcs with half/whole-step arrows; static hand-lock 5-fret box with outside dimming and zoom focus) |
| **`TASK-3.5`** | Tone.js Multi-Voice Backing Comping Engine & Practice Drill Game | 2026-11-05 | Build Clean (0 err) | `frontend/src/lib/audio/soundEngine.ts`, `voicingMath.ts`, `ProgressionTimeline.tsx`, `useTheoryStore.ts` (Multi-voice WebAudio backing band with rhythm guitar arpeggiated comping, electric bass root/fifth walking downbeats, and hi-hat/kick metronome groove synchronized to playhead; individual stem mixer; interactive "Target the 3rd" practice drill game with score, streak & instant rewarding feedback) |
| **Total** | **Phase 1, Phase 2 & Phase 3 (Core + Studio + Progression Flight-Path & Backing Band)** | | **93/93 Passing (100%) + Clean Next Build** | Complete deterministic theory engine, 24-fret SVG instrument, visual soloing overlays, ear-training WebAudio engine, 16-song progression encyclopedia, interactive timeline HUD, real-time voice-leading spotlight overlays, multi-voice backing comping band, and target tone drill practice game |




