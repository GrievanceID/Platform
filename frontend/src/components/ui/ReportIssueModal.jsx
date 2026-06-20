import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { api_request } from '../../api/client';
import styles from './ReportIssueModal.module.css';

const CATEGORIES = ['ai_error', 'bug', 'other'];

/**
 * ReportIssueModal — inline modal for Reviewer/Employee to flag a concern.
 *
 * Props:
 *   token        string   — auth token
 *   grievance_id string? — pre-linked grievance ID (optional; null for general reports)
 *   onClose      fn       — called when user dismisses
 */
export function ReportIssueModal({ token, grievance_id, onClose }) {
  const { t } = useTranslation();
  const [category, set_category] = useState('ai_error');
  const [description, set_description] = useState('');
  const [submitting, set_submitting] = useState(false);
  const [error, set_error] = useState('');
  const [done, set_done] = useState(false);

  async function handle_submit(e) {
    e.preventDefault();
    if (!description.trim()) return;
    set_error('');
    set_submitting(true);
    try {
      await api_request('/issue-reports', {
        method: 'POST',
        token,
        body: {
          category,
          description: description.trim(),
          ...(grievance_id ? { grievance_id } : {}),
        },
      });
      set_done(true);
    } catch {
      set_error(t('flag.error'));
    } finally {
      set_submitting(false);
    }
  }

  const ref_short = grievance_id ? grievance_id.slice(0, 8).toUpperCase() : null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={t('flag.modal_title')}>
      <div className={styles.modal}>
        <div className={styles.modal_header}>
          <h2 className={styles.modal_title}>{t('flag.modal_title')}</h2>
          <button
            type="button"
            className={styles.close_btn}
            onClick={onClose}
            aria-label={t('flag.cancel_btn')}
          >
            ✕
          </button>
        </div>
        <p className={styles.modal_sub}>{t('flag.modal_sub')}</p>

        {done ? (
          <div className={styles.success_block}>
            <p className={styles.success_msg}>{t('flag.success')}</p>
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              {t('flag.cancel_btn')}
            </Button>
          </div>
        ) : (
          <form onSubmit={handle_submit} className={styles.form} noValidate>
            {/* Linked case indicator */}
            <div className={styles.field_group}>
              <span className={styles.field_label}>{t('flag.linked_case_label')}</span>
              <span className={styles.linked_value}>
                {ref_short
                  ? t('flag.linked_case_value', { ref: ref_short })
                  : t('flag.linked_case_general')}
              </span>
            </div>

            {/* Category */}
            <div className={styles.field_group}>
              <label htmlFor="flag_category" className={styles.field_label}>
                {t('flag.category_label')}
              </label>
              <select
                id="flag_category"
                className={styles.select}
                value={category}
                onChange={(e) => set_category(e.target.value)}
                disabled={submitting}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{t(`flag.category_${c}`)}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className={styles.field_group}>
              <label htmlFor="flag_description" className={styles.field_label}>
                {t('flag.description_label')}
              </label>
              <textarea
                id="flag_description"
                className={styles.textarea}
                rows={4}
                value={description}
                onChange={(e) => set_description(e.target.value)}
                placeholder={t('flag.description_placeholder')}
                disabled={submitting}
              />
            </div>

            {error && <p className={styles.error_msg} role="alert">{error}</p>}

            <div className={styles.form_actions}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={submitting}
                onClick={onClose}
              >
                {t('flag.cancel_btn')}
              </Button>
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                disabled={submitting || !description.trim()}
              >
                {submitting ? t('flag.submitting') : t('flag.submit_btn')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
