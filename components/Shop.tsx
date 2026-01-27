import React, { useState } from 'react';
import { PowerUpType, GadgetType } from '../types';

interface ShopProps {
  wallet: number;
  purchasedItems: Record<PowerUpType, boolean>;
  purchasedGadgets: Record<GadgetType, boolean>;
  equippedGadget: GadgetType;
  onBuyPowerup: (type: PowerUpType, cost: number) => void;
  onBuyGadget: (type: GadgetType, cost: number) => void;
  onEquipGadget: (type: GadgetType) => void;
  onClose: () => void;
}

const POWERUPS: { type: PowerUpType; name: string; desc: string; cost: number; icon: string; color: string; illustration: string }[] = [
    { type: 'shield', name: 'מגן התחלה', desc: 'מתחיל עם מגן פעיל', cost: 20, icon: 'fa-shield-alt', color: 'text-blue-400', illustration: '🛡️' },
    { type: 'magnet', name: 'מגנט חזק', desc: 'מגנט ל-10 שניות ראשונות', cost: 25, icon: 'fa-magnet', color: 'text-red-400', illustration: '🧲' },
    { type: 'double', name: 'ניקוד כפול', desc: 'כפול נקודות בהתחלה', cost: 30, icon: 'fa-times', color: 'text-purple-400', illustration: '✖️' },
    { type: 'slow', name: 'הילוך איטי', desc: 'התחלה איטית ורגועה', cost: 15, icon: 'fa-clock', color: 'text-teal-400', illustration: '⏰' },
];

const GADGETS: { type: GadgetType; name: string; desc: string; cost: number; icon: string; color: string; illustration: string }[] = [
    { type: 'rainbow_trail', name: 'שובל קשת', desc: 'משאיר שובל צבעוני בקפיצה', cost: 100, icon: 'fa-rainbow', color: 'text-pink-400', illustration: '🌈' },
    { type: 'neon_board', name: 'בורד ניאון', desc: 'סקייטבורד זוהר בחושך', cost: 150, icon: 'fa-lightbulb', color: 'text-green-400', illustration: '💡' },
    { type: 'gold_chain', name: 'שרשרת חי', desc: 'שרשרת זהב יוקרתית', cost: 200, icon: 'fa-gem', color: 'text-yellow-400', illustration: '💎' },
];

const Shop: React.FC<ShopProps> = ({ 
    wallet, purchasedItems, purchasedGadgets, equippedGadget, 
    onBuyPowerup, onBuyGadget, onEquipGadget, onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'powerups' | 'gadgets'>('powerups');

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-6 z-30 overflow-y-auto">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(250, 204, 21, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
        }}></div>
      </div>
      
      {/* Header */}
      <div className="relative flex items-center justify-between w-full max-w-6xl mb-4 sm:mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/50">
              <i className="fas fa-store text-white text-xl sm:text-2xl"></i>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 bg-clip-text text-transparent drop-shadow-lg">
              חנות הצדיק
            </h2>
          </div>
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-900/40 to-amber-800/40 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-xl border-2 border-amber-500/50 shadow-xl">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-md">
              <span className="text-amber-900 font-black text-base sm:text-xl">₪</span>
            </div>
            <span className="font-black text-white text-xl sm:text-3xl tracking-wider">{wallet}</span>
          </div>
      </div>

      {/* Tabs */}
      <div className="relative flex gap-3 mb-4 sm:mb-6 bg-slate-800/50 p-1 rounded-xl backdrop-blur-sm">
          <button 
            onClick={() => setActiveTab('powerups')}
            className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-bold text-sm sm:text-base transition-all duration-300 ${
              activeTab === 'powerups' 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/50 scale-105' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
              <i className="fas fa-bolt mr-2"></i>כוחות
          </button>
          <button 
            onClick={() => setActiveTab('gadgets')}
            className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-bold text-sm sm:text-base transition-all duration-300 ${
              activeTab === 'gadgets' 
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/50 scale-105' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
              <i className="fas fa-star mr-2"></i>גאדג'טים
          </button>
      </div>

      {/* Grid - Square cards */}
      <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 w-full max-w-7xl flex-1 overflow-y-auto custom-scroll px-2 min-h-0">
        {activeTab === 'powerups' ? (
            POWERUPS.map(item => {
                const isBought = purchasedItems[item.type];
                const canAfford = wallet >= item.cost;
                return (
                    <div key={item.type} className="group relative aspect-square bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 backdrop-blur-sm border-2 border-slate-700/60 rounded-2xl p-3 sm:p-4 hover:border-amber-500/80 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/40 hover:scale-[1.05] transform overflow-hidden flex flex-col">
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                        
                        <div className="relative flex flex-col items-center justify-center flex-1 gap-2 mb-2">
                            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center text-3xl sm:text-4xl shadow-lg border-2 ${item.color} border-opacity-50 group-hover:scale-110 transition-transform duration-300`}>
                                <span className="drop-shadow-lg">{item.illustration}</span>
                            </div>
                            <div className="text-center w-full flex-1 flex flex-col justify-center">
                                <h3 className="text-white font-black text-sm sm:text-base mb-1 drop-shadow-md leading-tight">{item.name}</h3>
                                <p className="text-slate-300 text-[10px] sm:text-xs leading-tight font-medium line-clamp-2">{item.desc}</p>
                            </div>
                        </div>
                        <button 
                            disabled={isBought || !canAfford}
                            onClick={() => onBuyPowerup(item.type, item.cost)}
                            className={`relative w-full py-2 sm:py-2.5 rounded-lg font-black text-xs sm:text-sm transition-all duration-300 ${
                                isBought 
                                ? 'bg-gradient-to-r from-green-600/40 to-green-700/40 text-green-300 cursor-default border-2 border-green-500/50 shadow-md' 
                                : canAfford 
                                    ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:via-amber-500 hover:to-amber-400 text-white shadow-lg hover:shadow-xl hover:shadow-amber-500/50 active:scale-95' 
                                    : 'bg-gradient-to-r from-slate-700/60 to-slate-800/60 text-slate-500 cursor-not-allowed border-2 border-slate-600/60'
                            }`}
                        >
                            {isBought ? (
                                <span className="flex items-center justify-center gap-1">
                                    <i className="fas fa-check-circle text-xs"></i> <span className="text-[10px] sm:text-xs">נרכש</span>
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-1">
                                    <i className="fas fa-coins text-xs"></i> <span className="text-[10px] sm:text-xs">{item.cost} ₪</span>
                                </span>
                            )}
                        </button>
                    </div>
                );
            })
        ) : (
            GADGETS.map(item => {
                const isOwned = purchasedGadgets[item.type];
                const isEquipped = equippedGadget === item.type;
                const canAfford = wallet >= item.cost;
                
                return (
                    <div key={item.type} className={`group relative aspect-square border-2 rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:shadow-2xl hover:scale-[1.05] transform overflow-hidden flex flex-col ${
                        isEquipped 
                            ? 'bg-gradient-to-br from-purple-900/70 via-purple-800/60 to-purple-900/70 border-purple-500/80 shadow-2xl shadow-purple-500/50' 
                            : 'bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 border-slate-700/60 hover:border-purple-500/80'
                    }`}>
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                        
                        <div className="relative flex flex-col items-center justify-center flex-1 gap-2 mb-2">
                            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center text-3xl sm:text-4xl shadow-lg border-2 ${item.color} border-opacity-50 group-hover:scale-110 transition-transform duration-300 ${isEquipped ? 'animate-pulse ring-2 ring-purple-400 shadow-purple-500/50' : ''}`}>
                                <span className="drop-shadow-lg">{item.illustration}</span>
                            </div>
                            <div className="text-center w-full flex-1 flex flex-col justify-center">
                                <h3 className={`font-black text-sm sm:text-base mb-1 drop-shadow-md leading-tight ${isEquipped ? 'text-purple-200' : 'text-white'}`}>{item.name}</h3>
                                <p className="text-slate-300 text-[10px] sm:text-xs leading-tight font-medium line-clamp-2">{item.desc}</p>
                            </div>
                        </div>
                        <div className="w-full">
                            {isOwned ? (
                                <button 
                                    onClick={() => onEquipGadget(isEquipped ? 'none' : item.type)}
                                    className={`relative w-full py-2 sm:py-2.5 rounded-lg font-black text-xs sm:text-sm transition-all duration-300 ${
                                        isEquipped 
                                        ? 'bg-gradient-to-r from-red-500 via-red-600 to-red-500 hover:from-red-400 hover:via-red-500 hover:to-red-400 text-white shadow-lg hover:shadow-xl hover:shadow-red-500/50 active:scale-95' 
                                        : 'bg-gradient-to-r from-green-600 via-green-700 to-green-600 hover:from-green-500 hover:via-green-600 hover:to-green-500 text-white shadow-lg hover:shadow-xl hover:shadow-green-500/50 active:scale-95'
                                    }`}
                                >
                                    <span className="flex items-center justify-center gap-1">
                                        {isEquipped ? <><i className="fas fa-times-circle text-xs"></i> <span className="text-[10px] sm:text-xs">הסר</span></> : <><i className="fas fa-check-circle text-xs"></i> <span className="text-[10px] sm:text-xs">בחר</span></>}
                                    </span>
                                </button>
                            ) : (
                                <button 
                                    disabled={!canAfford}
                                    onClick={() => onBuyGadget(item.type, item.cost)}
                                    className={`relative w-full py-2 sm:py-2.5 rounded-lg font-black text-xs sm:text-sm transition-all duration-300 ${
                                        canAfford 
                                            ? 'bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 hover:from-purple-400 hover:via-purple-500 hover:to-purple-400 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/50 active:scale-95' 
                                            : 'bg-gradient-to-r from-slate-700/60 to-slate-800/60 text-slate-500 cursor-not-allowed border-2 border-slate-600/60'
                                    }`}
                                >
                                    <span className="flex items-center justify-center gap-1">
                                        <i className="fas fa-coins text-xs"></i> <span className="text-[10px] sm:text-xs">{item.cost} ₪</span>
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                );
            })
        )}
      </div>

      <button 
        onClick={onClose} 
        className="relative mt-6 sm:mt-8 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-black text-base sm:text-lg rounded-xl border-2 border-slate-600 hover:border-amber-500/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
      >
        <i className="fas fa-arrow-right mr-2"></i>חזור לתפריט
      </button>
    </div>
  );
};

export default Shop;