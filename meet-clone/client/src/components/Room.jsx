import { useEffect, useMemo, useState } from 'react';
import VideoTile from './VideoTile.jsx';
import Controls from './Controls.jsx';

const PAGE_SIZE = 12;

function Audio({ stream }) {
  return <audio autoPlay ref={(el) => { if (el) el.srcObject = stream; }} />;
}

export default function Room({ meeting, roomId, onLeave }) {
  const { peers, localStream, status, toggle, setVisible, leave } = meeting;
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(peers.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = useMemo(() => peers.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE), [peers, current]);

  // Only visible tiles receive video; everyone's audio always plays.
  useEffect(() => { setVisible(visible.map((p) => p.id)); }, [visible, setVisible]);

  const cols = visible.length <= 1 ? 'grid-cols-1' : visible.length <= 4 ? 'grid-cols-2'
    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <div className="relative flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-line px-4 py-2 text-sm">
        <span>{roomId} · {peers.length + 1} in call</span>
        {pages > 1 && (
          <span className="flex items-center gap-2">
            <button disabled={current === 0} onClick={() => setPage(current - 1)} className="rounded bg-line px-2 disabled:opacity-40">Prev</button>
            {current + 1}/{pages}
            <button disabled={current >= pages - 1} onClick={() => setPage(current + 1)} className="rounded bg-line px-2 disabled:opacity-40">Next</button>
          </span>
        )}
      </header>
      <main className={`grid flex-1 content-start gap-2 overflow-y-auto p-2 ${cols}`}>
        {visible.map((p) => <VideoTile key={p.id} stream={p.stream} name={p.name} />)}
      </main>
      {peers.filter((p) => !visible.includes(p)).map((p) => <Audio key={p.id} stream={p.stream} />)}
      <div className="absolute bottom-20 right-3 w-40 md:w-56">
        {localStream && <VideoTile stream={localStream} name="You" muted />}
      </div>
      <Controls status={status} toggle={toggle} leave={() => { leave(); onLeave(); }} />
    </div>
  );
}
