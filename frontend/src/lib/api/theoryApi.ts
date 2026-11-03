/**
 * API client to connect frontend to the FastAPI Python backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchFromBackend<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    if (!res.ok) {
      console.warn(`Backend responded with status ${res.status} for ${endpoint}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    // If backend isn't running, frontend operates seamlessly in zero-latency offline client mode
    return null;
  }
}

export const theoryApi = {
  getScale: (root: string, scaleType: string) =>
    fetchFromBackend(`/api/theory/scale?root=${encodeURIComponent(root)}&type=${encodeURIComponent(scaleType)}`),

  getChord: (root: string, chordType: string) =>
    fetchFromBackend(`/api/theory/chord?root=${encodeURIComponent(root)}&type=${encodeURIComponent(chordType)}`),

  getCagedAnchors: (root: string, shape: string) =>
    fetchFromBackend(`/api/theory/caged?root=${encodeURIComponent(root)}&shape=${encodeURIComponent(shape)}`),

  getDiagonalHighway: (root: string) =>
    fetchFromBackend(`/api/theory/highway?root=${encodeURIComponent(root)}`),

  getBbKingBox: (root: string) =>
    fetchFromBackend(`/api/theory/bb-box?root=${encodeURIComponent(root)}`),

  getThreeNps: (root: string, shapeIndex: number) =>
    fetchFromBackend(`/api/theory/3nps?root=${encodeURIComponent(root)}&shape=${shapeIndex}`),
};
