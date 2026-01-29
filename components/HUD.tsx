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
  tzedakahCoinCount?: number;
  hasTzedakahShield?: boolean;
  onJump: () => void;
  onTrick: (t: 'kickflip'|'superman'|'360') => void;
  onSlide?: () => void; // For swipe down
}

const HUD: React.FC<HUDProps> = ({ score, coins, combo, highScore, powerups, missions = [], currentStage, tzedakahCoinCount = 0, hasTzedakahShield = false, onJump, onTrick, onSlide }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  // Gesture handling for mobile - Tap to jump (backup handler)
  useEffect(() => {
    // Only add backup handler for mobile, buttons handle their own events
    if (window.innerWidth >= 768) {
      const handleTouchStart = (e: TouchEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button')) {
          return;
        }
        gestureService.handleTouchStart(e);
      };

      const handleTouchEnd = (e: TouchEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button')) {
          return;
        }
        gestureService.handleTouchEnd(e, {
          onSwipeUp: () => onJump(),
          onSwipeDown: () => onSlide?.(),
          onTap: () => {
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
    }
  }, [onJump, onTrick, onSlide]);

  return (
    <div ref={canvasRef} className="absolute inset-0 p-2 sm:p-3 md:p-4 lg:p-8 flex flex-col justify-between z-10" style={{ pointerEvents: 'none' }}>
      {/* Mobile Tap Area for Jump - Only on tap, not on scroll */}
      {(isMobile || window.innerWidth < 768) && (
      <div 
        className="absolute pointer-events-auto"
        style={{ 
          top: '10%', 
          bottom: '35%', 
          left: '0%', 
          right: '0%',
          touchAction: 'pan-y pan-x', // Allow scrolling
          WebkitTapHighlightColor: 'transparent',
          zIndex: 5,
          display: 'block'
        }}
        onTouchStart={(e) => {
          // Don't trigger if touching a button or UI element
          const target = e.target as HTMLElement;
          const isButton = target.closest('button');
          const isUI = target.closest('.bg-slate-900') || target.closest('.bg-gradient-to-br') || target.closest('.bg-gradient-to-b') || target.closest('.bg-slate-800');
          
          // Only handle tap, not scroll - let scrolling work naturally
          if (!isButton && !isUI && target === e.currentTarget && e.touches.length === 1) {
            // Store touch start for tap detection
            const touch = e.touches[0];
            (e.currentTarget as any).touchStart = { x: touch.clientX, y: touch.clientY, time: Date.now() };
          }
        }}
        onTouchEnd={(e) => {
          const target = e.target as HTMLElement;
          const isButton = target.closest('button');
          const isUI = target.closest('.bg-slate-900') || target.closest('.bg-gradient-to-br') || target.closest('.bg-gradient-to-b') || target.closest('.bg-slate-800');
          
          if (!isButton && !isUI && target === e.currentTarget) {
            const touchStart = (e.currentTarget as any).touchStart;
            if (touchStart) {
              const touch = e.changedTouches[0];
              const deltaX = Math.abs(touch.clientX - touchStart.x);
              const deltaY = Math.abs(touch.clientY - touchStart.y);
              const deltaTime = Date.now() - touchStart.time;
              
              // Only trigger jump if it's a tap (small movement, short time), not a scroll
              if (deltaX < 10 && deltaY < 10 && deltaTime < 300) {
                e.preventDefault();
                e.stopPropagation();
                onJump();
              }
            }
          }
        }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          const isButton = target.closest('button');
          const isUI = target.closest('.bg-slate-900') || target.closest('.bg-gradient-to-br') || target.closest('.bg-gradient-to-b') || target.closest('.bg-slate-800');
          
          if (!isButton && !isUI && target === e.currentTarget) {
            e.preventDefault();
            e.stopPropagation();
            onJump();
          }
        }}
      />
      )}
      
      {/* Top Bar */}
      <div className="flex justify-between items-start flex-wrap gap-2 sm:gap-3 pointer-events-none">
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
        <div className="flex gap-2 sm:gap-2.5 md:gap-3 items-center">
            {powerups.shield && <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse text-sm sm:text-base md:text-lg"><i className="fas fa-shield-alt"></i></div>}
            {powerups.magnet && <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse text-sm sm:text-base md:text-lg"><i className="fas fa-magnet"></i></div>}
            {powerups.double && <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg animate-pulse text-sm sm:text-base md:text-lg">x2</div>}
            {powerups.slow && <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-teal-500 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse text-sm sm:text-base md:text-lg"><i className="fas fa-clock"></i></div>}
            {/* Tzedakah Shield Heart */}
            {hasTzedakahShield && (
                <div className="flex items-center gap-1 sm:gap-1.5">
                    <img 
                        src="/heart_shield.png" 
                        alt="Tzedakah Shield" 
                        className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-14 object-contain animate-pulse"
                        onError={(e) => {
                            // Fallback if image doesn't exist - show a heart emoji
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            if (target.nextElementSibling) {
                                (target.nextElementSibling as HTMLElement).style.display = 'block';
                            }
                        }}
                    />
                    <div className="hidden text-red-500 text-2xl sm:text-3xl md:text-4xl animate-pulse">❤️</div>
                </div>
            )}
        </div>
      </div>

      {/* Tzedakah Box UI - Top Left (below score/coins) */}
      <div className="absolute top-24 sm:top-28 md:top-32 left-2 sm:left-3 md:left-4 flex flex-col items-center gap-1.5 sm:gap-2 pointer-events-none z-20">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl border-2 sm:border-3 border-amber-500/70 shadow-xl flex items-center gap-3 sm:gap-3.5 md:gap-4">
          <img 
            src="/tzedakah_box.png" 
            alt="Tzedakah Box" 
            className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain"
            onError={(e) => {
              // Fallback if image doesn't exist - show a box icon
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.nextElementSibling) {
                (target.nextElementSibling as HTMLElement).style.display = 'block';
              }
            }}
          />
          <div className="hidden text-amber-400 text-3xl sm:text-4xl md:text-5xl">📦</div>
          <div className="flex flex-col items-center">
            <div className="text-amber-400 font-bold text-sm sm:text-base md:text-lg">צדקה</div>
            <div className="text-white font-black text-base sm:text-lg md:text-xl lg:text-2xl tabular-nums">
              {tzedakahCoinCount} / 20
            </div>
          </div>
        </div>
      </div>

      {/* Stage Indicator */}
      {currentStage && (
        <div className="absolute top-16 sm:top-14 md:top-12 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-md px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full border-2 sm:border-3 border-amber-500 shadow-xl z-10">
          <div className="text-white font-bold text-base sm:text-lg md:text-xl lg:text-2xl">{currentStage}</div>
        </div>
      )}

      {/* Missions Panel - Hidden on mobile to avoid blocking game */}
      {missions.length > 0 && !isMobile && window.innerWidth >= 768 && (
        <div className="absolute top-40 sm:top-36 md:top-32 right-2 sm:right-3 md:right-4 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-lg p-2 sm:p-3 md:p-3 rounded-lg sm:rounded-xl border-2 border-amber-500/50 shadow-2xl max-w-[220px] sm:max-w-[260px] md:max-w-[280px]">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 pb-1.5 sm:pb-2 border-b border-amber-500/30">
            <i className="fas fa-tasks text-amber-400 text-sm sm:text-base md:text-lg"></i>
            <div className="text-amber-400 font-bold text-xs sm:text-sm md:text-base">משימות</div>
          </div>
          <div className="space-y-1.5 sm:space-y-2 max-h-[140px] sm:max-h-[160px] md:max-h-[180px] overflow-y-auto custom-scroll">
            {missions.slice(0, 3).map(mission => (
              <div key={mission.id} className={`p-1.5 sm:p-2 md:p-2 rounded-md sm:rounded-lg border-2 transition-all ${
                mission.completed 
                  ? 'bg-gradient-to-r from-green-900/60 to-green-800/40 border-green-500/50 text-green-200 shadow-lg shadow-green-500/20' 
                  : 'bg-slate-800/60 border-slate-600/50 text-slate-200 hover:border-amber-500/50'
              }`}>
                <div className="flex items-start justify-between gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
                  <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight flex-1">{mission.description}</span>
                  {mission.completed && (
                    <i className="fas fa-check-circle text-green-400 text-sm sm:text-base md:text-lg flex-shrink-0"></i>
                  )}
                </div>
                {!mission.completed && (
                  <div className="mt-1.5 sm:mt-2 bg-slate-700/50 rounded-full h-1.5 sm:h-2 overflow-hidden shadow-inner">
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

      {/* Mobile Controls - Compact and Small - ALWAYS VISIBLE ON MOBILE */}
      {(isMobile || window.innerWidth < 768) && (
      <div 
        className="flex justify-between items-end mt-auto px-1 sm:px-2 md:px-3 pb-1 sm:pb-2 md:pb-3 gap-1 sm:gap-1.5 md:gap-2 relative" 
        style={{ 
          pointerEvents: 'auto',
          zIndex: 1000,
          position: 'absolute',
          bottom: '5px',
          left: 0,
          right: 0,
          width: '100%',
          display: 'flex'
        }}
      >
        {/* Jump Button - Much Smaller for Mobile */}
        <button 
            onClick={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              onJump(); 
            }}
            onTouchStart={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              onJump(); 
            }}
            onTouchEnd={(e) => { e.preventDefault(); }}
            onMouseDown={(e) => { e.preventDefault(); }}
            className="rounded-full bg-gradient-to-b from-emerald-500 to-green-600 border-b-3 sm:border-b-4 border-green-800 shadow-xl active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center group relative"
            style={{ 
              WebkitTapHighlightColor: 'transparent', 
              width: '60px', 
              height: '60px', 
              minWidth: '60px', 
              minHeight: '60px',
              WebkitUserSelect: 'none',
              userSelect: 'none',
              cursor: 'pointer',
              touchAction: 'manipulation',
              pointerEvents: 'auto',
              zIndex: 1001
            }}
        >
            <div className="rounded-full bg-green-700 border-2 sm:border-3 border-green-900 flex items-center justify-center group-active:bg-green-600 transition-all" style={{ width: '55px', height: '55px' }}>
               <i className="fas fa-arrow-up text-2xl sm:text-3xl text-white drop-shadow-md"></i>
            </div>
        </button>

        {/* Trick Buttons - Much Smaller for Mobile */}
        <div className="flex gap-1 sm:gap-1.5 md:gap-2 relative" style={{ zIndex: 1001 }}>
            <button 
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  onTrick('kickflip'); 
                }}
                onTouchStart={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  onTrick('kickflip'); 
                }} 
                onTouchEnd={(e) => { e.preventDefault(); }}
                onMouseDown={(e) => { e.preventDefault(); }}
                className="flex flex-col items-center gap-0.5 sm:gap-1 group relative"
                style={{ 
                  WebkitTapHighlightColor: 'transparent', 
                  WebkitUserSelect: 'none', 
                  userSelect: 'none', 
                  cursor: 'pointer', 
                  touchAction: 'manipulation',
                  pointerEvents: 'auto',
                  zIndex: 1002
                }}
            >
                <div className="rounded-full bg-gradient-to-b from-blue-500 to-blue-700 border-b-3 sm:border-b-4 border-blue-900 shadow-lg active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center" style={{ width: '50px', height: '50px', minWidth: '50px', minHeight: '50px' }}>
                    <i className="fas fa-undo text-lg sm:text-xl text-white drop-shadow"></i>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-blue-300 drop-shadow-md tracking-wider">FLIP</span>
            </button>
            
            <button 
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  onTrick('superman'); 
                }}
                onTouchStart={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  onTrick('superman'); 
                }} 
                onTouchEnd={(e) => { e.preventDefault(); }}
                onMouseDown={(e) => { e.preventDefault(); }}
                className="flex flex-col items-center gap-0.5 sm:gap-1 group relative"
                style={{ 
                  WebkitTapHighlightColor: 'transparent', 
                  WebkitUserSelect: 'none', 
                  userSelect: 'none', 
                  cursor: 'pointer', 
                  touchAction: 'manipulation',
                  pointerEvents: 'auto',
                  zIndex: 1002
                }}
            >
                <div className="rounded-full bg-gradient-to-b from-red-500 to-red-700 border-b-3 sm:border-b-4 border-red-900 shadow-lg active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center" style={{ width: '50px', height: '50px', minWidth: '50px', minHeight: '50px' }}>
                    <i className="fas fa-plane text-lg sm:text-xl text-white drop-shadow"></i>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-red-300 drop-shadow-md tracking-wider">SUPER</span>
            </button>
            
            <button 
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  onTrick('360'); 
                }}
                onTouchStart={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  onTrick('360'); 
                }} 
                onTouchEnd={(e) => { e.preventDefault(); }}
                onMouseDown={(e) => { e.preventDefault(); }}
                className="flex flex-col items-center gap-0.5 sm:gap-1 group relative"
                style={{ 
                  WebkitTapHighlightColor: 'transparent', 
                  WebkitUserSelect: 'none', 
                  userSelect: 'none', 
                  cursor: 'pointer', 
                  touchAction: 'manipulation',
                  pointerEvents: 'auto',
                  zIndex: 1002
                }}
            >
                <div className="rounded-full bg-gradient-to-b from-amber-500 to-amber-700 border-b-3 sm:border-b-4 border-amber-900 shadow-lg active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center" style={{ width: '50px', height: '50px', minWidth: '50px', minHeight: '50px' }}>
                    <i className="fas fa-sync text-lg sm:text-xl text-white drop-shadow"></i>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-amber-300 drop-shadow-md tracking-wider">360</span>
            </button>
        </div>
      </div>
      )}

      {/* Desktop Hints */}
      <div className="hidden md:flex justify-between items-end pointer-events-auto">
         <div className="bg-black/40 backdrop-blur px-4 py-2 rounded-full text-white/70 text-sm font-bold border border-white/10">Space = Jump</div>
         <div className="flex gap-4">
             <button onClick={() => onTrick('kickflip')} className="bg-slate-800/80 hover:bg-slate-700 text-white px-6 py-2 rounded-full border border-white/10 font-bold shadow-lg transition">A - Kickflip</button>
             <button onClick={() => onTrick('superman')} className="bg-slate-800/80 hover:bg-slate-700 text-white px-6 py-2 rounded-full border border-white/10 font-bold shadow-lg transition">S - Superman</button>
             <button onClick={() => onTrick('360')} className="bg-slate-800/80 hover:bg-slate-700 text-white px-6 py-2 rounded-full border border-white/10 font-bold shadow-lg transition">D - 360</button>
         </div>
      </div>

    </div>
  );
};

export default HUD;