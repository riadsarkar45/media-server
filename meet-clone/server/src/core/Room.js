import config from '../config.js';

/** A meeting: one mediasoup router plus its peers. */
export default class Room {
  #peers = new Map();
  constructor(id, router) { this.id = id; this.router = router; }

  get rtpCapabilities() { return this.router.rtpCapabilities; }
  get size() { return this.#peers.size; }
  get isEmpty() { return this.#peers.size === 0; }

  addPeer(peer) {
    if (this.size >= config.maxPeersPerRoom) throw new Error('room is full');
    this.#peers.set(peer.id, peer);
  }

  removePeer(id) { this.#peers.get(id)?.close(); this.#peers.delete(id); }

  /** Producers of everyone except `exceptId`, for late joiners. */
  listProducers(exceptId) {
    const out = [];
    for (const peer of this.#peers.values()) {
      if (peer.id === exceptId) continue;
      for (const p of peer.producers.values())
        out.push({ producerId: p.id, peerId: peer.id, peerName: peer.name, kind: p.kind });
    }
    return out;
  }

  async createTransport(peer, direction) {
    const t = await this.router.createWebRtcTransport(config.transport);
    peer.addTransport(t, direction);
    return {
      id: t.id, iceParameters: t.iceParameters,
      iceCandidates: t.iceCandidates, dtlsParameters: t.dtlsParameters,
    };
  }

  /** Consumers start paused; video is resumed only when its tile is visible. */
  async consume(peer, producerId, rtpCapabilities) {
    if (!this.router.canConsume({ producerId, rtpCapabilities })) throw new Error('cannot consume');
    if (!peer.recvTransport) throw new Error('no recv transport');
    const c = await peer.recvTransport.consume({ producerId, rtpCapabilities, paused: true });
    peer.addConsumer(c);
    c.on('producerclose', () => peer.consumers.delete(c.id));
    return { id: c.id, producerId, kind: c.kind, rtpParameters: c.rtpParameters };
  }

  close() { this.#peers.forEach((p) => p.close()); this.router.close(); }
}
