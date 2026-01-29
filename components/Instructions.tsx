import React from 'react';

interface InstructionsProps {
  onClose: () => void;
}

const Instructions: React.FC<InstructionsProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 lg:p-6 z-30 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y', overflowY: 'scroll' }}>
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(250, 204, 21, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
        }}></div>
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-center w-full max-w-4xl mb-3 sm:mb-4 md:mb-6 px-2">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
            <i className="fas fa-book text-white text-base sm:text-lg md:text-xl lg:text-2xl"></i>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
            הוראות המשחק
          </h2>
        </div>
      </div>

      {/* Content Container */}
      <div className="relative w-full max-w-4xl flex-1 overflow-y-auto custom-scroll px-2 sm:px-4" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        <div className="space-y-4 sm:space-y-5 md:space-y-6 pb-4">
          
          {/* מטרת המשחק */}
          <div className="bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 backdrop-blur-sm border-2 border-emerald-500/50 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-bullseye text-white text-sm sm:text-base"></i>
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-emerald-400">מטרת המשחק</h3>
            </div>
            <p className="text-white text-sm sm:text-base md:text-lg leading-relaxed text-right">
              המטרה היא לגלוש כמה שיותר רחוק, לאסוף מטבעות, לבצע טריקים מדהימים ולצבור נקודות גבוהות. 
              ככל שתתקדם יותר, המשחק יהפוך לקשה יותר עם מכשולים רבים יותר.
            </p>
          </div>

          {/* הרעיון המרכזי */}
          <div className="bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 backdrop-blur-sm border-2 border-purple-500/50 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-lightbulb text-white text-sm sm:text-base"></i>
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-purple-400">הרעיון המרכזי</h3>
            </div>
            <p className="text-white text-sm sm:text-base md:text-lg leading-relaxed text-right">
              הסקייטר הצדיק הוא משחק שמשלב בין כיף לפעילות צדקה. המשחק מעודד ערכים יהודיים כמו צדקה והשבת אבידה, 
              תוך כדי חוויה מהנה של גלישה על סקייטבורד. כל פעולה טובה במשחק מחזקת את הדמות ומעניקה בונוסים מיוחדים.
            </p>
          </div>

          {/* צדקה */}
          <div className="bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 backdrop-blur-sm border-2 border-yellow-500/50 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-hand-holding-heart text-white text-sm sm:text-base"></i>
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-yellow-400">צדקה</h3>
            </div>
            <p className="text-white text-sm sm:text-base md:text-lg leading-relaxed text-right mb-3">
              במשחק יש מטבעות צדקה מיוחדים (מטבעות זהב). כאשר אתה אוסף 20 מטבעות צדקה, תקבל מגן צדקה מיוחד 
              שיגן עליך מפני התנגשות אחת. המגן יופיע עם ההודעה "צדקה תציל ממוות" - ערך חשוב ביהדות.
            </p>
            <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-2 sm:p-3">
              <p className="text-yellow-200 text-xs sm:text-sm md:text-base text-right">
                <i className="fas fa-star text-yellow-400 ml-1"></i>
                <strong>טיפ:</strong> נסה לאסוף מטבעות צדקה כדי לקבל הגנה נוספת במשחק!
              </p>
            </div>
          </div>

          {/* השבת אבידה */}
          <div className="bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 backdrop-blur-sm border-2 border-cyan-500/50 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-search text-white text-sm sm:text-base"></i>
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-cyan-400">השבת אבידה</h3>
            </div>
            <p className="text-white text-sm sm:text-base md:text-lg leading-relaxed text-right mb-3">
              במהלך המשחק תראה חפצים אבודים כמו תיק בית ספר, דובי או ספר. אסוף אותם והחזר אותם לבעלים שלהם 
              (ילד שמחכה במסלול). החזרת חפצים אבודים מעניקה לך בונוס נקודות ומטבעות, ומחזקת את הערך של השבת אבידה.
            </p>
            <div className="bg-cyan-900/30 border border-cyan-500/30 rounded-lg p-2 sm:p-3">
              <p className="text-cyan-200 text-xs sm:text-sm md:text-base text-right">
                <i className="fas fa-star text-cyan-400 ml-1"></i>
                <strong>טיפ:</strong> חפש ילדים שמחכים - הם הבעלים של החפצים האבודים!
              </p>
            </div>
          </div>

          {/* מקשים ושליטה */}
          <div className="bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 backdrop-blur-sm border-2 border-orange-500/50 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-keyboard text-white text-sm sm:text-base"></i>
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-orange-400">מקשים ושליטה</h3>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-2 sm:p-3">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 sm:px-3 py-1 bg-slate-700 text-white rounded text-xs sm:text-sm font-mono border border-slate-600">Space</kbd>
                  <span className="text-slate-300 text-xs sm:text-sm">או</span>
                  <kbd className="px-2 sm:px-3 py-1 bg-slate-700 text-white rounded text-xs sm:text-sm font-mono border border-slate-600">↑</kbd>
                </div>
                <span className="text-white text-sm sm:text-base font-medium text-right">קפיצה</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-2 sm:p-3">
                <kbd className="px-2 sm:px-3 py-1 bg-slate-700 text-white rounded text-xs sm:text-sm font-mono border border-slate-600">A</kbd>
                <span className="text-white text-sm sm:text-base font-medium text-right">טריק: קיק-פליפ</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-2 sm:p-3">
                <kbd className="px-2 sm:px-3 py-1 bg-slate-700 text-white rounded text-xs sm:text-sm font-mono border border-slate-600">S</kbd>
                <span className="text-white text-sm sm:text-base font-medium text-right">טריק: סופרמן</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-2 sm:p-3">
                <kbd className="px-2 sm:px-3 py-1 bg-slate-700 text-white rounded text-xs sm:text-sm font-mono border border-slate-600">D</kbd>
                <span className="text-white text-sm sm:text-base font-medium text-right">טריק: 360</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-2 sm:p-3">
                <kbd className="px-2 sm:px-3 py-1 bg-slate-700 text-white rounded text-xs sm:text-sm font-mono border border-slate-600">ESC</kbd>
                <span className="text-white text-sm sm:text-base font-medium text-right">השהה/המשך</span>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 bg-orange-900/30 border border-orange-500/30 rounded-lg p-2 sm:p-3">
              <p className="text-orange-200 text-xs sm:text-sm md:text-base text-right">
                <i className="fas fa-mobile-alt text-orange-400 ml-1"></i>
                <strong>במובייל:</strong> השתמש בכפתורים על המסך או החלק למעלה/למטה/שמאלה/ימינה
              </p>
            </div>
          </div>

          {/* מכניקות נוספות */}
          <div className="bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 backdrop-blur-sm border-2 border-pink-500/50 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-cogs text-white text-sm sm:text-base"></i>
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-pink-400">מכניקות נוספות</h3>
            </div>
            <div className="space-y-2 sm:space-y-3 text-right">
              <div className="flex items-start gap-2 sm:gap-3">
                <i className="fas fa-coins text-yellow-400 mt-1 text-sm sm:text-base"></i>
                <div>
                  <p className="text-white text-sm sm:text-base font-semibold mb-1">מטבעות</p>
                  <p className="text-slate-300 text-xs sm:text-sm">אסוף מטבעות כדי לקנות כוחות וגאדג'טים בחנות</p>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <i className="fas fa-fire text-red-400 mt-1 text-sm sm:text-base"></i>
                <div>
                  <p className="text-white text-sm sm:text-base font-semibold mb-1">טריקים וקומבו</p>
                  <p className="text-slate-300 text-xs sm:text-sm">בצע טריקים ברצף כדי להגדיל את הקומבו ולצבור נקודות נוספות</p>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <i className="fas fa-sliders-h text-blue-400 mt-1 text-sm sm:text-base"></i>
                <div>
                  <p className="text-white text-sm sm:text-base font-semibold mb-1">גריינד</p>
                  <p className="text-slate-300 text-xs sm:text-sm">גלוש על מסילות ובנקים כדי לבצע גריינד ולקבל נקודות בונוס</p>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <i className="fas fa-rocket text-purple-400 mt-1 text-sm sm:text-base"></i>
                <div>
                  <p className="text-white text-sm sm:text-base font-semibold mb-1">רמפות</p>
                  <p className="text-slate-300 text-xs sm:text-sm">קפוץ על רמפות כדי לקבל דחיפה חזקה ולבצע טריקים גבוהים</p>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <i className="fas fa-shield-alt text-green-400 mt-1 text-sm sm:text-base"></i>
                <div>
                  <p className="text-white text-sm sm:text-base font-semibold mb-1">כוחות מיוחדים</p>
                  <p className="text-slate-300 text-xs sm:text-sm">קנה מגן, מגנט, ניקוד כפול והילוך איטי בחנות</p>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <i className="fas fa-tasks text-indigo-400 mt-1 text-sm sm:text-base"></i>
                <div>
                  <p className="text-white text-sm sm:text-base font-semibold mb-1">משימות</p>
                  <p className="text-slate-300 text-xs sm:text-sm">השלם משימות כדי לקבל מטבעות בונוס</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Close Button */}
      <button 
        onClick={onClose} 
        className="relative mt-3 sm:mt-4 md:mt-6 px-4 sm:px-5 md:px-6 lg:px-8 py-2 sm:py-2.5 md:py-3 lg:py-4 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-black text-sm sm:text-base md:text-lg lg:text-xl rounded-lg sm:rounded-xl md:rounded-2xl border-2 border-slate-600 hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 touch-manipulation"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <i className="fas fa-arrow-right mr-1 sm:mr-2"></i>חזור לתפריט
      </button>
    </div>
  );
};

export default Instructions;
