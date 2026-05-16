import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { AuthScreen, type AuthMode } from './components/AuthScreen';
import { FluidBackground } from './components/FluidBackground';
import { MicrosystemNetwork } from './components/MicrosystemNetwork';
import { clearAuthenticatedSession, getAuthenticatedSession } from './lib/auth';
import './App.css';

function App() {
  const [authenticatedEmail, setAuthenticatedEmail] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

  useEffect(() => {
    let isMounted = true;

    getAuthenticatedSession()
      .then((session) => {
        if (isMounted) {
          setAuthenticatedEmail(session.email);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAuthenticatedEmail(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="app-container">
      <FluidBackground />

      <div className="grid-line grid-v" style={{ left: '20%' }}></div>
      <div className="grid-line grid-v" style={{ left: '80%' }}></div>
      <div className="grid-line grid-h" style={{ top: '30%' }}></div>
      <div className="grid-line grid-h" style={{ top: '70%' }}></div>

      {isCheckingSession && <div className="auth-loading">Checking session...</div>}

      {!isCheckingSession && !authenticatedEmail && (
        <>
          <motion.main
            initial={{ opacity: 0, scale: 0.98, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="home-shell"
          >
            <section className="hero-content" aria-label="Agentic Microsystems overview">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="hero-title"
              >
                Agentic <br />
                Microsystems
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 1 }}
                className="hero-description"
              >
                Pioneering the next generation of distributed intelligence. Our micro-agent architecture
                enables AI systems that collaborate, reason, and adapt - creating a foundation for fully
                agentic, self-evolving digital ecosystems.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 1 }}
                className="status-badge"
              >
                <div className="line"></div>
                <span className="status-text">Evolution in Progress</span>
                <div className="line rev"></div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 0.8 }}
                className="home-actions"
              >
                <button type="button" className="primary-action" onClick={() => setAuthMode('login')}>
                  Sign in
                </button>
                <button type="button" className="secondary-action" onClick={() => setAuthMode('register')}>
                  Create account
                </button>
              </motion.div>
            </section>

          </motion.main>

          {authMode && (
            <div className="auth-overlay" role="presentation">
              <AuthScreen
                key={authMode}
                initialMode={authMode}
                onClose={() => setAuthMode(null)}
                onAuthenticated={(email) => {
                  setAuthenticatedEmail(email);
                  setAuthMode(null);
                }}
              />
            </div>
          )}
        </>
      )}

      {!isCheckingSession && authenticatedEmail && (
        <motion.main
          initial={{ opacity: 0, scale: 0.98, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="workspace-shell"
        >
          <header className="workspace-header">
            <span className="workspace-title">Agentic Microsystems</span>
            <button
              type="button"
              className="signout-button"
              onClick={async () => {
                await clearAuthenticatedSession();
                setAuthenticatedEmail(null);
              }}
            >
              Sign out
            </button>
          </header>

          <motion.div
            className="workspace-network"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.9, ease: 'easeOut' }}
          >
            <MicrosystemNetwork />
          </motion.div>
        </motion.main>
      )}
    </div>
  );
}

export default App;
