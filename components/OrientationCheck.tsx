import React, { useState, useEffect } from 'react';

const OrientationCheck: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Check if mobile device or small screen
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth < 768;
      
      if (isMobile || isSmallScreen) {
        // Check orientation - use a small threshold to account for browser UI
        const isPortraitMode = window.innerHeight > window.innerWidth;
        setIsPortrait(isPortraitMode);
      } else {
        setIsPortrait(false);
      }
    };

    // Check immediately
    checkOrientation();
    
    // Also check after a delay to handle browser UI changes
    const timeoutId = setTimeout(checkOrientation, 300);
    
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', () => {
      setTimeout(checkOrientation, 100);
    });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 sm:p-8" style={{ width: '100vw', height: '100vh' }}>
      <div className="text-center max-w-md">
        <div className="mb-4 sm:mb-8">
          <i className="fas fa-mobile-alt text-4xl sm:text-6xl text-amber-400 mb-2 sm:mb-4 animate-pulse"></i>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 sm:mb-4">
          הטה את הטלפון לרוחב
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-4 sm:mb-6 px-4">
          המשחק עובד בצורה הטובה ביותר במצב landscape (רוחב)
        </p>
        <div className="flex justify-center">
          <i className="fas fa-arrows-alt-h text-3xl sm:text-4xl text-amber-400 animate-bounce"></i>
        </div>
      </div>
    </div>
  );
};

export default OrientationCheck;
