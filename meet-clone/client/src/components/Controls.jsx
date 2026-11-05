const Btn = ({ on, onClick, children, danger }) => (
  <button onClick={onClick}
    className={`rounded-full px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-signal
      ${danger ? 'bg-red-500 hover:bg-red-400' : on ? 'bg-line hover:bg-slate-600' : 'bg-slate-100 text-ink'}`}>
    {children}
  </button>
);

export default function Controls({ status, toggle, leave }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 border-t border-line bg-panel p-3">
      <Btn on={status.mic} onClick={() => toggle('mic')}>{status.mic ? 'Mute' : 'Unmute'}</Btn>
      <Btn on={status.cam} onClick={() => toggle('cam')}>{status.cam ? 'Stop video' : 'Start video'}</Btn>
      <Btn on={status.noise} onClick={() => toggle('noise')}>
        Noise cancelling: {status.noise ? 'on' : 'off'}
      </Btn>
      <Btn danger onClick={leave}>Leave</Btn>
    </div>
  );
}
