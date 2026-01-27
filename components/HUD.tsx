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
    <div ref={canvasRef} className="absolute inset-0 pointer-events-none p-2 sm:p-4 md:p-8 flex flex-col justify-between z-10">
      
      {/* Top Bar */}
      <div className="flex justify-between items-start flex-wrap gap-2">
        <div className="flex flex-col gap-1 sm:gap-2">
            <div className="bg-slate-900/50 backdrop-blur px-2 sm:px-4 py-1 sm:py-2 rounded-lg border-l-4 border-amber-500 shadow-lg">
                <div className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-widest tabular-nums">
                    {score.toString().padStart(6, '0')}
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-slate-400">HI: {highScore}</div>
            </div>
            
            <div className="bg-slate-900/50 backdrop-blur px-2 sm:px-4 py-1 sm:py-2 rounded-lg flex items-center gap-2 text-amber-400 font-bold text-sm sm:text-lg md:text-xl shadow-lg w-fit">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-amber-400 flex items-center justify-center text-[10px] sm:text-xs">₪</div>
                <span>{coins}</span>
            </div>
        </div>

        {/* Combo */}
        {combo > 1 && (
            <div className="animate-bounce">
                <div className="bg-red-600 text-white font-black text-base sm:text-xl md:text-2xl px-2 sm:px-4 py-1 rounded -skew-x-12 shadow-xl border-2 border-white">
                    x{combo} COMBO!
                </div>
            </div>
        )}

        {/* Powerup Status */}
        <div className="flex gap-1 sm:gap-2">
            {powerups.shield && <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse text-xs sm:text-sm"><i className="fas fa-shield-alt"></i></div>}
            {powerups.magnet && <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse text-xs sm:text-sm"><i className="fas fa-magnet"></i></div>}
            {powerups.double && <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg animate-pulse text-xs sm:text-sm">x2</div>}
            {powerups.slow && <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-500 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse text-xs sm:text-sm"><i className="fas fa-clock"></i></div>}
        </div>
      </div>

      {/* Stage Indicator */}
      {currentStage && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-slate-900/80 backdrop-blur px-4 py-2 rounded-full border-2 border-amber-500 shadow-lg">
          <div className="text-white font-bold text-sm sm:text-lg">{currentStage}</div>
        </div>
      )}

      {/* Missions Panel - Better positioned and styled */}
      {missions.length > 0 && (
        <div className="absolute top-16 right-2 sm:right-4 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-lg p-3 rounded-xl border-2 border-amber-500/50 shadow-2xl max-w-[280px] sm:max-w-[320px]">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-amber-500/30">
            <i className="fas fa-tasks text-amber-400 text-sm"></i>
            <div className="text-amber-400 font-bold text-sm">משימות</div>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scroll">
            {missions.slice(0, 3).map(mission => (
              <div key={mission.id} className={`p-2 rounded-lg border transition-all ${
                mission.completed 
                  ? 'bg-gradient-to-r from-green-900/60 to-green-800/40 border-green-500/50 text-green-200 shadow-lg shadow-green-500/20' 
                  : 'bg-slate-800/60 border-slate-600/50 text-slate-200 hover:border-amber-500/50'
              }`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-medium leading-tight flex-1">{mission.description}</span>
                  {mission.completed && (
                    <i className="fas fa-check-circle text-green-400 text-sm flex-shrink-0"></i>
                  )}
                </div>
                {!mission.completed && (
                  <div className="mt-2 bg-slate-700/50 rounded-full h-1.5 overflow-hidden shadow-inner">
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

      {/* Mobile Controls - Arcade Style */}
      <div className="pointer-events-auto md:hidden flex justify-between items-end mt-auto px-2 pb-2 sm:pb-4">
        {/* Jump Button */}
        <button 
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); onJump(); }}
            onTouchEnd={(e) => { e.preventDefault(); }}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-b from-slate-600 to-slate-800 border-b-6 sm:border-b-8 border-slate-900 shadow-2xl active:border-b-0 active:translate-y-1 sm:active:translate-y-2 transition-all flex items-center justify-center group touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
        >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-700 border-3 sm:border-4 border-slate-500 flex items-center justify-center group-active:bg-slate-600">
               <i className="fas fa-arrow-up text-3xl sm:text-4xl text-white drop-shadow-md"></i>
            </div>
        </button>

        {/* Trick Buttons */}
        <div className="flex gap-2 sm:gap-4">
            <button 
                onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); onTrick('kickflip'); }} 
                onTouchEnd={(e) => { e.preventDefault(); }}
                className="flex flex-col items-center gap-1 group touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-blue-500 to-blue-700 border-b-3 sm:border-b-4 border-blue-900 shadow-lg active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center">
                    <i className="fas fa-undo text-xl sm:text-2xl text-white drop-shadow"></i>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-blue-300 drop-shadow-md tracking-wider">FLIP</span>
            </button>
            
            <button 
                onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); onTrick('superman'); }} 
                onTouchEnd={(e) => { e.preventDefault(); }}
                className="flex flex-col items-center gap-1 group touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-red-500 to-red-700 border-b-3 sm:border-b-4 border-red-900 shadow-lg active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center">
                    <i className="fas fa-plane text-xl sm:text-2xl text-white drop-shadow"></i>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-red-300 drop-shadow-md tracking-wider">SUPER</span>
            </button>
            
            <button 
                onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); onTrick('360'); }} 
                onTouchEnd={(e) => { e.preventDefault(); }}
                className="flex flex-col items-center gap-1 group touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-amber-500 to-amber-700 border-b-3 sm:border-b-4 border-amber-900 shadow-lg active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center">
                    <i className="fas fa-sync text-xl sm:text-2xl text-white drop-shadow"></i>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-amber-300 drop-shadow-md tracking-wider">360</span>
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

      {/* Logo - Bottom Right */}
      <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 pointer-events-none">
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