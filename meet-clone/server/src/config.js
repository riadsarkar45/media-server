const announcedAddress = process.env.ANNOUNCED_IP || '127.0.0.1';
export default Object.freeze({
  port: Number(process.env.PORT) || 3000,
  maxPeersPerRoom: 100,
  worker: { rtcMinPort: 40000, rtcMaxPort: 49999, logLevel: 'warn' },
  mediaCodecs: [
    { kind: 'audio', mimeType: 'audio/opus', clockRate: 48000, channels: 2,
      parameters: { useinbandfec: 1, usedtx: 1 } },
    { kind: 'video', mimeType: 'video/VP8', clockRate: 90000 },
  ],
  transport: {
    listenInfos: [
      { protocol: 'udp', ip: '0.0.0.0', announcedAddress },
      { protocol: 'tcp', ip: '0.0.0.0', announcedAddress },
    ],
    initialAvailableOutgoingBitrate: 800000,
    enableUdp: true, enableTcp: true, preferUdp: true,
  },
});
