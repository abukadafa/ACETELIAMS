import React, { useState, useEffect } from 'react';

interface CrossfadeLogoProps {
  size?: number;
  className?: string;
  invert?: boolean;
}

const CrossfadeLogo: React.FC<CrossfadeLogoProps> = ({ size = 40, className, invert = false }) => {
  const [showNOUN, setShowNOUN] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowNOUN(prev => !prev);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: 'relative', width: size, height: size }} className={className}>
      <img
        src="https://nou.edu.ng/wp-content/uploads/2021/12/Logo-1.png"
        alt="NOUN"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity: showNOUN ? 1 : 0,
          transition: 'opacity 1s cubic-bezier(0.4, 0, 0.2, 1)',
          filter: invert ? 'brightness(0) invert(1) contrast(1.4) drop-shadow(0 2px 4px rgba(255,255,255,0.1))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.1)) contrast(1.1)',
          imageRendering: '-webkit-optimize-contrast',
          WebkitFontSmoothing: 'antialiased'
        }}
      />
      <img
        src="https://acetel.nou.edu.ng/wp-content/uploads/2022/12/logo.png"
        alt="ACETEL"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity: showNOUN ? 0 : 1,
          transition: 'opacity 1s cubic-bezier(0.4, 0, 0.2, 1)',
          filter: invert ? 'brightness(0) invert(1) contrast(1.4) drop-shadow(0 2px 4px rgba(255,255,255,0.1))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.1)) contrast(1.1)',
          imageRendering: '-webkit-optimize-contrast',
          WebkitFontSmoothing: 'antialiased'
        }}
      />
    </div>
  );
};

export default CrossfadeLogo;
