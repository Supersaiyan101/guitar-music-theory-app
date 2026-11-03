/**
 * SSR-Safe WebAudio Sound Engine for Guitar Theory Kingdom
 * Powered by Tone.js with pluck synthesis, acoustic/electric modeling,
 * tonic drone pads, and synchronized playhead sequence tracking.
 */

import { TonePreset } from '@/types/theory';

class SoundEngine {
  private tone: typeof import('tone') | null = null;
  private synth: any = null;
  private polySynth: any = null;
  private droneSynth: any = null;
  private reverb: any = null;
  private isInitialized = false;
  private isMuted = false;
  private currentDroneKey: string | null = null;

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

      // Subtle room reverb for studio realism
      this.reverb = new this.tone.Reverb({
        decay: 1.6,
        preDelay: 0.01,
        wet: 0.14,
      }).toDestination();
      await this.reverb.generate();

      // Guitar Pluck Synthesizer
      this.synth = new this.tone.PluckSynth({
        attackNoise: 1.4,
        dampening: 3800,
        resonance: 0.93,
      }).connect(this.reverb);
      this.synth.volume.value = -3;

      // Polyphonic Strum Synthesizer
      this.polySynth = new this.tone.PolySynth(this.tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: {
          attack: 0.018,
          decay: 1.2,
          sustain: 0.18,
          release: 0.8,
        },
      }).connect(this.reverb);
      this.polySynth.volume.value = -7;

      // Tonic Drone Pad (Low Root + Fifth with Warm Lowpass Filter)
      const droneFilter = new this.tone.Filter({
        frequency: 450,
        type: 'lowpass',
        rolloff: -24,
      }).connect(this.reverb);

      this.droneSynth = new this.tone.PolySynth(this.tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: {
          attack: 1.2,
          decay: 2.0,
          sustain: 0.8,
          release: 2.0,
        },
      }).connect(droneFilter);
      this.droneSynth.volume.value = -16;

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

  public setTonePreset(preset: TonePreset): void {
    if (!this.synth) return;
    if (preset === 'acoustic_steel') {
      this.synth.attackNoise = 2.2;
      this.synth.dampening = 5200;
      this.synth.resonance = 0.96;
    } else {
      // Electric clean
      this.synth.attackNoise = 1.2;
      this.synth.dampening = 3600;
      this.synth.resonance = 0.92;
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.synth) this.synth.volume.mute = muted;
    if (this.polySynth) this.polySynth.volume.mute = muted;
    if (this.droneSynth) this.droneSynth.volume.mute = muted;
  }

  // Play a single guitar pluck
  public async playNote(pitchWithOctave: string): Promise<void> {
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

  // Strum a chord with natural 35ms pick-sweep delay
  public async playChord(pitchesWithOctaves: string[]): Promise<void> {
    if (this.isMuted || pitchesWithOctaves.length === 0) return;
    if (!this.isInitialized) {
      const ok = await this.initialize();
      if (!ok) return;
    }

    try {
      if (!this.tone || !this.polySynth) return;
      const now = this.tone.now();
      const stringDelay = 0.035; // 35ms pick sweep

      pitchesWithOctaves.forEach((pitch, i) => {
        this.polySynth.triggerAttackRelease(pitch, '2n', now + i * stringDelay);
      });
    } catch (err) {
      console.error('Error strumming chord:', pitchesWithOctaves, err);
    }
  }

  // Start continuous tonic drone (Root + 5th in bass register)
  public async startDrone(rootKey: string): Promise<void> {
    if (!this.isInitialized) {
      const ok = await this.initialize();
      if (!ok) return;
    }
    if (!this.droneSynth || !this.tone) return;

    this.stopDrone();
    this.currentDroneKey = rootKey;

    try {
      // Determine bass tonic: e.g. "A1" or "A2"
      const rootPitch = `${rootKey}2`;
      this.droneSynth.triggerAttack([rootPitch]);
    } catch (err) {
      console.error('Error starting drone:', err);
    }
  }

  // Stop continuous tonic drone
  public stopDrone(): void {
    if (this.droneSynth) {
      try {
        this.droneSynth.releaseAll();
      } catch (err) {
        // Safe catch
      }
      this.currentDroneKey = null;
    }
  }

  // Play an animated sequence with synchronized SVG playhead tracking
  public async playSequenceWithTracking(
    items: Array<{ pitch: string; stringNumber: number; fretNumber: number }>,
    bpm = 120,
    onStep?: (pin: { stringNumber: number; fretNumber: number } | null) => void,
    onComplete?: () => void
  ): Promise<void> {
    if (this.isMuted || items.length === 0) return;
    if (!this.isInitialized) {
      const ok = await this.initialize();
      if (!ok) return;
    }

    this.stopSequence();

    if (!this.tone) return;
    this.tone.Transport.bpm.value = bpm;

    const intervalSeconds = 60 / bpm;
    items.forEach((item, index) => {
      this.tone!.Transport.scheduleOnce((time) => {
        if (this.synth) {
          this.synth.triggerAttack(item.pitch, time);
        }
        if (onStep) {
          this.tone!.Draw.schedule(() => {
            onStep({ stringNumber: item.stringNumber, fretNumber: item.fretNumber });
          }, time);
        }
      }, `+${index * intervalSeconds}`);
    });

    // Schedule completion and clear playhead
    const totalDuration = items.length * intervalSeconds;
    this.tone.Transport.scheduleOnce((time) => {
      if (onStep) {
        this.tone!.Draw.schedule(() => onStep(null), time);
      }
      if (onComplete) {
        this.tone!.Draw.schedule(() => onComplete(), time);
      }
    }, `+${totalDuration}`);

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

export const soundEngine = new SoundEngine();
