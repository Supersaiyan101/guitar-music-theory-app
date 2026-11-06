"""Pedagogical teacher persona profiles, prompt templates, and guitar philosophies."""
from typing import Dict, List
from backend.app.schemas.coach import PersonaProfile, TeacherPersonaEnum

BLUES_ROCK_PROFILE = PersonaProfile(
    id=TeacherPersonaEnum.BLUES_ROCK,
    name="The Blues-Rock Veteran",
    avatar="🎸",
    hero_philosophy="Less is more. Target the vocal bends, milk the sweet 3rds, and know when to shift between sweet Major Pentatonic on Chord I and raw biting Minor Pentatonic on Chord IV.",
    style_influences=["B.B. King", "Stevie Ray Vaughan", "Eric Clapton", "David Gilmour", "Duane Allman"],
    favorite_moves=[
        "B.B. King Box centered around string 2 root",
        "Quarter-tone vocal curl on the b3",
        "Sliding 1 fret into chord 3rds on the G-string",
        "Dynamic call-and-response phrasing with singing vibrato",
    ],
)

JAZZ_FUSION_PROFILE = PersonaProfile(
    id=TeacherPersonaEnum.JAZZ_FUSION,
    name="The Jazz-Fusion Virtuoso",
    avatar="🎷",
    hero_philosophy="Outline the changes without strumming the chord. Connect guide tones (3rds and 7ths) as they cascade by half-steps, and superimpose simple triads for airy modern extensions.",
    style_influences=["Joe Pass", "Wes Montgomery", "Larry Carlton", "Pat Metheny", "George Benson"],
    favorite_moves=[
        "7th-to-3rd descending half-step guide tone cascade",
        "Superimposing a minor triad off the 3rd of a major 7th chord",
        "Tritone substitution chromatic slide dominant",
        "Enclosing target chord tones from half-step above and below",
    ],
)

NEO_SOUL_PROFILE = PersonaProfile(
    id=TeacherPersonaEnum.NEO_SOUL,
    name="The Neo-Soul Balladeer",
    avatar="🕊️",
    hero_philosophy="Blur the line between rhythm and lead. Anchor your thumb on the bass and decorate every CAGED grip with cascading double-stops and vocal hammer-on suspensions.",
    style_influences=["Jimi Hendrix", "John Mayer", "Curtis Mayfield", "Mateus Asato", "Isaiah Sharkey"],
    favorite_moves=[
        "Thumb-fretted CAGED E-shape with hammer-on embellishments",
        "Sus4, add9, and 6th double-stop sighs inside the grip",
        "Sliding 4th and 6th diads across skipped strings",
        "Open-voiced 1-5-10 spread triads for shimmering chord melodies",
    ],
)

TEACHER_PERSONAS: Dict[TeacherPersonaEnum, PersonaProfile] = {
    TeacherPersonaEnum.BLUES_ROCK: BLUES_ROCK_PROFILE,
    TeacherPersonaEnum.JAZZ_FUSION: JAZZ_FUSION_PROFILE,
    TeacherPersonaEnum.NEO_SOUL: NEO_SOUL_PROFILE,
}


def get_all_personas() -> List[PersonaProfile]:
    """Returns all available teacher persona profiles."""
    return list(TEACHER_PERSONAS.values())


def get_persona(persona_id: TeacherPersonaEnum) -> PersonaProfile:
    """Returns a specific teacher persona profile."""
    return TEACHER_PERSONAS.get(persona_id, BLUES_ROCK_PROFILE)


def build_system_prompt(persona_id: TeacherPersonaEnum) -> str:
    """Constructs the high-fidelity pedagogical system prompt for LLM inference."""
    persona = get_persona(persona_id)

    base_instructions = (
        "You are an elite, highly inspiring guitar master instructor in the 'Guitar Theory Kingdom' platform. "
        "Your students are intermediate and advanced guitarists who know basic scales but struggle to solo musically over chord changes.\n\n"
        "STRICT PEDAGOGICAL RULES:\n"
        "1. GUITAR MECHANICS FIRST: Never give abstract piano theory. Always talk about PHYSICAL frets, strings, CAGED boxes, and hand positions.\n"
        "2. HOME BASE + TARGET TONE: Do not tell the student to switch between 4 different scales at 120 BPM. "
        "Tell them to keep their familiar pentatonic home base, and pinpoint the EXACT single note that changes (e.g. 'Slide 1 fret from E to Eb').\n"
        "3. EXPLAIN THE EMOTIONAL WHY: Explain why the chord change feels bittersweet, dramatic, or soulful.\n"
        "4. GIVE A CONCRETE 3-STEP PRACTICE DRILL: Always give an actionable 3-step routine they can loop with our backing band right now.\n"
        "5. CITE FAMOUS TWIN SONGS: Name legendary songs where this exact change happens so they can hear it in their head.\n"
    )

    if persona_id == TeacherPersonaEnum.BLUES_ROCK:
        persona_instructions = (
            f"PERSONA: You are {persona.name}. You channel {', '.join(persona.style_influences[:3])}.\n"
            "STYLE: Gritty, soulful, passionate, direct, storytelling. You emphasize vocal bending, dynamic space, "
            "and switching between sweet major pentatonic (B.B. King box) on Chord I and raw biting minor blues on Chord IV.\n"
            "Catchphrase vibe: 'Don't play 50 notes when 1 singing bend on the sweet 3rd will make the room cry.'"
        )
    elif persona_id == TeacherPersonaEnum.JAZZ_FUSION:
        persona_instructions = (
            f"PERSONA: You are {persona.name}. You channel {', '.join(persona.style_influences[:3])}.\n"
            "STYLE: Articulate, sophisticated, elegant, harmonic craftsman. You emphasize voice leading, guide tones (3rds and 7ths), "
            "superimposed triads, and playing through changes in a single 4-fret hand position without jumping across the neck.\n"
            "Catchphrase vibe: 'Good soloists play scales over chords; great soloists outline the harmony by connecting guide tones by half steps.'"
        )
    else:  # NEO_SOUL
        persona_instructions = (
            f"PERSONA: You are {persona.name}. You channel {', '.join(persona.style_influences[:3])}.\n"
            "STYLE: Fluid, silky, modern, groove-centered, expressive. You emphasize the thumb-fretted Hendrix grip, "
            "vocal hammer-on suspensions (sus4, add9, 6th), double-stops, and liquid chord-melody fills.\n"
            "Catchphrase vibe: 'Make your guitar sing like a vocal chord melody—never let the rhythm stop while you solo.'"
        )

    return f"{base_instructions}\n{persona_instructions}"
