import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { api_request } from '../api/client';
import { ROLE_HOME } from '../layouts/ProtectedRoute';
import { toggle_lang } from '../i18n';
import styles from './LoginPage.module.css';

function BackArrow() {
  return (
    <svg
      className={styles.back_arrow}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 2L4 7l5 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STAFF_ROLES = [
  { value: 'reviewer', key: 'tab_reviewer' },
  { value: 'employee', key: 'tab_employee' },
  { value: 'admin',    key: 'tab_admin' },
];

export function LoginPage() {
  const { commit_session, is_authenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // tier: 'choice' | 'citizen' | 'staff'
  const [tier, set_tier] = useState('choice');
  const [selected_role, set_selected_role] = useState('reviewer');
  const [email, set_email] = useState('');
  const [password, set_password] = useState('');
  const [error, set_error] = useState('');
  const [loading, set_loading] = useState(false);

  if (is_authenticated && user) {
    navigate(ROLE_HOME[user.role] ?? '/', { replace: true });
    return null;
  }

  function go_to_citizen() {
    set_email('');
    set_password('');
    set_error('');
    set_tier('citizen');
  }

  function go_to_staff() {
    set_email('');
    set_password('');
    set_error('');
    set_tier('staff');
  }

  function go_back_to_choice() {
    set_email('');
    set_password('');
    set_error('');
    set_tier('choice');
  }

  // For the citizen path, the declared role is always 'citizen'.
  // For the staff path, it is the value of the role selector.
  const declared_role = tier === 'citizen' ? 'citizen' : selected_role;

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

      // Role-gate: declared role (tab/selector) must match what the backend returns.
      if (returned_user.role !== declared_role) {
        const actual_label = t(`login.tab_${returned_user.role}`, { defaultValue: returned_user.role });
        const selected_label = t(`login.tab_${declared_role}`, { defaultValue: declared_role });
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
      <Link to="/" className={styles.back_home}>
        <BackArrow />
        {t('login.back_home')}
      </Link>

      <div className={styles.container}>
        <div className={styles.heading_block}>
          <Link to="/" className={styles.logo_link}>
            <img
              src="/src/assets/branding/tawthiqid-logo-transparent.png"
              alt="TawthiqID"
              className={styles.brand_logo}
              height={36}
            />
          </Link>
          <p className={styles.app_subtitle}>{t('login.subtitle')}</p>
        </div>

        <div className={styles.card}>
          {/* ── Tier 1: Entry choice ── */}
          {tier === 'choice' && (
            <>
              <div className={styles.choice_grid}>
                <button
                  type="button"
                  className={styles.choice_card}
                  onClick={go_to_citizen}
                >
                  <span className={styles.choice_label}>{t('login.choice_citizen_label')}</span>
                  <span className={styles.choice_sub}>{t('login.choice_citizen_sub')}</span>
                </button>
                <button
                  type="button"
                  className={styles.choice_card}
                  onClick={go_to_staff}
                >
                  <span className={styles.choice_label}>{t('login.choice_staff_label')}</span>
                  <span className={styles.choice_sub}>{t('login.choice_staff_sub')}</span>
                </button>
              </div>
              <div className={styles.choice_footer}>
                <button type="button" className={styles.lang_toggle} onClick={toggle_lang}>
                  {t('lang_toggle.label')}
                </button>
              </div>
            </>
          )}

          {/* ── Tier 2a: Citizen path ── */}
          {tier === 'citizen' && (
            <>
              <div className={styles.tier_header}>
                <button
                  type="button"
                  className={styles.back_to_choice}
                  onClick={go_back_to_choice}
                  disabled={loading}
                >
                  <BackArrow />
                  {t('login.back_to_choice')}
                </button>
              </div>
              {/* TEMPORARY: will be replaced by eSignet redirect flow */}
              <form onSubmit={handle_submit} noValidate>
                <div className={styles.form_body}>
                  <h2 className={styles.form_title}>
                    {t('login.title', { role: t('login.tab_citizen') })}
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
            </>
          )}

          {/* ── Tier 2b: Staff path ── */}
          {tier === 'staff' && (
            <>
              <div className={styles.tier_header}>
                <button
                  type="button"
                  className={styles.back_to_choice}
                  onClick={go_back_to_choice}
                  disabled={loading}
                >
                  <BackArrow />
                  {t('login.back_to_choice')}
                </button>
              </div>
              <form onSubmit={handle_submit} noValidate>
                <div className={styles.form_body}>
                  <h2 className={styles.form_title}>
                    {t('login.title', { role: t(`login.tab_${selected_role}`) })}
                  </h2>

                  {error && (
                    <div className={styles.error_banner} role="alert">{error}</div>
                  )}

                  <div className={styles.role_select_group}>
                    <label className={styles.role_select_label} htmlFor="staff_role">
                      {t('login.staff_role_label')}
                    </label>
                    <select
                      id="staff_role"
                      className={styles.role_select}
                      value={selected_role}
                      onChange={(e) => { set_selected_role(e.target.value); set_error(''); }}
                      disabled={loading}
                    >
                      {STAFF_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {t(`login.${r.key}`)}
                        </option>
                      ))}
                    </select>
                  </div>

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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
