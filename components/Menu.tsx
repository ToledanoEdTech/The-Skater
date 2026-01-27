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
  <svg viewBox="0 0 100 100" className="w-20 h-20 drop-shadow-lg">
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

         {/* Head */}
         <circle cx="50" cy="45" r="22" fill={char.skin} />
         
         {/* Beard */}
         {char.beard && (
             <path d="M28 45 Q28 75 50 78 Q72 75 72 45" fill="#ecf0f1" />
         )}

         {/* Eyes (Sunglasses) */}
         <rect x="35" y="40" width="12" height="6" rx="2" fill="#111" />
         <rect x="53" y="40" width="12" height="6" rx="2" fill="#111" />
         <line x1="47" y1="43" x2="53" y2="43" stroke="#111" strokeWidth="2" />

         {/* Smile */}
         {!char.beard && (
             <path d="M45 58 Q50 62 55 58" stroke="#000" strokeWidth="2" fill="none" />
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
    <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white z-20">
      
      {/* Title with Gradient and Stroke */}
      <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 via-orange-500 to-red-600 mb-2 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] transform -rotate-2">
        הסקייטר הצדיק
      </h1>
      <div className="text-2xl text-yellow-400 font-bold tracking-[0.5em] mb-10 uppercase drop-shadow-md">Pro Edition</div>

      {/* Wallet Widget */}
      <div className="absolute top-8 left-8 flex items-center gap-3 bg-slate-800/90 px-6 py-3 rounded-2xl border border-yellow-500/30 shadow-2xl backdrop-blur">
        <div className="bg-yellow-500 rounded-full w-8 h-8 flex items-center justify-center text-slate-900 font-bold">₪</div>
        <span className="font-mono text-2xl font-bold text-yellow-100">{wallet}</span>
      </div>

      <div className="mb-4 text-slate-400 text-sm uppercase tracking-widest font-bold">בחר את הצדיק שלך</div>

      {/* Character Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-5xl p-4">
        {CHARACTERS.map(char => (
            <button
                key={char.id}
                onClick={() => setSelectedCharId(char.id)}
                className={`relative group flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-300 transform ${
                    selectedCharId === char.id 
                    ? 'border-yellow-400 bg-slate-800 scale-110 shadow-[0_0_30px_rgba(250,204,21,0.4)] z-10' 
                    : 'border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:-translate-y-1 hover:border-slate-500 opacity-80 hover:opacity-100'
                }`}
            >
                <CharacterAvatar char={char} />
                <span className={`mt-3 font-bold text-sm text-center transition-colors ${selectedCharId === char.id ? 'text-yellow-400' : 'text-slate-400 group-hover:text-white'}`}>
                    {char.name}
                </span>
                {selectedCharId === char.id && (
                    <div className="absolute -top-3 -right-3 bg-yellow-500 text-slate-900 rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                        <i className="fas fa-check"></i>
                    </div>
                )}
            </button>
        ))}
      </div>

      {/* Main Actions */}
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl">
        <button 
            onClick={() => onStart(selectedChar)}
            className="flex-[2] bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black py-5 px-10 rounded-2xl text-3xl shadow-[0_10px_20px_rgba(16,185,129,0.3)] transform transition active:scale-95 flex items-center justify-center gap-4 border-b-4 border-green-800"
        >
            <i className="fas fa-play"></i> התחל משחק
        </button>
        
        <div className="flex flex-1 gap-4">
            <button 
                onClick={onOpenShop}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-amber-400 font-bold py-4 rounded-2xl text-2xl shadow-lg transition active:scale-95 border-b-4 border-slate-900 flex items-center justify-center"
                title="חנות"
            >
                <i className="fas fa-store"></i>
            </button>
            <button 
                onClick={onOpenLeaderboard}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-blue-400 font-bold py-4 rounded-2xl text-2xl shadow-lg transition active:scale-95 border-b-4 border-slate-900 flex items-center justify-center"
                title="טבלה"
            >
                <i className="fas fa-trophy"></i>
            </button>
        </div>
      </div>
    </div>
  );
};

export default Menu;