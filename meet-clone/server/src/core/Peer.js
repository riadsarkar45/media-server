/** One participant: owns its transports, producers and consumers. */
export default class Peer {
  transports = new Map();
  producers = new Map();
  consumers = new Map();
  sendTransport = null;
  recvTransport = null;

  constructor(id, name) { this.id = id; this.name = name; }

  addTransport(transport, direction) {
    this.transports.set(transport.id, transport);
    if (direction === 'send') this.sendTransport = transport;
    else this.recvTransport = transport;
  }

  getTransport(id) {
    const t = this.transports.get(id);
    if (!t) throw new Error('transport not found');
    return t;
  }

  addProducer(p) { this.producers.set(p.id, p); p.on('transportclose', () => this.producers.delete(p.id)); }
  addConsumer(c) { this.consumers.set(c.id, c); c.on('transportclose', () => this.consumers.delete(c.id)); }

  getConsumer(id) {
    const c = this.consumers.get(id);
    if (!c) throw new Error('consumer not found');
    return c;
  }

  close() { this.transports.forEach((t) => t.close()); }
}
