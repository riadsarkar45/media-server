import Peer from '../core/Peer.js';

/** Translates socket.io events into Room/Peer calls. No media logic here. */
export default class SocketGateway {
  constructor(io, roomManager) { this.io = io; this.rooms = roomManager; }

  listen() { this.io.on('connection', (socket) => this.#onConnection(socket)); }

  #onConnection(socket) {
    let peer = null, room = null;
    const handle = (event, fn) => socket.on(event, async (data, cb = () => {}) => {
      try { cb(await fn(data ?? {})); }
      catch (e) { cb({ error: e.message }); }
    });

    handle('join', async ({ roomId, name }) => {
      if (!roomId) throw new Error('roomId required');
      room = await this.rooms.getOrCreate(roomId);
      peer = new Peer(socket.id, String(name || 'Guest').slice(0, 40));
      room.addPeer(peer);
      socket.join(roomId);
      return { peerId: peer.id, rtpCapabilities: room.rtpCapabilities, producers: room.listProducers(peer.id) };
    });

    handle('createTransport', ({ direction }) => room.createTransport(peer, direction));
    handle('connectTransport', async ({ transportId, dtlsParameters }) => {
      await peer.getTransport(transportId).connect({ dtlsParameters });
      return {};
    });

    handle('produce', async ({ transportId, kind, rtpParameters }) => {
      const producer = await peer.getTransport(transportId).produce({ kind, rtpParameters });
      peer.addProducer(producer);
      socket.to(room.id).emit('newProducer',
        { producerId: producer.id, peerId: peer.id, peerName: peer.name, kind });
      return { id: producer.id };
    });

    handle('consume', ({ producerId, rtpCapabilities }) => room.consume(peer, producerId, rtpCapabilities));
    handle('resumeConsumer', async ({ consumerId }) => { await peer.getConsumer(consumerId).resume(); return {}; });
    handle('pauseConsumer', async ({ consumerId }) => { await peer.getConsumer(consumerId).pause(); return {}; });

    socket.on('disconnect', async () => {
      if (!room || !peer) return;
      room.removePeer(peer.id);
      socket.to(room.id).emit('peerLeft', { peerId: peer.id });
      await this.rooms.cleanup(room.id);
    });
  }
}
