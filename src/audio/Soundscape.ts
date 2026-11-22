/**
 * Procedural Web Audio Heavenly Soundscape
 * Synthesizes warm, timeless, non-tempo Lydian harmonic pads, soft crystal water shimmer,
 * healing leaf chimes, and guided vision swells — zero external MP3 dependencies.
 */
export class HeavenlySoundscape {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private padGain: GainNode | null = null;
  private padOscillators: OscillatorNode[] = [];
  private muted = false;
  private initialized = false;

  public init(): void {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.28;
    this.masterGain.connect(this.ctx.destination);

    // Warm low-pass filter for heavenly pad shimmer
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 920;
    filter.Q.value = 0.7;
    filter.connect(this.masterGain);

    this.padGain = this.ctx.createGain();
    this.padGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.padGain.gain.exponentialRampToValueAtTime(0.32, this.ctx.currentTime + 3.5);
    this.padGain.connect(filter);

    // D Lydian ethereal chord: D3, A3, E4, F#4, G#4 (soft shimmer), A4
    const freqs = [146.83, 220.0, 293.66, 369.99, 440.0, 554.37];
    freqs.forEach((freq, i) => {
      if (!this.ctx || !this.padGain) return;
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = (i - 2.5) * 3.5;

      // Gentle slow breathing LFO on each voice
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 0.08 + i * 0.023;
      lfoGain.gain.value = 0.035;
      lfo.connect(lfoGain);
      lfoGain.connect(oscGain.gain);

      oscGain.gain.value = i < 2 ? 0.14 : 0.07;
      osc.connect(oscGain);
      oscGain.connect(this.padGain);

      osc.start();
      lfo.start();
      this.padOscillators.push(osc);
    });

    this.initialized = true;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.28, this.ctx.currentTime, 0.2);
    }
    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public playChime(type: 'interact' | 'leaves' | 'vision-start' | 'vision-swell' | 'stillness'): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;

    const noteSets: Record<typeof type, number[]> = {
      interact: [440, 554.37, 659.25],
      leaves: [293.66, 369.99, 440, 587.33, 739.99],
      'vision-start': [146.83, 220, 293.66, 440],
      'vision-swell': [293.66, 440, 587.33, 739.99, 880],
      stillness: [329.63, 440]
    };

    const notes = noteSets[type];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type === 'vision-swell' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.11);

      const dur = type === 'vision-swell' ? 4.2 : 2.6;
      const peak = type === 'vision-swell' ? 0.16 : 0.11;
      gain.gain.setValueAtTime(0.0001, now + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(peak, now + idx * 0.11 + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.11 + dur);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.11);
      osc.stop(now + idx * 0.11 + dur + 0.1);
    });
  }
}
