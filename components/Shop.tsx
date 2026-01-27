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

const POWERUPS: { type: PowerUpType; name: string; desc: string; cost: number; icon: string; color: string }[] = [
    { type: 'shield', name: 'מגן התחלה', desc: 'מתחיל עם מגן פעיל', cost: 20, icon: 'fa-shield-alt', color: 'text-blue-400' },
    { type: 'magnet', name: 'מגנט חזק', desc: 'מגנט ל-10 שניות ראשונות', cost: 25, icon: 'fa-magnet', color: 'text-red-400' },
    { type: 'double', name: 'ניקוד כפול', desc: 'כפול נקודות בהתחלה', cost: 30, icon: 'fa-times', color: 'text-purple-400' },
    { type: 'slow', name: 'הילוך איטי', desc: 'התחלה איטית ורגועה', cost: 15, icon: 'fa-clock', color: 'text-teal-400' },
];

const GADGETS: { type: GadgetType; name: string; desc: string; cost: number; icon: string; color: string }[] = [
    { type: 'rainbow_trail', name: 'שובל קשת', desc: 'משאיר שובל צבעוני בקפיצה', cost: 100, icon: 'fa-rainbow', color: 'text-pink-400' },
    { type: 'neon_board', name: 'בורד ניאון', desc: 'סקייטבורד זוהר בחושך', cost: 150, icon: 'fa-lightbulb', color: 'text-green-400' },
    { type: 'gold_chain', name: 'שרשרת חי', desc: 'שרשרת זהב יוקרתית', cost: 200, icon: 'fa-gem', color: 'text-yellow-400' },
];

const Shop: React.FC<ShopProps> = ({ 
    wallet, purchasedItems, purchasedGadgets, equippedGadget, 
    onBuyPowerup, onBuyGadget, onEquipGadget, onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'powerups' | 'gadgets'>('powerups');

  return (
    <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30">
      
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-4xl mb-6">
          <h2 className="text-4xl font-black text-amber-400"><i className="fas fa-store"></i> חנות הצדיק</h2>
          <div className="flex items-center gap-2 bg-slate-800/80 px-6 py-2 rounded-full border border-amber-500/30">
            <span className="text-amber-400 font-bold text-2xl">₪</span>
            <span className="font-bold text-white text-2xl">{wallet}</span>
          </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setActiveTab('powerups')}
            className={`px-6 py-2 rounded-full font-bold text-lg transition ${activeTab === 'powerups' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-400'}`}
          >
              כוחות
          </button>
          <button 
            onClick={() => setActiveTab('gadgets')}
            className={`px-6 py-2 rounded-full font-bold text-lg transition ${activeTab === 'gadgets' ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-400'}`}
          >
              גאדג'טים
          </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl h-[50vh] overflow-y-auto custom-scroll pr-2">
        {activeTab === 'powerups' ? (
            POWERUPS.map(item => {
                const isBought = purchasedItems[item.type];
                const canAfford = wallet >= item.cost;
                return (
                    <div key={item.type} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800 transition">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-2xl ${item.color}`}>
                                <i className={`fas ${item.icon}`}></i>
                            </div>
                            <div className="text-right">
                                <h3 className="text-white font-bold text-lg">{item.name}</h3>
                                <p className="text-slate-400 text-sm">{item.desc}</p>
                            </div>
                        </div>
                        <button 
                            disabled={isBought || !canAfford}
                            onClick={() => onBuyPowerup(item.type, item.cost)}
                            className={`px-6 py-2 rounded-full font-bold transition ${
                                isBought 
                                ? 'bg-green-600/20 text-green-500 cursor-default' 
                                : canAfford 
                                    ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg' 
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            {isBought ? <i className="fas fa-check"></i> : <span>{item.cost} ₪</span>}
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
                    <div key={item.type} className={`border rounded-xl p-4 flex items-center justify-between transition ${isEquipped ? 'bg-purple-900/30 border-purple-500' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-2xl ${item.color} ${isEquipped ? 'animate-pulse' : ''}`}>
                                <i className={`fas ${item.icon}`}></i>
                            </div>
                            <div className="text-right">
                                <h3 className="text-white font-bold text-lg">{item.name}</h3>
                                <p className="text-slate-400 text-sm">{item.desc}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {isOwned ? (
                                <button 
                                    onClick={() => onEquipGadget(isEquipped ? 'none' : item.type)}
                                    className={`px-6 py-2 rounded-full font-bold transition shadow-lg ${
                                        isEquipped 
                                        ? 'bg-red-500 hover:bg-red-400 text-white' 
                                        : 'bg-green-600 hover:bg-green-500 text-white'
                                    }`}
                                >
                                    {isEquipped ? 'הסר' : 'בחר'}
                                </button>
                            ) : (
                                <button 
                                    disabled={!canAfford}
                                    onClick={() => onBuyGadget(item.type, item.cost)}
                                    className={`px-6 py-2 rounded-full font-bold transition ${
                                        canAfford 
                                            ? 'bg-purple-500 hover:bg-purple-400 text-white shadow-lg' 
                                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    }`}
                                >
                                    {item.cost} ₪
                                </button>
                            )}
                        </div>
                    </div>
                );
            })
        )}
      </div>

      <button onClick={onClose} className="mt-8 text-white hover:text-amber-400 font-bold text-lg transition">
        חזור לתפריט
      </button>
    </div>
  );
};

export default Shop;