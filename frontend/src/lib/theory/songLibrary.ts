/**
 * Curated Master Song Encyclopedia for Guitar Theory Kingdom (Frontend Library).
 * Strictly mirrors the backend data in backend/app/data/progressions.py.
 */
import { SongProgression } from '@/types/theory';

export const CURATED_SONGS: SongProgression[] = [
  // --- 1. Classic Rock & Guitar Anthems ---
  {
    id: 'little_wing',
    title: 'Little Wing',
    artist: 'Jimi Hendrix',
    genre: 'classic_rock',
    difficulty: 'advanced',
    default_tempo: 72,
    time_signature: '4/4',
    key: 'G',
    mode: 'major',
    bars: [
      [{ chord: 'Em', beats: 4 }],
      [{ chord: 'G', beats: 4 }],
      [{ chord: 'Am', beats: 4 }],
      [{ chord: 'Em', beats: 4 }],
      [{ chord: 'Bm', beats: 4 }],
      [{ chord: 'Am', beats: 2 }, { chord: 'C', beats: 2 }],
      [{ chord: 'G', beats: 2 }, { chord: 'F', beats: 2 }],
      [{ chord: 'C', beats: 4 }],
      [{ chord: 'D', beats: 4 }],
      [{ chord: 'D', beats: 4 }],
    ],
    chords_sequence: ['Em', 'G', 'Am', 'Em', 'Bm', 'Am', 'C', 'G', 'F', 'C', 'D', 'D'],
    chord_durations: [4, 4, 4, 4, 4, 2, 2, 2, 2, 4, 4, 4],
    soloing_tip:
      'Anchor your thumb over the neck in CAGED shapes and use sus4/add9 hammer-ons. Target the F natural note in Bar 7 (borrowed bVII relative to G) for that signature floating Hendrix ballad sound!',
    iconic_tone:
      'Fender Stratocaster neck pickup through a clean tube amp with subtle Uni-Vibe rotary modulation and warm germanium fuzz.',
  },
  {
    id: 'comfortably_numb_outro',
    title: 'Comfortably Numb (Outro Solo)',
    artist: 'Pink Floyd / David Gilmour',
    genre: 'classic_rock',
    difficulty: 'intermediate',
    default_tempo: 65,
    time_signature: '4/4',
    key: 'B',
    mode: 'minor',
    bars: [
      [{ chord: 'Bm', beats: 4 }],
      [{ chord: 'A', beats: 4 }],
      [{ chord: 'G', beats: 4 }],
      [{ chord: 'Em', beats: 4 }],
    ],
    chords_sequence: ['Bm', 'A', 'G', 'Em'],
    chord_durations: [4, 4, 4, 4],
    soloing_tip:
      'Hit the F# (5th of Bm) right on the downbeat with singing sustain. Over the G chord, bend the A (9th) up to B (3rd) with slow, expressive Gilmour vibrato.',
    iconic_tone:
      'Black Strat bridge pickup with Electro-Harmonix Big Muff fuzz, subtle digital delay (440ms), and electric chorus.',
  },
  {
    id: 'hotel_california',
    title: 'Hotel California',
    artist: 'Eagles / Don Felder & Joe Walsh',
    genre: 'classic_rock',
    difficulty: 'advanced',
    default_tempo: 75,
    time_signature: '4/4',
    key: 'B',
    mode: 'minor',
    bars: [
      [{ chord: 'Bm', beats: 4 }],
      [{ chord: 'F#7', beats: 4 }],
      [{ chord: 'A', beats: 4 }],
      [{ chord: 'E7', beats: 4 }],
      [{ chord: 'G', beats: 4 }],
      [{ chord: 'D', beats: 4 }],
      [{ chord: 'Em', beats: 4 }],
      [{ chord: 'F#7', beats: 4 }],
    ],
    chords_sequence: ['Bm', 'F#7', 'A', 'E7', 'G', 'D', 'Em', 'F#7'],
    chord_durations: [4, 4, 4, 4, 4, 4, 4, 4],
    soloing_tip:
      'When the F#7 chord hits, switch immediately from B Minor Pentatonic to B Harmonic Minor (or F# Phrygian Dominant) to target the crucial A# leading tone!',
    iconic_tone:
      'Gibson Les Paul neck pickup into a Fender Tweed Deluxe with smooth overdrive.',
  },
  {
    id: 'hey_joe',
    title: 'Hey Joe',
    artist: 'Jimi Hendrix',
    genre: 'classic_rock',
    difficulty: 'intermediate',
    default_tempo: 84,
    time_signature: '4/4',
    key: 'E',
    mode: 'major',
    bars: [
      [{ chord: 'C', beats: 4 }],
      [{ chord: 'G', beats: 4 }],
      [{ chord: 'D', beats: 4 }],
      [{ chord: 'A', beats: 4 }],
      [{ chord: 'E', beats: 4 }],
    ],
    chords_sequence: ['C', 'G', 'D', 'A', 'E'],
    chord_durations: [4, 4, 4, 4, 4],
    soloing_tip:
      'The famous Circle of Fourths reverse cascade (C-G-D-A-E). E Minor Blues works across the entire loop, but target the Major 3rd of each chord as it arrives to outline the changes.',
    iconic_tone:
      'Stratocaster middle/bridge pickup through a Marshall Plexi with Dallas Arbiter Fuzz Face.',
  },

  // --- 2. Blues & Funk ---
  {
    id: 'blues_12_bar_a',
    title: '12-Bar Blues in A (Quick Change)',
    artist: 'Blues Standard',
    genre: 'blues_funk',
    difficulty: 'intermediate',
    default_tempo: 116,
    time_signature: '4/4',
    key: 'A',
    mode: 'major',
    bars: [
      [{ chord: 'A7', beats: 4 }],
      [{ chord: 'D7', beats: 4 }],
      [{ chord: 'A7', beats: 4 }],
      [{ chord: 'A7', beats: 4 }],
      [{ chord: 'D7', beats: 4 }],
      [{ chord: 'D7', beats: 4 }],
      [{ chord: 'A7', beats: 4 }],
      [{ chord: 'A7', beats: 4 }],
      [{ chord: 'E7', beats: 4 }],
      [{ chord: 'D7', beats: 4 }],
      [{ chord: 'A7', beats: 4 }],
      [{ chord: 'E7', beats: 4 }],
    ],
    chords_sequence: ['A7', 'D7', 'A7', 'A7', 'D7', 'D7', 'A7', 'A7', 'E7', 'D7', 'A7', 'E7'],
    chord_durations: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    soloing_tip:
      'Slip between A Minor Pentatonic and A Major Pentatonic! On the A7 chord, slide the minor 3rd (C) up a half-step to the sweet Major 3rd (C#) on String 3 Fret 6.',
    iconic_tone:
      'Gibson ES-335 or Fender Telecaster on edge-of-breakup tube amp with light spring reverb.',
  },
  {
    id: 'thrill_is_gone',
    title: 'The Thrill is Gone',
    artist: 'B.B. King',
    genre: 'blues_funk',
    difficulty: 'intermediate',
    default_tempo: 90,
    time_signature: '4/4',
    key: 'B',
    mode: 'minor',
    bars: [
      [{ chord: 'Bm', beats: 4 }],
      [{ chord: 'Bm', beats: 4 }],
      [{ chord: 'Bm', beats: 4 }],
      [{ chord: 'Bm', beats: 4 }],
      [{ chord: 'Em', beats: 4 }],
      [{ chord: 'Em', beats: 4 }],
      [{ chord: 'Bm', beats: 4 }],
      [{ chord: 'Bm', beats: 4 }],
      [{ chord: 'Gmaj7', beats: 4 }],
      [{ chord: 'F#7', beats: 4 }],
      [{ chord: 'Bm', beats: 4 }],
      [{ chord: 'Bm', beats: 4 }],
    ],
    chords_sequence: ['Bm', 'Bm', 'Bm', 'Bm', 'Em', 'Em', 'Bm', 'Bm', 'Gmaj7', 'F#7', 'Bm', 'Bm'],
    chord_durations: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    soloing_tip:
      'Anchor in the B.B. King Box at Fret 12 on String 2. Over Gmaj7, target the high D note, and over F#7, hit the C# or bend the E to F# with butterfly vibrato.',
    iconic_tone:
      'Gibson Lucille semi-hollow body on Varitone position 2 through a Fender Twin Reverb.',
  },
  {
    id: 'oye_como_va',
    title: 'Oye Como Va',
    artist: 'Santana',
    genre: 'blues_funk',
    difficulty: 'intermediate',
    default_tempo: 128,
    time_signature: '4/4',
    key: 'A',
    mode: 'minor',
    bars: [
      [{ chord: 'Am7', beats: 4 }],
      [{ chord: 'D9', beats: 4 }],
    ],
    chords_sequence: ['Am7', 'D9'],
    chord_durations: [4, 4],
    soloing_tip:
      'The ultimate 2-chord Dorian modal masterclass. Play A Dorian throughout, and target the F# note (the Sweet Major 6th) every time the D9 chord hits!',
    iconic_tone:
      'PRS Custom 24 or Yamaha SG2000 neck pickup into a cranked Mesa/Boogie Mark I with infinite singing sustain.',
  },
  {
    id: 'funk_vamp_e7sharp9',
    title: 'Funk Groove in E7#9',
    artist: 'James Brown / Hendrix',
    genre: 'blues_funk',
    difficulty: 'advanced',
    default_tempo: 105,
    time_signature: '4/4',
    key: 'E',
    mode: 'major',
    bars: [
      [{ chord: 'E7#9', beats: 4 }],
      [{ chord: 'E7#9', beats: 4 }],
      [{ chord: 'A13', beats: 4 }],
      [{ chord: 'B7#9', beats: 4 }],
    ],
    chords_sequence: ['E7#9', 'E7#9', 'A13', 'B7#9'],
    chord_durations: [4, 4, 4, 4],
    soloing_tip:
      'Lock into tight 16th-note scratch rhythm comping. Target the G natural note (the sharp-9 tension) on the E chord, and outline the F# note (13th) on A13.',
    iconic_tone:
      'Fender Stratocaster in position 4 (neck + middle) through an optical compressor and envelope filter wah.',
  },

  // --- 3. Jazz & Neo-Soul ---
  {
    id: 'autumn_leaves',
    title: 'Autumn Leaves',
    artist: 'Jazz Standard',
    genre: 'jazz_neosoul',
    difficulty: 'advanced',
    default_tempo: 120,
    time_signature: '4/4',
    key: 'G',
    mode: 'minor',
    bars: [
      [{ chord: 'Cm7', beats: 4 }],
      [{ chord: 'F7', beats: 4 }],
      [{ chord: 'Bbmaj7', beats: 4 }],
      [{ chord: 'Ebmaj7', beats: 4 }],
      [{ chord: 'Am7b5', beats: 4 }],
      [{ chord: 'D7', beats: 4 }],
      [{ chord: 'Gm', beats: 4 }],
      [{ chord: 'Gm', beats: 4 }],
    ],
    chords_sequence: ['Cm7', 'F7', 'Bbmaj7', 'Ebmaj7', 'Am7b5', 'D7', 'Gm', 'Gm'],
    chord_durations: [4, 4, 4, 4, 4, 4, 4, 4],
    soloing_tip:
      'The master study in guide-tone voice leading: Bars 1-4 form a Major ii-V-I-IV in Bb, and Bars 5-8 form a Minor ii-V-i in G Minor. Connect the 7ths to the 3rds by half-steps across every change!',
    iconic_tone:
      'Gibson L-5 archtop hollow-body with flatwound strings and tone knob rolled back to 4.',
  },
  {
    id: 'just_the_two_of_us',
    title: 'Just the Two of Us',
    artist: 'Grover Washington Jr. / Bill Withers',
    genre: 'jazz_neosoul',
    difficulty: 'advanced',
    default_tempo: 96,
    time_signature: '4/4',
    key: 'F',
    mode: 'minor',
    bars: [
      [{ chord: 'Dbmaj7', beats: 4 }],
      [{ chord: 'C7', beats: 4 }],
      [{ chord: 'Fm7', beats: 4 }],
      [{ chord: 'Ebm7', beats: 2 }, { chord: 'Ab7', beats: 2 }],
    ],
    chords_sequence: ['Dbmaj7', 'C7', 'Fm7', 'Ebm7', 'Ab7'],
    chord_durations: [4, 4, 4, 2, 2],
    soloing_tip:
      'Neo-soul gold! Over C7 (secondary dominant V7/vi), target the E natural note pulling into F on the Fm7. Over Ebm7-Ab7, run quick 2-beat arpeggios resolving back into Db.',
    iconic_tone:
      "D'Angelico semi-hollow or Telecaster middle position through a Fender Rhodes-style clean tone with analog tape delay.",
  },
  {
    id: 'jazz_turnaround_c',
    title: 'Classic Jazz Turnaround',
    artist: 'Jazz Standard (I-vi-ii-V)',
    genre: 'jazz_neosoul',
    difficulty: 'intermediate',
    default_tempo: 130,
    time_signature: '4/4',
    key: 'C',
    mode: 'major',
    bars: [
      [{ chord: 'Cmaj7', beats: 4 }],
      [{ chord: 'Am7', beats: 4 }],
      [{ chord: 'Dm7', beats: 4 }],
      [{ chord: 'G7', beats: 4 }],
    ],
    chords_sequence: ['Cmaj7', 'Am7', 'Dm7', 'G7'],
    chord_durations: [4, 4, 4, 4],
    soloing_tip:
      'Use shell voicings on strings 4, 3, and 2. On G7, introduce the G Altered scale (Super Locrian) to create tension that pulls seamlessly back into the Cmaj7 root.',
    iconic_tone: 'Warm jazz archtop with subtle chorus and room reverb.',
  },
  {
    id: 'giant_steps_intro',
    title: 'Giant Steps (Intro Cycle)',
    artist: 'John Coltrane',
    genre: 'jazz_neosoul',
    difficulty: 'advanced',
    default_tempo: 200,
    time_signature: '4/4',
    key: 'B',
    mode: 'major',
    bars: [
      [{ chord: 'Bmaj7', beats: 2 }, { chord: 'D7', beats: 2 }],
      [{ chord: 'Gmaj7', beats: 2 }, { chord: 'Bb7', beats: 2 }],
      [{ chord: 'Ebmaj7', beats: 4 }],
      [{ chord: 'Am7', beats: 2 }, { chord: 'D7', beats: 2 }],
    ],
    chords_sequence: ['Bmaj7', 'D7', 'Gmaj7', 'Bb7', 'Ebmaj7', 'Am7', 'D7'],
    chord_durations: [2, 2, 2, 2, 4, 2, 2],
    soloing_tip:
      'The famous Coltrane Matrix: moves rapidly between three key centers a Major 3rd apart (B -> G -> Eb). Do not try to play one scale—outline the 1-3-5-7 arpeggio of each chord cleanly!',
    iconic_tone: 'Pristine clean jazz solid-state amp (Roland JC-120) with fast attack.',
  },

  // --- 4. Pop & Modern Progressions ---
  {
    id: 'creep',
    title: 'Creep',
    artist: 'Radiohead',
    genre: 'pop_modern',
    difficulty: 'beginner',
    default_tempo: 92,
    time_signature: '4/4',
    key: 'G',
    mode: 'major',
    bars: [
      [{ chord: 'G', beats: 4 }],
      [{ chord: 'G', beats: 4 }],
      [{ chord: 'B', beats: 4 }],
      [{ chord: 'B', beats: 4 }],
      [{ chord: 'C', beats: 4 }],
      [{ chord: 'C', beats: 4 }],
      [{ chord: 'Cm', beats: 4 }],
      [{ chord: 'Cm', beats: 4 }],
    ],
    chords_sequence: ['G', 'G', 'B', 'B', 'C', 'C', 'Cm', 'Cm'],
    chord_durations: [4, 4, 4, 4, 4, 4, 4, 4],
    soloing_tip:
      'The quintessential lesson in borrowed chords: Over the B major, target the D# note. When the C major changes to Cm, drop your finger one fret from E to Eb (the minor 4th) for that legendary heartbreaking moment!',
    iconic_tone:
      'Telecaster Plus with Lace Sensor pickups into a Fender Twin, then kicking on a Marshall ShredMaster distortion on the chorus.',
  },
  {
    id: 'four_chord_anthem',
    title: '4-Chord Pop Anthem (I-V-vi-IV)',
    artist: 'Axis of Awesome / Pop Standard',
    genre: 'pop_modern',
    difficulty: 'beginner',
    default_tempo: 120,
    time_signature: '4/4',
    key: 'C',
    mode: 'major',
    bars: [
      [{ chord: 'C', beats: 4 }],
      [{ chord: 'G', beats: 4 }],
      [{ chord: 'Am', beats: 4 }],
      [{ chord: 'F', beats: 4 }],
    ],
    chords_sequence: ['C', 'G', 'Am', 'F'],
    chord_durations: [4, 4, 4, 4],
    soloing_tip:
      "The foundation of hundreds of global hit songs (Don't Stop Believin', With or Without You). C Major Pentatonic works over everything, but target the 3rds: E on C, B on G, C on Am, A on F.",
    iconic_tone: 'Acoustic steel-string dreadnought layered with clean electric chime.',
  },
  {
    id: 'andalusian_cadence',
    title: 'Andalusian Cadence (i-bVII-bVI-V)',
    artist: 'Flamenco / Spanish Traditional',
    genre: 'pop_modern',
    difficulty: 'intermediate',
    default_tempo: 110,
    time_signature: '4/4',
    key: 'A',
    mode: 'minor',
    bars: [
      [{ chord: 'Am', beats: 4 }],
      [{ chord: 'G', beats: 4 }],
      [{ chord: 'F', beats: 4 }],
      [{ chord: 'E7', beats: 4 }],
    ],
    chords_sequence: ['Am', 'G', 'F', 'E7'],
    chord_durations: [4, 4, 4, 4],
    soloing_tip:
      'The descending four-chord Spanish progression. Play A Natural Minor over Am, G, and F, then unleash the E Phrygian Dominant scale (featuring G#) over the E7 chord!',
    iconic_tone:
      'Nylon-string Spanish classical guitar or Stratocaster neck pickup with slapback delay.',
  },
  {
    id: 'doo_wop_50s',
    title: '50s Doo-Wop Cadence (I-vi-IV-V)',
    artist: '50s Ballad Standard',
    genre: 'pop_modern',
    difficulty: 'beginner',
    default_tempo: 85,
    time_signature: '4/4',
    key: 'C',
    mode: 'major',
    bars: [
      [{ chord: 'C', beats: 4 }],
      [{ chord: 'Am', beats: 4 }],
      [{ chord: 'F', beats: 4 }],
      [{ chord: 'G7', beats: 4 }],
    ],
    chords_sequence: ['C', 'Am', 'F', 'G7'],
    chord_durations: [4, 4, 4, 4],
    soloing_tip:
      'Classic slow-dance progression. Practice moving between C Major triad inversions across strings 1, 2, and 3 without jumping your hand across the neck.',
    iconic_tone: 'Gretsch hollow-body with Bigsby vibrato into an analog tape echo.',
  },
];

export function getCuratedSong(songId: string): SongProgression | undefined {
  return CURATED_SONGS.find((s) => s.id === songId);
}

export function listCuratedSongs(genre?: string): SongProgression[] {
  if (!genre) return CURATED_SONGS;
  return CURATED_SONGS.filter((s) => s.genre === genre);
}

