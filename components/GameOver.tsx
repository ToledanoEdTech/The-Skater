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
    <div className="absolute inset-0 bg-red-900/90 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 z-40 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
      <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2 sm:mb-3 md:mb-4 -rotate-2 drop-shadow-xl text-center px-2">נפסלת צדיק!</h2>
      
      <div className="bg-slate-900/80 p-3 sm:p-4 md:p-6 lg:p-8 rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl border-2 border-red-500/30 text-center w-full max-w-md sm:max-w-lg md:max-w-xl mx-2">
        <div className="text-slate-400 text-xs sm:text-sm md:text-base font-bold uppercase tracking-wider mb-1.5 sm:mb-2 md:mb-3">ניקוד סופי</div>
        <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-amber-400 mb-2 sm:mb-3 md:mb-4">{score}</div>
        
        <div className="flex justify-center items-center gap-1.5 sm:gap-2 md:gap-3 text-amber-500 font-bold text-lg sm:text-xl md:text-2xl mb-4 sm:mb-5 md:mb-6">
            <span>+</span><span>{coins}</span><span>₪</span>
        </div>

        {!submitted ? (
            <div className="mb-3 sm:mb-4 md:mb-5">
                <input 
                    type="text" 
                    maxLength={15}
                    placeholder="הכנס את שמך" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-800 border-2 border-slate-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-center text-white text-sm sm:text-base md:text-lg focus:outline-none focus:border-amber-400 mb-2 sm:mb-3"
                />
                <button 
                    onClick={handleSubmit}
                    disabled={!name || submitting}
                    className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-2.5 sm:py-3 md:py-4 px-3 sm:px-4 rounded-lg transition active:scale-95 text-sm sm:text-base md:text-lg touch-manipulation"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                    {submitting ? <i className="fas fa-circle-notch fa-spin"></i> : <span><i className="fas fa-paper-plane mr-1 sm:mr-2"></i> שלח לטבלה</span>}
                </button>
            </div>
        ) : (
            <div className="mb-3 sm:mb-4 md:mb-5 text-green-400 font-bold py-2 sm:py-3 border-2 border-green-500/30 bg-green-500/10 rounded-lg text-xs sm:text-sm md:text-base">
                <i className="fas fa-check mr-1 sm:mr-2"></i> התוצאה נשמרה!
            </div>
        )}

        <div className="flex gap-2 sm:gap-3">
            <button onClick={onRestart} className="flex-1 bg-white text-red-900 hover:bg-gray-100 font-bold py-2.5 sm:py-3 md:py-4 px-3 sm:px-4 rounded-lg sm:rounded-xl shadow-lg transition transform hover:-translate-y-1 active:scale-95 text-sm sm:text-base md:text-lg touch-manipulation" style={{ WebkitTapHighlightColor: 'transparent' }}>
                <i className="fas fa-redo mr-1 sm:mr-2"></i> שוב
            </button>
            <button onClick={onHome} className="flex-1 bg-slate-700 text-white hover:bg-slate-600 font-bold py-2.5 sm:py-3 md:py-4 px-3 sm:px-4 rounded-lg sm:rounded-xl shadow-lg transition transform hover:-translate-y-1 active:scale-95 text-sm sm:text-base md:text-lg touch-manipulation" style={{ WebkitTapHighlightColor: 'transparent' }}>
                <i className="fas fa-home mr-1 sm:mr-2"></i> תפריט
            </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;