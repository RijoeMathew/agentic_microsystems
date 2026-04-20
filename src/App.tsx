import { motion } from 'framer-motion';
import { FluidBackground } from './components/FluidBackground';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <FluidBackground />
      
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
        <div className="pulse-node"></div>

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
      </motion.main>
    </div>
  );
}

export default App;
