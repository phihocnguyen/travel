export class AmbientBed {
  private ctx: AudioContext | null = null;
  private nodes: AudioNode[] = [];

  start() {
    if (this.ctx) return;
    const ctx = new AudioContext();
    this.ctx = ctx;

    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;

    const gain = ctx.createGain();
    gain.gain.value = 0.04;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 72;
    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.012;

    noise.connect(filter).connect(gain).connect(ctx.destination);
    osc.connect(oscGain).connect(ctx.destination);
    noise.start();
    osc.start();
    this.nodes = [noise, osc, filter, gain, oscGain];
  }

  stop() {
    this.nodes.forEach((n) => {
      if ("stop" in n && typeof n.stop === "function") {
        try {
          n.stop();
        } catch {
          /* already stopped */
        }
      }
    });
    void this.ctx?.close();
    this.ctx = null;
    this.nodes = [];
  }
}
