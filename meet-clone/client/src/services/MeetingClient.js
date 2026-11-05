import { io } from 'socket.io-client';
import { Device } from 'mediasoup-client';

/** Wraps signalling + mediasoup-client. UI talks to this through callbacks. */
export default class MeetingClient {
  #socket; #device = new Device(); #send; #recv;
  #consumers = new Map(); // peerId -> { video?: Consumer, audio?: Consumer }
  #producers = {};

  constructor({ onTrack, onPeerLeft }) { this.onTrack = onTrack; this.onPeerLeft = onPeerLeft; }

  #req(event, data = {}) {
    return new Promise((resolve, reject) =>
      this.#socket.emit(event, data, (res) => (res?.error ? reject(new Error(res.error)) : resolve(res))));
  }

  async join(roomId, name) {
    this.#socket = io();
    await new Promise((r) => this.#socket.on('connect', r));
    this.#socket.on('newProducer', (p) => this.#consume(p));
    this.#socket.on('peerLeft', ({ peerId }) => { this.#consumers.delete(peerId); this.onPeerLeft(peerId); });

    const { rtpCapabilities, producers, peerId } = await this.#req('join', { roomId, name });
    await this.#device.load({ routerRtpCapabilities: rtpCapabilities });
    this.#send = await this.#makeTransport('send');
    this.#recv = await this.#makeTransport('recv');
    for (const p of producers) await this.#consume(p);
    return peerId;
  }

  async #makeTransport(direction) {
    const params = await this.#req('createTransport', { direction });
    const t = direction === 'send'
      ? this.#device.createSendTransport(params) : this.#device.createRecvTransport(params);
    t.on('connect', ({ dtlsParameters }, ok, fail) =>
      this.#req('connectTransport', { transportId: t.id, dtlsParameters }).then(ok, fail));
    if (direction === 'send') {
      t.on('produce', ({ kind, rtpParameters }, ok, fail) =>
        this.#req('produce', { transportId: t.id, kind, rtpParameters }).then(({ id }) => ok({ id }), fail));
    }
    return t;
  }

  async publish(track) {
    const opts = track.kind === 'video'
      ? { encodings: [{ maxBitrate: 100000, scaleResolutionDownBy: 4 }, { maxBitrate: 400000, scaleResolutionDownBy: 2 },
                      { maxBitrate: 1000000 }] }
      : { codecOptions: { opusDtx: true, opusFec: true } };
    this.#producers[track.kind] = await this.#send.produce({ track, ...opts });
  }

  async #consume({ producerId, peerId, peerName, kind }) {
    const data = await this.#req('consume', { producerId, rtpCapabilities: this.#device.rtpCapabilities });
    const consumer = await this.#recv.consume(data);
    const entry = this.#consumers.get(peerId) ?? {};
    entry[kind] = consumer; this.#consumers.set(peerId, entry);
    if (kind === 'audio') await this.#req('resumeConsumer', { consumerId: consumer.id });
    this.onTrack(peerId, peerName, consumer.track);
  }

  /** Resume video only for visible peers; pause the rest to save bandwidth/CPU. */
  async setVisiblePeers(ids) {
    const visible = new Set(ids);
    for (const [peerId, { video }] of this.#consumers) {
      if (!video) continue;
      const shouldPlay = visible.has(peerId);
      if (shouldPlay && video.paused) { await this.#req('resumeConsumer', { consumerId: video.id }); video.resume(); }
      if (!shouldPlay && !video.paused) { await this.#req('pauseConsumer', { consumerId: video.id }); video.pause(); }
    }
  }

  leave() {
    Object.values(this.#producers).forEach((p) => p.close());
    this.#send?.close(); this.#recv?.close(); this.#socket?.disconnect();
  }
}
