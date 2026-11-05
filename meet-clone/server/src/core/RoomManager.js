import Room from './Room.js';

/** Creates rooms lazily and disposes them when empty (in-memory, no DB). */
export default class RoomManager {
  #rooms = new Map();
  constructor(mediaServer) { this.mediaServer = mediaServer; }

  async getOrCreate(id) {
    if (!this.#rooms.has(id)) {
      // store the promise so concurrent joins share one router
      this.#rooms.set(id, this.mediaServer.createRouter().then((r) => new Room(id, r)));
    }
    return this.#rooms.get(id);
  }

  async cleanup(id) {
    const room = await this.#rooms.get(id);
    if (room?.isEmpty) { room.close(); this.#rooms.delete(id); }
  }
}
