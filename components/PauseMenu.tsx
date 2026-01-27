import React from 'react';

interface PauseMenuProps {
  onResume: () => void;
  onExit: () => void;
}

const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onExit }) => {
  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
       <h2 className="text-7xl font-black text-white tracking-widest mb-8 drop-shadow-2xl italic transform -skew-x-12">
          PAUSED
       </h2>
       
       <div className="flex flex-col gap-4 w-64">
           <button 
                onClick={onResume}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-8 rounded-xl shadow-[0_4px_0_rgb(21,128,61)] active:shadow-none active:translate-y-1 transition-all text-xl uppercase tracking-wider flex items-center justify-center gap-3"
           >
               <i className="fas fa-play"></i> המשך
           </button>
           
           <button 
                onClick={onExit}
                className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 px-8 rounded-xl shadow-[0_4px_0_rgb(51,65,85)] active:shadow-none active:translate-y-1 transition-all text-xl uppercase tracking-wider flex items-center justify-center gap-3"
           >
               <i className="fas fa-home"></i> תפריט
           </button>
       </div>
    </div>
  );
};

export default PauseMenu;