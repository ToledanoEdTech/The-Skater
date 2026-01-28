import React, { useState } from 'react';
import { GOOGLE_SCRIPT_URL } from '../constants';

interface GameOverProps {
  score: number;
  coins: number;
  onRestart: () => void;
  onHome: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ score, coins, onRestart, onHome }) => {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || submitting || submitted) return;
    setSubmitting(true);
    try {
        await fetch(`${GOOGLE_SCRIPT_URL}?action=add&name=${encodeURIComponent(name)}&score=${score}`);
        setSubmitted(true);
    } catch (e) {
        console.error(e);
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-red-900/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 z-40 overflow-y-auto">
      <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-3 sm:mb-4 md:mb-6 -rotate-2 drop-shadow-xl text-center px-2">נפסלת צדיק!</h2>
      
      <div className="bg-slate-900/80 p-5 sm:p-6 md:p-8 lg:p-10 rounded-xl sm:rounded-2xl shadow-2xl border-2 sm:border-3 border-red-500/30 text-center w-full max-w-md sm:max-w-lg md:max-w-xl mx-2">
        <div className="text-slate-400 text-sm sm:text-base md:text-lg font-bold uppercase tracking-wider mb-2 sm:mb-3">ניקוד סופי</div>
        <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-amber-400 mb-3 sm:mb-4 md:mb-5">{score}</div>
        
        <div className="flex justify-center items-center gap-2 sm:gap-3 text-amber-500 font-bold text-xl sm:text-2xl md:text-3xl mb-6 sm:mb-8">
            <span>+</span><span>{coins}</span><span>₪</span>
        </div>

        {!submitted ? (
            <div className="mb-5 sm:mb-6">
                <input 
                    type="text" 
                    maxLength={15}
                    placeholder="הכנס את שמך" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-800 border-2 border-slate-600 rounded-lg sm:rounded-xl px-4 sm:px-5 py-3 sm:py-4 text-center text-white text-base sm:text-lg md:text-xl focus:outline-none focus:border-amber-400 mb-3 sm:mb-4"
                />
                <button 
                    onClick={handleSubmit}
                    disabled={!name || submitting}
                    className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 sm:py-4 md:py-5 px-4 sm:px-5 rounded-lg sm:rounded-xl transition active:scale-95 text-base sm:text-lg md:text-xl touch-manipulation"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                    {submitting ? <i className="fas fa-circle-notch fa-spin"></i> : <span><i className="fas fa-paper-plane mr-2"></i> שלח לטבלה</span>}
                </button>
            </div>
        ) : (
            <div className="mb-5 sm:mb-6 text-green-400 font-bold py-3 sm:py-4 border-2 border-green-500/30 bg-green-500/10 rounded-lg sm:rounded-xl text-sm sm:text-base md:text-lg">
                <i className="fas fa-check mr-2"></i> התוצאה נשמרה!
            </div>
        )}

        <div className="flex gap-3 sm:gap-4">
            <button onClick={onRestart} className="flex-1 bg-white text-red-900 hover:bg-gray-100 font-bold py-3 sm:py-4 md:py-5 px-4 sm:px-5 rounded-lg sm:rounded-xl shadow-lg transition transform hover:-translate-y-1 active:scale-95 text-base sm:text-lg md:text-xl touch-manipulation" style={{ WebkitTapHighlightColor: 'transparent' }}>
                <i className="fas fa-redo mr-2"></i> שוב
            </button>
            <button onClick={onHome} className="flex-1 bg-slate-700 text-white hover:bg-slate-600 font-bold py-3 sm:py-4 md:py-5 px-4 sm:px-5 rounded-lg sm:rounded-xl shadow-lg transition transform hover:-translate-y-1 active:scale-95 text-base sm:text-lg md:text-xl touch-manipulation" style={{ WebkitTapHighlightColor: 'transparent' }}>
                <i className="fas fa-home mr-2"></i> תפריט
            </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;