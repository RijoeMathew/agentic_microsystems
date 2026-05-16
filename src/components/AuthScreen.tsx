import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { authenticateUser, registerUser, validateEmail, validatePassword } from '../lib/auth';

export type AuthMode = 'login' | 'register';

type AuthScreenProps = {
  initialMode: AuthMode;
  onClose: () => void;
  onAuthenticated: (email: string) => void;
};

export function AuthScreen({ initialMode, onClose, onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (!validateEmail(email)) {
      setMessage('Enter a valid email address.');
      return;
    }

    if (!validatePassword(password)) {
      setMessage('Use at least 12 characters for the password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const authenticatedUser =
        mode === 'login' ? await authenticateUser(email, password) : await registerUser(email, password);
      onAuthenticated(authenticatedUser.email);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage('');
    setPassword('');
  }

  return (
    <motion.main
      initial={{ opacity: 0, scale: 0.98, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="auth-shell"
    >
      <section className="auth-brand" aria-label="Agentic Microsystems">
        <p className="auth-kicker">Agentic Microsystems</p>
        <h1>Secure access</h1>
        <p>Sign in to continue to the microsystem workspace.</p>
      </section>

      <section className="auth-panel" aria-label="Authentication">
        <button type="button" className="auth-close" aria-label="Close authentication" onClick={onClose}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'auth-tab auth-tab-active' : 'auth-tab'}
            onClick={() => switchMode('login')}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'auth-tab auth-tab-active' : 'auth-tab'}
            onClick={() => switchMode('register')}
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              type="text"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <span className="password-field">
              <input
                type={isPasswordVisible ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 12 characters"
                minLength={12}
                required
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                aria-pressed={isPasswordVisible}
                onClick={() => setIsPasswordVisible((currentValue) => !currentValue)}
              >
                {isPasswordVisible ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.2 0 8.7 4.6 9.8 6.3a3 3 0 0 1 0 3.4 14.8 14.8 0 0 1-3.2 3.6" />
                    <path d="M6.2 6.2A15.1 15.1 0 0 0 2.2 10.3a3 3 0 0 0 0 3.4C3.3 15.4 6.8 20 12 20a10.8 10.8 0 0 0 3.4-.5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2.2 10.3a3 3 0 0 0 0 3.4C3.3 15.4 6.8 20 12 20s8.7-4.6 9.8-6.3a3 3 0 0 0 0-3.4C20.7 8.6 17.2 4 12 4S3.3 8.6 2.2 10.3Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </span>
          </label>

          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className={message ? 'auth-message auth-message-visible' : 'auth-message'} aria-live="polite">
          {message}
        </p>
      </section>
    </motion.main>
  );
}
