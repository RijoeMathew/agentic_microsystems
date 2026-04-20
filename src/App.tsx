import { motion } from 'framer-motion';
import { FluidBackground } from './components/FluidBackground';
import './App.css';

function App() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      <FluidBackground />
      
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="glass-container relative z-10 flex flex-col items-center text-center max-w-4xl"
      >
        <div className="mb-8">
          <div className="pulse-node mx-auto"></div>
        </div>

        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="hero-title"
        >
          Agentic <br />
          Microsystems
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
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
          transition={{ delay: 1, duration: 1 }}
          className="mt-12 flex gap-4"
        >
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-sky-400 self-center"></div>
          <span className="text-[10px] uppercase tracking-[0.4em] text-sky-400 font-bold">
            Evolution in Progress
          </span>
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-sky-400 self-center"></div>
        </motion.div>
      </motion.main>

      {/* Futuristic decorative lines */}
      <div className="absolute top-0 left-1/4 w-[1px] h-full bg-white/5 pointer-events-none"></div>
      <div className="absolute top-0 right-1/4 w-[1px] h-full bg-white/5 pointer-events-none"></div>
    </div>
  );
}

export default App;
