# 📋 Guitar Theory Kingdom — Live Task Tracker

> **Current Workflow:** Select Micro-Task $\rightarrow$ Fine-Tune & Agree on Spec $\rightarrow$ Implement Target Files $\rightarrow$ Run Verification Tests $\rightarrow$ Review & Mark Complete.

---

## 🚦 Live Status Board

| Status | Task ID | Name | Focus Area |
|---|---|---|---|
| 🔄 **IN PROGRESS** | **`TASK-1.3`** | **Scale & Mode Generator** | Pentatonics, Blues, 7 Modes, Character notes |
| ⏭️ **NEXT UP** | **`TASK-1.4`** | Chord Formula & Quality Parser | Triads, 7ths, altered chords |
| ⚪ **QUEUED** | **`TASK-1.5`** | 24-Fret Guitar Matrix & CAGED 5-Box Engine | Full fretboard coordinates & boxes |

---

## ✅ Completed Tasks Registry

| Task ID | Name | Completed At | Key Deliverables |
|---|---|---|---|
| **`TASK-0.1`** | Monorepo Scaffolding & Virtualenv | 2026-11-02 | `backend/`, `data/`, `frontend/`, `.gitignore`, `backend/requirements.txt`, Python virtualenv `.venv` with `fastapi`, `pydantic`, `pytest` |
| **`TASK-0.2`** | Core Theory Data Schemas | 2026-11-02 | `backend/app/schemas/theory.py` (`ScaleDefinition`, `ChordDefinition`, `FretCoordinate`, `CagedBoxDefinition`, `ProgressionSection`) |
| **`TASK-1.1`** | Pitch Class Algebra & Enharmonic Resolution | 2026-11-02 | `backend/app/theory/pitch.py` with `NotationMode.PRACTICAL` (guitar frets: E#->F) & `ACADEMIC`, 11/11 `pytest` passing |
| **`TASK-1.2`** | Interval Engine | 2026-11-02 | `backend/app/theory/intervals.py`, compound extensions (#9, 13), degree letter resolution, 18/18 `pytest` passing |

---

## 🎯 Active Task Detail: `TASK-1.3`
* **Target File:** `backend/app/theory/scales.py`
* **Test File:** `backend/tests/test_scales.py`
* **Status:** Fine-Tuning Specification (Pending User Review)

