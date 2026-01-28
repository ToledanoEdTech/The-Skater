import React, { useState, useEffect, useRef } from 'react';
import GameEngine, { GameEngineHandle } from './components/GameEngine';
import Menu from './components/Menu';
import Shop from './components/Shop';
import HUD from './components/HUD';
import GameOver from './components/GameOver';
import Leaderboard from './components/Leaderboard';
import PauseMenu from './components/PauseMenu';
import OrientationCheck from './components/OrientationCheck';
import { GameState, CharacterConfig, PowerUpType, PowerUpState, GadgetType, Mission } from './types';
import { CHARACTERS } from './constants';
import { audioService } from './services/audioService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [character, setCharacter] = useState<CharacterConfig>(CHARACTERS[0]);
  const [sessionId, setSessionId] = useState(0); 
  
  // Persistent State
  const [wallet, setWallet] = useState(() => parseInt(localStorage.getItem('wallet') || '0'));
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('highScore') || '0'));
  
  const [purchasedGadgets, setPurchasedGadgets] = useState<Record<GadgetType, boolean>>(() => {
      const saved = localStorage.getItem('purchasedGadgets');
      return saved ? JSON.parse(saved) : { none: true, rainbow_trail: false, neon_board: false, gold_chain: false, fire_trail: false, ice_board: false, diamond_sparkles: false, lightning_aura: false, cosmic_wings: false, neon_glow: false };
  });
  
  const [equippedGadget, setEquippedGadget] = useState<GadgetType>(() => {
      return (localStorage.getItem('equippedGadget') as GadgetType) || 'none';
  });

  // Game Session State
  const [score, setScore] = useState(0);
  const [sessionCoins, setSessionCoins] = useState(0);
  const [combo, setCombo] = useState(1);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [currentStage, setCurrentStage] = useState<string>('');
  
  const [activePowerups, setActivePowerups] = useState<PowerUpState>({
    shield: false, magnet: false, double: false, slow: false
  });
  
  const gameRef = useRef<GameEngineHandle>(null);

  useEffect(() => { localStorage.setItem('wallet', wallet.toString()); }, [wallet]);
  useEffect(() => { localStorage.setItem('highScore', highScore.toString()); }, [highScore]);
  useEffect(() => { localStorage.setItem('purchasedGadgets', JSON.stringify(purchasedGadgets)); }, [purchasedGadgets]);
  useEffect(() => { localStorage.setItem('equippedGadget', equippedGadget); }, [equippedGadget]);

  // Initialize audio on mount
  useEffect(() => {
    audioService.init();
  }, []);

  // Handle first user interaction to enable audio (browser autoplay policy)
  useEffect(() => {
    let hasInteracted = false;
    const enableAudio = async () => {
      if (!hasInteracted) {
        hasInteracted = true;
        await audioService.init();
        // Start music based on current state after user interaction
        if (gameState === GameState.MENU) {
          audioService.startMenuMusic();
        } else if (gameState === GameState.PLAYING) {
          audioService.startMusic();
        }
      }
    };

    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, enableAudio, { once: true, passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, enableAudio);
      });
    };
  }, [gameState]);

  // Audio State Management
  useEffect(() => {
    audioService.init().then(() => {
      if (gameState === GameState.MENU) {
        audioService.stopMusic();
        audioService.startMenuMusic();
      } else if (gameState === GameState.PAUSED) {
        audioService.pauseMusic();
        audioService.stopMenuMusic();
      } else if (gameState === GameState.PLAYING) {
        audioService.stopMenuMusic();
        audioService.startMusic();
      } else {
        audioService.stopMenuMusic();
      }
    });
  }, [gameState]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global Pause Toggle
      if (e.code === 'Escape') {
        setGameState(current => {
            if (current === GameState.PLAYING) return GameState.PAUSED;
            if (current === GameState.PAUSED) return GameState.PLAYING;
            return current;
        });
        return;
      }

      // Game Controls
      if (gameState === GameState.PLAYING) {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            gameRef.current?.jump();
        } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
            gameRef.current?.performTrick('360');
        } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
            gameRef.current?.performTrick('superman');
        } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
            gameRef.current?.performTrick('kickflip');
        } 
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const startGame = (char: CharacterConfig) => {
    setCharacter(char);
    setScore(0);
    setSessionCoins(0);
    setCombo(1);
    setSessionId(prev => prev + 1);
    setGameState(GameState.PLAYING);
    // Audio will be handled by the useEffect hook
  };

  const buyPowerup = (type: PowerUpType, cost: number) => {
    if (wallet >= cost) {
        audioService.playBuy();
        setWallet(prev => prev - cost);
        setActivePowerups(prev => ({ ...prev, [type]: true }));
    }
  };

  const buyGadget = (type: GadgetType, cost: number) => {
    if (wallet >= cost && !purchasedGadgets[type]) {
        audioService.playBuy();
        setWallet(prev => prev - cost);
        setPurchasedGadgets(prev => ({ ...prev, [type]: true }));
    }
  };

  const handleGameOver = (finalScore: number, finalCoins: number) => {
    audioService.stopMusic();
    setWallet(prev => prev + finalCoins);
    if (finalScore > highScore) setHighScore(finalScore);
    setGameState(GameState.GAME_OVER);
  };

  const handleRestart = () => {
    setActivePowerups({ shield: false, magnet: false, double: false, slow: false });
    startGame(character);
  };

  return (
    <div className="relative w-full h-screen bg-black flex items-center justify-center overflow-hidden" style={{ width: '100vw', height: '100dvh' }}>
      <OrientationCheck />
      <div className="relative w-full h-full shadow-2xl overflow-hidden bg-slate-800"
           style={{
             width: '100%',
             height: '100dvh',
             position: 'relative'
           }}>
        
        <GameEngine
            ref={gameRef}
            character={character}
            sessionId={sessionId}
            isActive={gameState === GameState.PLAYING || gameState === GameState.PAUSED || gameState === GameState.GAME_OVER}
            isPaused={gameState === GameState.PAUSED || gameState === GameState.GAME_OVER}
            activePowerups={activePowerups}
            equippedGadget={equippedGadget}
            onScoreUpdate={(s, c, cm) => { setScore(s); setSessionCoins(c); setCombo(cm); }}
            onGameOver={handleGameOver}
            onPowerupExpire={(type) => setActivePowerups(prev => ({ ...prev, [type]: false }))}
            onMissionUpdate={setMissions}
            onStageChange={setCurrentStage}
            onReward={(amount) => setWallet(prev => prev + amount)}
        />
        
        {/* Overlay Layers */}
        {gameState === GameState.MENU && (
            <Menu 
                onStart={startGame} 
                onOpenShop={() => setGameState(GameState.SHOP)}
                onOpenLeaderboard={() => setGameState(GameState.LEADERBOARD)}
                wallet={wallet}
            />
        )}

        {gameState === GameState.SHOP && (
            <Shop 
                wallet={wallet}
                purchasedItems={activePowerups}
                purchasedGadgets={purchasedGadgets}
                equippedGadget={equippedGadget}
                onBuyPowerup={buyPowerup}
                onBuyGadget={buyGadget}
                onEquipGadget={setEquippedGadget}
                onClose={() => setGameState(GameState.MENU)}
            />
        )}

        {gameState === GameState.LEADERBOARD && (
            <Leaderboard onClose={() => setGameState(GameState.MENU)} />
        )}

        {gameState === GameState.PLAYING && (
            <HUD 
                score={Math.floor(score)} 
                coins={sessionCoins}
                combo={combo}
                highScore={highScore}
                powerups={activePowerups}
                missions={missions}
                currentStage={currentStage}
                onJump={() => gameRef.current?.jump()}
                onTrick={(t) => gameRef.current?.performTrick(t)}
                onSlide={() => gameRef.current?.slide()}
            />
        )}

        {gameState === GameState.PAUSED && (
            <PauseMenu 
                onResume={() => setGameState(GameState.PLAYING)}
                onExit={() => {
                    audioService.stopMusic();
                    setGameState(GameState.MENU);
                }}
            />
        )}

        {gameState === GameState.GAME_OVER && (
            <GameOver 
                score={Math.floor(score)}
                coins={sessionCoins}
                onRestart={handleRestart}
                onHome={() => setGameState(GameState.MENU)}
            />
        )}

        
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')]"></div>
      </div>
    </div>
  );
};

export default App;