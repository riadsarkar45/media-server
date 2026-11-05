/** Mic capture with browser DSP: noise suppression, echo cancel, auto gain. */
export default class AudioProcessor {
  static constraints(noiseCancel = true) {
    return { echoCancellation: true, noiseSuppression: noiseCancel, autoGainControl: true,
             channelCount: 1, sampleRate: 48000 };
  }

  static async getMicTrack(noiseCancel = true) {
    const s = await navigator.mediaDevices.getUserMedia({ audio: this.constraints(noiseCancel) });
    return s.getAudioTracks()[0];
  }

  /** Toggle suppression live without re-negotiating. */
  static async setNoiseCancel(track, on) {
    await track.applyConstraints(this.constraints(on));
  }
}
// Upgrade path: swap in an RNNoise AudioWorklet (e.g. @jitsi/rnnoise-wasm) for ML denoising.
