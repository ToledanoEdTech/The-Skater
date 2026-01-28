import React from 'react';

interface PauseMenuProps {
  onResume: () => void;
  onExit: () => void;
}

const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onExit }) => {
  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-2 sm:p-3 md:p-4 lg:p-6">
       <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white tracking-widest mb-3 sm:mb-4 md:mb-6 lg:mb-8 drop-shadow-2xl italic transform -skew-x-12 text-center">
          PAUSED
       </h2>
       
       <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 w-full max-w-xs sm:max-w-sm md:max-w-md">
           <button 
                onClick={onResume}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 sm:py-3 md:py-4 lg:py-5 px-4 sm:px-5 md:px-6 lg:px-8 rounded-lg sm:rounded-xl md:rounded-2xl shadow-[0_4px_0_rgb(21,128,61)] active:shadow-none active:translate-y-1 transition-all text-sm sm:text-base md:text-lg lg:text-xl uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
           >
               <i className="fas fa-play text-sm sm:text-base md:text-lg lg:text-xl"></i> <span>המשך</span>
           </button>
           
           <button 
                onClick={onExit}
                className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 sm:py-3 md:py-4 lg:py-5 px-4 sm:px-5 md:px-6 lg:px-8 rounded-lg sm:rounded-xl md:rounded-2xl shadow-[0_4px_0_rgb(51,65,85)] active:shadow-none active:translate-y-1 transition-all text-sm sm:text-base md:text-lg lg:text-xl uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
           >
               <i className="fas fa-home text-sm sm:text-base md:text-lg lg:text-xl"></i> <span>תפריט</span>
           </button>
       </div>
    </div>
  );
};

export default PauseMenu;