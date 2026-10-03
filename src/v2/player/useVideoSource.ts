import { useCallback, useEffect, useState, type RefObject } from 'react';

type Src = { url: string; kind: 'hls' | 'mp4' } | null;
type State = 'idle' | 'loading' | 'ready' | 'error';

// Attaches HLS (hls.js, loaded on demand) or plain mp4 to ONE recycled <video> element.
export function useVideoSource(ref: RefObject<HTMLVideoElement>, src: Src, opts: { startAt: number; dataSaver: boolean }) {
  const [state, setState] = useState<State>('idle');
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const { startAt, dataSaver } = opts;

  useEffect(() => {
    const v = ref.current;
    if (!v || !src) { setState('idle'); return; }
    let dead = false;
    let hls: any = null;
    let netRetries = 0;
    setState('loading');

    const onMeta = () => {
      if (startAt > 2 && v.duration && startAt < v.duration - 3) v.currentTime = startAt;
    };
    const onData = () => {
      if (dead) return;
      setState('ready');
      v.play().catch(() => {
        v.muted = true;
        setSoundBlocked(true);
        v.play().catch(() => {});
      });
    };
    const onErr = () => { if (!dead) setState('error'); };
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('loadeddata', onData);
    v.addEventListener('error', onErr);

    const nativeHls = v.canPlayType('application/vnd.apple.mpegurl') !== '';
    if (src.kind === 'hls' && !nativeHls) {
      import('hls.js').then(({ default: Hls }) => {
        if (dead) return;
        if (!Hls.isSupported()) { setState('error'); return; }
        hls = new Hls({ startLevel: 0, capLevelToPlayerSize: true, maxBufferLength: 12, enableWorker: true });
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (dataSaver) {
            let cap = -1;
            hls.levels.forEach((l: { height: number }, i: number) => { if (l.height && l.height <= 480) cap = i; });
            if (cap >= 0) hls.autoLevelCapping = cap;
          }
        });
        hls.on(Hls.Events.ERROR, (_e: unknown, d: { fatal: boolean; type: string }) => {
          if (!d.fatal || dead) return;
          if (d.type === Hls.ErrorTypes.NETWORK_ERROR && netRetries < 3) {
            netRetries += 1;
            setTimeout(() => { if (!dead) hls.startLoad(); }, 600 * netRetries);
          } else if (d.type === Hls.ErrorTypes.MEDIA_ERROR && netRetries < 3) {
            netRetries += 1;
            hls.recoverMediaError();
          } else {
            setState('error');
          }
        });
        hls.loadSource(src.url);
        hls.attachMedia(v);
      }).catch(() => { if (!dead) setState('error'); });
    } else {
      v.src = src.url;
      v.load();
    }

    return () => {
      dead = true;
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('loadeddata', onData);
      v.removeEventListener('error', onErr);
      if (hls) hls.destroy();
      v.pause();
      v.removeAttribute('src');
      v.load();
    };
    // startAt/dataSaver intentionally read once per source
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, src?.url, src?.kind, attempt]);

  const retry = useCallback(() => setAttempt(a => a + 1), []);
  const unmute = useCallback(() => { if (ref.current) ref.current.muted = false; setSoundBlocked(false); }, [ref]);
  return { state, retry, soundBlocked, unmute };
}
