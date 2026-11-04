"""Deterministic Progression Engine & Harmonic Analysis Core for Guitar Theory Kingdom.

Provides algorithmic harmonic analysis for guitarists:
- Krumhansl-Schmuckler empirical key and mode detection
- Roman numeral taxonomy (diatonic, secondary dominants, modal interchange, tritone subs)
- Guide-tone voice leading graph (3rd <-> 7th resolutions, common tones, minimal fret motion)
- Pedagogical insights and 4-tier soloing scale recommendations
"""
import math
from typing import Any, Dict, List, Optional, Tuple

from backend.app.schemas.theory import (
    ChordAnalysis,
    ChordDefinition,
    HarmonicFunction,
    ProgressionAnalysisResult,
    VoiceLeadingStep,
)
from backend.app.theory.chords import (
    deconstruct_chord,
    get_shell_voicing,
    parse_chord_symbol,
)
from backend.app.theory.pitch import (
    NOTE_NAME_TO_PITCH_CLASS,
    NotationMode,
    are_enharmonic,
    note_to_pitch_class,
    pitch_class_to_note,
    semitones_between,
    shortest_semitone_distance,
    simplify_to_practical,
)

# ---------------------------------------------------------------------------
# Krumhansl-Kessler Empirical Key Profiles (Psychometric MIR Standard)
# ---------------------------------------------------------------------------
KRUMHANSL_MAJOR: Tuple[float, ...] = (
    6.35, 2.23, 3.48, 2.33, 1.71, 4.03, 2.38, 4.85, 2.09, 2.29, 2.28, 2.28
)
KRUMHANSL_MINOR: Tuple[float, ...] = (
    6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17
)

PITCH_NAMES_SHARP: Tuple[str, ...] = (
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
)
PITCH_NAMES_FLAT: Tuple[str, ...] = (
    "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"
)


def _pearson_correlation(x: List[float], y: Tuple[float, ...]) -> float:
    """Computes Pearson correlation coefficient between two 12-element vectors without numpy."""
    n = len(x)
    mean_x = sum(x) / n
    mean_y = sum(y) / n

    cov = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n))
    var_x = sum((x[i] - mean_x) ** 2 for i in range(n))
    var_y = sum((y[i] - mean_y) ** 2 for i in range(n))

    denom = math.sqrt(var_x * var_y)
    if denom == 0:
        return 0.0
    return cov / denom


def detect_tonal_center(
    chords: List[str],
    durations: Optional[List[int]] = None
) -> Tuple[str, str, float]:
    """Detects the most probable musical key (tonic root and mode) from a sequence of chords
    using the Krumhansl-Schmuckler key-finding algorithm.
    
    Returns:
        (tonic_note, mode, confidence_score) where mode is 'major' or 'minor',
        and confidence_score is normalized in [0.0, 1.0].
    """
    if not chords:
        return "C", "major", 0.0

    if durations is None or len(durations) != len(chords):
        durations = [4] * len(chords)  # Default 4 beats / 1 bar each

    # 1. Build 12-element chroma histogram
    chroma_hist = [0.0] * 12

    for chord_sym, dur in zip(chords, durations):
        try:
            chord = deconstruct_chord(chord_sym)
        except Exception:
            continue

        root_pc = note_to_pitch_class(chord.root)
        chroma_hist[root_pc] += 1.6 * dur  # Root is primary tonal foundation

        for interval, tone in zip(chord.intervals, chord.tones):
            tone_pc = note_to_pitch_class(tone)
            if interval in ("3", "b3"):
                chroma_hist[tone_pc] += 1.4 * dur  # 3rd defines quality
            elif interval in ("7", "b7"):
                chroma_hist[tone_pc] += 1.2 * dur  # 7th defines tension
            elif interval in ("5", "b5", "#5"):
                chroma_hist[tone_pc] += 0.8 * dur
            else:
                chroma_hist[tone_pc] += 0.6 * dur

    total_weight = sum(chroma_hist)
    if total_weight > 0:
        chroma_hist = [w / total_weight for w in chroma_hist]

    # 2. Correlate against all 24 rotated key profiles
    best_corr = -2.0
    best_root = "C"
    best_mode = "major"

    # Also extract first and last chord roots to provide musical contextual bias
    first_root_pc = None
    last_root_pc = None
    try:
        first_root_pc = note_to_pitch_class(deconstruct_chord(chords[0]).root)
        last_root_pc = note_to_pitch_class(deconstruct_chord(chords[-1]).root)
    except Exception:
        pass

    prefer_flats = any("b" in c for c in chords)

    for i in range(12):
        # Rotate major profile by i
        maj_profile = tuple(KRUMHANSL_MAJOR[(j - i) % 12] for j in range(12))
        r_maj = _pearson_correlation(chroma_hist, maj_profile)

        # Musical bias: first/last chord root bonus (+0.05)
        if first_root_pc == i:
            r_maj += 0.04
        if last_root_pc == i:
            r_maj += 0.04

        if r_maj > best_corr:
            best_corr = r_maj
            best_root = PITCH_NAMES_FLAT[i] if prefer_flats else PITCH_NAMES_SHARP[i]
            best_mode = "major"

        # Rotate minor profile by i
        min_profile = tuple(KRUMHANSL_MINOR[(j - i) % 12] for j in range(12))
        r_min = _pearson_correlation(chroma_hist, min_profile)

        if first_root_pc == i:
            r_min += 0.04
        if last_root_pc == i:
            r_min += 0.04

        if r_min > best_corr:
            best_corr = r_min
            best_root = PITCH_NAMES_FLAT[i] if prefer_flats else PITCH_NAMES_SHARP[i]
            best_mode = "minor"

    # Normalize correlation score from [-1, 1] to [0, 1]
    confidence = max(0.0, min(1.0, (best_corr + 1.0) / 2.0))
    return best_root, best_mode, round(confidence, 3)


def parse_roman_numeral(
    chord_symbol: str,
    key_root: str,
    key_mode: str = "major"
) -> Tuple[str, HarmonicFunction, str]:
    """Analyzes a chord symbol relative to a key and produces its Roman numeral,
    harmonic function, and a concise pedagogical explanation.
    """
    chord = deconstruct_chord(chord_symbol)
    root = chord.root
    quality_val = chord.quality.value
    intervals = chord.intervals

    semitones = semitones_between(key_root, root)
    has_7 = any("7" in iv for iv in intervals)
    is_maj7 = "7" in intervals and "b7" not in intervals
    is_dom7 = "b7" in intervals and ("3" in intervals or "maj" in quality_val or "7" in quality_val)
    is_min = "min" in quality_val or "b3" in intervals
    is_dim = "dim" in quality_val or ("b3" in intervals and "b5" in intervals)

    key_is_major = key_mode.lower() == "major"

    # Helper for 7th symbol appendage
    sev = "maj7" if is_maj7 else ("7" if has_7 else "")

    if key_is_major:
        # ---------------- Major Key Analysis ----------------
        if semitones == 0:
            if is_min:
                return f"i{sev}", HarmonicFunction.MODAL_INTERCHANGE, "Parallel minor tonic chord borrowed for bittersweet mood."
            elif is_dom7:
                return "I7", HarmonicFunction.DOMINANT, "Blues tonic dominant chord with sweet Mixolydian character."
            else:
                return f"I{sev}", HarmonicFunction.TONIC, "Tonic center of the key. Resolves harmonic tension."

        elif semitones == 1:
            return f"bII{sev}", HarmonicFunction.NEAPOLITAN, "Neapolitan chord / Tritone sub leading smoothly to dominant or tonic."

        elif semitones == 2:
            if is_min:
                return f"ii{sev}", HarmonicFunction.SUBDOMINANT, "Diatonic supertonic predominant chord. Sets up dominant V resolution."
            elif is_dim:
                return f"iiø{sev or '7'}", HarmonicFunction.MODAL_INTERCHANGE, "Half-diminished ii chord borrowed from parallel minor."
            else:
                return f"II{sev or '7'}", HarmonicFunction.SECONDARY_DOMINANT, "Secondary dominant (V/V) leading directly to the V chord."

        elif semitones == 3:
            return f"bIII{sev}", HarmonicFunction.MODAL_INTERCHANGE, "Borrowed mediant from parallel minor. Classic rock and blues anthem sound."

        elif semitones == 4:
            if is_min:
                return f"iii{sev}", HarmonicFunction.TONIC, "Diatonic mediant chord. Soft, emotional tonic substitute."
            else:
                return f"III{sev or '7'}", HarmonicFunction.SECONDARY_DOMINANT, "Secondary dominant (V/vi) pushing strongly into the relative minor vi chord."

        elif semitones == 5:
            if is_min:
                return f"iv{sev}", HarmonicFunction.MODAL_INTERCHANGE, "The bittersweet minor 4th borrowed from parallel minor. Beautiful emotional release."
            else:
                return f"IV{sev}", HarmonicFunction.SUBDOMINANT, "Diatonic subdominant chord. Bright, expansive lift."

        elif semitones == 6:
            return f"bV{sev or '7'}", HarmonicFunction.TRITONE_SUB, "Tritone substitution dominant (subV). Resolves downward by a single half-step."

        elif semitones == 7:
            if is_min:
                return f"v{sev}", HarmonicFunction.MODAL_INTERCHANGE, "Minor v chord borrowed from Aeolian/Mixolydian."
            else:
                return f"V{sev}", HarmonicFunction.DOMINANT, "Diatonic dominant chord. Maximum harmonic tension demanding resolution to I."

        elif semitones == 8:
            return f"bVI{sev}", HarmonicFunction.MODAL_INTERCHANGE, "Borrowed submediant from parallel minor. Epic, cinematic chord."

        elif semitones == 9:
            if is_min:
                return f"vi{sev}", HarmonicFunction.TONIC, "Diatonic submediant chord. Relative minor tonic substitute."
            else:
                return f"VI{sev or '7'}", HarmonicFunction.SECONDARY_DOMINANT, "Secondary dominant (V/ii) leading into the ii chord."

        elif semitones == 10:
            return f"bVII{sev}", HarmonicFunction.MODAL_INTERCHANGE, "Subtonic chord borrowed from Mixolydian. The quintessential classic rock power cadence."

        elif semitones == 11:
            if is_dim:
                return f"vii°{sev}", HarmonicFunction.DOMINANT, "Diatonic leading-tone chord. Shares strong dominant pull with V7."
            else:
                return f"VII{sev}", HarmonicFunction.PASSING, "Non-diatonic chromatic passing chord."

    else:
        # ---------------- Minor Key Analysis ----------------
        if semitones == 0:
            if not is_min and not is_dim:
                return f"I{sev}", HarmonicFunction.TONIC, "Picardy third: Major tonic resolution in a minor key."
            return f"i{sev}", HarmonicFunction.TONIC, "Minor tonic center. Melancholy home chord."

        elif semitones == 1:
            return f"bII{sev}", HarmonicFunction.NEAPOLITAN, "Neapolitan chord with dark Phrygian flavor."

        elif semitones == 2:
            return f"ii°{sev or '7'}", HarmonicFunction.SUBDOMINANT, "Diatonic minor supertonic chord. Sets up V7 in minor."

        elif semitones == 3:
            return f"bIII{sev}", HarmonicFunction.TONIC, "Relative major chord. Uplifting tonic substitute in minor."

        elif semitones == 4:
            return f"III{sev}", HarmonicFunction.SECONDARY_DOMINANT, "Major mediant / secondary dominant."

        elif semitones == 5:
            if is_min:
                return f"iv{sev}", HarmonicFunction.SUBDOMINANT, "Diatonic minor subdominant chord."
            else:
                return f"IV{sev or '7'}", HarmonicFunction.MODAL_INTERCHANGE, "Major IV chord with bright Dorian flavor (sweet Dorian 6th)."

        elif semitones == 6:
            return f"bV{sev}", HarmonicFunction.TRITONE_SUB, "Tritone substitution chord."

        elif semitones == 7:
            if is_min:
                return f"v{sev}", HarmonicFunction.DOMINANT, "Natural minor v chord."
            else:
                return f"V{sev}", HarmonicFunction.DOMINANT, "Harmonic minor dominant V7 chord with raised leading tone. Classic minor resolution."

        elif semitones == 8:
            return f"bVI{sev}", HarmonicFunction.SUBDOMINANT, "Diatonic submediant chord. Key anchor of the Andalusian cadence."

        elif semitones == 9:
            return f"vi{sev}", HarmonicFunction.PASSING, "Dorian minor 6th chord."

        elif semitones == 10:
            return f"bVII{sev}", HarmonicFunction.SUBDOMINANT, "Diatonic subtonic chord from natural minor."

        elif semitones == 11:
            return f"vii°{sev}", HarmonicFunction.DOMINANT, "Harmonic minor leading-tone diminished chord."

    # Fallback for complex extensions
    return chord_symbol, HarmonicFunction.PASSING, "Chromatic passing harmony."


def get_guide_tones(chord_symbol: str) -> List[Tuple[str, str]]:
    """Extracts the Guide Tones for a chord: (note, degree_role).
    Returns [(note, '3'), (note, '7')] if both present, or [(note, '3')].
    """
    chord = deconstruct_chord(chord_symbol)
    result: List[Tuple[str, str]] = []

    # Find 3rd
    for iv, tone in zip(chord.intervals, chord.tones):
        if iv in ("3", "b3"):
            result.append((tone, iv))
            break

    # Find 7th
    for iv, tone in zip(chord.intervals, chord.tones):
        if iv in ("7", "b7", "bb7"):
            result.append((tone, iv))
            break

    return result


def calculate_chord_voice_leading(
    chord_a_sym: str,
    chord_b_sym: str
) -> List[VoiceLeadingStep]:
    """Calculates the minimal fret/voice-leading movements between two chords,
    highlighting 3rd <-> 7th guide-tone resolutions, common tones, and leading tones.
    """
    chord_a = deconstruct_chord(chord_a_sym)
    chord_b = deconstruct_chord(chord_b_sym)

    guide_a = get_guide_tones(chord_a_sym)
    guide_b = get_guide_tones(chord_b_sym)

    steps: List[VoiceLeadingStep] = []
    used_b_indices = set()

    # 1. First Pass: Check Guide-Tone Specific Resolutions (7th -> 3rd and 3rd -> 7th)
    for tone_a, role_a in guide_a:
        for idx_b, (tone_b, role_b) in enumerate(guide_b):
            if idx_b in used_b_indices:
                continue

            dist = shortest_semitone_distance(tone_a, tone_b)

            # Golden Rule 1: 7th resolves down by half-step to 3rd
            if role_a in ("7", "b7") and role_b in ("3", "b3") and dist == -1:
                steps.append(VoiceLeadingStep(
                    from_note=tone_a,
                    from_degree=role_a,
                    to_note=tone_b,
                    to_degree=role_b,
                    semitone_distance=-1,
                    movement_type="half_step_down",
                    is_guide_tone_resolution=True,
                ))
                used_b_indices.add(idx_b)
                break

            # Golden Rule 2: 3rd stays as common tone to become 7th
            elif role_a in ("3", "b3") and role_b in ("7", "b7") and dist == 0:
                steps.append(VoiceLeadingStep(
                    from_note=tone_a,
                    from_degree=role_a,
                    to_note=tone_b,
                    to_degree=role_b,
                    semitone_distance=0,
                    movement_type="common_tone",
                    is_guide_tone_resolution=True,
                ))
                used_b_indices.add(idx_b)
                break

            # Golden Rule 3: 7th stays as common tone to become 3rd
            elif role_a in ("7", "b7") and role_b in ("3", "b3") and dist == 0:
                steps.append(VoiceLeadingStep(
                    from_note=tone_a,
                    from_degree=role_a,
                    to_note=tone_b,
                    to_degree=role_b,
                    semitone_distance=0,
                    movement_type="common_tone",
                    is_guide_tone_resolution=True,
                ))
                used_b_indices.add(idx_b)
                break

            # Golden Rule 4: 3rd resolves down by half-step to 7th
            elif role_a in ("3", "b3") and role_b in ("7", "b7") and dist == -1:
                steps.append(VoiceLeadingStep(
                    from_note=tone_a,
                    from_degree=role_a,
                    to_note=tone_b,
                    to_degree=role_b,
                    semitone_distance=-1,
                    movement_type="half_step_down",
                    is_guide_tone_resolution=True,
                ))
                used_b_indices.add(idx_b)
                break

    # 2. Second Pass: Check Leading Tone Resolution (3rd of Dominant resolving up half-step to Root of Tonic)
    dominant_3rd = next((t for t, r in guide_a if r == "3"), None)
    if dominant_3rd and chord_b.root:
        dist_to_root = shortest_semitone_distance(dominant_3rd, chord_b.root)
        if dist_to_root == 1:
            # Check if root not already covered
            if not any(s.to_note == chord_b.root for s in steps):
                steps.append(VoiceLeadingStep(
                    from_note=dominant_3rd,
                    from_degree="3",
                    to_note=chord_b.root,
                    to_degree="1",
                    semitone_distance=1,
                    movement_type="half_step_up",
                    is_guide_tone_resolution=True,
                ))

    # 3. Third Pass: Map all remaining chord tones of A to nearest unused tone in B
    covered_a_notes = {s.from_note for s in steps}

    for iv_a, tone_a in zip(chord_a.intervals, chord_a.tones):
        if tone_a in covered_a_notes:
            continue

        best_tone_b = None
        best_iv_b = None
        best_dist = 999
        best_idx_b = None

        for idx_b, (iv_b, tone_b) in enumerate(zip(chord_b.intervals, chord_b.tones)):
            dist = shortest_semitone_distance(tone_a, tone_b)
            if abs(dist) < abs(best_dist):
                best_dist = dist
                best_tone_b = tone_b
                best_iv_b = iv_b
                best_idx_b = idx_b

        if best_tone_b is not None:
            if best_dist == 0:
                m_type = "common_tone"
            elif best_dist == -1:
                m_type = "half_step_down"
            elif best_dist == 1:
                m_type = "half_step_up"
            elif best_dist == -2:
                m_type = "whole_step_down"
            elif best_dist == 2:
                m_type = "whole_step_up"
            else:
                m_type = "leap"

            steps.append(VoiceLeadingStep(
                from_note=tone_a,
                from_degree=iv_a,
                to_note=best_tone_b,
                to_degree=best_iv_b,
                semitone_distance=best_dist,
                movement_type=m_type,
                is_guide_tone_resolution=False,
            ))
            covered_a_notes.add(tone_a)

    return steps


def recommend_scales_for_chord(
    chord_symbol: str,
    key_root: str,
    key_mode: str = "major"
) -> Dict[str, str]:
    """Calculates a 4-tier soloing roadmap for the guitarist over a specific chord:
    1. Parent: Overarching song key scale (e.g. C Major)
    2. Modal: Chord-tone matching mode (e.g. D Dorian over Dm7)
    3. Blues: Expressive vocal blues scale
    4. Spicy: Tension/altered scale for outside flavor
    """
    chord = deconstruct_chord(chord_symbol)
    root = chord.root
    quality_val = chord.quality.value
    intervals = chord.intervals
    semitones = semitones_between(key_root, root)

    parent_name = f"{key_root} Major" if key_mode.lower() == "major" else f"{key_root} Natural Minor"
    blues_name = f"{root} Minor Blues"

    # 1. Modal Recommendation
    if "b7" in intervals and "3" in intervals:
        # Dominant 7th
        modal_name = f"{root} Mixolydian"
    elif "min" in quality_val or "b3" in intervals:
        # Minor chord
        if semitones == 2:
            modal_name = f"{root} Dorian"
        elif semitones == 4:
            modal_name = f"{root} Phrygian"
        elif semitones == 9:
            modal_name = f"{root} Aeolian (Natural Minor)"
        else:
            modal_name = f"{root} Dorian"
    elif "dim" in quality_val:
        modal_name = f"{root} Locrian"
    else:
        # Major chord
        if semitones == 5:
            modal_name = f"{root} Lydian"
        else:
            modal_name = f"{root} Major (Ionian)"

    # 2. Spicy / Tension Recommendation
    if "b7" in intervals and "3" in intervals:
        if semitones == 7:  # V7 chord
            spicy_name = f"{root} Altered (Super Locrian)"
        elif semitones == 4:  # V7/vi (e.g. E7 in C)
            spicy_name = f"{root} Phrygian Dominant"
        elif semitones == 2:  # V7/V (e.g. D7 in C)
            spicy_name = f"{root} Lydian Dominant"
        elif semitones == 10:  # bVII (e.g. Bb7 in C)
            spicy_name = f"{root} Lydian Dominant"
        else:
            spicy_name = f"{root} Half-Whole Diminished"
    elif semitones == 5 and "min" in quality_val:  # Minor iv chord (e.g. Fm in C)
        spicy_name = f"{root} Melodic Minor"
    elif semitones == 8:  # bVI (e.g. Ab in C)
        spicy_name = f"{root} Lydian"
    elif semitones == 3:  # bIII (e.g. Eb in C)
        spicy_name = f"{root} Major Pentatonic"
    else:
        spicy_name = f"{root} Major Pentatonic"

    return {
        "parent": parent_name,
        "modal": modal_name,
        "blues": blues_name,
        "spicy": spicy_name,
    }


def analyze_progression(
    chords: List[str],
    key: Optional[str] = None,
    mode: Optional[str] = None,
    durations: Optional[List[int]] = None,
) -> ProgressionAnalysisResult:
    """Master progression analyzer. Processes any sequence of chords, detects the key if omitted,
    and returns full Roman numerals, guide-tone voice-leading connections, and scale advice.
    """
    if not chords:
        raise ValueError("Progression cannot be empty.")

    # 1. Determine Key
    if key is None or mode is None:
        detected_key, detected_mode, conf = detect_tonal_center(chords, durations)
        key = key or detected_key
        mode = mode or detected_mode
        confidence = conf
    else:
        # Calculate confidence against provided key
        _, _, conf = detect_tonal_center(chords, durations)
        confidence = conf

    if durations is None or len(durations) != len(chords):
        durations = [4] * len(chords)

    total_bars = sum(durations) // 4
    chord_analyses: List[ChordAnalysis] = []

    for i, (chord_sym, dur) in enumerate(zip(chords, durations)):
        chord = deconstruct_chord(chord_sym)
        next_chord_sym = chords[(i + 1) % len(chords)]
        next_chord = deconstruct_chord(next_chord_sym)

        # Roman numeral & Harmonic function
        roman, h_func, insight = parse_roman_numeral(chord_sym, key, mode)

        # Guide tones
        guide_t = [t for t, _ in get_guide_tones(chord_sym)]

        # Common tones with next chord
        pc_current = {note_to_pitch_class(t) for t in chord.tones}
        common_t = [t for t in next_chord.tones if note_to_pitch_class(t) in pc_current]

        # Voice leading steps to next chord
        vl_steps = calculate_chord_voice_leading(chord_sym, next_chord_sym)

        # Scale recommendations
        rec_scales = recommend_scales_for_chord(chord_sym, key, mode)

        chord_analyses.append(ChordAnalysis(
            symbol=chord_sym,
            root=chord.root,
            quality=chord.quality.value,
            chord_tones=chord.tones,
            guide_tones=guide_t,
            roman_numeral=roman,
            harmonic_function=h_func,
            pedagogical_insight=insight,
            common_tones_with_next=common_t,
            voice_leading_to_next=vl_steps,
            recommended_scales=rec_scales,
        ))

    # Summary description
    roman_summary = " - ".join(c.roman_numeral for c in chord_analyses)
    summary = f"Key of {key} {mode.capitalize()} ({roman_summary}) with {len(chords)} chord changes."

    return ProgressionAnalysisResult(
        key=key,
        mode=mode,
        confidence=confidence,
        total_bars=max(1, total_bars),
        chords=chord_analyses,
        summary_description=summary,
    )
