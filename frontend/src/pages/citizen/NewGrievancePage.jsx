import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, InView } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { api_request } from '../../api/client';
import styles from './NewGrievancePage.module.css';

const ACCEPTED_AUDIO = ['audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/webm', 'audio/mp4'];

// ---------------------------------------------------------------------------
// Recording state machine values
// ---------------------------------------------------------------------------
const REC = {
  IDLE: 'idle',
  RECORDING: 'recording',
  PAUSED: 'paused',
  DONE: 'done',
};

export function NewGrievancePage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  // ── Mode: 'record' | 'upload' ──────────────────────────────────────────
  const [mode, set_mode] = useState('record');

  // ── Recording state ─────────────────────────────────────────────────────
  const [rec_state, set_rec_state] = useState(REC.IDLE);
  const [rec_seconds, set_rec_seconds] = useState(0);
  const [rec_blob, set_rec_blob] = useState(null);
  const [rec_error, set_rec_error] = useState('');
  const media_recorder_ref = useRef(null);
  const chunks_ref = useRef([]);
  const timer_ref = useRef(null);

  // ── Upload state ─────────────────────────────────────────────────────────
  const [upload_file, set_upload_file] = useState(null);
  const [upload_error, set_upload_error] = useState('');

  // ── Shared submission state ──────────────────────────────────────────────
  const [description, set_description] = useState('');
  const [submitting, set_submitting] = useState(false);
  const [submit_error, set_submit_error] = useState('');

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timer_ref.current) clearInterval(timer_ref.current);
      if (media_recorder_ref.current?.state !== 'inactive') {
        media_recorder_ref.current?.stop();
      }
    };
  }, []);

  // ── Recording controls ──────────────────────────────────────────────────

  const start_recording = useCallback(async () => {
    set_rec_error('');
    set_rec_blob(null);
    chunks_ref.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      media_recorder_ref.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks_ref.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks_ref.current, { type: recorder.mimeType || 'audio/webm' });
        set_rec_blob(blob);
        set_rec_state(REC.DONE);
        // Release microphone
        stream.getTracks().forEach((t) => t.stop());
        if (timer_ref.current) clearInterval(timer_ref.current);
      };

      recorder.start(200); // collect chunks every 200ms
      set_rec_state(REC.RECORDING);
      set_rec_seconds(0);

      timer_ref.current = setInterval(() => {
        set_rec_seconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      set_rec_error(
        err.name === 'NotAllowedError'
          ? 'Microphone access was denied. Please allow microphone access and try again.'
          : 'Could not start recording. Make sure a microphone is connected.'
      );
    }
  }, []);

  const stop_recording = useCallback(() => {
    if (media_recorder_ref.current?.state !== 'inactive') {
      media_recorder_ref.current.stop();
    }
    if (timer_ref.current) clearInterval(timer_ref.current);
  }, []);

  const discard_recording = useCallback(() => {
    set_rec_blob(null);
    set_rec_state(REC.IDLE);
    set_rec_seconds(0);
    set_rec_error('');
  }, []);

  // ── File upload controls ────────────────────────────────────────────────

  function handle_file_change(e) {
    const file = e.target.files?.[0];
    set_upload_error('');
    if (!file) { set_upload_file(null); return; }

    if (!ACCEPTED_AUDIO.includes(file.type)) {
      set_upload_error('Unsupported file type. Please upload a WAV, MP3, OGG, or WebM audio file.');
      set_upload_file(null);
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      set_upload_error('File is too large. Maximum size is 100 MB.');
      set_upload_file(null);
      return;
    }
    set_upload_file(file);
  }

  // ── Submission ──────────────────────────────────────────────────────────

  const audio_ready = mode === 'record' ? rec_blob !== null : upload_file !== null;

  async function handle_submit(e) {
    e.preventDefault();
    if (!audio_ready) return;

    set_submit_error('');
    set_submitting(true);

    try {
      const form = new FormData();

      if (mode === 'record') {
        // Name the blob so the backend multer filter can inspect the extension
        const ext = rec_blob.type.includes('ogg') ? 'ogg' : 'webm';
        form.append('audio', rec_blob, `recording.${ext}`);
      } else {
        form.append('audio', upload_file);
      }

      if (description.trim()) {
        // Description stored as a text field; backend currently ignores it
        // (transcript comes from ASR), but we send it so future versions can
        // store it without a client change.
        form.append('description', description.trim());
      }

      const { data } = await api_request('/grievances', {
        method: 'POST',
        body: form,
        token,
      });

      navigate(`/grievances/${data.grievance.id}`, { replace: false });
    } catch (err) {
      set_submit_error(err.message ?? 'Submission failed. Please try again.');
    } finally {
      set_submitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <InView direction="up">
        <div className={styles.page_header}>
          <h1 className={styles.page_title}>Submit a Grievance</h1>
          <p className={styles.page_desc}>
            Record or upload an audio statement. Your submission will be
            transcribed and reviewed before being routed to the appropriate institution.
          </p>
        </div>
      </InView>

      <form onSubmit={handle_submit} noValidate>
        <div className={styles.sections}>

          {/* ── Section 1: Audio mode selector ── */}
          <InView direction="up" delay="60ms">
            <Card title="Audio input">
              <div className={styles.mode_tabs} role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'record'}
                  className={`${styles.mode_tab} ${mode === 'record' ? styles.mode_tab_active : ''}`}
                  onClick={() => { set_mode('record'); set_upload_error(''); }}
                >
                  Record now
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'upload'}
                  className={`${styles.mode_tab} ${mode === 'upload' ? styles.mode_tab_active : ''}`}
                  onClick={() => { set_mode('upload'); set_rec_error(''); }}
                >
                  Upload file
                </button>
              </div>

              {/* ── Record panel ── */}
              {mode === 'record' && (
                <div className={styles.record_panel}>
                  {rec_error && (
                    <div className={styles.inline_error} role="alert">{rec_error}</div>
                  )}

                  {rec_state === REC.IDLE && (
                    <div className={styles.record_idle}>
                      <MicIcon className={styles.mic_icon} />
                      <p className={styles.record_hint}>
                        Press <strong>Start recording</strong> and speak your grievance
                        clearly. When finished, press <strong>Stop</strong>.
                      </p>
                      <Button type="button" variant="primary" onClick={start_recording}>
                        Start recording
                      </Button>
                    </div>
                  )}

                  {rec_state === REC.RECORDING && (
                    <div className={styles.record_active}>
                      <div className={styles.rec_indicator} aria-label="Recording in progress">
                        <span className={styles.rec_dot} aria-hidden="true" />
                        <span className={styles.rec_label}>Recording</span>
                        <span className={styles.rec_timer}>{format_duration(rec_seconds)}</span>
                      </div>
                      <Button type="button" variant="secondary" onClick={stop_recording}>
                        Stop recording
                      </Button>
                    </div>
                  )}

                  {rec_state === REC.DONE && rec_blob && (
                    <div className={styles.record_done}>
                      <div className={styles.rec_summary}>
                        <CheckIcon className={styles.check_icon} />
                        <div>
                          <p className={styles.rec_done_label}>Recording complete</p>
                          <p className={styles.rec_done_meta}>
                            Duration: {format_duration(rec_seconds)} ·{' '}
                            {format_bytes(rec_blob.size)}
                          </p>
                        </div>
                      </div>
                      {/* Playback preview */}
                      <audio
                        className={styles.audio_preview}
                        controls
                        src={URL.createObjectURL(rec_blob)}
                      />
                      <Button type="button" variant="secondary" size="sm" onClick={discard_recording}>
                        Discard and re-record
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Upload panel ── */}
              {mode === 'upload' && (
                <div className={styles.upload_panel}>
                  {upload_error && (
                    <div className={styles.inline_error} role="alert">{upload_error}</div>
                  )}

                  <label className={styles.file_drop_zone} htmlFor="audio_file_input">
                    <UploadIcon className={styles.upload_icon} />
                    <span className={styles.file_drop_label}>
                      {upload_file
                        ? upload_file.name
                        : 'Click to choose a file'}
                    </span>
                    <span className={styles.file_drop_hint}>
                      WAV, MP3, OGG, WebM · Max 100 MB
                    </span>
                    <input
                      id="audio_file_input"
                      type="file"
                      accept={ACCEPTED_AUDIO.join(',')}
                      className={styles.file_input_hidden}
                      onChange={handle_file_change}
                    />
                  </label>

                  {upload_file && (
                    <p className={styles.file_meta}>
                      {upload_file.name} · {format_bytes(upload_file.size)}
                    </p>
                  )}
                </div>
              )}
            </Card>
          </InView>

          {/* ── Section 2: Optional description ── */}
          <InView direction="up" delay="120ms">
            <Card title="Additional details (optional)">
              <div className={styles.description_body}>
                <textarea
                  id="description"
                  className={styles.textarea}
                  placeholder="Add any written context you'd like to include alongside the audio…"
                  value={description}
                  onChange={(e) => set_description(e.target.value)}
                  rows={4}
                  // RTL detection: if the user types Arabic, the browser will
                  // handle bidi. dir="auto" lets the browser decide per-line.
                  dir="auto"
                  lang="ar-MA"
                />
                <p className={styles.textarea_hint}>
                  Supports Arabic and Darija. The field will adapt to right-to-left
                  text automatically.
                </p>
              </div>
            </Card>
          </InView>

          {/* ── Section 3: Submit ── */}
          <InView direction="up" delay="180ms">
            <div className={styles.submit_row}>
              {submit_error && (
                <div className={styles.inline_error} role="alert">{submit_error}</div>
              )}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={!audio_ready || submitting}
              >
                {submitting ? 'Submitting…' : 'Submit grievance'}
              </Button>
              {!audio_ready && (
                <p className={styles.submit_hint}>
                  {mode === 'record'
                    ? 'Complete a recording before submitting.'
                    : 'Choose an audio file before submitting.'}
                </p>
              )}
            </div>
          </InView>

        </div>
      </form>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function format_duration(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function format_bytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Inline SVG icons (no external icon library — NFR-1) ────────────────────

function MicIcon({ className }) {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="2" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="21" x2="15" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 10.5l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UploadIcon({ className }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15V3m0 0L8 7m4-4l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
