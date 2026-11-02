# 📋 Guitar Theory Kingdom — Live Task Tracker

> **Current Workflow:** Select Micro-Task $\rightarrow$ Fine-Tune & Agree on Spec $\rightarrow$ Implement Target Files $\rightarrow$ Run Verification Tests $\rightarrow$ Review & Mark Complete.

---

## 🚦 Live Status Board

| Status | Task ID | Name | Focus Area |
|---|---|---|---|
| 🔄 **IN PROGRESS** | **`TASK-2.1`** | **Next.js 14 Web App Scaffolding** | App router, Tailwind CSS, Zustand state store |
| ⏭️ **NEXT UP** | **`TASK-2.2`** | Dynamic SVG Fretboard Component | Scalable vector guitar neck (frets 0-22) |
| ⚪ **QUEUED** | **`TASK-2.3`** | Interactive Note Pins & Degree Badges | Note names vs Interval degrees display |
| ⚪ **QUEUED** | **`TASK-2.4`** | CAGED Box Visual Overlays & Triads | Color-coded chord tone highlighting |

---

## ✅ Completed Tasks Registry

| Task ID | Name | Completed At | Key Deliverables |
|---|---|---|---|
| **`TASK-0.1`** | Monorepo Scaffolding & Virtualenv | 2026-11-02 | `backend/`, `data/`, `frontend/`, `.gitignore`, `backend/requirements.txt`, Python virtualenv `.venv` with `fastapi`, `pydantic`, `pytest` |
| **`TASK-0.2`** | Core Theory Data Schemas | 2026-11-02 | `backend/app/schemas/theory.py` (`ScaleDefinition`, `ChordDefinition`, `FretCoordinate`, `CagedBoxDefinition`, `ProgressionSection`) |
| **`TASK-1.1`** | Pitch Class Algebra & Enharmonic Resolution | 2026-11-02 | `backend/app/theory/pitch.py` with `NotationMode.PRACTICAL` (guitar frets: E#->F) & `ACADEMIC`, 11/11 `pytest` passing |
| **`TASK-1.2`** | Interval Engine | 2026-11-02 | `backend/app/theory/intervals.py`, compound extensions (#9, 13), degree letter resolution, 18/18 `pytest` passing |
| **`TASK-1.3`** | Scale & Mode Generator | 2026-11-02 | `backend/app/theory/scales.py` (Full Major, Natural/Harmonic/Melodic Minor, Pentatonics, Blues, 7 Modes, Phrygian Dominant), 31/31 `pytest` passing |
| **`TASK-1.4`** | Chord Formula & Quality Parser | 2026-11-02 | `backend/app/theory/chords.py` (Triad deconstruction, Hendrix 7#9, altered chords, 1st/2nd triad inversions, slash chords), 43/43 `pytest` passing |
| **`TASK-1.5`** | 24-Fret Guitar Matrix & CAGED 5-Box Engine | 2026-11-02 | `backend/app/theory/fretboard.py` (Standard/Drop-D/Eb tunings, 24-fret matrix, CAGED box spans, movable string triads), 50/50 `pytest` passing |

---

## 🎯 Active Task Detail: `TASK-2.1`
* **Target Files:** `frontend/src/app/`, `frontend/package.json`, `frontend/src/store/theoryStore.ts`
* **Focus:** Next.js 14 Web App Scaffolding & State Management
* **Status:** Fine-Tuning Specification (Pending User Review)

