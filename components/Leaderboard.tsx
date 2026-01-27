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
    <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 z-30 overflow-y-auto">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-amber-400 mb-4 sm:mb-6 md:mb-8"><i className="fas fa-trophy"></i> טבלת אלופים</h2>
      
      <div className="bg-slate-800/50 border border-slate-700 w-full max-w-2xl h-[50vh] sm:h-[60vh] rounded-xl overflow-hidden flex flex-col">
        <div className="bg-slate-800 p-2 sm:p-4 grid grid-cols-3 font-bold text-slate-400 text-xs sm:text-sm">
            <div className="text-center">דירוג</div>
            <div className="text-right pr-2 sm:pr-4">שם הצדיק</div>
            <div className="text-left pl-2 sm:pl-4">ניקוד</div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scroll p-1 sm:p-2">
            {loading ? (
                <div className="text-center p-4 sm:p-8 text-white text-sm sm:text-base"><i className="fas fa-circle-notch fa-spin"></i> טוען...</div>
            ) : scores.length === 0 ? (
                <div className="text-center p-4 sm:p-8 text-slate-500 text-sm sm:text-base">אין תוצאות או שגיאת חיבור</div>
            ) : (
                scores.map((entry, idx) => {
                    let medal = null;
                    if(idx === 0) medal = '🥇';
                    else if(idx === 1) medal = '🥈';
                    else if(idx === 2) medal = '🥉';

                    return (
                        <div key={idx} className="grid grid-cols-3 p-2 sm:p-3 border-b border-slate-700/50 hover:bg-white/5 transition items-center">
                            <div className="text-center text-base sm:text-xl">{medal || (idx + 1)}</div>
                            <div className="text-right pr-2 sm:pr-4 text-white font-medium truncate text-sm sm:text-base">{entry.name}</div>
                            <div className="text-left pl-2 sm:pl-4 font-mono text-amber-400 font-bold text-sm sm:text-base">{entry.score}</div>
                        </div>
                    );
                })
            )}
        </div>
      </div>

      <button onClick={onClose} className="mt-4 sm:mt-6 md:mt-8 bg-white text-slate-900 hover:bg-gray-200 font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-full shadow-lg transition text-sm sm:text-base">
        חזור
      </button>
    </div>
  );
};

export default Leaderboard;