/**
 * SSR-Safe WebAudio Sound Engine for Guitar Theory Kingdom
 * Powered by Tone.js with pluck synthesis and sequence playback.
 */

class SoundEngine {
  private tone: typeof import('tone') | null = null;
  private synth: any = null;
  private polySynth: any = null;
  private isInitialized = false;
  private isMuted = false;
  private currentPart: any = null;

  public async initialize(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (this.isInitialized && this.tone) {
      if (this.tone.context.state !== 'running') {
        await this.tone.start();
      }
      return true;
    }

    try {
      const ToneModule = await import('tone');
      this.tone = ToneModule;
      await this.tone.start();

      // Pluck synthesizer simulating steel guitar string with warm decay
      this.synth = new this.tone.PluckSynth({
        attackNoise: 1.2,
        dampening: 4200,
        resonance: 0.94,
      }).toDestination();
      this.synth.volume.value = -4;

      // Polyphonic synthesizer for chords and triads
      this.polySynth = new this.tone.PolySynth(this.tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: {
          attack: 0.015,
          decay: 1.2,
          sustain: 0.15,
          release: 0.8,
        },
      }).toDestination();
      this.polySynth.volume.value = -8;

      this.isInitialized = true;
      return true;
    } catch (err) {
      console.warn('WebAudio initialization delayed until user gesture:', err);
      return false;
    }
  }

  public get ready(): boolean {
    return this.isInitialized;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.synth) this.synth.volume.mute = muted;
    if (this.polySynth) this.polySynth.volume.mute = muted;
  }

  // Play a single guitar pluck (e.g. "A2", "C4")
  public async playNote(pitchWithOctave: string, duration = '4n'): Promise<void> {
    if (this.isMuted) return;
    if (!this.isInitialized) {
      const ok = await this.initialize();
      if (!ok) return;
    }

    try {
      if (this.synth) {
        this.synth.triggerAttack(pitchWithOctave);
      }
    } catch (err) {
      console.error('Error playing note:', pitchWithOctave, err);
    }
  }

  // Strum a chord (e.g. ['C3', 'E3', 'G3']) with natural millisecond finger delay
  public async playChord(pitchesWithOctaves: string[]): Promise<void> {
    if (this.isMuted || pitchesWithOctaves.length === 0) return;
    if (!this.isInitialized) {
      const ok = await this.initialize();
      if (!ok) return;
    }

    try {
      if (!this.tone || !this.polySynth) return;
      const now = this.tone.now();
      const stringDelay = 0.035; // 35ms strum delay across strings

      pitchesWithOctaves.forEach((pitch, i) => {
        this.polySynth.triggerAttackRelease(pitch, '2n', now + i * stringDelay);
      });
    } catch (err) {
      console.error('Error strumming chord:', pitchesWithOctaves, err);
    }
  }

  // Play a sequence of notes (e.g. scale run or arpeggio)
  public async playSequence(
    notes: string[],
    bpm = 120,
    onStep?: (index: number) => void,
    onComplete?: () => void
  ): Promise<void> {
    if (this.isMuted || notes.length === 0) return;
    if (!this.isInitialized) {
      const ok = await this.initialize();
      if (!ok) return;
    }

    this.stopSequence();

    if (!this.tone) return;
    this.tone.Transport.bpm.value = bpm;

    const intervalSeconds = 60 / bpm;
    notes.forEach((pitch, index) => {
      this.tone!.Transport.scheduleOnce((time) => {
        if (this.synth) {
          this.synth.triggerAttack(pitch, time);
        }
        if (onStep) {
          ToneModuleScheduleDraw(this.tone!, () => onStep(index));
        }
      }, `+${index * intervalSeconds}`);
    });

    // Schedule completion
    this.tone.Transport.scheduleOnce(() => {
      if (onComplete) onComplete();
    }, `+${notes.length * intervalSeconds}`);

    if (this.tone.Transport.state !== 'started') {
      this.tone.Transport.start();
    }
  }

  public stopSequence(): void {
    if (this.tone) {
      this.tone.Transport.cancel();
      this.tone.Transport.stop();
    }
  }
}

function ToneModuleScheduleDraw(tone: typeof import('tone'), callback: () => void) {
  tone.Draw.schedule(callback, tone.now());
}

export const soundEngine = new SoundEngine();
