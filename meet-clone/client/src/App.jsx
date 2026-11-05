import { useState } from 'react';
import useMeeting from './hooks/useMeeting.js';
import Room from './components/Room.jsx';

export default function App() {
  const meeting = useMeeting();
  const [form, setForm] = useState({ room: '', name: '' });
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setJoined(await meeting.join(form.room.trim(), form.name.trim()));
    setBusy(false);
  };

  if (joined) return <Room meeting={meeting} roomId={form.room} onLeave={() => setJoined(false)} />;

  const input = 'w-full rounded-lg border border-line bg-panel px-3 py-2 outline-none focus:ring-2 focus:ring-signal';
  return (
    <div className="grid h-full place-items-center p-4">
      <div className="w-full max-w-sm space-y-3">
        <h1 className="text-2xl font-semibold">Join a meeting</h1>
        <input className={input} placeholder="Meeting code" value={form.room}
               onChange={(e) => setForm({ ...form, room: e.target.value })} />
        <input className={input} placeholder="Your name" value={form.name}
               onChange={(e) => setForm({ ...form, name: e.target.value })} />
        {meeting.error && <p className="text-sm text-red-400">{meeting.error}</p>}
        <button disabled={!form.room.trim() || busy} onClick={submit}
                className="w-full rounded-lg bg-signal py-2 font-medium text-ink disabled:opacity-50">
          {busy ? 'Joining…' : 'Join'}
        </button>
      </div>
    </div>
  );
}
