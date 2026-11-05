import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import config from './config.js';
import MediaServer from './core/MediaServer.js';
import RoomManager from './core/RoomManager.js';
import SocketGateway from './transport/SocketGateway.js';

async function main() {
  const app = express();
  app.use(cors());
  app.get('/health', (_, res) => res.json({ ok: true }));

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });

  const mediaServer = new MediaServer();
  await mediaServer.init();
  new SocketGateway(io, new RoomManager(mediaServer)).listen();

  server.listen(config.port, () => console.log(`Meet server on :${config.port}`));
}
main().catch((e) => { console.error(e); process.exit(1); });
