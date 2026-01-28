import React, { useEffect, useRef } from 'react';
import { PowerUpState, Mission } from '../types';
import { gestureService } from '../services/gestureService';

interface HUDProps {
  score: number;
  coins: number;
  combo: number;
  highScore: number;
  powerups: PowerUpState;
  missions?: Mission[];
  currentStage?: string;
  onJump: () => void;
  onTrick: (t: 'kickflip'|'superman'|'360') => void;
  onSlide?: () => void; // For swipe down
}

const HUD: React.FC<HUDProps> = ({ score, coins, combo, highScore, powerups, missions = [], currentStage, onJump, onTrick, onSlide }) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Gesture handling for mobile
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      gestureService.handleTouchStart(e);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      gestureService.handleTouchEnd(e, {
        onSwipeUp: () => onJump(),
        onSwipeDown: () => onSlide?.(),
        onTap: () => {
          // Tap anywhere on screen performs a trick
          if (Math.random() > 0.5) {
            onTrick('kickflip');
          } else {
            onTrick('360');
          }
        }
      });
    };

    const element = canvasRef.current || document.body;
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onJump, onTrick, onSlide]);

  return (
    <div ref={canvasRef} className="absolute inset-0 pointer-events-none p-2 sm:p-3 md:p-4 lg:p-8 flex flex-col justify-between z-10">
      
      {/* Top Bar */}
      <div className="flex justify-between items-start flex-wrap gap-2 sm:gap-3">
        <div className="flex flex-col gap-1.5 sm:gap-2">
            <div className="bg-slate-900/70 backdrop-blur-md px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl border-l-4 border-amber-500 shadow-xl">
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-widest tabular-nums">
                    {score.toString().padStart(6, '0')}
                </div>
                <div className="text-xs sm:text-sm md:text-base font-bold text-slate-300">HI: {highScore}</div>
            </div>
            
            <div className="bg-slate-900/70 backdrop-blur-md px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl flex items-center gap-2 sm:gap-3 text-amber-400 font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl shadow-xl w-fit">
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full border-2 sm:border-3 border-amber-400 flex items-center justify-center text-xs sm:text-sm md:text-base">₪</div>
                <span>{coins}</span>
            </div>
        </div>

        {/* Combo */}
        {combo > 1 && (
            <div className="animate-bounce">
                <div className="bg-red-600 text-white font-black text-lg sm:text-xl md:text-2xl lg:text-3xl px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-lg -skew-x-12 shadow-xl border-2 sm:border-3 border-white">
                    x{combo} COMBO!
                </div>
            </div>
        )}

        {/* Powerup Status */}
        <div className="flex gap-2 sm:gap-2.5 md:gap-3">
            {powerups.shield && <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse text-sm sm:text-base md:text-lg"><i className="fas fa-shield-alt"></i></div>}
            {powerups.magnet && <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse text-sm sm:text-base md:text-lg"><i className="fas fa-magnet"></i></div>}
            {powerups.double && <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg animate-pulse text-sm sm:text-base md:text-lg">x2</div>}
            {powerups.slow && <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-teal-500 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse text-sm sm:text-base md:text-lg"><i className="fas fa-clock"></i></div>}
        </div>
      </div>

      {/* Stage Indicator */}
      {currentStage && (
        <div className="absolute top-24 sm:top-20 md:top-16 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-md px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full border-2 sm:border-3 border-amber-500 shadow-xl">
          <div className="text-white font-bold text-base sm:text-lg md:text-xl lg:text-2xl">{currentStage}</div>
        </div>
      )}

      {/* Missions Panel - Better positioned and styled */}
      {missions.length > 0 && (
        <div className="absolute top-20 sm:top-16 md:top-14 right-2 sm:right-3 md:right-4 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-lg p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border-2 sm:border-3 border-amber-500/50 shadow-2xl max-w-[260px] sm:max-w-[300px] md:max-w-[340px]">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 pb-2 sm:pb-2.5 border-b border-amber-500/30">
            <i className="fas fa-tasks text-amber-400 text-base sm:text-lg md:text-xl"></i>
            <div className="text-amber-400 font-bold text-sm sm:text-base md:text-lg">משימות</div>
          </div>
          <div className="space-y-2 sm:space-y-2.5 max-h-[180px] sm:max-h-[220px] md:max-h-[240px] overflow-y-auto custom-scroll">
            {missions.slice(0, 3).map(mission => (
              <div key={mission.id} className={`p-2.5 sm:p-3 md:p-3.5 rounded-lg sm:rounded-xl border-2 transition-all ${
                mission.completed 
                  ? 'bg-gradient-to-r from-green-900/60 to-green-800/40 border-green-500/50 text-green-200 shadow-lg shadow-green-500/20' 
                  : 'bg-slate-800/60 border-slate-600/50 text-slate-200 hover:border-amber-500/50'
              }`}>
                <div className="flex items-start justify-between gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                  <span className="text-xs sm:text-sm md:text-base font-medium leading-tight flex-1">{mission.description}</span>
                  {mission.completed && (
                    <i className="fas fa-check-circle text-green-400 text-base sm:text-lg md:text-xl flex-shrink-0"></i>
                  )}
                </div>
                {!mission.completed && (
                  <div className="mt-2 sm:mt-2.5 bg-slate-700/50 rounded-full h-2 sm:h-2.5 overflow-hidden shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-amber-400 h-full transition-all duration-500 shadow-sm"
                      style={{ width: `${Math.min((mission.progress / mission.target) * 100, 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Controls - Arcade Style - Much Larger for Mobile */}
      <div className="pointer-events-auto md:hidden flex justify-between items-end mt-auto px-3 sm:px-4 pb-3 sm:pb-4 md:pb-6 gap-3 sm:gap-4">
        {/* Jump Button - Larger */}
        <button 
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); onJump(); }}
            onTouchEnd={(e) => { e.preventDefault(); }}
            className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-b from-slate-600 to-slate-800 border-b-6 sm:border-b-8 md:border-b-10 border-slate-900 shadow-2xl active:border-b-0 active:translate-y-2 sm:active:translate-y-3 transition-all flex items-center justify-center group touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent', minWidth: '96px', minHeight: '96px' }}
        >
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-slate-700 border-3 sm:border-4 md:border-5 border-slate-500 flex items-center justify-center group-active:bg-slate-600">
               <i className="fas fa-arrow-up text-4xl sm:text-5xl md:text-6xl text-white drop-shadow-md"></i>
            </div>
        </button>

        {/* Trick Buttons - Larger */}
        <div className="flex gap-3 sm:gap-4 md:gap-5">
            <button 
                onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); onTrick('kickflip'); }} 
                onTouchEnd={(e) => { e.preventDefault(); }}
                className="flex flex-col items-center gap-1.5 sm:gap-2 group touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                <div className="rounded-full bg-gradient-to-b from-blue-500 to-blue-700 border-b-4 sm:border-b-5 md:border-b-6 border-blue-900 shadow-xl active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center" style={{ width: '72px', height: '72px', minWidth: '72px', minHeight: '72px' }}>
                    <i className="fas fa-undo text-2xl sm:text-3xl md:text-4xl text-white drop-shadow"></i>
                </div>
                <span className="text-xs sm:text-sm md:text-base font-bold text-blue-300 drop-shadow-md tracking-wider">FLIP</span>
            </button>
            
            <button 
                onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); onTrick('superman'); }} 
                onTouchEnd={(e) => { e.preventDefault(); }}
                className="flex flex-col items-center gap-1.5 sm:gap-2 group touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                <div className="rounded-full bg-gradient-to-b from-red-500 to-red-700 border-b-4 sm:border-b-5 md:border-b-6 border-red-900 shadow-xl active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center" style={{ width: '72px', height: '72px', minWidth: '72px', minHeight: '72px' }}>
                    <i className="fas fa-plane text-2xl sm:text-3xl md:text-4xl text-white drop-shadow"></i>
                </div>
                <span className="text-xs sm:text-sm md:text-base font-bold text-red-300 drop-shadow-md tracking-wider">SUPER</span>
            </button>
            
            <button 
                onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); onTrick('360'); }} 
                onTouchEnd={(e) => { e.preventDefault(); }}
                className="flex flex-col items-center gap-1.5 sm:gap-2 group touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                <div className="rounded-full bg-gradient-to-b from-amber-500 to-amber-700 border-b-4 sm:border-b-5 md:border-b-6 border-amber-900 shadow-xl active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center" style={{ width: '72px', height: '72px', minWidth: '72px', minHeight: '72px' }}>
                    <i className="fas fa-sync text-2xl sm:text-3xl md:text-4xl text-white drop-shadow"></i>
                </div>
                <span className="text-xs sm:text-sm md:text-base font-bold text-amber-300 drop-shadow-md tracking-wider">360</span>
            </button>
        </div>
      </div>

      {/* Desktop Hints */}
      <div className="hidden md:flex justify-between items-end pointer-events-auto">
         <div className="bg-black/40 backdrop-blur px-4 py-2 rounded-full text-white/70 text-sm font-bold border border-white/10">Space = Jump</div>
         <div className="flex gap-4">
             <button onClick={() => onTrick('kickflip')} className="bg-slate-800/80 hover:bg-slate-700 text-white px-6 py-2 rounded-full border border-white/10 font-bold shadow-lg transition">A - Kickflip</button>
             <button onClick={() => onTrick('superman')} className="bg-slate-800/80 hover:bg-slate-700 text-white px-6 py-2 rounded-full border border-white/10 font-bold shadow-lg transition">S - Superman</button>
             <button onClick={() => onTrick('360')} className="bg-slate-800/80 hover:bg-slate-700 text-white px-6 py-2 rounded-full border border-white/10 font-bold shadow-lg transition">D - 360</button>
         </div>
      </div>

      {/* Logo - Bottom Right - Hidden on mobile to save space */}
      <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 pointer-events-none hidden sm:block">
        <img 
          src="/logo.png" 
          alt="Logo" 
          className="h-12 sm:h-16 md:h-20 opacity-80 hover:opacity-100 transition-opacity drop-shadow-lg"
          onError={(e) => {
            // Hide logo if image doesn't exist
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    </div>
  );
};

export default HUD;