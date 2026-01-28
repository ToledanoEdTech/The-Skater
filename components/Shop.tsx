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
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 lg:p-6 z-30 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(250, 204, 21, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
        }}></div>
      </div>
      
      {/* Header - Smaller on Mobile */}
      <div className="relative flex flex-col sm:flex-row items-center justify-between w-full max-w-6xl mb-2 sm:mb-3 md:mb-4 flex-wrap gap-2 sm:gap-3 px-2">
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/50">
              <i className="fas fa-store text-white text-sm sm:text-base md:text-lg lg:text-xl"></i>
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 bg-clip-text text-transparent drop-shadow-lg">
              חנות הצדיק
            </h2>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 bg-gradient-to-r from-amber-900/40 to-amber-800/40 backdrop-blur-sm px-2 sm:px-3 md:px-4 lg:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl border-2 border-amber-500/50 shadow-xl">
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-md">
              <span className="text-amber-900 font-black text-xs sm:text-sm md:text-base lg:text-xl">₪</span>
            </div>
            <span className="font-black text-white text-base sm:text-lg md:text-xl lg:text-2xl tracking-wider">{wallet}</span>
          </div>
      </div>

      {/* Tabs - Smaller on Mobile */}
      <div className="relative flex gap-1.5 sm:gap-2 md:gap-3 mb-2 sm:mb-3 md:mb-4 bg-slate-800/50 p-0.5 sm:p-1 rounded-lg sm:rounded-xl backdrop-blur-sm w-full max-w-6xl px-2">
          <button 
            onClick={() => setActiveTab('powerups')}
            className={`flex-1 px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-2.5 md:py-3 lg:py-3.5 rounded-md sm:rounded-lg font-bold text-xs sm:text-sm md:text-base lg:text-lg transition-all duration-300 touch-manipulation ${
              activeTab === 'powerups' 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/50 scale-105' 
                : 'text-slate-400 hover:text-slate-200 active:scale-95'
            }`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
              <i className="fas fa-bolt mr-1 sm:mr-2"></i>כוחות
          </button>
          <button 
            onClick={() => setActiveTab('gadgets')}
            className={`flex-1 px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-2.5 md:py-3 lg:py-3.5 rounded-md sm:rounded-lg font-bold text-xs sm:text-sm md:text-base lg:text-lg transition-all duration-300 touch-manipulation ${
              activeTab === 'gadgets' 
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/50 scale-105' 
                : 'text-slate-400 hover:text-slate-200 active:scale-95'
            }`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
              <i className="fas fa-star mr-1 sm:mr-2"></i>גאדג'טים
          </button>
      </div>

      {/* Grid - Square cards */}
      <div className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 lg:gap-5 w-full max-w-7xl flex-1 overflow-y-auto custom-scroll px-1 sm:px-2 md:px-3 min-h-0" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        {activeTab === 'powerups' ? (
            POWERUPS.map(item => {
                const isBought = purchasedItems[item.type];
                const canAfford = wallet >= item.cost;
                return (
                    <div key={item.type} className="group relative aspect-square bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 backdrop-blur-sm border-2 border-slate-700/60 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 hover:border-amber-500/80 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/40 hover:scale-[1.05] transform overflow-hidden flex flex-col">
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                        
                        <div className="relative flex flex-col items-center justify-center flex-1 gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            <div className={`rounded-lg sm:rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center text-3xl sm:text-4xl md:text-5xl shadow-lg border-2 ${item.color} border-opacity-50 group-hover:scale-110 transition-transform duration-300`} style={{ width: '50px', height: '50px', minWidth: '50px', minHeight: '50px' }}>
                                <span className="drop-shadow-lg">{item.illustration}</span>
                            </div>
                            <div className="text-center w-full flex-1 flex flex-col justify-center">
                                <h3 className="text-white font-black text-xs sm:text-sm md:text-base mb-0.5 sm:mb-1 drop-shadow-md leading-tight">{item.name}</h3>
                                <p className="text-slate-300 text-[10px] sm:text-xs leading-tight font-medium line-clamp-2">{item.desc}</p>
                            </div>
                        </div>
                        <button 
                            disabled={isBought || !canAfford}
                            onClick={() => onBuyPowerup(item.type, item.cost)}
                            className={`relative w-full py-2 sm:py-2.5 md:py-3 rounded-md sm:rounded-lg font-black text-xs sm:text-sm transition-all duration-300 touch-manipulation ${
                                isBought 
                                ? 'bg-gradient-to-r from-green-600/40 to-green-700/40 text-green-300 cursor-default border-2 border-green-500/50 shadow-md' 
                                : canAfford 
                                    ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:via-amber-500 hover:to-amber-400 text-white shadow-lg hover:shadow-xl hover:shadow-amber-500/50 active:scale-95' 
                                    : 'bg-gradient-to-r from-slate-700/60 to-slate-800/60 text-slate-500 cursor-not-allowed border-2 border-slate-600/60'
                            }`}
                            style={{ WebkitTapHighlightColor: 'transparent' }}
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
                    <div key={item.type} className={`group relative aspect-square border-2 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 transition-all duration-300 hover:shadow-2xl hover:scale-[1.05] transform overflow-hidden flex flex-col ${
                        isEquipped 
                            ? 'bg-gradient-to-br from-purple-900/70 via-purple-800/60 to-purple-900/70 border-purple-500/80 shadow-2xl shadow-purple-500/50' 
                            : 'bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 border-slate-700/60 hover:border-purple-500/80'
                    }`}>
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                        
                        <div className="relative flex flex-col items-center justify-center flex-1 gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            <div className={`rounded-lg sm:rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center text-3xl sm:text-4xl md:text-5xl shadow-lg border-2 ${item.color} border-opacity-50 group-hover:scale-110 transition-transform duration-300 ${isEquipped ? 'animate-pulse ring-2 ring-purple-400 shadow-purple-500/50' : ''}`} style={{ width: '50px', height: '50px', minWidth: '50px', minHeight: '50px' }}>
                                <span className="drop-shadow-lg">{item.illustration}</span>
                            </div>
                            <div className="text-center w-full flex-1 flex flex-col justify-center">
                                <h3 className={`font-black text-xs sm:text-sm md:text-base mb-0.5 sm:mb-1 drop-shadow-md leading-tight ${isEquipped ? 'text-purple-200' : 'text-white'}`}>{item.name}</h3>
                                <p className="text-slate-300 text-[10px] sm:text-xs leading-tight font-medium line-clamp-2">{item.desc}</p>
                            </div>
                        </div>
                        <div className="w-full">
                            {isOwned ? (
                                <button 
                                    onClick={() => onEquipGadget(isEquipped ? 'none' : item.type)}
                                    className={`relative w-full py-2 sm:py-2.5 md:py-3 rounded-md sm:rounded-lg font-black text-xs sm:text-sm transition-all duration-300 touch-manipulation ${
                                        isEquipped 
                                        ? 'bg-gradient-to-r from-red-500 via-red-600 to-red-500 hover:from-red-400 hover:via-red-500 hover:to-red-400 text-white shadow-lg hover:shadow-xl hover:shadow-red-500/50 active:scale-95' 
                                        : 'bg-gradient-to-r from-green-600 via-green-700 to-green-600 hover:from-green-500 hover:via-green-600 hover:to-green-500 text-white shadow-lg hover:shadow-xl hover:shadow-green-500/50 active:scale-95'
                                    }`}
                                    style={{ WebkitTapHighlightColor: 'transparent' }}
                                >
                                    <span className="flex items-center justify-center gap-1">
                                        {isEquipped ? <><i className="fas fa-times-circle text-xs"></i> <span className="text-[10px] sm:text-xs">הסר</span></> : <><i className="fas fa-check-circle text-xs"></i> <span className="text-[10px] sm:text-xs">בחר</span></>}
                                    </span>
                                </button>
                            ) : (
                                <button 
                                    disabled={!canAfford}
                                    onClick={() => onBuyGadget(item.type, item.cost)}
                                    className={`relative w-full py-2 sm:py-2.5 md:py-3 rounded-md sm:rounded-lg font-black text-xs sm:text-sm transition-all duration-300 touch-manipulation ${
                                        canAfford 
                                            ? 'bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 hover:from-purple-400 hover:via-purple-500 hover:to-purple-400 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/50 active:scale-95' 
                                            : 'bg-gradient-to-r from-slate-700/60 to-slate-800/60 text-slate-500 cursor-not-allowed border-2 border-slate-600/60'
                                    }`}
                                    style={{ WebkitTapHighlightColor: 'transparent' }}
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
        className="relative mt-2 sm:mt-3 md:mt-4 lg:mt-6 px-4 sm:px-5 md:px-6 lg:px-8 py-2 sm:py-2.5 md:py-3 lg:py-4 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-black text-sm sm:text-base md:text-lg lg:text-xl rounded-lg sm:rounded-xl md:rounded-2xl border-2 border-slate-600 hover:border-amber-500/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 touch-manipulation"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <i className="fas fa-arrow-right mr-1 sm:mr-2"></i>חזור לתפריט
      </button>
    </div>
  );
};

export default Shop;