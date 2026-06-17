import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api_request } from '../api/client';

/**
 * AuthContext — manages the authenticated session for the lifetime of the page.
 *
 * TOKEN STORAGE DECISION: in-memory React state only.
 *
 * Why NOT localStorage:
 *   Any JS executing on the page (including injected scripts via XSS) can read
 *   localStorage. For a system that handles citizen grievance data tied to
 *   identity, that is an unacceptable attack surface.
 *
 * Why NOT a regular cookie:
 *   A regular (non-httpOnly) cookie is also readable by JS. An httpOnly cookie
 *   set by the server would be the production-grade solution — the browser
 *   never exposes it to JS at all. However, this requires the backend to set
 *   the cookie on login and validate it server-side, which is a backend change
 *   not in scope for this task.
 *
 * Why in-memory (current approach):
 *   The token lives in a React useState variable inside a context provider. It
 *   is never written to any persistent store. It is lost on page refresh
 *   (acceptable for prototype phase). No JS outside this module can read it
 *   via the DOM, localStorage, or cookie APIs. The tradeoff is UX friction
 *   (refresh = re-login) which is acceptable for a government staff/citizen
 *   tool used in a controlled environment.
 *
 * Migration path to httpOnly cookies:
 *   Replace the token state with a boolean `authenticated` flag. The backend
 *   sets/clears the httpOnly cookie; the frontend just calls /auth/login and
 *   /auth/logout and tracks whether it's currently logged in. One file changes.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, set_token] = useState(null);
  const [user, set_user] = useState(null);

  const login = useCallback(async (email, password) => {
    const { data } = await api_request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    set_token(data.token);
    set_user(data.user);
    return data.user;
  }, []);

  // Stores a session that has already been validated by the caller.
  // Used by LoginPage to do a role-match check before committing state.
  const commit_session = useCallback((token_val, user_val) => {
    set_token(token_val);
    set_user(user_val);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api_request('/auth/logout', { method: 'POST', token });
    } catch {
      // Ignore network errors on logout — clear local state regardless.
    }
    set_token(null);
    set_user(null);
  }, [token]);

  const value = useMemo(
    () => ({ token, user, login, logout, commit_session, is_authenticated: !!token }),
    [token, user, login, logout, commit_session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
