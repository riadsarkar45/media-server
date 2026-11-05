import os from 'node:os';
import * as mediasoup from 'mediasoup';
import config from '../config.js';

/** Owns the mediasoup worker pool and hands out workers round-robin. */
export default class MediaServer {
  #workers = [];
  #next = 0;

  async init(count = os.cpus().length) {
    for (let i = 0; i < count; i++) {
      const worker = await mediasoup.createWorker(config.worker);
      worker.on('died', () => { console.error('worker died, exiting'); process.exit(1); });
      this.#workers.push(worker);
    }
  }

  createRouter() {
    const worker = this.#workers[this.#next++ % this.#workers.length];
    return worker.createRouter({ mediaCodecs: config.mediaCodecs });
  }
}
