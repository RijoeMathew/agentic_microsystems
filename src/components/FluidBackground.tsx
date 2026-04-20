import { useEffect, useRef } from 'react';

export const FluidBackground = () => {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (bgRef.current) {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        bgRef.current.style.setProperty('--mouse-x', `${x}%`);
        bgRef.current.style.setProperty('--mouse-y', `${y}%`);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={bgRef} className="fluid-bg">
      <div className="fluid-blob" style={{ top: '5%', left: '5%' }}></div>
      <div className="fluid-blob" style={{ top: '55%', left: '45%', animationDelay: '-7s', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)' }}></div>
      <div className="fluid-blob" style={{ top: '15%', left: '65%', animationDelay: '-12s', width: '35vw', height: '35vw' }}></div>
      
      {/* Interactive SVG Layer */}
      <svg style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.1, pointerEvents: 'none' }}>
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <circle cx="10%" cy="10%" r="2" fill="#38bdf8" />
        <circle cx="90%" cy="80%" r="2" fill="#38bdf8" />
        <line x1="10%" y1="10%" x2="90%" y2="80%" stroke="url(#lineGrad)" strokeWidth="0.5" />
      </svg>
    </div>
  );
};
