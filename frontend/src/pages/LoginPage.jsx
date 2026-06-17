import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Input, Card } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { login, is_authenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, set_email] = useState('');
  const [password, set_password] = useState('');
  const [error, set_error] = useState('');
  const [loading, set_loading] = useState(false);

  // If already authenticated, redirect away immediately
  if (is_authenticated && user) {
    const dest = user.role === 'citizen' ? '/grievances/mine' : '/';
    navigate(dest, { replace: true });
    return null;
  }

  async function handle_submit(e) {
    e.preventDefault();
    set_error('');
    set_loading(true);

    try {
      const logged_in_user = await login(email.trim(), password);
      const from = location.state?.from?.pathname;
      const dest = from ?? (logged_in_user.role === 'citizen' ? '/grievances/mine' : '/');
      navigate(dest, { replace: true });
    } catch (err) {
      // Show inline error — never a browser alert()
      set_error(err.message ?? 'Login failed. Please try again.');
    } finally {
      set_loading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.heading_block}>
          <h1 className={styles.app_name}>GrievanceID</h1>
          <p className={styles.app_subtitle}>
            Citizen Grievance Management Platform
          </p>
        </div>

        <Card>
          <form onSubmit={handle_submit} noValidate>
            <div className={styles.form_body}>
              <h2 className={styles.form_title}>Sign in to your account</h2>

              {error && (
                <div className={styles.error_banner} role="alert">
                  {error}
                </div>
              )}

              <Input
                id="email"
                type="email"
                label="Email address"
                autoComplete="email"
                value={email}
                onChange={(e) => set_email(e.target.value)}
                required
                disabled={loading}
              />

              <Input
                id="password"
                type="password"
                label="Password"
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
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
