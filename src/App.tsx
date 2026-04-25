import { motion } from 'framer-motion';
import { FluidBackground } from './components/FluidBackground';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <FluidBackground />
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 1 }}
        className="sale-banner-container"
      >
        <div className="sale-banner">
          <div className="sale-dot"></div>
          <span className="sale-text">This site is for sale</span>
          <div className="sale-divider"></div>
          <a href="mailto:rijoe.c.mathew@gmail.com" className="sale-email">
            Contact for Inquiry
          </a>
        </div>
      </motion.div>

      {/* Dynamic Background Lines */}
      <div className="grid-line grid-v" style={{ left: '20%' }}></div>
      <div className="grid-line grid-v" style={{ left: '80%' }}></div>
      <div className="grid-line grid-h" style={{ top: '30%' }}></div>
      <div className="grid-line grid-h" style={{ top: '70%' }}></div>

      <motion.main 
        initial={{ opacity: 0, scale: 0.98, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="glass-container"
      >
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
          Pioneering the next generation of distributed intelligence. 
          Our micro‑agent architecture enables AI systems that collaborate, 
          reason, and adapt—creating a foundation for fully agentic, 
          self‑evolving digital ecosystems.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 1 }}
          className="status-badge"
        >
          <div className="line"></div>
          <span className="status-text">
            Evolution in Progress
          </span>
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
      </motion.main>
    </div>
  );
}

export default App;
