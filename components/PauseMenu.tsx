import React from 'react';

interface PauseMenuProps {
  onResume: () => void;
  onExit: () => void;
}

const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onExit }) => {
  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4 sm:p-6 md:p-8">
       <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white tracking-widest mb-4 sm:mb-6 md:mb-8 drop-shadow-2xl italic transform -skew-x-12 text-center">
          PAUSED
       </h2>
       
       <div className="flex flex-col gap-3 sm:gap-4 md:gap-5 w-full max-w-xs sm:max-w-sm md:max-w-md">
           <button 
                onClick={onResume}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 sm:py-5 md:py-6 px-6 sm:px-8 md:px-10 rounded-xl sm:rounded-2xl shadow-[0_4px_0_rgb(21,128,61)] active:shadow-none active:translate-y-1 transition-all text-lg sm:text-xl md:text-2xl uppercase tracking-wider flex items-center justify-center gap-2 sm:gap-3 touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
           >
               <i className="fas fa-play text-lg sm:text-xl md:text-2xl"></i> <span>המשך</span>
           </button>
           
           <button 
                onClick={onExit}
                className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 sm:py-5 md:py-6 px-6 sm:px-8 md:px-10 rounded-xl sm:rounded-2xl shadow-[0_4px_0_rgb(51,65,85)] active:shadow-none active:translate-y-1 transition-all text-lg sm:text-xl md:text-2xl uppercase tracking-wider flex items-center justify-center gap-2 sm:gap-3 touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
           >
               <i className="fas fa-home text-lg sm:text-xl md:text-2xl"></i> <span>תפריט</span>
           </button>
       </div>
    </div>
  );
};

export default PauseMenu;