import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Button, StatusBadge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { api_request } from '../../api/client';
import styles from './EmployeeCasePage.module.css';

function BackArrow() {
  return (
    <svg className={styles.back_arrow} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EmployeeCasePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { t, i18n } = useTranslation();

  const [grievance, set_grievance] = useState(null);
  const [notes, set_notes] = useState([]);
  const [loading, set_loading] = useState(true);
  const [error, set_error] = useState('');

  // Status action
  const [resolving, set_resolving] = useState(false);
  const [resolve_msg, set_resolve_msg] = useState('');
  const [resolve_err, set_resolve_err] = useState('');

  // Note form
  const [note_text, set_note_text] = useState('');
  const [note_visible, set_note_visible] = useState(false);
  const [note_submitting, set_note_submitting] = useState(false);
  const [note_err, set_note_err] = useState('');
  const [notes_loading, set_notes_loading] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    Promise.all([
      api_request(`/grievances/${id}`, { token }),
      api_request(`/grievances/${id}/notes`, { token }),
    ])
      .then(([g_res, n_res]) => {
        if (!cancelled) {
          set_grievance(g_res.data.grievance);
          set_notes(n_res.data.notes ?? []);
          set_loading(false);
        }
      })
      .catch(() => {
        if (!cancelled) { set_error(t('employee.case_error')); set_loading(false); }
      });
    return () => { cancelled = true; };
  }, [id, token]);

  const locale = i18n.language === 'ar' ? 'ar-MA' : 'fr-FR';
  function fmt_date(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(locale, {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  async function handle_resolve() {
    set_resolve_err('');
    set_resolving(true);
    try {
      const { data } = await api_request(`/grievances/${id}/status`, {
        method: 'PATCH',
        token,
        body: { status: 'resolved' },
      });
      set_grievance((prev) => ({ ...prev, status: data.grievance.status }));
      set_resolve_msg(t('employee.case_resolved_msg'));
    } catch (err) {
      set_resolve_err(t('employee.case_resolve_err'));
    } finally {
      set_resolving(false);
    }
  }

  async function handle_note_submit(e) {
    e.preventDefault();
    if (!note_text.trim()) return;
    set_note_err('');
    set_note_submitting(true);
    try {
      const { data } = await api_request(`/grievances/${id}/notes`, {
        method: 'POST',
        token,
        body: { text: note_text.trim(), is_citizen_visible: note_visible },
      });
      set_notes((prev) => [...prev, data.note]);
      set_note_text('');
      set_note_visible(false);
    } catch {
      set_note_err(t('employee.case_note_err'));
    } finally {
      set_note_submitting(false);
    }
  }

  const g = grievance;
  const already_resolved = g?.status === 'resolved';

  return (
    <div className={styles.page}>
      <div className={styles.back_row}>
        <button type="button" className={styles.back_btn} onClick={() => navigate('/employee/dashboard')}>
          <BackArrow />
          {t('employee.case_back')}
        </button>
      </div>

      {loading && <p className={styles.loading}>{t('employee.case_loading')}</p>}
      {error && <p className={styles.error_msg} role="alert">{error}</p>}

      {!loading && !error && g && (
        <div className={styles.sections}>

          {/* ── Case header ── */}
          <div className={styles.case_header}>
            <h1 className={styles.case_title}>
              {t('employee.case_title')}
              <span className={styles.case_ref}>{g.id.slice(0, 8).toUpperCase()}</span>
            </h1>
            <StatusBadge status={g.status} />
          </div>

          {/* ── Info card ── */}
          <Card>
            <dl className={styles.fields}>
              <div className={styles.field}>
                <dt>{t('employee.case_submitted_label')}</dt>
                <dd>{fmt_date(g.created_at)}</dd>
              </div>
              <div className={styles.field}>
                <dt>{t('employee.case_category_label')}</dt>
                <dd>{g.category ?? '—'}</dd>
              </div>
              {g.urgency && (
                <div className={styles.field}>
                  <dt>{t('employee.case_urgency_label')}</dt>
                  <dd>
                    <span className={`${styles.urgency_chip} ${styles[`urgency_${g.urgency}`]}`}>
                      {g.urgency}
                    </span>
                  </dd>
                </div>
              )}
              {g.summary && (
                <div className={`${styles.field} ${styles.field_full}`}>
                  <dt>{t('citizen.detail_summary_label')}</dt>
                  <dd className={styles.summary}>{g.summary}</dd>
                </div>
              )}
            </dl>
          </Card>

          {/* ── Transcript ── */}
          <Card title={t('employee.case_section_transcript')}>
            {g.raw_transcript || g.diarized_transcript ? (
              <pre className={styles.transcript}>
                {g.diarized_transcript ?? g.raw_transcript}
              </pre>
            ) : (
              <p className={styles.muted_italic}>{t('employee.case_transcript_pending')}</p>
            )}
          </Card>

          {/* ── Status action ── */}
          <Card title={t('employee.case_section_status')}>
            {already_resolved ? (
              <p className={styles.resolved_note}>{t('employee.case_already_resolved')}</p>
            ) : (
              <div className={styles.action_area}>
                {resolve_msg && <p className={styles.success_msg}>{resolve_msg}</p>}
                {resolve_err && <p className={styles.action_error} role="alert">{resolve_err}</p>}
                {!resolve_msg && (
                  <Button
                    type="button"
                    variant="primary"
                    disabled={resolving}
                    onClick={handle_resolve}
                  >
                    {resolving ? t('employee.case_resolving') : t('employee.case_resolve_btn')}
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* ── Notes ── */}
          <Card title={t('employee.case_section_notes')}>
            {/* Existing notes */}
            {notes.length === 0 ? (
              <p className={styles.notes_empty}>{t('employee.case_notes_empty')}</p>
            ) : (
              <ul className={styles.notes_list}>
                {notes.map((note) => (
                  <li key={note.id} className={styles.note_item}>
                    <div className={styles.note_header}>
                      <span className={styles.note_date}>{fmt_date(note.created_at)}</span>
                      <span className={`${styles.visibility_badge} ${note.is_citizen_visible ? styles.badge_public : styles.badge_internal}`}>
                        {note.is_citizen_visible
                          ? t('employee.case_note_public_badge')
                          : t('employee.case_note_internal_badge')}
                      </span>
                    </div>
                    <p className={styles.note_text}>{note.text}</p>
                  </li>
                ))}
              </ul>
            )}

            {/* Add note form */}
            <form onSubmit={handle_note_submit} className={styles.note_form} noValidate>
              <textarea
                className={styles.note_textarea}
                rows={3}
                value={note_text}
                onChange={(e) => set_note_text(e.target.value)}
                placeholder={t('employee.case_note_placeholder')}
                disabled={note_submitting}
              />

              {/* Visibility toggle — internal is default, citizen-visible requires explicit opt-in */}
              <label className={styles.visibility_toggle}>
                <input
                  type="checkbox"
                  className={styles.visibility_checkbox}
                  checked={note_visible}
                  onChange={(e) => set_note_visible(e.target.checked)}
                  disabled={note_submitting}
                />
                {t('employee.case_note_visible_label')}
              </label>

              {note_err && <p className={styles.note_err} role="alert">{note_err}</p>}

              <div className={styles.note_actions}>
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  disabled={note_submitting || !note_text.trim()}
                >
                  {note_submitting ? t('employee.case_note_submitting') : t('employee.case_note_submit')}
                </Button>
              </div>
            </form>
          </Card>

        </div>
      )}
    </div>
  );
}
