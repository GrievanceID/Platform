import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, StatusBadge, Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { api_request } from '../../api/client';
import styles from './GrievanceDetailPage.module.css';

/**
 * Grievance detail page — citizen view.
 * Stub: loads and displays core fields. Full transcript/diarization view is a
 * separate future task (ASR integration not yet wired).
 */
export function GrievanceDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [grievance, set_grievance] = useState(null);
  const [loading, set_loading] = useState(true);
  const [error, set_error] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetch_grievance() {
      set_loading(true);
      set_error('');
      try {
        const { data } = await api_request(`/grievances/${id}`, { token });
        if (!cancelled) set_grievance(data.grievance);
      } catch (err) {
        if (!cancelled) {
          set_error(
            err.status === 404
              ? 'Grievance not found or you do not have access to it.'
              : (err.message ?? 'Failed to load grievance.')
          );
        }
      } finally {
        if (!cancelled) set_loading(false);
      }
    }

    fetch_grievance();
    return () => { cancelled = true; };
  }, [id, token]);

  return (
    <div className={styles.page}>
      <div className={styles.back_row}>
        <button
          type="button"
          className={styles.back_btn}
          onClick={() => navigate('/grievances/mine')}
        >
          ← Back to my grievances
        </button>
      </div>

      {loading && (
        <p className={styles.loading} aria-live="polite">Loading…</p>
      )}

      {error && (
        <div className={styles.error_banner} role="alert">{error}</div>
      )}

      {!loading && !error && grievance && (
        <div className={styles.sections}>
          <div className={styles.title_row}>
            <h1 className={styles.page_title}>
              Grievance <span className={styles.ref}>{grievance.id.slice(0, 8).toUpperCase()}</span>
            </h1>
            <StatusBadge status={grievance.status} />
          </div>

          <Card title="Overview">
            <dl className={styles.fields}>
              <div className={styles.field}>
                <dt>Submitted</dt>
                <dd>{format_date(grievance.submitted_at)}</dd>
              </div>
              <div className={styles.field}>
                <dt>Category</dt>
                <dd>{grievance.category ?? '—'}</dd>
              </div>
              <div className={styles.field}>
                <dt>Urgency</dt>
                <dd>{grievance.urgency ?? '—'}</dd>
              </div>
              {grievance.related_grievance_id && (
                <div className={styles.field}>
                  <dt>Follow-up of</dt>
                  <dd>
                    <button
                      type="button"
                      className={styles.link_btn}
                      onClick={() => navigate(`/grievances/${grievance.related_grievance_id}`)}
                    >
                      {grievance.related_grievance_id.slice(0, 8).toUpperCase()}
                    </button>
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {grievance.status === 'rejected' && (
            <Card title="Rejection note">
              <p className={styles.rejected_note}>
                This grievance was not routed for processing. If you believe this
                is an error, you may submit a follow-up with additional information.
              </p>
              <div className={styles.followup_cta}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/grievances/new')}
                >
                  Submit follow-up
                </Button>
              </div>
            </Card>
          )}

          <Card title="Transcript">
            <p className={styles.transcript_placeholder}>
              {grievance.status === 'submitted'
                ? 'Your grievance is being processed. The transcript will appear here once available.'
                : 'Transcript will be shown here in a future update.'}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}

function format_date(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
