import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, StatusBadge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { api_request } from '../../api/client';
import styles from './EmployeeSessionDetailPage.module.css';

export function EmployeeSessionDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [session, set_session] = useState(null);
  const [loading, set_loading] = useState(true);
  const [error, set_error] = useState('');

  // Audio playback via object URL — <audio src> cannot send auth headers,
  // so we fetch the file as a blob with Bearer token and create a local URL.
  const [audio_url, set_audio_url]   = useState(null);
  const [audio_loading, set_audio_loading] = useState(false);
  const [audio_error, set_audio_error]   = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function load() {
      set_loading(true);
      set_error('');
      try {
        const { data } = await api_request(`/live-sessions/${id}`, { token });
        if (cancelled) return;
        set_session(data.session);

        if (data.session?.audio_file_path) {
          set_audio_loading(true);
          try {
            const res = await fetch(`/api/live-sessions/${id}/audio`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('audio fetch failed');
            const blob = await res.blob();
            if (!cancelled) {
              set_audio_url(URL.createObjectURL(blob));
            }
          } catch {
            if (!cancelled) set_audio_error(true);
          } finally {
            if (!cancelled) set_audio_loading(false);
          }
        }
      } catch (err) {
        if (!cancelled) {
          set_error(
            err.status === 404
              ? t('employee.session_detail_not_found')
              : (err.message ?? t('employee.session_detail_error'))
          );
        }
      } finally {
        if (!cancelled) set_loading(false);
      }
    }
    load();

    return () => {
      cancelled = true;
      // Revoke object URL when component unmounts to free memory.
      set_audio_url((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    };
  }, [id, token]);

  const locale = i18n.language === 'ar' ? 'ar-MA' : 'fr-FR';

  function fmt_date(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(locale, {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function fmt_duration(seconds) {
    if (seconds == null) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  return (
    <div className={styles.page}>
      <div className={styles.back_row}>
        <button type="button" className={styles.back_btn}
          onClick={() => navigate('/employee/sessions')}>
          ← {t('employee.session_detail_back')}
        </button>
      </div>

      {loading && (
        <p className={styles.loading} aria-live="polite">
          {t('employee.session_detail_loading')}
        </p>
      )}
      {error && <div className={styles.error_banner} role="alert">{error}</div>}

      {!loading && !error && session && (
        <div className={styles.sections}>

          {/* ── Title row ── */}
          <div className={styles.title_row}>
            <h1 className={styles.page_title}>
              {session.title
                ? <span>{session.title}</span>
                : <span className={styles.title_none}>{t('employee.session_detail_title_none')}</span>
              }
              <span className={styles.ref}>{session.id.slice(0, 8).toUpperCase()}</span>
            </h1>
            <StatusBadge status={session.status} />
          </div>

          {/* ── Info ── */}
          <Card title={t('employee.session_detail_section_info')}>
            <dl className={styles.fields}>
              <div className={styles.field}>
                <dt>{t('employee.session_detail_ref')}</dt>
                <dd><span className={styles.mono}>{session.id.slice(0, 8).toUpperCase()}</span></dd>
              </div>
              <div className={styles.field}>
                <dt>{t('employee.session_detail_date')}</dt>
                <dd>{fmt_date(session.started_at)}</dd>
              </div>
              <div className={styles.field}>
                <dt>{t('employee.session_detail_duration')}</dt>
                <dd>{fmt_duration(session.duration_seconds)}</dd>
              </div>
              <div className={styles.field}>
                <dt>{t('employee.session_detail_status')}</dt>
                <dd><StatusBadge status={session.status} /></dd>
              </div>
            </dl>
          </Card>

          {/* ── Audio ── */}
          <Card title={t('employee.session_detail_section_audio')}>
            {!session.audio_file_path && (
              <p className={styles.muted_italic}>{t('employee.session_detail_audio_none')}</p>
            )}
            {session.audio_file_path && audio_loading && (
              <p className={styles.audio_loading}>…</p>
            )}
            {session.audio_file_path && !audio_loading && audio_error && (
              <p className={styles.muted_italic}>{t('employee.session_detail_audio_none')}</p>
            )}
            {session.audio_file_path && !audio_loading && !audio_error && audio_url && (
              <audio
                className={styles.audio_player}
                controls
                src={audio_url}
              />
            )}
          </Card>

          {/* ── Transcript / AI — intentionally unfinished ── */}
          <Card title={t('employee.session_detail_section_transcript')}>
            <div className={styles.ai_fields}>

              <div className={styles.ai_field}>
                <p className={styles.ai_field_label}>{t('employee.session_detail_transcript_label')}</p>
                {session.transcript
                  ? <p className={styles.ai_field_value} dir="auto">{session.transcript}</p>
                  : <p className={styles.ai_pending}>{t('employee.session_detail_transcript_pending')}</p>
                }
              </div>

              <div className={styles.ai_field}>
                <p className={styles.ai_field_label}>{t('employee.session_detail_summary_label')}</p>
                {session.ai_summary
                  ? <p className={styles.ai_field_value} dir="auto">{session.ai_summary}</p>
                  : <p className={styles.ai_pending}>{t('employee.session_detail_summary_pending')}</p>
                }
              </div>

              <div className={styles.ai_field}>
                <p className={styles.ai_field_label}>{t('employee.session_detail_category_label')}</p>
                {session.ai_category
                  ? <p className={styles.ai_field_value}>{session.ai_category}</p>
                  : <p className={styles.ai_pending}>{t('employee.session_detail_category_pending')}</p>
                }
              </div>

            </div>

            <p className={styles.ai_note}>{t('employee.session_detail_ai_note')}</p>
          </Card>

        </div>
      )}
    </div>
  );
}
