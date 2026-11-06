/**
 * Guitar Coach API Client & Real-Time SSE Streamer.
 * Connects frontend to the FastAPI Coach endpoints with Tier-2 Instant Card support
 * and word-by-word streaming advice.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type TeacherPersonaEnum = 'blues_rock' | 'jazz_fusion' | 'neo_soul';

export interface PersonaProfile {
  id: TeacherPersonaEnum;
  name: string;
  avatar: string;
  hero_philosophy: string;
  style_influences: string[];
  favorite_moves: string[];
}

export interface InstantCard {
  vibe: string;
  hero_move: string;
  twin_songs: string[];
  target_degree_motion: string;
}

export interface FretTargetSuggestion {
  string: number;
  fret: number;
  note: string;
  interval: string;
  technique: string;
  description: string;
}

export interface PracticeDrillStep {
  step_number: number;
  action: string;
  fretboard_focus: string;
}

export interface CoachExplainRequest {
  progression: string[];
  active_chord_index: number;
  from_chord?: string;
  to_chord?: string;
  key?: string;
  mode?: string;
  persona?: TeacherPersonaEnum;
  user_question?: string;
  target_fret_zone?: number;
}

export interface CoachExplainResponse {
  instant_card: InstantCard;
  harmonic_summary: string;
  the_musical_why: string;
  fretboard_gps: string;
  target_notes: FretTargetSuggestion[];
  practice_drill: PracticeDrillStep[];
  twin_songs: string[];
  persona_used: PersonaProfile;
  retrieved_concept_id: string;
  retrieval_score: number;
  engine_mode: string;
}

export interface StreamCallbacks {
  onInstantCard?: (data: {
    instant_card: InstantCard;
    target_notes: FretTargetSuggestion[];
    roman_numeral: string;
    harmonic_summary: string;
    retrieved_concept_id: string;
  }) => void;
  onToken?: (token: string) => void;
  onComplete?: (response: CoachExplainResponse) => void;
  onError?: (error: Error) => void;
}

export const coachApi = {
  /**
   * Fetches the 3 teacher personas and their musical profiles.
   */
  async getPersonas(): Promise<PersonaProfile[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/coach/personas`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.personas || [];
    } catch {
      return [];
    }
  },

  /**
   * Fetches the Tier-2 Instant Card (< 0.5ms RAM cache) without calling an LLM.
   */
  async getInstantCard(params: {
    chord?: string;
    roman?: string;
    category?: string;
  }): Promise<InstantCard | null> {
    try {
      const searchParams = new URLSearchParams();
      if (params.chord) searchParams.set('chord', params.chord);
      if (params.roman) searchParams.set('roman', params.roman);
      if (params.category) searchParams.set('category', params.category);

      const res = await fetch(`${API_BASE_URL}/api/coach/instant-card?${searchParams.toString()}`);
      if (!res.ok) return null;
      return (await res.json()) as InstantCard;
    } catch {
      return null;
    }
  },

  /**
   * Fetches standard full structured advice from the Coach.
   */
  async explainTransition(request: CoachExplainRequest): Promise<CoachExplainResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/coach/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!res.ok) return null;
      return (await res.json()) as CoachExplainResponse;
    } catch {
      return null;
    }
  },

  /**
   * Streams real-time word-by-word coaching advice via Server-Sent Events (SSE).
   * Returns a cancel/cleanup function.
   */
  streamExplainTransition(request: CoachExplainRequest, callbacks: StreamCallbacks): () => void {
    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/coach/explain/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Streaming failed with status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const block of lines) {
            if (!block.trim()) continue;
            const eventMatch = block.match(/event: (.*)/);
            const dataMatch = block.match(/data: (.*)/);

            if (eventMatch && dataMatch) {
              const eventType = eventMatch[1].trim();
              const rawData = dataMatch[1].trim();

              try {
                const parsed = JSON.parse(rawData);
                if (eventType === 'instant_card') {
                  callbacks.onInstantCard?.(parsed);
                } else if (eventType === 'token') {
                  callbacks.onToken?.(parsed.token || '');
                } else if (eventType === 'complete') {
                  callbacks.onComplete?.(parsed as CoachExplainResponse);
                }
              } catch {
                // If token is raw string
                if (eventType === 'token') {
                  callbacks.onToken?.(rawData);
                }
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          callbacks.onError?.(err);
        }
      }
    })();

    return () => controller.abort();
  },
};

