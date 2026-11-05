import { memo, useEffect, useRef } from 'react';

function VideoTile({ stream, name, muted = false }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream; }, [stream]);
  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-panel ring-1 ring-line">
      <video ref={ref} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs">{name}</span>
    </div>
  );
}
export default memo(VideoTile);
