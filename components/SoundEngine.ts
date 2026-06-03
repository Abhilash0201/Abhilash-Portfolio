// Web Audio API Synthesizer for a cinematic space drone
export class SoundEngine {
  private static ctx: AudioContext | null = null;
  private static mainGain: GainNode | null = null;
  private static oscillators: OscillatorNode[] = [];
  private static filter: BiquadFilterNode | null = null;
  private static lfo: OscillatorNode | null = null;
  private static lfoGain: GainNode | null = null;
  private static isPlaying: boolean = false;

  static init() {
    if (this.ctx) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Main filter to make it sound warm and deep
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 160;
      this.filter.Q.value = 4.0;

      // Main gain
      this.mainGain = this.ctx.createGain();
      this.mainGain.gain.value = 0.0; // Start silent

      // Connections
      this.filter.connect(this.mainGain);
      this.mainGain.connect(this.ctx.destination);

      // Low frequency drone notes (A1 = 55Hz, E2 = 82.4Hz, A2 = 110Hz, C#3 = 138.6Hz)
      const baseFreqs = [55, 82.4, 110, 138.6];
      baseFreqs.forEach((freq, index) => {
        if (!this.ctx || !this.filter) return;
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        osc.type = index % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.value = freq;

        // Slight detune for chorus/warmth effect
        osc.detune.value = (Math.random() - 0.5) * 15;

        // Set volume per oscillator to prevent clipping
        oscGain.gain.value = 0.15;

        osc.connect(oscGain);
        oscGain.connect(this.filter);
        osc.start();
        this.oscillators.push(osc);
      });

      // LFO to modulate filter cutoff for a breathing effect
      this.lfo = this.ctx.createOscillator();
      this.lfo.frequency.value = 0.08; // Very slow (0.08 Hz)
      
      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.value = 60; // Modulate cutoff by +/- 60Hz

      this.lfo.connect(this.lfoGain);
      if (this.filter) {
        this.lfoGain.connect(this.filter.frequency);
      }
      this.lfo.start();

    } catch (e) {
      console.warn('Failed to initialize SoundEngine:', e);
    }
  }

  static async setMuted(muted: boolean) {
    this.init();
    if (!this.ctx || !this.mainGain) return;

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    const targetGain = muted ? 0.0 : 0.6;
    const now = this.ctx.currentTime;
    this.mainGain.gain.cancelScheduledValues(now);
    // Smooth cinematic fade-in/fade-out
    this.mainGain.gain.setValueAtTime(this.mainGain.gain.value, now);
    this.mainGain.gain.linearRampToValueAtTime(targetGain, now + 1.8);
    this.isPlaying = !muted;
  }

  static setAtmosphereIntense(intense: boolean) {
    if (!this.ctx || !this.filter || !this.lfo || !this.lfoGain) return;
    
    const now = this.ctx.currentTime;
    this.filter.frequency.cancelScheduledValues(now);
    this.lfo.frequency.cancelScheduledValues(now);
    this.lfoGain.gain.cancelScheduledValues(now);

    if (intense) {
      // Intensified state: higher cutoff, faster pulsing, wider modulation range
      this.filter.frequency.linearRampToValueAtTime(240, now + 2.0);
      this.lfo.frequency.linearRampToValueAtTime(0.22, now + 2.0);
      this.lfoGain.gain.linearRampToValueAtTime(100, now + 2.0);
    } else {
      // Relaxed state
      this.filter.frequency.linearRampToValueAtTime(160, now + 2.0);
      this.lfo.frequency.linearRampToValueAtTime(0.08, now + 2.0);
      this.lfoGain.gain.linearRampToValueAtTime(60, now + 2.0);
    }
  }
}
