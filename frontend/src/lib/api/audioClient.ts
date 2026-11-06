/**
 * Audio Transcription & Ingestion API Client.
 * Connects frontend to the FastAPI basic-pitch audio transcription endpoints.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface GuitarTabPosition {
  string: number;
  fret: number;
  note: string;
  pitch_midi: number;
  articulation: string;
  bend_semitones: number;
  confidence: number;
}

export interface TranscribedNoteEvent {
  start_time: number;
  end_time: number;
  duration: number;
  pitch_midi: number;
  pitch_name: string;
  pitch_class: string;
  amplitude: number;
  articulation: string;
  bend_cents?: number;
  tab_position?: GuitarTabPosition;
}

export interface TranscribedLickResponse {
  detected_bpm?: number;
  detected_key?: string;
  detected_mode?: string;
  primary_caged_box?: string;
  hand_position_zone?: string;
  notes: TranscribedNoteEvent[];
  total_duration: number;
  audio_sample_rate: number;
  inference_device: string;
}

export interface TranscribedChordEvent {
  start_time: number;
  end_time: number;
  duration: number;
  chord_symbol: string;
  root: string;
  quality: string;
  roman_numeral?: string;
  confidence: number;
  notes_detected: string[];
  bass_note?: string;
}

export interface TranscribedProgressionResponse {
  detected_bpm: number;
  detected_key: string;
  detected_mode: string;
  time_signature: string;
  chords_sequence: string[];
  bars: { chord: string; beats: number }[][];
  harmonic_summary: string;
  raw_chords: TranscribedChordEvent[];
  total_duration: number;
  inference_device: string;
}

export const audioApi = {
  /**
   * Checks the status and hardware acceleration of the ONNX basic-pitch engine.
   */
  async getStatus(): Promise<{ status: string; engine: string; device: string } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/audio/status`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Uploads an audio file/recording of a lead guitar lick and receives solved guitar tablature.
   */
  async transcribeLick(
    audioBlobOrFile: Blob | File,
    targetZoneFret: number = 7
  ): Promise<TranscribedLickResponse | null> {
    try {
      const formData = new FormData();
      formData.append('file', audioBlobOrFile, 'guitar_input.wav');
      formData.append('target_zone_fret', targetZoneFret.toString());

      const res = await fetch(`${API_BASE_URL}/api/audio/transcribe-lick`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Transcription failed with status ${res.status}`);
      }
      return (await res.json()) as TranscribedLickResponse;
    } catch (err) {
      console.error('Audio transcribe error:', err);
      return null;
    }
  },

  /**
   * Uploads an audio file/recording of a chord progression and receives structured bars & Roman numerals.
   */
  async transcribeProgression(
    audioBlobOrFile: Blob | File,
    bpm: number = 120.0
  ): Promise<TranscribedProgressionResponse | null> {
    try {
      const formData = new FormData();
      formData.append('file', audioBlobOrFile, 'guitar_chords.wav');
      formData.append('bpm', bpm.toString());

      const res = await fetch(`${API_BASE_URL}/api/audio/transcribe-progression`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Progression transcription failed with status ${res.status}`);
      }
      return (await res.json()) as TranscribedProgressionResponse;
    } catch (err) {
      console.error('Progression transcribe error:', err);
      return null;
    }
  },
};
