import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { api_request } from '../../api/client';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import styles from './EmployeeRecordPage.module.css';

export function EmployeeRecordPage() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [title, set_title] = useState('');
  const [saving, set_saving] = useState(false);
  const [save_error, set_save_error] = useState('');
  const [upload_error, set_upload_error] = useState('');

  // started_at is captured at the moment the employee clicks Start, not at POST
  // time, so the recorded timestamps reflect the actual recording window.
  const started_at_ref = useRef(null);

  const {
    start,
    stop,
    discard,
    is_recording,
    elapsed,
    blob,
    error: rec_error_code,
  } = useAudioRecorder();

  const rec_error = rec_error_code === 'denied'
    ? t('employee.rec_error_denied')
    : rec_error_code === 'device'
      ? t('employee.rec_error_device')
      : '';

  async function handle_start() {
    started_at_ref.current = new Date().toISOString();
    set_save_error('');
    set_upload_error('');
    await start();
  }

  async function handle_stop() {
    stop();
    // blob is set asynchronously in the hook's onstop handler; saving is
    // triggered by the "Save" button that appears once blob is available.
  }

  async function handle_save() {
    if (!blob || !started_at_ref.current) return;

    set_save_error('');
    set_upload_error('');
    set_saving(true);

    const ended_at = new Date().toISOString();
    const ext = blob.type.includes('ogg') ? 'ogg' : 'webm';

    const form = new FormData();
    form.append('audio', blob, `session.${ext}`);
    form.append('started_at', started_at_ref.current);
    form.append('ended_at', ended_at);
    form.append('duration_seconds', String(elapsed));
    if (title.trim()) form.append('title', title.trim());

    try {
      await api_request('/live-sessions', { method: 'POST', body: form, token });
      navigate('/employee/sessions', { replace: true });
    } catch {
      set_save_error(t('employee.rec_save_error'));
      set_saving(false);
    }
  }

  function handle_discard() {
    discard();
    started_at_ref.current = null;
    set_save_error('');
    set_upload_error('');
  }

  const is_idle = !is_recording && !blob;
  const is_done = !is_recording && !!blob;

  return (
    <div className={styles.page}>
      <div className={styles.page_header}>
        <h1 className={styles.page_title}>{t('employee.rec_title')}</h1>
      </div>

      <div className={styles.card}>
        {/* Title input — available before and during recording only */}
        {!is_done && (
          <div className={styles.field_row}>
            <Input
              id="session-title"
              type="text"
              label={t('employee.rec_label_label')}
              placeholder={t('employee.rec_label_placeholder')}
              value={title}
              onChange={(e) => set_title(e.target.value)}
              disabled={is_recording || saving}
            />
          </div>
        )}

        {/* Mic permission / device error */}
        {rec_error && (
          <p className={styles.error_msg} role="alert">{rec_error}</p>
        )}

        {/* Recording controls */}
        <div className={styles.controls_row}>
          {is_idle && (
            <Button variant="primary" size="lg" onClick={handle_start} disabled={saving}>
              <RecordDot /> {t('employee.rec_start_btn')}
            </Button>
          )}

          {is_recording && (
            <Button variant="secondary" size="lg" onClick={handle_stop}>
              <StopSquare /> {t('employee.rec_stop_btn')}
            </Button>
          )}
        </div>

        {/* Live recording indicator */}
        {is_recording && (
          <div className={styles.rec_status} role="status" aria-live="polite">
            <span className={styles.pulse_dot} aria-hidden="true" />
            <span className={styles.rec_label}>{t('employee.rec_in_progress')}</span>
            <span className={styles.elapsed}>
              {t('employee.rec_elapsed', { elapsed: fmt_elapsed(elapsed) })}
            </span>
          </div>
        )}

        {/* Post-recording: audio ready — confirm or discard */}
        {is_done && (
          <div className={styles.audio_ready_zone}>
            <div className={styles.audio_ready_header}>
              <CheckIcon />
              <span className={styles.audio_ready_label}>{t('employee.rec_audio_ready')}</span>
            </div>
            <p className={styles.audio_ready_meta}>
              {t('employee.rec_audio_meta', {
                duration: fmt_elapsed(elapsed),
                size: fmt_bytes(blob.size),
              })}
            </p>

            <audio
              className={styles.audio_preview}
              controls
              src={URL.createObjectURL(blob)}
            />

            <div className={styles.audio_ready_title_row}>
              <Input
                id="session-title-done"
                type="text"
                label={t('employee.rec_label_label')}
                placeholder={t('employee.rec_label_placeholder')}
                value={title}
                onChange={(e) => set_title(e.target.value)}
                disabled={saving}
              />
            </div>

            {(save_error || upload_error) && (
              <p className={styles.error_msg} role="alert">
                {save_error || upload_error}
              </p>
            )}

            <div className={styles.audio_ready_actions}>
              <Button variant="primary" size="lg" onClick={handle_save} disabled={saving}>
                {saving ? t('employee.rec_saving') : t('employee.rec_stop_btn')}
              </Button>
              <Button variant="secondary" size="sm" onClick={handle_discard} disabled={saving}>
                {t('employee.rec_discard')}
              </Button>
            </div>
          </div>
        )}

        {/* Transcript placeholder — future ASR integration slot */}
        {!is_done && (
          <div className={styles.transcript_zone} aria-label={t('employee.rec_transcript_placeholder_title')}>
            <p className={styles.transcript_zone_title}>{t('employee.rec_transcript_placeholder_title')}</p>
            <p className={styles.transcript_zone_body}>{t('employee.rec_transcript_placeholder_body')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function fmt_elapsed(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function fmt_bytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function RecordDot() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="6" cy="6" r="5" fill="currentColor" />
    </svg>
  );
}

function StopSquare() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect x="1.5" y="1.5" width="9" height="9" rx="1.5" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 10.5l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
