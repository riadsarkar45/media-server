# Meet Clone (Node + React JS + Tailwind, no DB)
SFU architecture (mediasoup) so 50+ participants don't each upload N-1 streams.

    cd server && npm i && ANNOUNCED_IP=127.0.0.1 npm start   # :3000
    cd client && npm i && npm run dev                          # :5173

Open http://localhost:5173, join the same room name from several tabs.
For production set ANNOUNCED_IP to the server public IP and open UDP/TCP 40000-49999.

Scaling notes: video consumers start paused and only resume for tiles on the current page
(12/page); audio is always on. Clients publish simulcast. Rooms are in-memory (no DB).
To go past ~100 per room add router.pipeToRouter across workers/hosts.
