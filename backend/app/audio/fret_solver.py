"""Biomechanical guitar fretboard solver.
Assigns optimal physical string and fret coordinates (tablature) to a sequence
of transcribed MIDI notes using Viterbi dynamic programming and CAGED ergonomics.
"""

from typing import Dict, List, Optional, Tuple
import numpy as np

from backend.app.schemas.audio import (
    GuitarArticulationEnum,
    GuitarTabPosition,
    TranscribedNoteEvent,
)

# Standard Guitar Tuning Open String MIDI numbers (String 1 = High E to String 6 = Low E)
STANDARD_TUNING_OPEN_MIDI = {
    1: 64,  # E4
    2: 59,  # B3
    3: 55,  # G3
    4: 50,  # D3
    5: 45,  # A2
    6: 40,  # E2
}

MAX_FRETS = 24


def get_candidate_fret_positions(
    pitch_midi: int,
    open_strings: Optional[Dict[int, int]] = None,
    max_frets: int = MAX_FRETS,
) -> List[Tuple[int, int]]:
    """Returns all valid (string, fret) pairs where pitch_midi can be played.
    Strings are 1 (high E) to 6 (low E).
    """
    tuning = open_strings or STANDARD_TUNING_OPEN_MIDI
    candidates: List[Tuple[int, int]] = []

    for s, open_pitch in tuning.items():
        fret = pitch_midi - open_pitch
        if 0 <= fret <= max_frets:
            candidates.append((s, fret))

    return candidates


def compute_biomechanical_transition_cost(
    pos_from: Tuple[int, int],
    pos_to: Tuple[int, int],
    pitch_to: int,
    anchor_fret: Optional[int] = None,
) -> float:
    """Computes physical effort/awkwardness cost for moving fingers between two positions.
    Lower is more natural and ergonomic.
    """
    s1, f1 = pos_from
    s2, f2 = pos_to

    cost = 0.0

    # 1. Horizontal fret distance along the neck
    fret_dist = abs(f2 - f1)
    if fret_dist == 0:
        cost += 0.0  # Same fret
    elif fret_dist <= 4:
        cost += fret_dist * 0.8  # Normal hand reach within 4 frets
    else:
        # Large shift / jump along the neck
        cost += 3.2 + (fret_dist - 4) * 3.5

    # 2. String jumping penalty
    string_diff = abs(s2 - s1)
    if string_diff == 0:
        cost += 0.2  # Same string picking is natural
    elif string_diff == 1:
        cost += 0.6  # Adjacent string transition
    else:
        cost += string_diff * 2.2  # String skipping is more awkward

    # 3. Preference for melodic lead registers (strings 1, 2, 3 for high notes)
    if pitch_to >= 64:  # High E and above
        if s2 in [1, 2]:
            cost -= 1.0  # Reward high plain strings
        elif s2 in [5, 6]:
            cost += 4.0  # Avoid high notes on thick wound strings (awkward upper frets)
    elif pitch_to <= 48:  # Bass register
        if s2 in [5, 6]:
            cost -= 1.0  # Reward wound bass strings
        elif s2 in [1, 2]:
            cost += 5.0

    # 4. Anchor box affinity (keep hand localized in target zone)
    if anchor_fret is not None and f2 > 0:
        box_dist = abs(f2 - anchor_fret)
        if box_dist > 4:
            cost += (box_dist - 4) * 1.5

    return cost


def solve_optimal_guitar_tabs(
    notes: List[TranscribedNoteEvent],
    target_zone_fret: Optional[int] = 7,
) -> Tuple[List[TranscribedNoteEvent], Optional[str], Optional[str]]:
    """Runs Viterbi dynamic programming to find the globally optimal, playable
    guitar tablature positions across all notes in the lick.
    Returns (notes_with_tab_positions, dominant_caged_box, hand_position_zone).
    """
    if not notes:
        return [], None, None

    # Step 1: Collect candidates for each note
    candidates_per_note: List[List[Tuple[int, int]]] = []
    for note in notes:
        cands = get_candidate_fret_positions(note.pitch_midi)
        if not cands:
            # Fallback for out-of-range notes
            cands = [(1, 0)]
        candidates_per_note.append(cands)

    n_notes = len(notes)

    # Step 2: Viterbi Trellis Initialization
    # V[t][c] = minimal cost to reach candidate c of note t
    V: List[List[float]] = []
    backpointers: List[List[int]] = []

    # Init t=0
    first_cands = candidates_per_note[0]
    first_costs = []
    for s, f in first_cands:
        # Initial preference: closer to target zone
        init_cost = 0.0
        if target_zone_fret is not None and f > 0:
            init_cost = abs(f - target_zone_fret) * 0.5
        # Melodic string preference
        if notes[0].pitch_midi >= 60 and s in [1, 2, 3]:
            init_cost -= 0.5
        first_costs.append(init_cost)

    V.append(first_costs)
    backpointers.append([-1] * len(first_cands))

    # Step 3: Viterbi Forward Pass
    for t in range(1, n_notes):
        curr_cands = candidates_per_note[t]
        prev_cands = candidates_per_note[t - 1]
        pitch_curr = notes[t].pitch_midi

        curr_costs = []
        curr_bps = []

        for c_idx, curr_pos in enumerate(curr_cands):
            min_cost = float("inf")
            best_prev_idx = 0

            for p_idx, prev_pos in enumerate(prev_cands):
                trans_cost = compute_biomechanical_transition_cost(
                    prev_pos, curr_pos, pitch_curr, target_zone_fret
                )
                total_cost = V[t - 1][p_idx] + trans_cost

                if total_cost < min_cost:
                    min_cost = total_cost
                    best_prev_idx = p_idx

            curr_costs.append(min_cost)
            curr_bps.append(best_prev_idx)

        V.append(curr_costs)
        backpointers.append(curr_bps)

    # Step 4: Backtracking
    best_last_idx = int(np.argmin(V[-1]))
    optimal_path_indices = [best_last_idx]

    for t in range(n_notes - 1, 0, -1):
        prev_idx = backpointers[t][optimal_path_indices[-1]]
        optimal_path_indices.append(prev_idx)

    optimal_path_indices.reverse()

    # Step 5: Assign tab positions to notes
    solved_notes: List[TranscribedNoteEvent] = []
    used_frets: List[int] = []

    for t, cand_idx in enumerate(optimal_path_indices):
        s, f = candidates_per_note[t][cand_idx]
        if f > 0:
            used_frets.append(f)

        orig = notes[t]
        tab_pos = GuitarTabPosition(
            string=s,
            fret=f,
            note=orig.pitch_name,
            pitch_midi=orig.pitch_midi,
            articulation=orig.articulation,
            bend_semitones=1.0 if orig.articulation == GuitarArticulationEnum.BEND_HALF else (
                2.0 if orig.articulation == GuitarArticulationEnum.BEND_FULL else 0.0
            ),
            confidence=orig.amplitude,
        )

        solved_note = TranscribedNoteEvent(
            start_time=orig.start_time,
            end_time=orig.end_time,
            duration=orig.duration,
            pitch_midi=orig.pitch_midi,
            pitch_name=orig.pitch_name,
            pitch_class=orig.pitch_class,
            amplitude=orig.amplitude,
            articulation=orig.articulation,
            bend_cents=orig.bend_cents,
            tab_position=tab_pos,
        )
        solved_notes.append(solved_note)

    # Step 6: Identify dominant hand position zone and CAGED box
    hand_zone = None
    caged_box = None

    if used_frets:
        min_fret = max(0, int(np.percentile(used_frets, 10)))
        max_fret = min(MAX_FRETS, int(np.percentile(used_frets, 90)))
        hand_zone = f"Frets {min_fret}–{max_fret}"

        # Estimate CAGED box from median fret position
        med = int(np.median(used_frets))
        if med <= 3:
            caged_box = "C"
        elif 3 < med <= 6:
            caged_box = "A"
        elif 6 < med <= 9:
            caged_box = "G"
        elif 9 < med <= 12:
            caged_box = "E"
        else:
            caged_box = "D"

    return solved_notes, caged_box, hand_zone
