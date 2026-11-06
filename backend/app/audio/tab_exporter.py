"""Standard 6-line ASCII Guitar Tablature Exporter.

Renders quantized guitar note events and articulations (bends, vibrato,
slides, hammer-ons, pull-offs) into standard 6-line text tablature with
measure bar lines, rhythmic alignment guides, and wrap layouts.
"""

from typing import List, Optional, Dict
from backend.app.schemas.audio import (
    TranscribedNoteEvent,
    GuitarArticulationEnum,
    AsciiTabExportRequest,
    AsciiTabExportResponse,
)
from backend.app.audio.quantizer import quantize_note_events
from backend.app.audio.fret_solver import solve_optimal_guitar_tabs


STRING_NAMES = ["e", "B", "G", "D", "A", "E"]  # Strings 1 to 6


def format_note_token(
    fret: int,
    articulation: GuitarArticulationEnum,
    next_fret: Optional[int] = None,
) -> str:
    """Formats an individual note and articulation into standard ASCII tab syntax."""
    fret_str = str(fret)

    if articulation == GuitarArticulationEnum.BEND_HALF:
        target = str(fret + 1)
        return f"{fret_str}b{target}"
    elif articulation == GuitarArticulationEnum.BEND_FULL:
        target = str(fret + 2)
        return f"{fret_str}b{target}"
    elif articulation == GuitarArticulationEnum.BEND_1_AND_HALF:
        target = str(fret + 3)
        return f"{fret_str}b{target}"
    elif articulation == GuitarArticulationEnum.VIBRATO:
        return f"{fret_str}~"
    elif articulation == GuitarArticulationEnum.SLIDE_UP:
        target = str(next_fret) if next_fret is not None else ""
        return f"{fret_str}/{target}" if target else f"/{fret_str}"
    elif articulation == GuitarArticulationEnum.SLIDE_DOWN:
        target = str(next_fret) if next_fret is not None else ""
        return f"{fret_str}\\{target}" if target else f"\\{fret_str}"
    elif articulation == GuitarArticulationEnum.HAMMER_ON:
        target = str(next_fret) if next_fret is not None else ""
        return f"{fret_str}h{target}" if target else f"h{fret_str}"
    elif articulation == GuitarArticulationEnum.PULL_OFF:
        target = str(next_fret) if next_fret is not None else ""
        return f"{fret_str}p{target}" if target else f"p{fret_str}"
    else:
        return fret_str


def export_ascii_tab(
    notes: List[TranscribedNoteEvent],
    bpm: float = 120.0,
    grid: str = "auto",
    title: str = "Guitar Solo Transcription",
    key: Optional[str] = None,
    measures_per_line: int = 2,
    time_signature: str = "4/4",
) -> AsciiTabExportResponse:
    """Generates standard 6-line ASCII guitar tablature from transcribed notes."""
    if not notes:
        empty_tab = "\n".join([f"{name}|---------------------------------|" for name in STRING_NAMES])
        return AsciiTabExportResponse(
            ascii_tab=f"# {title}\n\n{empty_tab}\n",
            total_measures=1,
            quantization_grid=grid if grid != "auto" else "1/16",
            bpm=bpm,
        )

    # Ensure all notes have tab positions via Viterbi solver if missing
    notes_to_process = list(notes)
    needs_solving = any(n.tab_position is None for n in notes_to_process)
    if needs_solving:
        solved_notes, _, _ = solve_optimal_guitar_tabs(notes_to_process)
        notes_to_process = solved_notes

    # Quantize notes onto rhythmic grid
    quant_res = quantize_note_events(
        notes=notes_to_process,
        bpm=bpm,
        grid=grid,
        time_signature=time_signature,
    )

    resolved_grid = quant_res.grid
    slots_per_meas = quant_res.slots_per_measure
    total_measures = quant_res.total_measures

    # Organize notes by measure and grid_slot: dict[measure, dict[slot, list[(string, token)]]]
    # string is 1 to 6
    meas_data: Dict[int, Dict[int, List[Dict]]] = {}
    for m in range(1, total_measures + 1):
        meas_data[m] = {s: [] for s in range(slots_per_meas)}

    for i, qn in enumerate(quant_res.notes):
        if not qn.tab_position:
            continue
        m = qn.measure
        s = qn.grid_slot
        if m not in meas_data:
            meas_data[m] = {slot: [] for slot in range(slots_per_meas)}

        # Check next note for legato/slide target
        next_fret = None
        if i + 1 < len(quant_res.notes):
            next_note = quant_res.notes[i + 1]
            if (
                next_note.tab_position
                and next_note.tab_position.string == qn.tab_position.string
            ):
                next_fret = next_note.tab_position.fret

        # Prioritize articulation on tab_position if present, else note event articulation
        note_art = qn.articulation
        if qn.tab_position and qn.tab_position.articulation != GuitarArticulationEnum.NORMAL:
            note_art = qn.tab_position.articulation

        token = format_note_token(
            fret=qn.tab_position.fret,
            articulation=note_art,
            next_fret=next_fret,
        )
        meas_data[m][s].append({
            "string": qn.tab_position.string,
            "token": token,
        })

    # Render measures into blocks of `measures_per_line`
    output_lines: List[str] = []

    # Title & Metadata Header
    key_str = f" | Key: {key}" if key else ""
    output_lines.append(f"# {title}")
    output_lines.append(f"# Tempo: {quant_res.bpm} BPM | Time: {time_signature} | Grid: {resolved_grid}{key_str}")
    output_lines.append("")

    # Slot width in characters (dashes)
    default_cell_width = 3 if resolved_grid in ["1/8", "1/8T"] else 2

    # Process in chunks of `measures_per_line`
    for start_m in range(1, total_measures + 1, measures_per_line):
        end_m = min(start_m + measures_per_line - 1, total_measures)
        block_meas = list(range(start_m, end_m + 1))

        # Block sub-header
        output_lines.append(f"Measure {start_m}" + (f" - {end_m}" if end_m > start_m else ""))

        # 6 string lines (index 0 is string 1 "e", index 5 is string 6 "E")
        rendered_strings = {str_num: f"{STRING_NAMES[str_num - 1]}|" for str_num in range(1, 7)}
        rhythm_guide = "  |"

        for m in block_meas:
            for s in range(slots_per_meas):
                # Find maximum token length in this slot across all strings
                slot_items = meas_data[m].get(s, [])
                slot_map = {item["string"]: item["token"] for item in slot_items}

                max_token_len = 0
                for item in slot_items:
                    max_token_len = max(max_token_len, len(item["token"]))

                cell_len = max(default_cell_width, max_token_len + 1)

                # Fill each string for this slot
                for str_num in range(1, 7):
                    if str_num in slot_map:
                        token = slot_map[str_num]
                        pad = "-" * (cell_len - len(token))
                        rendered_strings[str_num] += f"{token}{pad}"
                    else:
                        rendered_strings[str_num] += "-" * cell_len

                # Rhythmic guide label for downbeats
                if s == 0:
                    guide_lbl = "1"
                elif resolved_grid == "1/16" and s % 4 == 0:
                    guide_lbl = str((s // 4) + 1)
                elif resolved_grid == "1/8" and s % 2 == 0:
                    guide_lbl = str((s // 2) + 1)
                else:
                    guide_lbl = " "
                pad_rhythm = " " * (cell_len - len(guide_lbl))
                rhythm_guide += f"{guide_lbl}{pad_rhythm}"

            # End of measure bar line
            for str_num in range(1, 7):
                rendered_strings[str_num] += "|"
            rhythm_guide += "|"

        # Append the 6 strings for this block
        for str_num in range(1, 7):
            output_lines.append(rendered_strings[str_num])
        output_lines.append(rhythm_guide)
        output_lines.append("")

    full_ascii = "\n".join(output_lines)

    return AsciiTabExportResponse(
        ascii_tab=full_ascii,
        total_measures=total_measures,
        quantization_grid=resolved_grid,
        bpm=quant_res.bpm,
    )
