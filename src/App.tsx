import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { FluidBackground } from './components/FluidBackground';
import { MicrosystemNetwork } from './components/MicrosystemNetwork';
import { clearAuthenticatedSession, getAuthenticatedSession } from './lib/auth';
import './App.css';

function App() {
  const [authenticatedEmail, setAuthenticatedEmail] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

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

      {!isCheckingSession && !authenticatedEmail && <AuthScreen onAuthenticated={setAuthenticatedEmail} />}

      {!isCheckingSession && authenticatedEmail && (
        <motion.main
          initial={{ opacity: 0, scale: 0.98, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="glass-container"
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

            <motion.a
              href="mailto:rijoe.c.mathew@gmail.com"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.8 }}
              className="contact-link"
            >
              Get in Touch
              <svg className="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </motion.a>

            <button
              type="button"
              className="logout-link"
              onClick={async () => {
                await clearAuthenticatedSession();
                setAuthenticatedEmail(null);
              }}
            >
              Sign out
            </button>
          </section>

          <motion.div
            className="hero-network"
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
