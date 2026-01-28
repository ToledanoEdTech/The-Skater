import React from 'react';
import { CHARACTERS } from '../constants';
import { CharacterConfig } from '../types';

interface MenuProps {
  onStart: (char: CharacterConfig) => void;
  onOpenShop: () => void;
  onOpenLeaderboard: () => void;
  wallet: number;
}

const CharacterAvatar = ({ char }: { char: CharacterConfig }) => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 drop-shadow-lg">
     <defs>
        <clipPath id="circleView">
            <circle cx="50" cy="50" r="45" />
        </clipPath>
     </defs>
     <g clipPath="url(#circleView)">
         {/* Background */}
         <rect x="0" y="0" width="100" height="100" fill="#cbd5e1" />
         
         {/* Body/Shirt */}
         <path d="M20 90 Q50 110 80 90 L80 100 L20 100 Z" fill={char.shirt} />
         <path d="M20 90 Q20 70 30 65 L70 65 Q80 70 80 90" fill={char.shirt} />

         {/* Neck */}
         <rect x="42" y="55" width="16" height="15" fill={char.skin} />

         {/* Head with shading */}
         <defs>
            <radialGradient id={`headGrad-${char.id}`} cx="50%" cy="40%">
               <stop offset="0%" stopColor={char.skin} stopOpacity="1" />
               <stop offset="100%" stopColor={char.skin} stopOpacity="0.8" />
            </radialGradient>
         </defs>
         <circle cx="50" cy="45" r="22" fill={`url(#headGrad-${char.id})`} />
         
         {/* Face shading for depth */}
         <ellipse cx="38" cy="45" rx="8" ry="12" fill="rgba(0,0,0,0.1)" />
         <ellipse cx="62" cy="45" rx="8" ry="12" fill="rgba(0,0,0,0.1)" />
         <ellipse cx="50" cy="35" rx="10" ry="6" fill="rgba(255,255,255,0.2)" />
         
         {/* Premium Beard */}
         {char.beard && (
             <g>
                <defs>
                   <linearGradient id={`beardGrad-${char.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#d5d5d5" />
                      <stop offset="50%" stopColor="#ecf0f1" />
                      <stop offset="100%" stopColor="#c0c0c0" />
                   </linearGradient>
                </defs>
                <path d="M28 45 Q28 70 50 78 Q72 70 72 45" fill={`url(#beardGrad-${char.id})`} />
                <path d="M28 45 Q28 70 50 78 Q72 70 72 45" stroke="#a0a0a0" strokeWidth="1" fill="none" />
             </g>
         )}

         {/* Premium Eyes - Detailed */}
         {char.uniqueFeature === 'glasses' ? (
            <g>
               {/* Glasses lenses */}
               <circle cx="41" cy="40" r="5" fill="rgba(100,150,200,0.3)" stroke="#1a1a1a" strokeWidth="2" />
               <circle cx="59" cy="40" r="5" fill="rgba(100,150,200,0.3)" stroke="#1a1a1a" strokeWidth="2" />
               <rect x="46" y="39" width="8" height="2" fill="#1a1a1a" />
            </g>
         ) : (
            <g>
               {/* Eye whites */}
               <ellipse cx="41" cy="40" rx="3.5" ry="2.8" fill="#ffffff" />
               <ellipse cx="59" cy="40" rx="3.5" ry="2.8" fill="#ffffff" />
               
               {/* Iris */}
               <circle cx="41" cy="40" r="2" fill="#2c1810" />
               <circle cx="59" cy="40" r="2" fill="#2c1810" />
               
               {/* Pupil */}
               <circle cx="41" cy="40" r="1.2" fill="#000000" />
               <circle cx="59" cy="40" r="1.2" fill="#000000" />
               
               {/* Eye highlights */}
               <circle cx="40.2" cy="39.2" r="0.8" fill="#ffffff" />
               <circle cx="58.2" cy="39.2" r="0.8" fill="#ffffff" />
               
               {/* Eyebrows */}
               <path d="M35 35 Q41 33 47 35" stroke={char.hair === '#ecf0f1' || char.hair === '#ffffff' ? '#8b8b8b' : char.hair} strokeWidth="3" strokeLinecap="round" fill="none" />
               <path d="M53 35 Q59 33 65 35" stroke={char.hair === '#ecf0f1' || char.hair === '#ffffff' ? '#8b8b8b' : char.hair} strokeWidth="3" strokeLinecap="round" fill="none" />
            </g>
         )}

         {/* Premium Nose */}
         <ellipse cx="50" cy="48" rx="1.5" ry="2" fill="rgba(0,0,0,0.15)" />
         <path d="M48.5 46 Q50 48 51.5 46" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" fill="none" />

         {/* Premium Mouth */}
         {!char.beard && char.uniqueFeature !== 'mustache' && (
            <g>
               <path d="M45 55 Q50 58 55 55" stroke="rgba(139,69,19,0.6)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
               <ellipse cx="50" cy="55.5" rx="4" ry="1.5" fill="rgba(139,69,19,0.3)" />
            </g>
         )}
         
         {/* Mustache */}
         {char.uniqueFeature === 'mustache' && (
            <path d="M42 52 Q45 50 50 52 Q55 50 58 52 Q58 54 54 55 Q50 54 50 54 Q50 54 46 55 Q42 54 42 52" 
                  fill={char.hair} stroke={char.hair} strokeWidth="0.5" />
         )}

         {/* Hair / Hat */}
         {char.type === 'hat' ? (
             <g>
                 <ellipse cx="50" cy="35" rx="30" ry="8" fill="#111" />
                 <path d="M35 35 L38 15 L62 15 L65 35 Z" fill="#111" />
                 <rect x="36" y="30" width="28" height="4" fill="#333" />
             </g>
         ) : (
             <g>
                <path d="M30 40 Q50 20 70 40 L70 30 Q50 10 30 30 Z" fill={char.hair} />
                {char.type === 'kippah' && (
                    <ellipse cx="50" cy="25" rx="12" ry="6" fill="#fff" stroke="#3b82f6" strokeWidth="1" />
                )}
             </g>
         )}
     </g>
     <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
  </svg>
);

const Menu: React.FC<MenuProps> = ({ onStart, onOpenShop, onOpenLeaderboard, wallet }) => {
  const [selectedCharId, setSelectedCharId] = React.useState(CHARACTERS[0].id);
  const selectedChar = CHARACTERS.find(c => c.id === selectedCharId) || CHARACTERS[0];

  return (
    <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-1 sm:p-2 md:p-3 lg:p-4 text-white z-20 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y' }}>
      
      {/* Logo - Only in Menu */}
      <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 right-2 sm:right-3 md:right-4 pointer-events-none z-30">
        <img 
          src="/logo.png" 
          alt="Logo" 
          className="h-8 sm:h-10 md:h-12 lg:h-16 opacity-70 hover:opacity-100 transition-opacity drop-shadow-2xl"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
      
      {/* Title with Gradient and Stroke - Much Smaller on Mobile */}
      <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 via-orange-500 to-red-600 mb-0.5 sm:mb-1 md:mb-2 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] transform -rotate-2 text-center px-2">
        הסקייטר הצדיק
      </h1>
      <div className="text-[10px] sm:text-xs md:text-sm lg:text-base text-yellow-400 font-bold tracking-[0.1em] sm:tracking-[0.2em] md:tracking-[0.3em] mb-1 sm:mb-2 md:mb-3 uppercase drop-shadow-md text-center">Pro Edition</div>

      {/* Wallet Widget - Much Smaller on Mobile */}
      <div className="absolute top-1 sm:top-2 md:top-3 lg:top-4 left-1 sm:left-2 md:left-3 lg:left-4 flex items-center gap-1 sm:gap-1.5 md:gap-2 bg-slate-800/90 px-1.5 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-2 rounded-md sm:rounded-lg md:rounded-xl border-2 border-yellow-500/30 shadow-xl backdrop-blur">
        <div className="bg-yellow-500 rounded-full w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex items-center justify-center text-slate-900 font-bold text-[10px] sm:text-xs md:text-sm">₪</div>
        <span className="font-mono text-sm sm:text-base md:text-lg lg:text-xl font-bold text-yellow-100">{wallet}</span>
      </div>

      <div className="mb-1 sm:mb-1.5 md:mb-2 text-slate-400 text-[10px] sm:text-xs md:text-sm uppercase tracking-widest font-bold text-center">בחר את הצדיק שלך</div>

      {/* Character Grid - Much Smaller on Mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 mb-2 sm:mb-3 md:mb-4 max-w-5xl p-0.5 sm:p-1 md:p-2 w-full">
        {CHARACTERS.map(char => (
            <button
                key={char.id}
                onClick={() => setSelectedCharId(char.id)}
                className={`relative group flex flex-col items-center p-1.5 sm:p-2 md:p-3 rounded-md sm:rounded-lg md:rounded-xl border-2 transition-all duration-300 transform touch-manipulation ${
                    selectedCharId === char.id 
                    ? 'border-yellow-400 bg-slate-800 scale-105 shadow-[0_0_30px_rgba(250,204,21,0.4)] z-10' 
                    : 'border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:-translate-y-1 hover:border-slate-500 opacity-80 hover:opacity-100 active:scale-95'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                <CharacterAvatar char={char} />
                <span className={`mt-0.5 sm:mt-1 font-bold text-[9px] sm:text-[10px] md:text-xs text-center transition-colors ${selectedCharId === char.id ? 'text-yellow-400' : 'text-slate-400 group-hover:text-white'}`}>
                    {char.name}
                </span>
                {selectedCharId === char.id && (
                    <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-yellow-500 text-slate-900 rounded-full w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex items-center justify-center shadow-lg">
                        <i className="fas fa-check text-[7px] sm:text-[8px] md:text-xs"></i>
                    </div>
                )}
            </button>
        ))}
      </div>

      {/* Main Actions - Much Smaller on Mobile */}
      <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 md:gap-3 w-full max-w-2xl px-1 sm:px-2">
        <button 
            onClick={() => onStart(selectedChar)}
            className="flex-[2] bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black py-2 sm:py-2.5 md:py-3 lg:py-4 px-3 sm:px-4 md:px-6 lg:px-8 rounded-md sm:rounded-lg md:rounded-xl text-xs sm:text-sm md:text-base lg:text-xl shadow-[0_10px_20px_rgba(16,185,129,0.3)] transform transition active:scale-95 flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 border-b-2 sm:border-b-3 border-green-800 touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
        >
            <i className="fas fa-play text-xs sm:text-sm md:text-base"></i> <span>התחל משחק</span>
        </button>
        
        <div className="flex flex-1 gap-1 sm:gap-1.5 md:gap-2">
            <button 
                onClick={onOpenShop}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-amber-400 font-bold py-2 sm:py-2.5 md:py-3 lg:py-4 rounded-md sm:rounded-lg md:rounded-xl text-sm sm:text-base md:text-xl lg:text-2xl shadow-lg transition active:scale-95 border-b-2 sm:border-b-3 border-slate-900 flex items-center justify-center touch-manipulation"
                title="חנות"
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                <i className="fas fa-store"></i>
            </button>
            <button 
                onClick={onOpenLeaderboard}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-blue-400 font-bold py-2 sm:py-2.5 md:py-3 lg:py-4 rounded-md sm:rounded-lg md:rounded-xl text-sm sm:text-base md:text-xl lg:text-2xl shadow-lg transition active:scale-95 border-b-2 sm:border-b-3 border-slate-900 flex items-center justify-center touch-manipulation"
                title="טבלה"
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                <i className="fas fa-trophy"></i>
            </button>
        </div>
      </div>
    </div>
  );
};

export default Menu;