import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { api_request } from '../api/client';
import { ROLE_HOME } from '../layouts/ProtectedRoute';
import { toggle_lang } from '../i18n';
import styles from './LoginPage.module.css';

const ROLES = [
  { value: 'citizen',  key: 'tab_citizen' },
  { value: 'reviewer', key: 'tab_reviewer' },
  { value: 'employee', key: 'tab_employee' },
  { value: 'admin',    key: 'tab_admin' },
];

export function LoginPage() {
  const { commit_session, is_authenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [selected_role, set_selected_role] = useState('citizen');
  const [email, set_email] = useState('');
  const [password, set_password] = useState('');
  const [error, set_error] = useState('');
  const [loading, set_loading] = useState(false);

  if (is_authenticated && user) {
    navigate(ROLE_HOME[user.role] ?? '/', { replace: true });
    return null;
  }

  async function handle_submit(e) {
    e.preventDefault();
    set_error('');
    set_loading(true);

    try {
      const { data } = await api_request('/auth/login', {
        method: 'POST',
        body: { email: email.trim(), password },
      });

      const returned_user = data.user;

      if (returned_user.role !== selected_role) {
        const actual_label = t(`login.tab_${returned_user.role}`, { defaultValue: returned_user.role });
        const selected_label = t(`login.tab_${selected_role}`, { defaultValue: selected_role });
        set_error(t('login.error_mismatch', { actual: actual_label, selected: selected_label }));
        return;
      }

      commit_session(data.token, returned_user);
      const from = location.state?.from?.pathname;
      navigate(from ?? ROLE_HOME[returned_user.role] ?? '/', { replace: true });
    } catch (err) {
      set_error(err.message ?? t('login.error_generic'));
    } finally {
      set_loading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.heading_block}>
          <div className={styles.logo_row}>
            <span className={styles.logo_mark}>GID</span>
            <span className={styles.app_name}>GrievanceID</span>
          </div>
          <p className={styles.app_subtitle}>{t('login.subtitle')}</p>
        </div>

        <div className={styles.card}>
          <div className={styles.role_tabs} role="tablist" aria-label={t('login.subtitle')}>
            {ROLES.map((role) => (
              <button
                key={role.value}
                type="button"
                role="tab"
                aria-selected={selected_role === role.value}
                className={`${styles.role_tab} ${selected_role === role.value ? styles.role_tab_active : ''}`}
                onClick={() => { set_selected_role(role.value); set_error(''); }}
                disabled={loading}
              >
                {t(`login.${role.key}`)}
              </button>
            ))}
          </div>

          <form onSubmit={handle_submit} noValidate>
            <div className={styles.form_body}>
              <h2 className={styles.form_title}>
                {t('login.title', { role: t(`login.tab_${selected_role}`) })}
              </h2>

              {error && (
                <div className={styles.error_banner} role="alert">{error}</div>
              )}

              <Input
                id="email"
                type="email"
                label={t('login.email_label')}
                autoComplete="email"
                value={email}
                onChange={(e) => set_email(e.target.value)}
                required
                disabled={loading}
              />

              <Input
                id="password"
                type="password"
                label={t('login.password_label')}
                autoComplete="current-password"
                value={password}
                onChange={(e) => set_password(e.target.value)}
                required
                disabled={loading}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading || !email || !password}
              >
                {loading ? t('login.submitting') : t('login.submit')}
              </Button>

              <button type="button" className={styles.lang_toggle} onClick={toggle_lang}>
                {t('lang_toggle.label')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
