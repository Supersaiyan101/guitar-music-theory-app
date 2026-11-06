"""Standard MIDI File (SMF Type 0) Exporter.

Converts transcribed guitar notes and pitch articulations into standard
binary MIDI (.mid) files with tempo maps, program changes, and pitch bend curves.
100% pure Python without external C dependencies.
"""

from typing import List
import struct

from backend.app.schemas.audio import (
    TranscribedNoteEvent,
    GuitarArticulationEnum,
)

TICKS_PER_QUARTER = 480  # Standard PPQ resolution


def encode_vlq(value: int) -> bytes:
    """Encodes an integer into MIDI Variable-Length Quantity (VLQ)."""
    if value < 0:
        value = 0
    buffer = bytearray()
    buffer.append(value & 0x7F)
    value >>= 7
    while value > 0:
        buffer.append((value & 0x7F) | 0x80)
        value >>= 7
    return bytes(reversed(buffer))


def export_midi_bytes(
    notes: List[TranscribedNoteEvent],
    bpm: float = 120.0,
    time_signature: str = "4/4",
    track_name: str = "Guitar Solo",
    include_pitch_bends: bool = True,
    program_number: int = 27,  # 27 = Electric Guitar (Clean), 25 = Acoustic Steel
) -> bytes:
    """Generates standard binary MIDI Type 0 (.mid) bytes from transcribed notes."""
    safe_bpm = max(30.0, min(300.0, bpm))
    ticks_per_sec = (safe_bpm / 60.0) * TICKS_PER_QUARTER

    # Meta events list: tuple of (tick, order_priority, byte_event)
    # Priority ensures deterministic ordering at identical tick timestamps:
    # 0: Tempo / Time Sig / Program Change
    # 1: Pitch Bend
    # 2: Note On
    # 3: Note Off
    events: List[tuple] = []

    # 1. Track Name Meta Event
    name_bytes = track_name.encode("utf-8")
    events.append((0, 0, b"\xFF\x03" + encode_vlq(len(name_bytes)) + name_bytes))

    # 2. Set Tempo Meta Event (microseconds per quarter note)
    us_per_quarter = int(round(60_000_000.0 / safe_bpm))
    tempo_bytes = struct.pack(">I", us_per_quarter)[1:]  # 3 bytes
    events.append((0, 0, b"\xFF\x51\x03" + tempo_bytes))

    # 3. Time Signature Meta Event
    try:
        num, denom = [int(x) for x in time_signature.split("/")]
    except Exception:
        num, denom = 4, 4

    # Denominator power of 2: 4 -> 2, 8 -> 3
    denom_power = 2
    if denom == 2:
        denom_power = 1
    elif denom == 8:
        denom_power = 3
    elif denom == 16:
        denom_power = 4

    events.append((0, 0, bytes([0xFF, 0x58, 0x04, num, denom_power, 24, 8])))

    # 4. Program Change Event (Channel 0)
    events.append((0, 0, bytes([0xC0, program_number & 0x7F])))

    # 5. Build Note On / Note Off / Pitch Bend events
    for note in notes:
        start_tick = max(0, int(round(note.start_time * ticks_per_sec)))
        duration_ticks = max(int(TICKS_PER_QUARTER / 8), int(round(note.duration * ticks_per_sec)))
        end_tick = start_tick + duration_ticks
        pitch = max(0, min(127, note.pitch_midi))
        velocity = max(40, min(127, int(round((note.amplitude or 0.8) * 110))))

        # Articulation checks (from note or tab_position)
        art = note.articulation
        if note.tab_position and note.tab_position.articulation != GuitarArticulationEnum.NORMAL:
            art = note.tab_position.articulation

        # Handle Pitch Bends if enabled
        if include_pitch_bends and art in [
            GuitarArticulationEnum.BEND_HALF,
            GuitarArticulationEnum.BEND_FULL,
            GuitarArticulationEnum.BEND_1_AND_HALF,
        ]:
            # MIDI bend 8192 is center (+0 semitones). Standard pitch bend sensitivity = 2 semitones.
            # 8192 center -> 12288 = +1 semitone (half bend), 16383 = +2 semitones (full bend)
            if art == GuitarArticulationEnum.BEND_HALF:
                target_val = 12288
            elif art == GuitarArticulationEnum.BEND_FULL:
                target_val = 16383
            else:
                target_val = 16383

            lsb = target_val & 0x7F
            msb = (target_val >> 7) & 0x7F

            # Note On with initial pitch
            events.append((start_tick, 2, bytes([0x90, pitch, velocity])))

            # Bend peaks at middle of note duration
            bend_tick = start_tick + (duration_ticks // 2)
            events.append((bend_tick, 1, bytes([0xE0, lsb, msb])))

            # Note Off
            events.append((end_tick, 3, bytes([0x80, pitch, 0])))

            # Reset pitch bend to center (8192 -> lsb=0, msb=64)
            events.append((end_tick, 4, bytes([0xE0, 0x00, 0x40])))
        else:
            # Standard Note On & Note Off
            events.append((start_tick, 2, bytes([0x90, pitch, velocity])))
            events.append((end_tick, 3, bytes([0x80, pitch, 0])))

    # 6. Sort all events chronologically by tick and priority
    events.sort(key=lambda x: (x[0], x[1]))

    # 7. Convert absolute ticks to delta ticks and serialize
    track_body = bytearray()
    last_tick = 0

    for tick, _, event_bytes in events:
        delta = max(0, tick - last_tick)
        track_body.extend(encode_vlq(delta))
        track_body.extend(event_bytes)
        last_tick = tick

    # End of Track Meta Event (delta 0, 0xFF 0x2F 0x00)
    track_body.extend(encode_vlq(0))
    track_body.extend(b"\xFF\x2F\x00")

    # 8. Assemble MThd Header Chunk
    # Format 0 (single track), 1 track, ticks per quarter
    header = struct.pack(
        ">4sIHHH",
        b"MThd",
        6,
        0,  # Format 0
        1,  # 1 Track
        TICKS_PER_QUARTER,
    )

    # 9. Assemble MTrk Track Chunk
    track_chunk = struct.pack(">4sI", b"MTrk", len(track_body)) + bytes(track_body)

    return header + track_chunk
