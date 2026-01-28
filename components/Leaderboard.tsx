import React, { useEffect, useState } from 'react';
import { GOOGLE_SCRIPT_URL } from '../constants';
import { HighScoreEntry } from '../types';

interface LeaderboardProps {
  onClose: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
  const [scores, setScores] = useState<HighScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(GOOGLE_SCRIPT_URL)
      .then(res => res.json())
      .then(data => {
        setScores(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-1 sm:p-2 md:p-3 lg:p-4 z-30 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y', overflowY: 'scroll' }}>
      <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-amber-400 mb-2 sm:mb-3 md:mb-4 lg:mb-6 text-center px-2"><i className="fas fa-trophy mr-1 sm:mr-2"></i> טבלת אלופים</h2>
      
      <div className="bg-slate-800/50 border-2 border-slate-700 w-full max-w-2xl sm:max-w-3xl md:max-w-4xl h-[45vh] sm:h-[50vh] md:h-[55vh] lg:h-[60vh] rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden flex flex-col mx-2">
        <div className="bg-slate-800 p-2 sm:p-3 md:p-4 grid grid-cols-3 font-bold text-slate-400 text-xs sm:text-sm md:text-base lg:text-lg border-b-2 border-slate-700">
            <div className="text-center">דירוג</div>
            <div className="text-right pr-1 sm:pr-2 md:pr-4">שם הצדיק</div>
            <div className="text-left pl-1 sm:pl-2 md:pl-4">ניקוד</div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scroll p-1 sm:p-2" style={{ WebkitOverflowScrolling: 'touch' }}>
            {loading ? (
                <div className="text-center p-4 sm:p-6 md:p-8 text-white text-sm sm:text-base md:text-lg"><i className="fas fa-circle-notch fa-spin mr-1 sm:mr-2"></i> טוען...</div>
            ) : scores.length === 0 ? (
                <div className="text-center p-4 sm:p-6 md:p-8 text-slate-500 text-sm sm:text-base md:text-lg">אין תוצאות או שגיאת חיבור</div>
            ) : (
                scores.map((entry, idx) => {
                    let medal = null;
                    if(idx === 0) medal = '🥇';
                    else if(idx === 1) medal = '🥈';
                    else if(idx === 2) medal = '🥉';

                    return (
                        <div key={idx} className="grid grid-cols-3 p-2 sm:p-3 md:p-4 border-b border-slate-700/50 hover:bg-white/5 transition items-center">
                            <div className="text-center text-base sm:text-lg md:text-xl lg:text-2xl">{medal || (idx + 1)}</div>
                            <div className="text-right pr-1 sm:pr-2 md:pr-4 text-white font-medium truncate text-xs sm:text-sm md:text-base lg:text-lg">{entry.name}</div>
                            <div className="text-left pl-1 sm:pl-2 md:pl-4 font-mono text-amber-400 font-bold text-xs sm:text-sm md:text-base lg:text-lg">{entry.score}</div>
                        </div>
                    );
                })
            )}
        </div>
      </div>

      <button onClick={onClose} className="mt-2 sm:mt-3 md:mt-4 lg:mt-6 bg-white text-slate-900 hover:bg-gray-200 font-bold py-2 sm:py-2.5 md:py-3 lg:py-4 px-4 sm:px-5 md:px-6 lg:px-8 rounded-full shadow-lg transition active:scale-95 text-sm sm:text-base md:text-lg touch-manipulation" style={{ WebkitTapHighlightColor: 'transparent' }}>
        חזור
      </button>
    </div>
  );
};

export default Leaderboard;