import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * useAudioRecorder — shared MediaRecorder wrapper used by both the citizen
 * grievance submission page and the employee live session recording page.
 *
 * Returns:
 *   start()        — requests mic permission, begins capture
 *   stop()         — finalises recording; blob is set asynchronously via onstop
 *   discard()      — clears blob and resets to idle
 *   is_recording   — boolean
 *   elapsed        — seconds since start (live counter)
 *   blob           — Blob | null (set after stop)
 *   error          — string | '' (NotAllowedError → 'denied'; other → 'device')
 *
 * The hook owns stream cleanup: mic track is stopped when recording ends or
 * on unmount, so the browser indicator light goes out immediately.
 */
export function useAudioRecorder() {
  const [is_recording, set_is_recording] = useState(false);
  const [elapsed, set_elapsed] = useState(0);
  const [blob, set_blob] = useState(null);
  const [error, set_error] = useState('');

  const recorder_ref = useRef(null);
  const chunks_ref   = useRef([]);
  const timer_ref    = useRef(null);
  const stream_ref   = useRef(null);

  // Stop mic and timer on unmount regardless of state.
  useEffect(() => {
    return () => {
      if (timer_ref.current)  clearInterval(timer_ref.current);
      if (recorder_ref.current?.state !== 'inactive') recorder_ref.current?.stop();
      stream_ref.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const start = useCallback(async () => {
    set_error('');
    set_blob(null);
    chunks_ref.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream_ref.current = stream;

      const recorder = new MediaRecorder(stream);
      recorder_ref.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks_ref.current.push(e.data);
      };

      recorder.onstop = () => {
        const final_blob = new Blob(chunks_ref.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        set_blob(final_blob);
        set_is_recording(false);
        stream.getTracks().forEach((t) => t.stop());
        if (timer_ref.current) clearInterval(timer_ref.current);
      };

      recorder.start(200);
      set_is_recording(true);
      set_elapsed(0);

      timer_ref.current = setInterval(() => {
        set_elapsed((s) => s + 1);
      }, 1000);
    } catch (err) {
      set_error(err.name === 'NotAllowedError' ? 'denied' : 'device');
    }
  }, []);

  const stop = useCallback(() => {
    if (recorder_ref.current?.state !== 'inactive') {
      recorder_ref.current.stop();
    }
    if (timer_ref.current) { clearInterval(timer_ref.current); timer_ref.current = null; }
    // is_recording and blob are set inside recorder.onstop
  }, []);

  const discard = useCallback(() => {
    set_blob(null);
    set_elapsed(0);
    set_error('');
  }, []);

  return { start, stop, discard, is_recording, elapsed, blob, error };
}
