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
      <div className="fluid-blob" style={{ top: '10%', left: '10%' }}></div>
      <div className="fluid-blob" style={{ top: '60%', left: '50%', animationDelay: '-5s', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(56, 189, 248, 0.15) 100%)' }}></div>
      <div className="fluid-blob" style={{ top: '20%', left: '70%', animationDelay: '-10s', width: '40vw', height: '40vw' }}></div>
    </div>
  );
};
