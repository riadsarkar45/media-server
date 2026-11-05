import { useCallback, useEffect, useRef, useState } from 'react';
import MeetingClient from '../services/MeetingClient.js';
import AudioProcessor from '../services/AudioProcessor.js';

export default function useMeeting() {
  const client = useRef(null);
  const tracks = useRef({});
  const [peers, setPeers] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [status, setStatus] = useState({ mic: true, cam: true, noise: true });
  const [error, setError] = useState('');

  const join = useCallback(async (roomId, name) => {
    try {
      const c = new MeetingClient({
        onTrack: (id, peerName, track) => setPeers((p) => {
          const cur = p[id] ?? { id, name: peerName, stream: new MediaStream() };
          cur.stream.addTrack(track);
          return { ...p, [id]: { ...cur } };
        }),
        onPeerLeft: (id) => setPeers(({ [id]: _, ...rest }) => rest),
      });
      client.current = c;
      const audio = await AudioProcessor.getMicTrack(true);
      const cam = (await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } })).getVideoTracks()[0];
      tracks.current = { audio, video: cam };
      setLocalStream(new MediaStream([audio, cam]));
      await c.join(roomId, name);
      await c.publish(audio); await c.publish(cam);
      return true;
    } catch (e) { setError(e.message); return false; }
  }, []);

  const toggle = useCallback(async (key) => {
    const t = tracks.current;
    if (key === 'mic') t.audio.enabled = !t.audio.enabled;
    if (key === 'cam') t.video.enabled = !t.video.enabled;
    if (key === 'noise') await AudioProcessor.setNoiseCancel(t.audio, !status.noise);
    setStatus((s) => ({ ...s, [key]: !s[key] }));
  }, [status.noise]);

  const setVisible = useCallback((ids) => client.current?.setVisiblePeers(ids), []);
  const leave = useCallback(() => {
    client.current?.leave();
    Object.values(tracks.current).forEach((t) => t.stop());
    setPeers({}); setLocalStream(null);
  }, []);

  useEffect(() => () => client.current?.leave(), []);
  return { peers: Object.values(peers), localStream, status, error, join, toggle, setVisible, leave };
}
