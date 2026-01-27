import React, { useState, useEffect } from 'react';

const OrientationCheck: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Check if mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Check orientation
        const isPortraitMode = window.innerHeight > window.innerWidth;
        setIsPortrait(isPortraitMode);
      } else {
        setIsPortrait(false);
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <i className="fas fa-mobile-alt text-6xl text-amber-400 mb-4 animate-pulse"></i>
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
          הטה את הטלפון לרוחב
        </h2>
        <p className="text-xl text-slate-300 mb-6">
          המשחק עובד בצורה הטובה ביותר במצב landscape (רוחב)
        </p>
        <div className="flex justify-center">
          <i className="fas fa-arrows-alt-h text-4xl text-amber-400 animate-bounce"></i>
        </div>
      </div>
    </div>
  );
};

export default OrientationCheck;
