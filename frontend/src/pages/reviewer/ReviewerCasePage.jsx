import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Button, StatusBadge, ReportIssueModal } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { api_request } from '../../api/client';
import styles from './ReviewerCasePage.module.css';

// Low-confidence visual threshold — same as queue page
const LOW_CONFIDENCE_THRESHOLD = 0.65;

// Institution categories that a Reviewer can route to.
// These are derived from the valid_institution_categories list in the spec/employee route.
// Reviewer chooses a destination institution by category when overriding.
// Note: Reviewer picks a specific institution (by ID), not just a category label.
// The institution list is fetched from the backend at mount.
const URGENCY_LABELS = { low: 'low', medium: 'medium', high: 'high' };

function BackArrow() {
  return (
    <svg className={styles.back_arrow} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ConfidenceBar({ score }) {
  if (score == null) return null;
  const pct = Math.round(score * 100);
  const is_low = score < LOW_CONFIDENCE_THRESHOLD;
  return (
    <div className={styles.confidence_bar_wrap} aria-label={`${pct}%`}>
      <div
        className={`${styles.confidence_bar_fill} ${is_low ? styles.confidence_bar_low : ''}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function ReviewerCasePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { t, i18n } = useTranslation();

  const [grievance, set_grievance] = useState(null);
  const [institutions, set_institutions] = useState([]);
  const [loading, set_loading] = useState(true);
  const [error, set_error] = useState('');

  // Flag/report state
  const [show_flag_modal, set_show_flag_modal] = useState(false);

  // Action state
  const [overriding, set_overriding] = useState(false);
  const [override_institution_id, set_override_institution_id] = useState('');
  const [override_reason, set_override_reason] = useState('');
  const [submitting, set_submitting] = useState(false);
  const [action_error, set_action_error] = useState('');
  const [action_success, set_action_success] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    Promise.all([
      api_request(`/grievances/${id}`, { token }),
      api_request('/institutions', { token }).catch(() => ({ data: { institutions: [] } })),
    ])
      .then(([grievance_res, inst_res]) => {
        if (!cancelled) {
          set_grievance(grievance_res.data.grievance);
          set_institutions(inst_res.data.institutions ?? []);
          set_loading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Always show a translated message — never a raw HTTP error string.
          set_error(t('reviewer.case_error'));
          set_loading(false);
        }
      });

    return () => { cancelled = true; };
  }, [id, token]);

  const locale = i18n.language === 'ar' ? 'ar-MA' : 'fr-FR';
  function fmt_date(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(locale, {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  }

  async function handle_confirm() {
    set_action_error('');
    set_submitting(true);
    try {
      await api_request(`/grievances/${id}/approve-routing`, { method: 'POST', token });
      set_action_success(t('reviewer.case_action_success_confirm'));
    } catch (err) {
      set_action_error(err.message || t('reviewer.case_action_err_generic'));
    } finally {
      set_submitting(false);
    }
  }

  async function handle_override() {
    set_action_error('');
    if (!override_institution_id) {
      set_action_error(t('reviewer.case_action_err_institution'));
      return;
    }
    if (!override_reason.trim()) {
      set_action_error(t('reviewer.case_action_err_reason'));
      return;
    }
    set_submitting(true);
    try {
      await api_request(`/grievances/${id}/correct-routing`, {
        method: 'POST',
        token,
        body: { institution_id: override_institution_id },
      });
      set_action_success(t('reviewer.case_action_success_override'));
    } catch (err) {
      set_action_error(err.message || t('reviewer.case_action_err_generic'));
    } finally {
      set_submitting(false);
    }
  }

  async function handle_reject() {
    set_action_error('');
    if (!override_reason.trim()) {
      set_action_error(t('reviewer.case_action_err_reason'));
      return;
    }
    set_submitting(true);
    try {
      await api_request(`/grievances/${id}/reject`, {
        method: 'POST',
        token,
        body: {
          rejection_reason: override_reason.trim(),
          flag_reason: 'manual_override',
        },
      });
      set_action_success(t('reviewer.case_action_success_reject'));
    } catch (err) {
      set_action_error(err.message || t('reviewer.case_action_err_generic'));
    } finally {
      set_submitting(false);
    }
  }

  const g = grievance;
  const score = g?.confidence_score;
  const is_low = score != null && score < LOW_CONFIDENCE_THRESHOLD;

  // Suggested institution name lookup
  const suggested_inst = institutions.find((i) => i.id === g?.suggested_institution_id);

  const done = !!action_success;

  return (
    <div className={styles.page}>
      {/* ── Back link ── */}
      <div className={styles.back_row}>
        <button type="button" className={styles.back_btn} onClick={() => navigate('/reviewer/queue')}>
          <BackArrow />
          {t('reviewer.case_back')}
        </button>
      </div>

      {loading && <p className={styles.loading}>{t('reviewer.case_loading')}</p>}
      {error && <p className={styles.error_msg} role="alert">{error}</p>}

      {show_flag_modal && (
        <ReportIssueModal
          token={token}
          grievance_id={id}
          onClose={() => set_show_flag_modal(false)}
        />
      )}

      {!loading && !error && g && (
        <div className={styles.sections}>

          {/* ── Case meta header ── */}
          <div className={styles.case_header}>
            <div className={styles.case_header_left}>
              <h1 className={styles.case_title}>
                {t('reviewer.case_title')}
                <span className={styles.case_ref}>{g.id.slice(0, 8).toUpperCase()}</span>
              </h1>
              <div className={styles.meta_row}>
                <span className={styles.meta_item}>
                  <span className={styles.meta_label}>{t('reviewer.case_submitted_label')}</span>
                  {fmt_date(g.created_at)}
                </span>
                <span className={styles.meta_sep} />
                <span className={styles.meta_item}>
                  <span className={styles.meta_label}>{t('reviewer.case_status_label')}</span>
                  <StatusBadge status={g.status} />
                </span>
                {g.flag_reason && (
                  <>
                    <span className={styles.meta_sep} />
                    <span className={styles.meta_item}>
                      <span className={styles.meta_label}>{t('reviewer.case_flag_reason_label')}</span>
                      <span className={styles.flag_chip}>{g.flag_reason}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              type="button"
              className={styles.flag_link}
              onClick={() => set_show_flag_modal(true)}
            >
              {t('flag.btn_label')}
            </button>
          </div>

          {/* ── Transcript ── */}
          <Card title={t('reviewer.case_section_transcript')}>
            {g.raw_transcript || g.diarized_transcript ? (
              <div className={styles.transcript_block}>
                {g.diarized_transcript && (
                  <pre className={styles.transcript_text}>{g.diarized_transcript}</pre>
                )}
                {!g.diarized_transcript && g.raw_transcript && (
                  <pre className={styles.transcript_text}>{g.raw_transcript}</pre>
                )}
              </div>
            ) : (
              <p className={styles.transcript_pending}>{t('reviewer.case_transcript_pending')}</p>
            )}
          </Card>

          {/* ── AI analysis ── */}
          <Card title={t('reviewer.case_section_ai')}>
            <dl className={styles.ai_fields}>
              <div className={styles.ai_field}>
                <dt>{t('reviewer.case_ai_category')}</dt>
                <dd className={styles.ai_value_strong}>{g.category ?? '—'}</dd>
              </div>
              <div className={styles.ai_field}>
                <dt>{t('reviewer.case_ai_confidence')}</dt>
                <dd>
                  <div className={styles.confidence_row}>
                    <span className={`${styles.confidence_num} ${is_low ? styles.confidence_low : ''}`}>
                      {score != null ? `${Math.round(score * 100)} %` : '—'}
                    </span>
                    {is_low && <span className={styles.low_badge}>{t('reviewer.low_confidence_label')}</span>}
                  </div>
                  {score != null && <ConfidenceBar score={score} />}
                </dd>
              </div>
              <div className={styles.ai_field}>
                <dt>{t('reviewer.case_ai_urgency')}</dt>
                <dd>{g.urgency ? (URGENCY_LABELS[g.urgency] ?? g.urgency) : '—'}</dd>
              </div>
              <div className={styles.ai_field}>
                <dt>{t('reviewer.case_ai_institution')}</dt>
                <dd>
                  {suggested_inst
                    ? <span className={styles.institution_name}>{suggested_inst.name}</span>
                    : g.suggested_institution_id
                    ? <span className={styles.institution_id}>{g.suggested_institution_id.slice(0, 8)}</span>
                    : <span className={styles.muted}>{t('reviewer.case_ai_institution_unknown')}</span>
                  }
                </dd>
              </div>
              {g.summary && (
                <div className={`${styles.ai_field} ${styles.ai_field_full}`}>
                  <dt>{t('reviewer.case_ai_summary')}</dt>
                  <dd className={styles.summary_text}>{g.summary}</dd>
                </div>
              )}
              {g.human_review_flag && (
                <div className={`${styles.ai_field} ${styles.ai_field_full}`}>
                  <dd className={styles.review_flag_note}>{t('reviewer.case_ai_flag')}</dd>
                </div>
              )}
            </dl>
          </Card>

          {/* ── Action panel ── */}
          <Card title={t('reviewer.case_section_action')}>
            {done ? (
              <p className={styles.success_msg}>{action_success}</p>
            ) : (
              <div className={styles.action_panel}>

                {/* Override toggle */}
                <div className={styles.override_toggle_row}>
                  <label className={styles.override_toggle_label}>
                    <input
                      type="checkbox"
                      className={styles.override_checkbox}
                      checked={overriding}
                      onChange={(e) => {
                        set_overriding(e.target.checked);
                        set_action_error('');
                        set_override_reason('');
                        set_override_institution_id('');
                      }}
                      disabled={submitting}
                    />
                    {t('reviewer.case_action_override_toggle')}
                  </label>
                </div>

                {overriding && (
                  <div className={styles.override_fields}>
                    {/* Institution selector */}
                    <div className={styles.field_group}>
                      <label htmlFor="override_inst" className={styles.field_label}>
                        {t('reviewer.case_action_override_label')}
                      </label>
                      <select
                        id="override_inst"
                        className={styles.select}
                        value={override_institution_id}
                        onChange={(e) => set_override_institution_id(e.target.value)}
                        disabled={submitting}
                      >
                        <option value="">— {t('reviewer.case_action_err_institution')} —</option>
                        {institutions.map((inst) => (
                          <option key={inst.id} value={inst.id}>{inst.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Reason field — required for both override AND reject */}
                    <div className={styles.field_group}>
                      <label htmlFor="override_reason" className={styles.field_label}>
                        {t('reviewer.case_action_reason_label')}
                      </label>
                      <textarea
                        id="override_reason"
                        className={styles.textarea}
                        rows={3}
                        value={override_reason}
                        onChange={(e) => set_override_reason(e.target.value)}
                        placeholder={t('reviewer.case_action_reason_placeholder')}
                        disabled={submitting}
                      />
                    </div>
                  </div>
                )}

                {action_error && (
                  <p className={styles.action_error} role="alert">{action_error}</p>
                )}

                <div className={styles.action_row}>
                  {!overriding ? (
                    <Button
                      type="button"
                      variant="primary"
                      disabled={submitting || !g.suggested_institution_id}
                      onClick={handle_confirm}
                    >
                      {submitting ? t('reviewer.case_action_submitting') : t('reviewer.case_action_confirm')}
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="primary"
                        disabled={submitting}
                        onClick={handle_override}
                      >
                        {submitting ? t('reviewer.case_action_submitting') : t('reviewer.case_action_override_submit')}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={submitting}
                        onClick={handle_reject}
                      >
                        {submitting ? t('reviewer.case_action_submitting') : t('reviewer.case_action_reject')}
                      </Button>
                    </>
                  )}
                </div>

              </div>
            )}
          </Card>

        </div>
      )}
    </div>
  );
}
