import { useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, GRAVITY, JUMP_FORCE, BASE_SPEED, MAX_SPEED 
} from '../constants';
import { 
  CharacterConfig, Obstacle, Coin, Particle, FloatingText, PowerUpState, TrickType, PlayerState, GadgetType, Boss, Mission, LostObject, OwnerNPC
} from '../types';
import { audioService } from '../services/audioService';
import { missionService } from '../services/missionService';
import { stageService } from '../services/stageService';
import { bossService } from '../services/bossService';

interface GameEngineProps {
  character: CharacterConfig;
  isActive: boolean;
  isPaused: boolean;
  sessionId: number; 
  activePowerups: PowerUpState;
  equippedGadget: GadgetType;
  onScoreUpdate: (score: number, coins: number, combo: number, tzedakahCoinCount?: number, hasTzedakahShield?: boolean) => void;
  onGameOver: (finalScore: number, finalCoins: number) => void;
  onPowerupExpire: (type: keyof PowerUpState) => void;
  onMissionUpdate?: (missions: Mission[]) => void;
  onStageChange?: (stageName: string) => void;
  onReward?: (amount: number) => void;
}

export interface GameEngineHandle {
  performTrick: (type: TrickType) => void;
  jump: () => void;
  slide: () => void;
}

const GameEngine = forwardRef<GameEngineHandle, GameEngineProps>((props, ref) => {
  const {
    character, isActive, isPaused, sessionId, activePowerups, equippedGadget, onScoreUpdate, onGameOver, onPowerupExpire, onMissionUpdate, onStageChange, onReward
  } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reqRef = useRef<number>();
  const isActiveRef = useRef(isActive);
  const isPausedRef = useRef(isPaused);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const obstacleImagesRef = useRef<Record<string, HTMLImageElement>>({});
  const characterFaceImagesRef = useRef<Record<string, HTMLImageElement>>({});
  const lostObjectImagesRef = useRef<Record<string, HTMLImageElement>>({});
  const ownerNPCImagesRef = useRef<Record<string, HTMLImageElement>>({});
  
  // Mutable Game State
  const gameState = useRef({
    frame: 0,
    score: 0,
    coins: 0,
    tzedakahCoinCount: 0,
    speed: BASE_SPEED,
    combo: 1,
    comboTimer: 0,
    timeOfDay: 0, // 0-1. 0=Day, 0.5=Sunset, 1=Night
    distance: 0, // Track distance for stages and missions
    lastBossDistance: 0,
    currentStage: 'haredi_neighborhood',
    supermanCombo: 0, // Track superman combo for missions
    jumpedRamps: new Set<number>(), // Track which ramps we've jumped on
    lastMissionDistance: 0, // Track last distance for mission updates
    lastMissionTime: 0, // Track last time for mission updates
    tzedakahMessageTimer: 0, // Timer for displaying the Hebrew message
    
    // Player
    player: {
      x: 200, y: GROUND_Y - 110,
      vy: 0,
      width: 60, height: 110,
      grounded: true,
      tricking: false,
      trickType: 'none' as TrickType,
      angle: 0,
      boardAngle: 0,
      jumpCount: 0,
      rampBoosted: false,
      grinding: false,
      grindDistance: 0,
      flashCounter: 0,
      crashed: false,
      crashTimer: 0,
      sliding: false,
      slideTimer: 0,
      isCarryingLostObject: false,
      carryingObjectType: undefined,
      hasTzedakahShield: false,
    } as PlayerState & { grindDistance: number; sliding: boolean; slideTimer: number },

    obstacles: [] as Obstacle[],
    coinsArr: [] as Coin[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    powerupTimers: { shield: 0, magnet: 0, double: 0, slow: 0 },
    bosses: [] as Boss[],
    lostObjects: [] as LostObject[],
    ownerNPCs: [] as OwnerNPC[],
    startTime: Date.now()
  });

  useImperativeHandle(ref, () => ({
    jump: () => {
      const p = gameState.current.player;
      if (p.crashed) return;
      if (p.grounded || p.grinding || p.jumpCount < 2) {
        p.vy = JUMP_FORCE;
        p.grounded = false;
        p.grinding = false; 
        p.jumpCount++;
        audioService.playJump();
        
        // Gadget effects on jump
        if (equippedGadget === 'rainbow_trail') {
            spawnParticles(p.x + 30, p.y + 100, 'rainbow', 'sparkle', 10);
        } else if (equippedGadget === 'fire_trail') {
            spawnParticles(p.x + 30, p.y + 100, '#ff4500', 'sparkle', 12);
        } else if (equippedGadget === 'diamond_sparkles') {
            spawnParticles(p.x + 30, p.y + 100, '#b9f2ff', 'sparkle', 15);
        } else if (equippedGadget === 'lightning_aura') {
            spawnParticles(p.x + 30, p.y + 100, '#9370db', 'sparkle', 10);
        } else if (equippedGadget === 'cosmic_wings') {
            spawnParticles(p.x + 30, p.y + 100, '#4b0082', 'star', 8);
        } else if (equippedGadget === 'neon_glow') {
            spawnParticles(p.x + 30, p.y + 100, '#39ff14', 'sparkle', 10);
        } else {
            spawnParticles(p.x + 30, p.y + 100, '#fff', 'dust', 5);
        }
      }
    },
    slide: () => {
      const p = gameState.current.player;
      if (p.crashed) return;
      if (p.grounded && !p.grinding && !p.sliding) {
        // Slide under obstacles - temporarily lower hitbox
        p.sliding = true;
        p.slideTimer = 30; // 30 frames = ~0.5 seconds at 60fps
        p.height = 60; // Reduce height
        p.y = GROUND_Y - 60;
        audioService.playGrind();
        spawnParticles(p.x + 30, p.y + 60, '#fff', 'dust', 8);
      }
    },
    performTrick: (type: TrickType) => {
      const p = gameState.current.player;
      if (p.crashed) return;
      if (!p.grounded && !p.grinding && !p.tricking) {
        p.tricking = true;
        p.trickType = type;
        
        let points = 200;
        let text = "TRICK!";
        
        if (type === '360') { 
            p.angle = Math.PI * 2; 
            text = "360 FLIP!"; 
            // Add slight upward boost for realism
            p.vy -= 2;
        }
        if (type === 'superman') { 
            p.angle = 0; 
            points = 300; 
            text = "SUPERMAN!"; 
            audioService.playSuperTrick();
            // Track superman combo for missions
            gameState.current.supermanCombo++;
            if (gameState.current.supermanCombo >= 3) {
                const reward = missionService.updateMissionByType('trick_combo', 3);
                if (reward > 0 && onReward) {
                    onReward(reward);
                    spawnFloatingText(`משימה הושלמה! +${reward}₪`, CANVAS_WIDTH / 2, 180, '#00ff00');
                }
                gameState.current.supermanCombo = 0; // Reset after completing
            }
            // Superman extends body horizontally
        } else {
            // Reset combo if not superman
            gameState.current.supermanCombo = 0;
        }
        if (type === 'kickflip') { 
            p.boardAngle = Math.PI * 2; 
            points = 250; 
            text = "KICKFLIP!"; 
            audioService.playTrick();
            // Kickflip adds slight rotation
            p.angle = Math.PI * 0.3;
        }
        
        if (p.rampBoosted) { points *= 2; text = "RAMP " + text; }
        if (activePowerups.double) { points *= 2; text = "x2 " + text; }
        
        gameState.current.score += points;
        spawnFloatingText(text, p.x, p.y);
        if (type !== 'superman') audioService.playTrick();
        
        // Gadget effects on trick
        let color = '#f1c40f';
        if (equippedGadget === 'rainbow_trail') {
            color = 'rainbow';
        } else if (equippedGadget === 'fire_trail') {
            color = '#ff4500';
        } else if (equippedGadget === 'ice_board') {
            color = '#00ffff';
        } else if (equippedGadget === 'diamond_sparkles') {
            color = '#b9f2ff';
        } else if (equippedGadget === 'lightning_aura') {
            color = '#9370db';
        } else if (equippedGadget === 'cosmic_wings') {
            color = '#4b0082';
        } else if (equippedGadget === 'neon_glow') {
            color = '#39ff14';
        }
        spawnParticles(p.x + 30, p.y + 50, color, 'star', 8);
      }
    }
  }));

  const spawnParticles = (x: number, y: number, color: string, type: 'dust'|'star'|'sparkle', count: number) => {
    for(let i=0; i<count; i++) {
      let pColor = color;
      if (color === 'rainbow') {
          const hue = Math.floor(Math.random() * 360);
          pColor = `hsl(${hue}, 100%, 60%)`;
      }
      gameState.current.particles.push({
        x, y, color: pColor, type,
        size: Math.random() * 5 + 2,
        speedX: Math.random() * 6 - 3,
        speedY: Math.random() * 6 - 3,
        life: 1.0,
        decay: Math.random() * 0.03 + 0.01
      });
    }
  };

  const spawnFloatingText = (text: string, x: number, y: number, color: string = '#fff') => {
    gameState.current.floatingTexts.push({
      id: Date.now() + Math.random(),
      text, x, y, color,
      life: 60
    });
  };

  const initGame = () => {
    const st = gameState.current;
    st.frame = 0;
    st.score = 0;
    st.coins = 0;
    st.speed = BASE_SPEED;
    st.timeOfDay = 0; // Start at Day
    st.distance = 0;
    st.lastBossDistance = 0;
    st.currentStage = 'haredi_neighborhood';
    st.supermanCombo = 0;
    st.jumpedRamps.clear();
    st.lastMissionDistance = 0;
    st.lastMissionTime = 0;
    st.tzedakahCoinCount = 0;
    st.tzedakahMessageTimer = 0;
    st.player.y = GROUND_Y - st.player.height;
    st.player.vy = 0;
    st.player.crashed = false;
    st.player.crashTimer = 0;
    st.player.angle = 0;
    st.player.grinding = false;
    st.player.grindDistance = 0;
    st.player.sliding = false;
    st.player.slideTimer = 0;
    st.player.isCarryingLostObject = false;
    st.player.carryingObjectType = undefined;
    st.player.hasTzedakahShield = false;
    st.obstacles = [];
    st.coinsArr = [];
    st.particles = [];
    st.floatingTexts = [];
    st.bosses = [];
    st.lostObjects = [];
    st.ownerNPCs = [];
    st.powerupTimers = { shield: 0, magnet: 0, double: 0, slow: 0 };
    st.startTime = Date.now();
    
    if (activePowerups.magnet) st.powerupTimers.magnet = 600;
    if (activePowerups.double) st.powerupTimers.double = 600;
    if (activePowerups.slow) st.powerupTimers.slow = 300;
    
    // Reset missions
    missionService.reset();
    if (onMissionUpdate) {
      onMissionUpdate(missionService.getMissions());
    }
  };

  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  };

  const drawShadow = (ctx: CanvasRenderingContext2D, x: number, w: number, distFromGround: number) => {
      ctx.save();
      ctx.translate(x + w/2, GROUND_Y);
      const scale = Math.max(0.5, 1 - distFromGround / 400);
      const alpha = Math.max(0.1, 0.4 - distFromGround / 300);
      ctx.scale(scale, scale);
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, w/1.8, 8, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
  };

  // Helper for color interpolation
  const interpolateColor = (color1: string, color2: string, factor: number) => {
    // Simple RGB interpolation approximation for hex
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);
    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    
    return `rgb(${r},${g},${b})`;
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, p: PlayerState) => {
    if (p.flashCounter > 0 && Math.floor(p.flashCounter / 4) % 2 === 0) return;

    if (!p.crashed) drawShadow(ctx, p.x, p.width, GROUND_Y - (p.y + p.height));

    ctx.save();
    ctx.translate(p.x + p.width / 2, p.y + p.height / 2);

    if (p.crashed) {
       ctx.rotate(p.angle); 
    } else {
        if (p.tricking) {
            if (p.trickType === '360') { 
                // Realistic 360 flip - slower rotation
                p.angle -= 0.15; // Slower rotation
                if (p.angle < 0) p.angle = 0; 
                ctx.rotate(p.angle); 
                // Add slight forward lean during rotation
                ctx.translate(0, Math.sin(p.angle) * 3);
            }
            else if (p.trickType === 'superman') {
                // Beautiful superman - horizontal flight pose
                ctx.rotate(Math.PI / 2); // Rotate to horizontal
                ctx.translate(0, -10); // Slight lift
                // No compression - keep natural proportions
                ctx.scale(1.1, 1.0); // Slight horizontal stretch only
            }
        } else if (p.grinding) {
            ctx.rotate(Math.sin(gameState.current.frame * 0.5) * 0.05 - 0.1); 
        } else if (!p.grounded) {
            ctx.rotate(p.vy * 0.02);
        }
    }

    ctx.scale(1.2, 1.2);

    // SKATEBOARD
    if (!p.crashed || (p.crashed && p.crashTimer < 10)) { 
        ctx.save();
        let boardY = 45;
        let boardX = 0;
        
        if (p.crashed) {
            boardY += p.crashTimer * 5; 
            boardX += p.crashTimer * 2;
            ctx.translate(boardX, boardY);
            ctx.rotate(p.crashTimer * 0.2);
        } else {
             if (p.trickType === 'kickflip' && p.tricking) {
                // Realistic kickflip - board spins faster, player stays upright
                p.boardAngle -= 0.5; // Faster board rotation
                if (p.boardAngle < 0) p.boardAngle = 0; 
                ctx.rotate(p.boardAngle);
                // Board flips independently
                ctx.translate(0, Math.sin(p.boardAngle * 2) * 2); // Slight vertical movement
            }
            if (p.trickType === 'superman' && p.tricking) {
                // Realistic superman - board goes forward, body extends backward
                ctx.translate(-25, 15); // Board moves forward and down
                ctx.rotate(-0.1); // Slight board tilt
            }
            if (p.trickType === '360' && p.tricking) {
                // Board rotates with player during 360
                ctx.rotate(p.angle * 0.3); // Board rotates slower than player
            }
            if (p.grinding) ctx.rotate(0.2); 
        }

        // Realistic Skateboard - Longer with nose and tail curved upward
        const boardLength = 80; // Longer board (was 70)
        const boardWidth = 8; // Board thickness
        const noseTailCurve = 6; // How much nose/tail curve up
        
        // Gadget: Board effects
        if (equippedGadget === 'neon_board') {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ff00';
            ctx.fillStyle = '#00ff00'; 
        } else if (equippedGadget === 'ice_board') {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00ffff';
            ctx.fillStyle = '#b0e0e6'; // Light blue ice color
        } else if (equippedGadget === 'neon_glow') {
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#39ff14';
            ctx.fillStyle = '#1e1b18'; // Dark board with neon glow
        } else {
            ctx.fillStyle = '#1e1b18'; // Dark board color
        }
        
        // Board deck - longer with curved nose and tail
        ctx.beginPath();
        // Nose (front) - curves upward
        ctx.moveTo(-boardLength/2, 35);
        ctx.quadraticCurveTo(-boardLength/2 + 8, 35 - noseTailCurve, -boardLength/2 + 15, 35 - noseTailCurve/2);
        // Top edge - slightly concave
        ctx.quadraticCurveTo(-20, 32, 0, 33);
        ctx.quadraticCurveTo(20, 32, boardLength/2 - 15, 35 - noseTailCurve/2);
        // Tail (back) - curves upward
        ctx.quadraticCurveTo(boardLength/2 - 8, 35 - noseTailCurve, boardLength/2, 35);
        // Bottom edge
        ctx.lineTo(boardLength/2, 35 + boardWidth);
        // Tail bottom - curves down
        ctx.quadraticCurveTo(boardLength/2 - 8, 35 + boardWidth + noseTailCurve/2, boardLength/2 - 15, 35 + boardWidth);
        // Bottom edge - slightly concave
        ctx.quadraticCurveTo(20, 41, 0, 42);
        ctx.quadraticCurveTo(-20, 41, -boardLength/2 + 15, 35 + boardWidth);
        // Nose bottom - curves down
        ctx.quadraticCurveTo(-boardLength/2 + 8, 35 + boardWidth + noseTailCurve/2, -boardLength/2, 35 + boardWidth);
        ctx.closePath();
        ctx.fill();
        
        // Board edge highlight (curved)
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-boardLength/2, 35);
        ctx.quadraticCurveTo(-boardLength/2 + 8, 35 - noseTailCurve, -boardLength/2 + 15, 35 - noseTailCurve/2);
        ctx.quadraticCurveTo(-20, 32, 0, 33);
        ctx.quadraticCurveTo(20, 32, boardLength/2 - 15, 35 - noseTailCurve/2);
        ctx.quadraticCurveTo(boardLength/2 - 8, 35 - noseTailCurve, boardLength/2, 35);
        ctx.stroke();
        
        // Reset shadow for gadgets that don't need it
        if (equippedGadget !== 'neon_board' && equippedGadget !== 'ice_board' && equippedGadget !== 'neon_glow') {
            ctx.shadowBlur = 0;
        }

        if (equippedGadget !== 'neon_board' && equippedGadget !== 'ice_board') {
            // Grip tape (sandpaper texture) - curved with nose/tail
            ctx.fillStyle = '#2c2c2c';
            ctx.beginPath();
            ctx.moveTo(-boardLength/2, 35);
            ctx.quadraticCurveTo(-boardLength/2 + 8, 35 - noseTailCurve, -boardLength/2 + 15, 35 - noseTailCurve/2);
            ctx.quadraticCurveTo(-20, 32, 0, 33);
            ctx.quadraticCurveTo(20, 32, boardLength/2 - 15, 35 - noseTailCurve/2);
            ctx.quadraticCurveTo(boardLength/2 - 8, 35 - noseTailCurve, boardLength/2, 35);
            ctx.lineTo(boardLength/2, 38);
            ctx.quadraticCurveTo(boardLength/2 - 8, 38, boardLength/2 - 15, 38);
            ctx.quadraticCurveTo(20, 35, 0, 36);
            ctx.quadraticCurveTo(-20, 35, -boardLength/2 + 15, 38);
            ctx.quadraticCurveTo(-boardLength/2 + 8, 38, -boardLength/2, 38);
            ctx.closePath();
            ctx.fill();
            
            // Grip tape texture lines
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 0.5;
            for (let i = -boardLength/2 + 10; i <= boardLength/2 - 10; i += 5) {
                ctx.beginPath();
                const curveOffset = Math.abs(i) > boardLength/2 - 20 ? Math.sin((Math.abs(i) - (boardLength/2 - 20)) * 0.3) * 1 : 0;
                const y = 33 + Math.sin(i * 0.1) * 2 + curveOffset; // Follow curve
                ctx.moveTo(i, y);
                ctx.lineTo(i, y + 3);
                ctx.stroke();
            }
            
            // Board graphic/decal - centered
            ctx.fillStyle = '#d35400'; 
            ctx.beginPath();
            ctx.moveTo(-boardLength/2 + 10, 38);
            ctx.quadraticCurveTo(-15, 36, 0, 37);
            ctx.quadraticCurveTo(15, 36, boardLength/2 - 10, 38);
            ctx.lineTo(boardLength/2 - 10, 40);
            ctx.quadraticCurveTo(15, 38, 0, 39);
            ctx.quadraticCurveTo(-15, 38, -boardLength/2 + 10, 40);
            ctx.closePath();
            ctx.fill();
        }
        
        // Trucks & Wheels - adjusted for longer board
        ctx.fillStyle = '#bdc3c7'; 
        ctx.fillRect(-28, 43, 10, 8); // Front truck
        ctx.fillRect(18, 43, 10, 8); // Back truck

        ctx.fillStyle = '#ecf0f1'; 
        ctx.beginPath(); ctx.arc(-23, 52, 7, 0, Math.PI*2); ctx.fill(); // Front wheel
        ctx.beginPath(); ctx.arc(23, 52, 7, 0, Math.PI*2); ctx.fill(); // Back wheel
        
        ctx.restore();
    }

    const breathing = p.crashed ? 0 : Math.sin(gameState.current.frame * 0.1) * 1;
    
    // Improved running animation - slower and more realistic
    const runCycle = gameState.current.frame * 0.2; // Slower animation (was 0.5)
    
    // Legs & Shoes - Positioned ON the skateboard (not under it)
    const drawLeg = (isBack: boolean) => {
        ctx.save();
        
        const legBaseY = 12; // Start from torso (relative to center)
        const offset = isBack ? -10 : 10;
        
        // More realistic leg animation - smooth and natural
        const legCycle = runCycle + (isBack ? Math.PI : 0);
        
        // Thigh rotation - more pronounced and smooth
        const thighRot = isBack 
            ? Math.sin(legCycle) * 0.3 
            : -Math.sin(legCycle) * 0.3;
        
        // Knee bend - more realistic based on movement
        const kneeBend = p.grounded && !p.grinding 
            ? Math.abs(Math.sin(legCycle)) * 0.35 
            : (p.grounded ? 0.15 : 0.5);
        
        // Thigh (ירך) - starts from torso
        ctx.translate(offset, legBaseY);
        ctx.rotate(thighRot);
        ctx.fillStyle = character.pants;
        ctx.beginPath();
        ctx.moveTo(-7, -10);
        ctx.lineTo(7, -10);
        ctx.lineTo(6, 15);
        ctx.lineTo(-6, 15);
        ctx.closePath();
        ctx.fill();
        
        // Thigh shading for depth
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(-6, -5, 12, 8);
        
        // Thigh highlight
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(-6, -8, 12, 4);
        
        // Knee joint (ברך)
        ctx.translate(0, 15);
        const shinRot = isBack 
            ? Math.sin(legCycle) * 0.2 + kneeBend
            : -Math.sin(legCycle) * 0.2 - kneeBend;
        ctx.rotate(shinRot + (p.grinding ? (isBack ? 0 : 0.2) : 0));
        
        // Knee highlight
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Shin (שוק)
        ctx.fillStyle = character.pants;
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(6, 0);
        ctx.lineTo(5, 15);
        ctx.lineTo(-5, 15);
        ctx.closePath();
        ctx.fill();
        
        // Shin shading
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(-5, 2, 10, 11);
        
        // Ankle (קרסול) - positioned to place foot on skateboard
        ctx.translate(0, 15);
        // Calculate: legBaseY(12) + thigh(15) + shin(15) = 42, board is at 35
        // So we need to go up 7 pixels to reach the board
        const ankleY = 35 - (legBaseY + 15 + 15); // = 35 - 42 = -7 (go up)
        
        // Ankle joint
        ctx.fillStyle = character.skin;
        ctx.beginPath();
        ctx.arc(0, ankleY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Shoe (נעל) - positioned ON skateboard (Y=35-40)
        const shoeY = ankleY;
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.moveTo(-8, shoeY);
        ctx.lineTo(8, shoeY);
        ctx.lineTo(9, shoeY + 5);
        ctx.lineTo(-9, shoeY + 5);
        ctx.closePath();
        ctx.fill();
        
        // Shoe shading
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(-8, shoeY + 2, 16, 3);
        
        // Shoe sole (סוליה) - thicker
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-9, shoeY + 5, 18, 2.5);
        
        // Shoe details - more realistic
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-6, shoeY);
        ctx.lineTo(-6, shoeY + 5);
        ctx.moveTo(6, shoeY);
        ctx.lineTo(6, shoeY + 5);
        ctx.stroke();
        
        // Shoe laces (שרוכים) - more detailed
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-5, shoeY + 1);
        ctx.lineTo(5, shoeY + 1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-5, shoeY + 3);
        ctx.lineTo(5, shoeY + 3);
        ctx.stroke();
        
        // Lace holes
        ctx.fillStyle = '#1a1a1a';
        for (let i = -4; i <= 4; i += 2) {
            ctx.beginPath();
            ctx.arc(i, shoeY + 0.5, 0.8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    };

    drawLeg(true);
    drawLeg(false);

    // Torso (גוף) - More realistic
    ctx.translate(0, breathing);
    ctx.fillStyle = character.shirt;
    ctx.beginPath();
    // Shoulders wider
    ctx.moveTo(-18, -22);
    ctx.lineTo(18, -22);
    // Chest
    ctx.lineTo(16, -5);
    // Waist
    ctx.lineTo(14, 16);
    ctx.lineTo(-14, 16);
    ctx.lineTo(-16, -5);
    ctx.closePath();
    ctx.fill();
    
    // Shirt collar
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.moveTo(-8, -22);
    ctx.lineTo(8, -22);
    ctx.lineTo(6, -15);
    ctx.lineTo(-6, -15);
    ctx.closePath();
    ctx.fill();
    
    // Gadget: Accessories
    if (equippedGadget === 'gold_chain') {
        ctx.save();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, -20, 10, 0, Math.PI); ctx.stroke();
        ctx.fillStyle = '#ffd700';
        ctx.font = '10px Arial'; ctx.textAlign='center'; ctx.fillText('ח', 0, -8);
        ctx.restore();
    }
    
    // Gadget: Diamond Sparkles - sparkles around player
    if (equippedGadget === 'diamond_sparkles') {
        ctx.save();
        const sparkleFrame = gameState.current.frame;
        for (let i = 0; i < 6; i++) {
            const angle = (sparkleFrame * 0.1 + i * Math.PI / 3) % (Math.PI * 2);
            const radius = 25 + Math.sin(sparkleFrame * 0.2 + i) * 5;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            ctx.fillStyle = `rgba(185, 242, 255, ${0.7 + Math.sin(sparkleFrame * 0.3 + i) * 0.3})`;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
    
    // Gadget: Lightning Aura - electric aura around player
    if (equippedGadget === 'lightning_aura') {
        ctx.save();
        ctx.strokeStyle = `rgba(147, 112, 219, ${0.6 + Math.sin(gameState.current.frame * 0.3) * 0.4})`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#9370db';
        ctx.beginPath();
        ctx.arc(0, 0, 35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
    }
    
    // Gadget: Cosmic Wings - wings effect
    if (equippedGadget === 'cosmic_wings') {
        ctx.save();
        const wingFrame = gameState.current.frame;
        const wingFlap = Math.sin(wingFrame * 0.15) * 0.3;
        ctx.fillStyle = `rgba(75, 0, 130, ${0.7})`;
        // Left wing
        ctx.beginPath();
        ctx.moveTo(-25, -10);
        ctx.quadraticCurveTo(-35 + wingFlap * 5, -20, -40 + wingFlap * 10, -15);
        ctx.quadraticCurveTo(-35 + wingFlap * 5, -5, -25, -10);
        ctx.fill();
        // Right wing
        ctx.beginPath();
        ctx.moveTo(25, -10);
        ctx.quadraticCurveTo(35 - wingFlap * 5, -20, 40 - wingFlap * 10, -15);
        ctx.quadraticCurveTo(35 - wingFlap * 5, -5, 25, -10);
        ctx.fill();
        ctx.restore();
    }
    
    // Gadget: Fire Trail - fire particles around player
    if (equippedGadget === 'fire_trail' && !p.grounded) {
        ctx.save();
        for (let i = 0; i < 3; i++) {
            const fireX = (Math.random() - 0.5) * 30;
            const fireY = 20 + Math.random() * 15;
            ctx.fillStyle = `rgba(255, ${69 + Math.random() * 50}, 0, ${0.8})`;
            ctx.beginPath();
            ctx.arc(fireX, fireY, 4 + Math.random() * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
    
    // Tzitzit (ציציות) - More realistic, coming out from shirt
    if (character.id === 'rabbi' || character.type === 'kippah') {
        ctx.save();
        const tzitzitSway = Math.sin(gameState.current.frame * 0.2 + (p.grounded ? 0 : 1)) * 2;
        
        // Front right tzitzit
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(14, 16);
        ctx.quadraticCurveTo(16 + tzitzitSway, 26, 18 + tzitzitSway, 32);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(14, 16);
        ctx.quadraticCurveTo(12 + tzitzitSway, 26, 10 + tzitzitSway, 32);
        ctx.stroke();
        
        // Front left tzitzit
        ctx.beginPath();
        ctx.moveTo(-14, 16);
        ctx.quadraticCurveTo(-16 + tzitzitSway, 26, -18 + tzitzitSway, 32);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-14, 16);
        ctx.quadraticCurveTo(-12 + tzitzitSway, 26, -10 + tzitzitSway, 32);
        ctx.stroke();
        
        // Back tzitzit (behind)
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(12, 16);
        ctx.quadraticCurveTo(14 + tzitzitSway, 28, 16 + tzitzitSway, 35);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-12, 16);
        ctx.quadraticCurveTo(-14 + tzitzitSway, 28, -16 + tzitzitSway, 35);
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // Tzitzit knots (קשרים)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(16, 20, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-16, 20, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    // Arms (ידיים) - Improved realistic animation - slower
    const drawArm = (isBack: boolean) => {
        // Slower arm animation synchronized with legs
        const armCycle = runCycle + (isBack ? Math.PI : 0);
        let armWag = p.crashed 
            ? 2 
            : (p.grinding 
                ? -1.2 
                : (p.grounded 
                    ? Math.sin(armCycle) * 0.3  // Reduced from 0.5 to 0.3
                    : -0.4)); // Reduced from -0.6 to -0.4
        
        // Superman trick - extend arms forward/backward gracefully
        if (p.tricking && p.trickType === 'superman') {
            armWag = isBack ? -1.3 : 1.3; // Graceful arm extension
            // Smooth wave animation
            armWag += Math.sin(gameState.current.frame * 0.2) * 0.15;
        }
        
        const upperArmRot = isBack ? armWag : -armWag;
        const forearmRot = isBack ? armWag * 0.6 : -armWag * 0.6;
        const xOff = isBack ? -17 : 17;
        
        ctx.save();
        ctx.translate(xOff, -8);
        
        // Upper arm (זרוע עליונה) - More realistic shape
        ctx.rotate(upperArmRot);
        ctx.fillStyle = character.skin;
        ctx.beginPath();
        ctx.ellipse(0, 0, 6.5, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Upper arm shading
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(0, 2, 6, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Shoulder joint highlight
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.arc(0, -8, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Elbow (מרפק)
        ctx.translate(0, 11);
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Forearm (אמה) - More realistic
        ctx.rotate(forearmRot);
        ctx.fillStyle = character.skin;
        ctx.beginPath();
        ctx.ellipse(0, 0, 5.5, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Forearm shading
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.beginPath();
        ctx.ellipse(0, 2, 5, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Hand (כף יד) - More detailed
        ctx.translate(0, 13);
        ctx.fillStyle = character.skin;
        ctx.beginPath();
        // Palm
        ctx.ellipse(0, 0, 6, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Hand shading
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(0, 2, 5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Fingers (אצבעות) - More realistic
        ctx.fillStyle = character.skin;
        const fingerPositions = [-3, -1, 1, 3];
        fingerPositions.forEach((pos) => {
            ctx.beginPath();
            ctx.arc(pos, -5, 1.8, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Thumb (אגודל)
        ctx.beginPath();
        ctx.arc(-5, -2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    };

    drawArm(true);
    drawArm(false);

    // Head (ראש) - Menu style (clean and simple)
    ctx.translate(0, -22);
    
    // Neck (צוואר)
    ctx.fillStyle = character.skin;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(6, 0);
    ctx.lineTo(5, 10);
    ctx.lineTo(-5, 10);
    ctx.closePath();
    ctx.fill();
    
    // Head shape (צורת ראש) - Menu style with radial gradient
    const headGradient = ctx.createRadialGradient(0, -8, 0, 0, -8, 16);
    headGradient.addColorStop(0, character.skin);
    // Convert skin color to rgba for transparency
    const skinR = parseInt(character.skin.substring(1, 3), 16);
    const skinG = parseInt(character.skin.substring(3, 5), 16);
    const skinB = parseInt(character.skin.substring(5, 7), 16);
    headGradient.addColorStop(1, `rgba(${skinR}, ${skinG}, ${skinB}, 0.8)`);
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(0, -8, 16, 0, Math.PI * 2);
    ctx.fill();
    
    // Hair (שיער) - Simple like menu
    if (character.type !== 'hat' && character.type !== 'kippah') {
        if (!character.uniqueFeature || (character.uniqueFeature !== 'curly_hair' && character.uniqueFeature !== 'long_hair' && character.uniqueFeature !== 'cap' && character.uniqueFeature !== 'bald')) {
            ctx.fillStyle = character.hair;
            ctx.beginPath();
            ctx.moveTo(-17, -8);
            ctx.quadraticCurveTo(0, -25, 17, -8);
            ctx.lineTo(15, 2);
            ctx.lineTo(-15, 2);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    // Kippah (כיפה) - Menu style
    if (character.type === 'kippah') {
        ctx.save();
        const kippahY = -22;
        const kippahRadius = 10;
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, kippahY, kippahRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, kippahY, kippahRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(0, kippahY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Hair around kippah
        ctx.fillStyle = character.hair;
        ctx.beginPath();
        ctx.moveTo(-17, -8);
        ctx.quadraticCurveTo(0, -25, 17, -8);
        ctx.lineTo(15, 2);
        ctx.lineTo(-15, 2);
        ctx.closePath();
        ctx.fill();
    }
    
    // Beard (זקן) - Menu style (simple gradient)
    if (character.beard && !p.crashed) {
        ctx.save();
        const beardGradient = ctx.createLinearGradient(0, -8, 0, 12);
        beardGradient.addColorStop(0, '#d5d5d5');
        beardGradient.addColorStop(0.5, '#ecf0f1');
        beardGradient.addColorStop(1, '#c0c0c0');
        ctx.fillStyle = beardGradient;
        ctx.beginPath();
        ctx.moveTo(-16, -8);
        ctx.quadraticCurveTo(-16, 6, -9, 12);
        ctx.quadraticCurveTo(-4, 15, 0, 15.5);
        ctx.quadraticCurveTo(4, 15, 9, 12);
        ctx.quadraticCurveTo(16, 6, 16, -8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#a0a0a0';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
    
    // Face features (תווי פנים) - Use image if available, otherwise draw
    if (!p.crashed && character.id !== 'rabbi') {
        // Check if we have a face image for this character
        const faceImageKey = `${character.id}-face`;
        const faceImage = characterFaceImagesRef.current[faceImageKey];
        
        if (faceImage && faceImage.complete && faceImage.naturalWidth > 0) {
            // Draw face image instead of drawing features
            // Scale the image to fit the head (radius 16, so diameter 32)
            const faceSize = 32;
            ctx.drawImage(faceImage, -faceSize/2, -24, faceSize, faceSize);
        } else {
            // Fallback: Draw face features (Menu style - clean and simple)
            // Face shading for depth (like menu)
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.beginPath();
            ctx.ellipse(-12, -8, 8, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(12, -8, 8, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Forehead highlight
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.ellipse(0, -18, 10, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Eyes - Menu style (clean)
            const eyeY = -12;
            const eyeSpacing = 5;
            
            // Eye whites
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(-eyeSpacing, eyeY, 3.5, 2.8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(eyeSpacing, eyeY, 3.5, 2.8, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Iris
            ctx.fillStyle = '#2c1810';
            ctx.beginPath();
            ctx.arc(-eyeSpacing, eyeY, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eyeSpacing, eyeY, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupil
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(-eyeSpacing, eyeY, 1.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eyeSpacing, eyeY, 1.2, 0, Math.PI * 2);
            ctx.fill();
            
            // Eye highlights
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-eyeSpacing - 0.8, eyeY - 0.8, 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eyeSpacing - 0.8, eyeY - 0.8, 0.8, 0, Math.PI * 2);
            ctx.fill();
            
            // Eyebrows
            const browColor = character.hair === '#ecf0f1' || character.hair === '#ffffff' ? '#8b8b8b' : character.hair;
            ctx.strokeStyle = browColor;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-9, -16);
            ctx.quadraticCurveTo(-5, -17, -1, -16);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(1, -16);
            ctx.quadraticCurveTo(5, -17, 9, -16);
            ctx.stroke();
            
            // Nose
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.beginPath();
            ctx.ellipse(0, -5, 1.5, 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-1.5, -10);
            ctx.quadraticCurveTo(0, -6, 1.5, -10);
            ctx.stroke();
            
            // Mouth
            if (!character.beard && character.uniqueFeature !== 'mustache') {
                ctx.strokeStyle = 'rgba(139,69,19,0.6)';
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(-4, -2);
                ctx.quadraticCurveTo(0, 0, 4, -2);
                ctx.stroke();
                ctx.fillStyle = 'rgba(139,69,19,0.3)';
                ctx.beginPath();
                ctx.ellipse(0, -1.5, 4, 1.5, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
    } else if (!p.crashed && character.id === 'rabbi') {
        // Rabbi - Keep original detailed face (as requested)
        const skinR = parseInt(character.skin.substring(1, 3), 16);
        const skinG = parseInt(character.skin.substring(3, 5), 16);
        const skinB = parseInt(character.skin.substring(5, 7), 16);
        
        // Advanced face shading for realistic depth and dimension
        const leftShadowGradient = ctx.createRadialGradient(-12, -8, 0, -12, -8, 18);
        leftShadowGradient.addColorStop(0, `rgba(${Math.max(0, skinR - 35)}, ${Math.max(0, skinG - 35)}, ${Math.max(0, skinB - 35)}, 0.5)`);
        leftShadowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = leftShadowGradient;
        ctx.beginPath();
        ctx.arc(-12, -8, 18, 0, Math.PI * 2);
        ctx.fill();
        
        const rightShadowGradient = ctx.createRadialGradient(12, -8, 0, 12, -8, 18);
        rightShadowGradient.addColorStop(0, `rgba(${Math.max(0, skinR - 35)}, ${Math.max(0, skinG - 35)}, ${Math.max(0, skinB - 35)}, 0.5)`);
        rightShadowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = rightShadowGradient;
        ctx.beginPath();
        ctx.arc(12, -8, 18, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(${Math.min(255, skinR + 15)}, ${Math.min(255, skinG + 15)}, ${Math.min(255, skinB + 15)}, 0.3)`;
        ctx.beginPath();
        ctx.ellipse(0, -18, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const eyeY = -12;
        const eyeSpacing = 5;
        
        ctx.fillStyle = `rgba(${Math.max(0, skinR - 25)}, ${Math.max(0, skinG - 25)}, ${Math.max(0, skinB - 25)}, 0.2)`;
        ctx.beginPath();
        ctx.ellipse(-eyeSpacing, eyeY - 1, 4.5, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(eyeSpacing, eyeY - 1, 4.5, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(${Math.max(0, skinR - 20)}, ${Math.max(0, skinG - 20)}, ${Math.max(0, skinB - 20)}, 0.3)`;
        ctx.beginPath();
        ctx.ellipse(-eyeSpacing, eyeY - 2.5, 4, 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(eyeSpacing, eyeY - 2.5, 4, 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-eyeSpacing, eyeY, 4, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(eyeSpacing, eyeY, 4, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(230, 230, 240, 0.6)';
        ctx.beginPath();
        ctx.ellipse(-eyeSpacing, eyeY + 0.5, 3.5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(eyeSpacing, eyeY + 0.5, 3.5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const irisColor = character.hair === '#ecf0f1' || character.hair === '#ffffff' ? '#4a5568' : '#2c1810';
        const irisGradient = ctx.createRadialGradient(-eyeSpacing, eyeY, 0, -eyeSpacing, eyeY, 2.5);
        irisGradient.addColorStop(0, irisColor);
        irisGradient.addColorStop(0.7, '#1a1a1a');
        irisGradient.addColorStop(1, '#0a0a0a');
        ctx.fillStyle = irisGradient;
        ctx.beginPath();
        ctx.arc(-eyeSpacing, eyeY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeSpacing, eyeY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(-eyeSpacing, eyeY, 2.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(eyeSpacing, eyeY, 2.5, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-eyeSpacing, eyeY, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeSpacing, eyeY, 1.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-eyeSpacing - 0.8, eyeY - 0.6, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeSpacing - 0.8, eyeY - 0.6, 1.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(-eyeSpacing + 0.5, eyeY - 1, 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeSpacing + 0.5, eyeY - 1, 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = `rgba(${Math.max(0, skinR - 15)}, ${Math.max(0, skinG - 15)}, ${Math.max(0, skinB - 15)}, 0.4)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(-eyeSpacing, eyeY + 2.5, 3.5, 0.2, Math.PI - 0.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(eyeSpacing, eyeY + 2.5, 3.5, 0.2, Math.PI - 0.2);
        ctx.stroke();
        
        const browColor = character.hair === '#ecf0f1' || character.hair === '#ffffff' ? '#8b8b8b' : character.hair;
        ctx.strokeStyle = browColor;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(-9.5, -16);
        ctx.quadraticCurveTo(-6, -17.5, -3.5, -16.5);
        ctx.quadraticCurveTo(-1.5, -15.8, -0.5, -15.5);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0.5, -15.5);
        ctx.quadraticCurveTo(1.5, -15.8, 3.5, -16.5);
        ctx.quadraticCurveTo(6, -17.5, 9.5, -16);
        ctx.stroke();
        
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
            const offset = i * 1.5;
            ctx.beginPath();
            ctx.moveTo(-8 + offset, -16.2);
            ctx.lineTo(-7.5 + offset, -16.8);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(7.5 - offset, -16.2);
            ctx.lineTo(8 - offset, -16.8);
            ctx.stroke();
        }
        
        ctx.fillStyle = `rgba(${Math.min(255, skinR + 20)}, ${Math.min(255, skinG + 20)}, ${Math.min(255, skinB + 20)}, 0.3)`;
        ctx.beginPath();
        ctx.moveTo(-0.8, -12);
        ctx.lineTo(0.8, -12);
        ctx.lineTo(0.5, -6);
        ctx.lineTo(-0.5, -6);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = `rgba(${Math.max(0, skinR - 25)}, ${Math.max(0, skinG - 25)}, ${Math.max(0, skinB - 25)}, 0.4)`;
        ctx.beginPath();
        ctx.moveTo(-2, -10);
        ctx.quadraticCurveTo(-2.5, -7, -2, -5);
        ctx.lineTo(-1.5, -5);
        ctx.quadraticCurveTo(-1.5, -7, -1.5, -9);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(2, -10);
        ctx.quadraticCurveTo(2.5, -7, 2, -5);
        ctx.lineTo(1.5, -5);
        ctx.quadraticCurveTo(1.5, -7, 1.5, -9);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = `rgba(${Math.min(255, skinR + 15)}, ${Math.min(255, skinG + 15)}, ${Math.min(255, skinB + 15)}, 0.4)`;
        ctx.beginPath();
        ctx.arc(0, -5.5, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(${Math.max(0, skinR - 45)}, ${Math.max(0, skinG - 45)}, ${Math.max(0, skinB - 45)}, 0.6)`;
        ctx.beginPath();
        ctx.ellipse(-1.5, -4.5, 1, 0.9, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(1.5, -4.5, 1, 0.9, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(${Math.max(0, skinR - 30)}, ${Math.max(0, skinG - 30)}, ${Math.max(0, skinB - 30)}, 0.3)`;
        ctx.beginPath();
        ctx.arc(-1.3, -4.7, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(1.3, -4.7, 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        const cheekGradient = ctx.createRadialGradient(-10, -4, 0, -10, -4, 5);
        cheekGradient.addColorStop(0, `rgba(${Math.min(255, skinR + 30)}, ${Math.min(255, skinG + 15)}, ${Math.min(255, skinB + 15)}, 0.35)`);
        cheekGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = cheekGradient;
        ctx.beginPath();
        ctx.arc(-10, -4, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(10, -4, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(${Math.max(0, skinR - 20)}, ${Math.max(0, skinG - 20)}, ${Math.max(0, skinB - 20)}, 0.25)`;
        ctx.beginPath();
        ctx.ellipse(0, 5, 14, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Crashed face - X eyes
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(-7.5, -13.5);
        ctx.lineTo(-2.5, -10.5);
        ctx.moveTo(-2.5, -13.5);
        ctx.lineTo(-7.5, -10.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(2.5, -13.5);
        ctx.lineTo(7.5, -10.5);
        ctx.moveTo(7.5, -13.5);
        ctx.lineTo(2.5, -10.5);
        ctx.stroke();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.quadraticCurveTo(0, 2, 3, 0);
        ctx.stroke();
    }
    
    // Unique Features - Menu style (clean and simple, except rabbi)
    if (!p.crashed && character.id !== 'rabbi') {
        // Glasses (משקפיים) - Menu style for nave
        if (character.uniqueFeature === 'glasses') {
            ctx.save();
            const eyeY = -12;
            const eyeSpacing = 5;
            
            // Lens glass (semi-transparent with tint like menu)
            ctx.fillStyle = 'rgba(100, 150, 200, 0.3)';
            ctx.beginPath();
            ctx.arc(-eyeSpacing, eyeY, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eyeSpacing, eyeY, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Frame (clean like menu)
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(-eyeSpacing, eyeY, 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(eyeSpacing, eyeY, 5, 0, Math.PI * 2);
            ctx.stroke();
            
            // Bridge (clean like menu)
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(-1.5, eyeY - 1, 3, 2);
            
            ctx.restore();
        }
        
        // Mustache (שפם) - Menu style for oshri
        if (character.uniqueFeature === 'mustache') {
            ctx.save();
            
            // Mustache (clean path like menu)
            ctx.fillStyle = character.hair;
            ctx.beginPath();
            ctx.moveTo(-8, -2);
            ctx.quadraticCurveTo(-4, -4, 0, -2);
            ctx.quadraticCurveTo(4, -4, 8, -2);
            ctx.quadraticCurveTo(8, 0, 6, 1);
            ctx.quadraticCurveTo(4, 0, 0, 1);
            ctx.quadraticCurveTo(-4, 0, -6, 1);
            ctx.quadraticCurveTo(-8, 0, -8, -2);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
        
        // Cap (כובע בייסבול) - Menu style for eitan
        if (character.uniqueFeature === 'cap') {
            ctx.save();
            
            // Cap base (simple like menu)
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(0, -18, 18, 0, Math.PI * 2);
            ctx.fill();
            
            // Cap visor (simple like menu)
            ctx.fillStyle = '#2c2c2c';
            ctx.beginPath();
            ctx.ellipse(0, -10, 20, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
        
        // Curly hair (שיער מתולתל) - Menu style for ariel
        if (character.uniqueFeature === 'curly_hair') {
            ctx.save();
            
            // Simple curly hair (like menu - just circles)
            ctx.fillStyle = character.hair;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const x = Math.cos(angle) * 12;
                const y = -18 + Math.sin(angle) * 8;
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
        
        // Long hair (שיער ארוך) - Menu style for hillel
        if (character.uniqueFeature === 'long_hair') {
            ctx.save();
            
            // Simple long hair (like menu)
            ctx.fillStyle = character.hair;
            ctx.beginPath();
            ctx.moveTo(-15, -8);
            ctx.quadraticCurveTo(-15, 5, -12, 8);
            ctx.lineTo(-8, 8);
            ctx.lineTo(-8, -8);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(8, -8);
            ctx.lineTo(8, 8);
            ctx.lineTo(12, 8);
            ctx.quadraticCurveTo(15, 5, 15, -8);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    // Hat (כובע) - for rabbi
    if (character.type === 'hat') {
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.ellipse(0, -20, 22, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-16, -20);
        ctx.lineTo(-13, -38);
        ctx.lineTo(13, -38);
        ctx.lineTo(16, -20);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#333';
        ctx.fillRect(-15, -24, 30, 4);
    }

    // Visual indicator for carrying lost object (object icon above player)
    if (p.isCarryingLostObject && p.carryingObjectType) {
        ctx.save();
        // Draw indicator above player - more prominent
        const indicatorX = 0;
        const indicatorY = -p.height / 2 - 35;
        ctx.translate(indicatorX, indicatorY);
        
        // Add floating animation
        const floatOffset = Math.sin(gameState.current.frame * 0.15) * 3;
        ctx.translate(0, floatOffset);
        
        // Draw the object image based on what's being carried
        const objectImg = lostObjectImagesRef.current[p.carryingObjectType];
        
        if (objectImg) {
            // Draw shadow
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(0, 25, 20, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.restore();
            
            // Draw object with glow
            let glowColor = '#3498db';
            if (p.carryingObjectType === 'school_bag') {
                glowColor = '#3498db'; // Blue for bag
            } else if (p.carryingObjectType === 'dubi') {
                glowColor = '#e74c3c'; // Red for dubi
            } else if (p.carryingObjectType === 'book') {
                glowColor = '#9b59b6'; // Purple for book
            }
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 15;
            const iconSize = 40;
            ctx.drawImage(objectImg, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
            ctx.shadowBlur = 0;
        } else {
            // Fallback: draw a prominent object icon
            let glowColor = '#3498db';
            let icon = '🎒';
            if (p.carryingObjectType === 'school_bag') {
                glowColor = '#3498db';
                icon = '🎒';
            } else if (p.carryingObjectType === 'dubi') {
                glowColor = '#e74c3c';
                icon = '🧸';
            } else if (p.carryingObjectType === 'book') {
                glowColor = '#9b59b6';
                icon = '📚';
            }
            ctx.fillStyle = glowColor;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Draw object icon
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(icon, 0, 0);
        }
        
        ctx.restore();
    }

    ctx.restore();
  };

  const drawDetailedDog = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, frame: number) => {
    drawShadow(ctx, x, w, 0);
    ctx.save();
    ctx.translate(x + w/2, y + h/2);
    const scale = Math.min(w / 70, h / 50); // Scale based on size (original was 70x50)
    const runCycle = (frame * 0.2) % (Math.PI * 2);
    const bob = Math.sin(runCycle * 2) * 2;
    ctx.translate(0, bob);
    ctx.scale(-1, 1); 
    ctx.scale(scale, scale); // Apply scaling
    // Body
    ctx.fillStyle = '#C19A6B'; ctx.beginPath(); ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI*2); ctx.fill();
    // Collar & Tag
    ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-12, -8); ctx.lineTo(-12, 8); ctx.stroke();
    ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.arc(-12, 8, 3, 0, Math.PI*2); ctx.fill();
    // Head
    ctx.translate(-18, -10); ctx.rotate(Math.sin(runCycle) * 0.1);
    ctx.fillStyle = '#C19A6B'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI*2); ctx.fill();
    // Ears
    ctx.fillStyle = '#A0764D'; ctx.beginPath(); ctx.ellipse(0, -4, 14, 6, 0.2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, 4, 6, 12, -0.3, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(-10, 2, 6, 12, 0.3, 0, Math.PI*2); ctx.fill();
    // Face
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-4, 4, 6, 4, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(-7, 2, 3, 2, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(-4, -2, 2, 0, Math.PI*2); ctx.fill();
    // Legs
    ctx.translate(18, 10); ctx.lineCap = 'round'; ctx.strokeStyle = '#C19A6B'; ctx.lineWidth = 6;
    const leg = (offsetX: number, phase: number) => { const angle = Math.sin(runCycle + phase); ctx.beginPath(); ctx.moveTo(offsetX, 5); ctx.lineTo(offsetX + angle * 10, 15); ctx.lineTo(offsetX + angle * 10 - 2, 20); ctx.stroke(); };
    leg(10, 0); leg(-10, Math.PI);
    // Tail
    ctx.save(); ctx.translate(20, -5); ctx.rotate(Math.sin(frame * 0.5) * 0.4 - 0.5); ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(10, -5, 15, 0); ctx.stroke(); ctx.restore();
    ctx.restore();
  };
  
  const drawDetailedCat = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
      drawShadow(ctx, x, w, 0);
      ctx.save(); 
      ctx.translate(x + w/2, y + h/2);
      const scale = Math.min(w / 50, h / 40); // Scale based on size (original was 50x40)
      ctx.scale(scale, scale);
      ctx.fillStyle = '#4b5563'; 
      ctx.beginPath(); ctx.moveTo(-20, 15); ctx.quadraticCurveTo(0, -20, 20, 15); ctx.lineTo(20, 25); ctx.lineTo(-20, 25); ctx.fill();
      ctx.translate(-15, 0); ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-8, -5); ctx.lineTo(-12, -15); ctx.lineTo(-2, -8); ctx.fill(); ctx.beginPath(); ctx.moveTo(2, -8); ctx.lineTo(8, -15); ctx.lineTo(8, -5); ctx.fill();
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.ellipse(-4, 0, 2, 3, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(2, 0, 2, 3, 0, 0, Math.PI*2); ctx.fill();
      ctx.restore();
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, speed: number, frame: number) => {
    // If background image is loaded, use it
    if (backgroundImageRef.current && backgroundImageRef.current.complete && backgroundImageRef.current.naturalWidth > 0) {
      const img = backgroundImageRef.current;
      // Calculate scaled dimensions to fit canvas height
      const scale = CANVAS_HEIGHT / img.height;
      const scaledWidth = img.width * scale;
      
      // Draw scrolling background
      const offset = -(frame * speed * 0.1) % scaledWidth;
      
      // Draw multiple copies for seamless scrolling
      for (let i = -1; i < Math.ceil(CANVAS_WIDTH / scaledWidth) + 2; i++) {
        ctx.drawImage(
          img,
          offset + i * scaledWidth,
          0,
          scaledWidth,
          CANVAS_HEIGHT
        );
      }
      
      // Draw Sidewalk (מדרכה) above the road - Less opaque so obstacles are visible
      const sidewalkHeight = 50;
      const sidewalkY = GROUND_Y - sidewalkHeight;
      
      // Sidewalk base color (concrete gray) - More transparent
      ctx.fillStyle = 'rgba(139, 139, 139, 0.7)'; // Reduced opacity from 1.0 to 0.7
      ctx.fillRect(0, sidewalkY, CANVAS_WIDTH, sidewalkHeight);
      
      // Sidewalk texture/pattern - Lighter and less prominent
      ctx.fillStyle = 'rgba(157, 157, 157, 0.4)'; // Reduced opacity
      const tileOffset = -(frame * speed * 0.05) % 40;
      for (let i = -1; i < (CANVAS_WIDTH / 40) + 2; i++) {
        ctx.fillRect(i * 40 + tileOffset, sidewalkY, 1.5, sidewalkHeight); // Thinner lines
      }
      
      // Sidewalk edge/curb - More subtle
      ctx.fillStyle = 'rgba(107, 107, 107, 0.8)'; // Slightly transparent
      ctx.fillRect(0, GROUND_Y - 2, CANVAS_WIDTH, 2); // Thinner edge
      
      // Draw Road (כביש שחור)
      const roadHeight = CANVAS_HEIGHT - GROUND_Y;
      ctx.fillStyle = '#1a1a1a'; // Very dark gray/black road
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, roadHeight);
      
      // Road texture (subtle)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      const roadTextureOffset = -(frame * speed * 0.1) % 60;
      for (let i = -1; i < (CANVAS_WIDTH / 60) + 2; i++) {
        ctx.fillRect(i * 60 + roadTextureOffset, GROUND_Y, 1, roadHeight);
      }
      
      // Road center line (double yellow lines)
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#facc15';
      const centerLineY = GROUND_Y + roadHeight / 2;
      const dashOffset = -(frame * speed) % 200;
      
      // Top yellow line
      for (let i = -1; i < (CANVAS_WIDTH / 200) + 2; i++) {
        ctx.fillRect(i * 200 + dashOffset, centerLineY - 6, 100, 4);
      }
      
      // Bottom yellow line (double line effect)
      for (let i = -1; i < (CANVAS_WIDTH / 200) + 2; i++) {
        ctx.fillRect(i * 200 + dashOffset, centerLineY + 2, 100, 4);
      }
      
      // Road edge lines (white)
      ctx.shadowBlur = 5;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 2); // Top edge
      ctx.fillRect(0, CANVAS_HEIGHT - 2, CANVAS_WIDTH, 2); // Bottom edge
      
      ctx.shadowBlur = 0;
      return;
    }

    // Fallback to programmatic background if no image
    // Determine Time of Day Cycle
    // 0 - 3000: Day -> Sunset
    // 3000 - 4500: Sunset -> Night
    // 4500+: Night
    let skyStart, skyEnd, sunMoonY, starAlpha, streetLightAlpha;
    
    const cyclePos = Math.min(frame, 6000); 
    let phase = 0; // 0=Day, 1=Sunset, 2=Night
    let t = 0;

    if (cyclePos < 3000) {
        // Day -> Sunset
        phase = 0;
        t = cyclePos / 3000;
        skyStart = interpolateColor('#38bdf8', '#f97316', t); // Blue -> Orange
        skyEnd = interpolateColor('#0ea5e9', '#7c3aed', t); // Deep Blue -> Purple
        sunMoonY = 100 + t * 400; // Sun goes down
        starAlpha = 0;
        streetLightAlpha = t > 0.8 ? (t - 0.8) * 5 : 0;
    } else if (cyclePos < 5000) {
        // Sunset -> Night
        phase = 1;
        t = (cyclePos - 3000) / 2000;
        skyStart = interpolateColor('#f97316', '#020617', t);
        skyEnd = interpolateColor('#7c3aed', '#312e81', t);
        sunMoonY = 500 + t * 200; // Sun gone
        starAlpha = t;
        streetLightAlpha = 1;
    } else {
        // Full Night
        phase = 2;
        skyStart = '#020617';
        skyEnd = '#312e81';
        sunMoonY = 150; // Moon Up
        starAlpha = 1;
        streetLightAlpha = 1;
    }

    // Sky
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    grad.addColorStop(0, skyStart);
    grad.addColorStop(1, skyEnd);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Celestial Body
    if (phase < 2) {
        // Sun
        ctx.save();
        ctx.translate(CANVAS_WIDTH - 300, sunMoonY);
        ctx.fillStyle = phase === 0 ? '#fde047' : '#fdba74'; // Yellow -> Orange
        ctx.shadowColor = phase === 0 ? '#fde047' : '#f97316';
        ctx.shadowBlur = 40;
        ctx.beginPath(); ctx.arc(0, 0, 60, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    } else {
        // Moon
        ctx.save();
        ctx.translate(CANVAS_WIDTH - 200, 180);
        ctx.shadowBlur = 80;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI * 2); ctx.fill();
        // Craters
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath(); ctx.arc(-15, 10, 8, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(20, -15, 10, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }

    // Stars
    if (starAlpha > 0) {
        ctx.fillStyle = 'white';
        for(let i=0; i<40; i++) {
            const sx = (i * 237) % CANVAS_WIDTH;
            const sy = (i * 97) % 500;
            const size = (i % 2) + 1;
            const blink = Math.sin(frame * 0.05 + i) > 0.8 ? 0.3 : 1;
            ctx.globalAlpha = starAlpha * blink * 0.8;
            ctx.beginPath(); ctx.arc(sx, sy, size, 0, Math.PI*2); ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    // Skyline
    const drawSkyline = (speedMult: number, color: string, heightMult: number, yOffset: number) => {
        const offset = -(frame * speed * speedMult) % 1200;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(0, CANVAS_HEIGHT);
        for (let i = -1; i < 3; i++) {
            let cx = offset + (i * 1200);
            ctx.lineTo(cx, GROUND_Y - 50);
            const building = (w: number, h: number) => {
                ctx.lineTo(cx, GROUND_Y - h * heightMult - yOffset);
                ctx.lineTo(cx + w, GROUND_Y - h * heightMult - yOffset);
                cx += w; ctx.lineTo(cx, GROUND_Y - 30); cx += 10;
            };
            building(60, 100); building(40, 150); building(80, 80); building(50, 200); building(100, 60); building(40, 120);
            building(70, 90); building(30, 220); building(90, 50); building(60, 130);
        }
        ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT); ctx.fill();
        
        // Window lights
        if (streetLightAlpha > 0) {
             // Re-trace for windows? Simplified: Draw small rects on top
             ctx.fillStyle = `rgba(253, 224, 71, ${streetLightAlpha * 0.5})`;
             for (let i = -1; i < 3; i++) {
                let bx = offset + (i * 1200) + 10;
                // Just some random scattered windows
                for (let k=0; k<10; k++) {
                   if ((k + frame/10) % 2 > 1) continue;
                   ctx.fillRect(bx + k*50, GROUND_Y - 100 - (k%3)*30, 5, 8);
                }
             }
        }
    };

    const buildColorFar = interpolateColor('#94a3b8', '#1e293b', Math.min(1, phase + t));
    const buildColorNear = interpolateColor('#475569', '#0f172a', Math.min(1, phase + t));
    
    drawSkyline(0.1, buildColorFar, 0.8, 80); 
    drawSkyline(0.2, buildColorNear, 1.0, 40);

    // Draw Sidewalk (מדרכה) above the road - Less opaque so obstacles are visible
    const sidewalkHeight = 50;
    const sidewalkY = GROUND_Y - sidewalkHeight;
    
    // Sidewalk base color (concrete gray) - More transparent
    ctx.fillStyle = 'rgba(139, 139, 139, 0.7)'; // Reduced opacity from 1.0 to 0.7
    ctx.fillRect(0, sidewalkY, CANVAS_WIDTH, sidewalkHeight);
    
    // Sidewalk texture/pattern - Lighter and less prominent
    ctx.fillStyle = 'rgba(157, 157, 157, 0.4)'; // Reduced opacity
    const tileOffset = -(frame * speed * 0.05) % 40;
    for (let i = -1; i < (CANVAS_WIDTH / 40) + 2; i++) {
        ctx.fillRect(i * 40 + tileOffset, sidewalkY, 1.5, sidewalkHeight); // Thinner lines
    }
    
    // Sidewalk edge/curb - More subtle
    ctx.fillStyle = 'rgba(107, 107, 107, 0.8)'; // Slightly transparent
    ctx.fillRect(0, GROUND_Y - 2, CANVAS_WIDTH, 2); // Thinner edge
    
    // Draw Road (כביש שחור)
    const roadHeight = CANVAS_HEIGHT - GROUND_Y;
    ctx.fillStyle = '#1a1a1a'; // Very dark gray/black road
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, roadHeight);
    
    // Road texture (subtle)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    const roadTextureOffset = -(frame * speed * 0.1) % 60;
    for (let i = -1; i < (CANVAS_WIDTH / 60) + 2; i++) {
        ctx.fillRect(i * 60 + roadTextureOffset, GROUND_Y, 1, roadHeight);
    }
    
    // Road center line (double yellow lines)
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#facc15';
    const centerLineY = GROUND_Y + roadHeight / 2;
    const dashOffset = -(frame * speed) % 200;
    
    // Top yellow line
    for (let i = -1; i < (CANVAS_WIDTH / 200) + 2; i++) {
        ctx.fillRect(i * 200 + dashOffset, centerLineY - 6, 100, 4);
    }
    
    // Bottom yellow line (double line effect)
    for (let i = -1; i < (CANVAS_WIDTH / 200) + 2; i++) {
        ctx.fillRect(i * 200 + dashOffset, centerLineY + 2, 100, 4);
    }
    
    // Road edge lines (white)
    ctx.shadowBlur = 5;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 2); // Top edge
    ctx.fillRect(0, CANVAS_HEIGHT - 2, CANVAS_WIDTH, 2); // Bottom edge
    
    ctx.shadowBlur = 0;
  };

  const handleCollision = (obs: Obstacle) => {
    const p = gameState.current.player;
    const st = gameState.current;
    if (p.crashed || p.flashCounter > 0) return;

    // RAMP AUTO-JUMP LOGIC
    if (obs.type.includes('ramp')) {
        // If hitting the front/body of the ramp, launch player up
        // Only jump if we haven't already jumped on this ramp and player is not already in air from this ramp
        if (p.x + p.width > obs.x && !st.jumpedRamps.has(obs.id) && !p.rampBoosted) {
            p.vy = JUMP_FORCE * 1.3;
            p.grounded = false;
            p.rampBoosted = true;
            p.grinding = false; // Cannot grind if launching
            // Track ramp jump for mission (only count once per ramp)
            st.jumpedRamps.add(obs.id);
            missionService.updateMissionByType('ramp_jumps', 1);
            audioService.playJump();
            spawnFloatingText("AIR TIME!", p.x, p.y - 60, '#fbbf24');
            spawnParticles(p.x + 30, p.y + p.height, '#fff', 'dust', 10);
            return; // Safe!
        }
        // If already jumped on this ramp, just return safely
        if (st.jumpedRamps.has(obs.id)) {
            return; // Safe - already handled this ramp
        }
    }

    if (activePowerups.shield) {
      p.flashCounter = 60;
      onPowerupExpire('shield');
      audioService.playCrash();
      spawnFloatingText("SHIELD BROKEN", p.x, p.y, '#3498db');
      return;
    }

    // Check Tzedakah Shield before game over
    if (p.hasTzedakahShield) {
      p.hasTzedakahShield = false;
      p.flashCounter = 60;
      audioService.playShieldBreak();
      spawnFloatingText("צדקה תציל ממוות", p.x, p.y - 30, '#ffd700');
      spawnParticles(p.x + p.width/2, p.y + p.height/2, '#ffd700', 'sparkle', 15);
      return; // Shield absorbed the hit
    }

    // Grind Logic - For rails and benches
    if (obs.type === 'rail' || obs.type === 'bench' || obs.type === 'bench-1' || obs.type === 'bench-2') {
       if (p.vy > 0 && p.y + p.height <= obs.y + 40 && p.x + p.width/2 > obs.x && p.x + p.width/2 < obs.x + obs.w) {
           p.y = obs.y - p.height;
           p.vy = 0;
           p.grounded = true;
           p.jumpCount = 0;
           if (!p.grinding) {
               p.grinding = true;
               audioService.playGrind();
               gameState.current.score += 50;
               spawnFloatingText("GRIND!", p.x, p.y - 20, '#f1c40f');
               spawnParticles(p.x + p.width/2, p.y + p.height, '#f39c12', 'sparkle', 3);
           }
           return;
       }
    }
    
    // Crash
    p.crashed = true;
    p.grounded = true;
    p.vy = 0;
    audioService.playCrash();
    
    // Check crash distance mission
    if (st.distance >= 500) {
        const reward = missionService.updateMissionByType('crash_distance', st.distance);
        if (reward > 0 && onReward) {
            onReward(reward);
        }
    }
    
    onGameOver(Math.floor(gameState.current.score), gameState.current.coins);
  };

  const updatePlayer = () => {
    const st = gameState.current;
    const p = st.player;
    
    if (p.crashed) {
       p.crashTimer++;
       return;
    }

    if (!p.grinding) {
        p.vy += GRAVITY;
        p.y += p.vy;
    } else {
        p.vy = 0;
    }

    if (p.y + p.height >= GROUND_Y) {
        p.y = GROUND_Y - p.height;
        p.vy = 0;
        p.grounded = true;
        p.jumpCount = 0;
        p.tricking = false;
        p.rampBoosted = false;
        p.grinding = false;
    } else {
        p.grounded = false;
    }

    if (p.grinding) {
        const stillGrinding = st.obstacles.some(o => 
            (o.type === 'rail' || o.type === 'bench' || o.type === 'bench-1' || o.type === 'bench-2') &&
            p.x + p.width/2 > o.x && p.x + p.width/2 < o.x + o.w &&
            Math.abs((p.y + p.height) - o.y) < 10
        );
        
        if (stillGrinding) {
            // Track grind distance for missions
            p.grindDistance += st.speed;
            if (p.grindDistance >= 200) {
                const reward = missionService.updateMissionByType('grind_distance', 200);
                if (reward > 0 && onReward) {
                    onReward(reward);
                    spawnFloatingText(`משימה הושלמה! +${reward}₪`, CANVAS_WIDTH / 2, 180, '#00ff00');
                }
                p.grindDistance = 0; // Reset
            }
        } else {
            // When finishing grind, give player a small upward boost to prevent immediate crash
            p.grinding = false;
            p.grounded = false;
            if (p.vy === 0) {
                p.vy = -2; // Small upward boost
            }
            p.grindDistance = 0;
        }
    }

    if (p.flashCounter > 0) p.flashCounter--;
    
    // Handle slide timer
    if (p.sliding) {
      p.slideTimer--;
      if (p.slideTimer <= 0) {
        p.sliding = false;
        p.height = 110;
        p.y = GROUND_Y - 110;
      }
    }
    
    if (!p.crashed && isActiveRef.current && !isPausedRef.current) {
       // Increase speed based on distance (progressive difficulty)
       const speedIncrease = Math.min(st.distance / 15000, 1.5); // Max 1.5x speed increase (slower acceleration)
       st.speed = BASE_SPEED + (speedIncrease * (MAX_SPEED - BASE_SPEED));
       
       let speedMult = st.speed / BASE_SPEED;
       let multiplier = st.combo * (activePowerups.double ? 2 : 1);
       // Score increases faster as speed increases
       st.score += 0.1 * speedMult * multiplier * (1 + speedIncrease * 0.5);
       
       // Update distance (1 meter per frame roughly)
       st.distance += st.speed * 0.1;
       
       // Check stage changes
       const currentStage = stageService.getCurrentStage(st.distance);
       if (currentStage.type !== st.currentStage) {
           st.currentStage = currentStage.type;
           if (onStageChange) {
               onStageChange(currentStage.name);
           }
           spawnFloatingText(`אזור חדש: ${currentStage.name}`, CANVAS_WIDTH / 2, 180, '#fbbf24');
       }
       
       // Update missions
       if (onMissionUpdate) {
           // Update distance mission - only update when distance increases
           if (st.distance > st.lastMissionDistance) {
               const distanceDelta = st.distance - st.lastMissionDistance;
               missionService.updateMissionByType('crash_distance', distanceDelta);
               st.lastMissionDistance = st.distance;
           }
           // Update survive time mission - only update when time increases
           const surviveTime = Math.floor((Date.now() - st.startTime) / 1000);
           if (surviveTime > st.lastMissionTime) {
               const timeDelta = surviveTime - st.lastMissionTime;
               missionService.updateMissionByType('survive_time', timeDelta);
               st.lastMissionTime = surviveTime;
           }
           onMissionUpdate(missionService.getMissions());
       }
       
       if (st.frame % 60 === 0) onScoreUpdate(Math.floor(st.score), st.coins, st.combo, st.tzedakahCoinCount, p.hasTzedakahShield);
    }
  };

  const updateObstacles = () => {
      const st = gameState.current;
      
      // Spawn obstacles more frequently as distance increases (more obstacles = harder)
      const obstacleSpawnRate = Math.max(1500 / st.speed, 800 / st.speed * (1 + st.distance / 10000));
      
      if (st.frame % Math.floor(obstacleSpawnRate) === 0) {
          const types: Obstacle['type'][] = ['bench', 'bush', 'dog', 'cat', 'ramp-kicker', 'ramp-quarter', 'fire-hydrant', 'bench-1', 'bench-2', 'trash-can', 'rail', 'car'];
          const type = types[Math.floor(Math.random() * types.length)];
          let w = 80, h = 60;
          if (type === 'bench') { w = 350; h = 150; }
          if (type === 'bench-1') { w = 350; h = 150; }
          if (type === 'bench-2') { w = 350; h = 150; }
          if (type === 'bush') { w = 180; h = 130; }
          if (type === 'dog') { w = 90; h = 65; }
          if (type === 'cat') { w = 80; h = 60; }
          if (type === 'ramp-kicker') { w = 240; h = 140; }
          if (type === 'ramp-quarter') { w = 280; h = 200; }
          if (type === 'fire-hydrant') { w = 100; h = 140; }
          if (type === 'trash-can') { w = 120; h = 150; }
          if (type === 'rail') { w = 400; h = 100; }
          if (type === 'car') { w = 200; h = 80; }

          // Lower ramps and benches closer to the ground
          let yOffset = 0;
          if (type.includes('ramp')) {
              yOffset = 50; // Lower ramps by 50 pixels
          } else if (type === 'bench' || type === 'bench-1' || type === 'bench-2') {
              yOffset = 40; // Position benches on the border between sidewalk and road
          } else if (type === 'fire-hydrant' || type === 'trash-can') {
              yOffset = 30; // Lower fire hydrant and trash can by 30 pixels
          } else if (type === 'car') {
              yOffset = 0; // Car is on the ground
          }

          st.obstacles.push({
              id: Date.now() + Math.random(),
              type,
              x: CANVAS_WIDTH + 100,
              y: GROUND_Y - h + yOffset,
              w, h,
              markedForDeletion: false,
              animFrame: 0
          });
      }

      st.obstacles.forEach(obs => {
          // Cars move faster (like police car) - from right to left
          if (obs.type === 'car') {
              obs.x -= st.speed * 1.2; // Moves left faster
          } else {
              obs.x -= st.speed;
          }
          obs.animFrame++;
          if (obs.x + obs.w < -100) obs.markedForDeletion = true;
          
          const p = st.player;
          const isGrindable = (obs.type === 'rail' || obs.type === 'bench' || obs.type === 'bench-1' || obs.type === 'bench-2');
          const isRamp = obs.type.includes('ramp');
          
          // Collision Box
          if (
              p.x < obs.x + obs.w - 15 &&
              p.x + p.width > obs.x + 15 &&
              p.y < obs.y + obs.h - 10 &&
              p.y + p.height > obs.y + 10
          ) {
              if (isGrindable && p.vy >= 0 && p.y + p.height < obs.y + 30) {
                  handleCollision(obs); // Grind start
              } else if (isRamp) {
                  // Only handle ramp collision if we haven't already jumped on it
                  if (!st.jumpedRamps.has(obs.id)) {
                      handleCollision(obs); // Launch
                  }
                  // If already jumped, just let player pass through safely
              } else if (!p.grinding) {
                  handleCollision(obs); // Crash
              }
          }
      });
      
      st.obstacles = st.obstacles.filter(o => !o.markedForDeletion);
  };

  const updateCoins = () => {
      const st = gameState.current;
      if (st.frame % 30 === 0) {
          if (Math.random() > 0.7) {
            const y = GROUND_Y - 150 - Math.random() * 200;
            st.coinsArr.push({
                id: Date.now() + Math.random(),
                x: CANVAS_WIDTH + 50,
                y,
                type: 'coin',
                markedForDeletion: false,
                rotation: 0
            });
          }
      }
      st.coinsArr.forEach(c => {
          c.x -= st.speed;
          if (c.x < -50) c.markedForDeletion = true;
          
          if (activePowerups.magnet) {
              const dx = st.player.x - c.x;
              const dy = st.player.y - c.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              if (dist < 400) { c.x += dx * 0.15; c.y += dy * 0.15; }
          }
          const p = st.player;
          // More forgiving coin collection using radial distance (reduces "near-miss" cases)
          const cx = p.x + p.width / 2;
          const cy = p.y + p.height / 2;
          const dx = cx - c.x;
          const dy = cy - c.y;
          const pickupRadius = 90; // was effectively ~70 via axis-aligned check
          if ((dx * dx + dy * dy) <= (pickupRadius * pickupRadius)) {
              c.markedForDeletion = true;
              st.coins++;
              st.score += 100;
              audioService.playCoin();
              spawnParticles(c.x, c.y, '#f1c40f', 'sparkle', 5);
              
              // Increment Tzedakah counter
              st.tzedakahCoinCount++;
              
              // Check if Tzedakah threshold reached (20 coins)
              if (st.tzedakahCoinCount >= 20) {
                  // Grant shield
                  p.hasTzedakahShield = true;
                  
                  // Show Hebrew message
                  spawnFloatingText("צדקה תציל ממוות", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, '#ffd700');
                  st.tzedakahMessageTimer = 180; // 3 seconds at 60fps
                  
                  // Play powerup sound
                  audioService.playPowerup();
                  
                  // Reset counter
                  st.tzedakahCoinCount = 0;
              }
              
              // Update coin collection mission
              const reward = missionService.updateMissionByType('collect_coins', 1);
              if (reward > 0 && onReward) {
                  onReward(reward);
                  spawnFloatingText(`משימה הושלמה! +${reward}₪`, CANVAS_WIDTH / 2, 120, '#00ff00');
              }
              
              onScoreUpdate(st.score, st.coins, st.combo, st.tzedakahCoinCount, p.hasTzedakahShield);
          }
      });
      st.coinsArr = st.coinsArr.filter(c => !c.markedForDeletion);
  };

  const updateLostObjects = () => {
      const st = gameState.current;
      const p = st.player;
      
      // Spawn lost objects (bag, dubi, or book) more frequently - multiple objects available
      // Spawn more often so there are always objects to collect
      if (!p.isCarryingLostObject && st.frame % 90 === 0 && Math.random() > 0.3) {
          const y = GROUND_Y - 150 - Math.random() * 150;
          // Randomly choose between bag, dubi, and book
          const rand = Math.random();
          let objectType: LostObject['spriteType'];
          if (rand < 0.33) {
              objectType = 'school_bag';
          } else if (rand < 0.66) {
              objectType = 'dubi';
          } else {
              objectType = 'book';
          }
          st.lostObjects.push({
              id: Date.now() + Math.random(),
              x: CANVAS_WIDTH + 50,
              y,
              spriteType: objectType,
              markedForDeletion: false,
              rotation: 0
          });
      }
      
      st.lostObjects.forEach(obj => {
          obj.x -= st.speed;
          obj.rotation += 0.05;
          if (obj.x < -50) obj.markedForDeletion = true;
          
          // Check collision with player (only if player is not already carrying an object)
          if (!p.isCarryingLostObject) {
              const cx = p.x + p.width / 2;
              const cy = p.y + p.height / 2;
              const dx = cx - obj.x;
              const dy = cy - obj.y;
              const pickupRadius = 90;
              
              if ((dx * dx + dy * dy) <= (pickupRadius * pickupRadius)) {
                  obj.markedForDeletion = true;
                  p.isCarryingLostObject = true;
                  p.carryingObjectType = obj.spriteType; // Save which object type is being carried
                  audioService.playCoin(); // Use coin sound for pickup
                  spawnParticles(obj.x, obj.y, '#3498db', 'sparkle', 8);
                  spawnFloatingText("אבידה נמצאה!", obj.x, obj.y - 30, '#3498db');
              }
          }
      });
      
      st.lostObjects = st.lostObjects.filter(obj => !obj.markedForDeletion);
  };

  const updateOwnerNPCs = () => {
      const st = gameState.current;
      const p = st.player;
      
      // Spawn owner NPCs ONLY when player is carrying a lost object
      // This ensures NPCs appear only when there's something to return
      if (p.isCarryingLostObject && st.frame % 120 === 0 && Math.random() > 0.4) {
          // Check if there's already a waiting NPC on screen
          const hasWaitingNPC = st.ownerNPCs.some(npc => npc.state === 'waiting' && npc.x > -100 && npc.x < CANVAS_WIDTH + 100);
          
          // Only spawn if no waiting NPC is already on screen
          if (!hasWaitingNPC) {
              st.ownerNPCs.push({
                  id: Date.now() + Math.random(),
                  x: CANVAS_WIDTH + 50,
                  y: GROUND_Y - 100, // NPC stands on ground (adjusted for child size)
                  w: 80, // Wider for child image
                  h: 100, // Height for child image
                  state: 'waiting',
                  markedForDeletion: false
              });
          }
      }
      
      st.ownerNPCs.forEach(npc => {
          npc.x -= st.speed;
          if (npc.x < -100) npc.markedForDeletion = true;
          
          // Check collision with player
          if (npc.state === 'waiting' && p.isCarryingLostObject) {
              const cx = p.x + p.width / 2;
              const cy = p.y + p.height / 2;
              const nx = npc.x + npc.w / 2;
              const ny = npc.y + npc.h / 2;
              const dx = cx - nx;
              const dy = cy - ny;
              const interactionRadius = 100;
              
              if ((dx * dx + dy * dy) <= (interactionRadius * interactionRadius)) {
                  // Return the lost object
                  npc.state = 'happy';
                  p.isCarryingLostObject = false;
                  p.carryingObjectType = undefined;
                  
                  // Award double points
                  const baseScore = 200;
                  const doubleScore = baseScore * 2;
                  st.score += doubleScore;
                  
                  // Update mission: return lost objects
                  const reward = missionService.updateMissionByType('return_lost_objects', 1);
                  if (reward > 0 && onReward) {
                      onReward(reward);
                      spawnFloatingText(`משימה הושלמה! +${reward}₪`, CANVAS_WIDTH / 2, 120, '#00ff00');
                  }
                  
                  // Update mission display
                  if (onMissionUpdate) {
                      onMissionUpdate(missionService.getMissions());
                  }
                  
                  audioService.playCoin(); // Use coin sound for success
                  spawnParticles(npc.x + npc.w / 2, npc.y + npc.h / 2, '#00ff00', 'sparkle', 15);
                  spawnFloatingText(`השבת אבידה! +${doubleScore}`, npc.x + npc.w / 2, npc.y - 40, '#00ff00');
                  
                  onScoreUpdate(st.score, st.coins, st.combo, st.tzedakahCoinCount, p.hasTzedakahShield);
              }
          }
      });
      
      st.ownerNPCs = st.ownerNPCs.filter(npc => !npc.markedForDeletion);
  };
  
  const updateParticles = () => {
      const st = gameState.current;
      st.particles.forEach(p => { p.x += p.speedX; p.y += p.speedY; p.life -= p.decay; });
      st.particles = st.particles.filter(p => p.life > 0);
  };

  const updateBosses = () => {
      const st = gameState.current;
      const p = st.player;
      
      // Spawn boss if needed
      if (bossService.shouldSpawnBoss(st.distance, st.lastBossDistance)) {
          const bossType: 'police_car' = 'police_car'; // Only police car, no rival skater
          st.bosses.push(bossService.spawnBoss(bossType, st.distance));
          st.lastBossDistance = st.distance;
          spawnFloatingText('בוס מגיע!', CANVAS_WIDTH / 2, 180, '#ff0000');
      }
      
      // Update bosses
      st.bosses.forEach(boss => {
          bossService.updateBoss(boss, p.x, st.speed);
          
          // Check collision
          if (bossService.checkCollision(boss, p.x, p.y, p.width, p.height)) {
              if (activePowerups.shield) {
                  p.flashCounter = 60;
                  onPowerupExpire('shield');
                  boss.health--;
                  if (boss.health <= 0) {
                      boss.markedForDeletion = true;
                      st.score += 1000;
                      spawnFloatingText('בוס הובס!', CANVAS_WIDTH / 2, 180, '#00ff00');
                      if (onReward) onReward(500);
                  }
              } else if (!p.crashed) {
                  p.crashed = true;
                  p.grounded = true;
                  p.vy = 0;
                  audioService.playCrash();
                  onGameOver(Math.floor(st.score), st.coins);
              }
          }
          
          // Remove if off screen (different logic for police car)
          if (boss.type === 'police_car') {
              // Police car comes from right, moves left, so check if off screen to the left
              if (boss.x + boss.w < -100) {
                  boss.markedForDeletion = true;
              }
          } else {
              if (boss.x + boss.w < -100) {
                  boss.markedForDeletion = true;
              }
          }
      });
      
      st.bosses = st.bosses.filter(b => !b.markedForDeletion);
  };

  const drawBosses = (ctx: CanvasRenderingContext2D) => {
      gameState.current.bosses.forEach(boss => {
          drawShadow(ctx, boss.x, boss.w, GROUND_Y - (boss.y + boss.h));
          
          if (boss.type === 'police_car') {
              // Draw improved police car
              ctx.save();
              ctx.translate(boss.x + boss.w / 2, boss.y + boss.h / 2);
              // Do not mirror: mirrored text feels wrong and can make the car look like it's "chasing from behind".
              
              // Car body - more realistic shape
              const bodyGradient = ctx.createLinearGradient(-boss.w / 2, -boss.h / 2, -boss.w / 2, boss.h / 2);
              bodyGradient.addColorStop(0, '#1e40af'); // Lighter blue top
              bodyGradient.addColorStop(1, '#1e3a8a'); // Darker blue bottom
              ctx.fillStyle = bodyGradient;
              
              // Main body with rounded corners
              const r = 8;
              ctx.beginPath();
              ctx.moveTo(-boss.w / 2 + r, -boss.h / 2);
              ctx.lineTo(boss.w / 2 - r, -boss.h / 2);
              ctx.quadraticCurveTo(boss.w / 2, -boss.h / 2, boss.w / 2, -boss.h / 2 + r);
              ctx.lineTo(boss.w / 2, boss.h / 2 - r);
              ctx.quadraticCurveTo(boss.w / 2, boss.h / 2, boss.w / 2 - r, boss.h / 2);
              ctx.lineTo(-boss.w / 2 + r, boss.h / 2);
              ctx.quadraticCurveTo(-boss.w / 2, boss.h / 2, -boss.w / 2, boss.h / 2 - r);
              ctx.lineTo(-boss.w / 2, -boss.h / 2 + r);
              ctx.quadraticCurveTo(-boss.w / 2, -boss.h / 2, -boss.w / 2 + r, -boss.h / 2);
              ctx.closePath();
              ctx.fill();
              
              // White stripe along the side
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(-boss.w / 2 + 5, -boss.h / 2 + boss.h * 0.3, boss.w - 10, 8);
              
              // Police lights bar on top - more prominent
              const lightBarHeight = 15;
              ctx.fillStyle = '#000000';
              ctx.fillRect(-boss.w / 2 - 5, -boss.h / 2 - lightBarHeight, boss.w + 10, lightBarHeight);
              
              // Flashing police lights
              const flashFrame = Math.floor(boss.animFrame / 5) % 4;
              if (flashFrame === 0 || flashFrame === 1) {
                  ctx.fillStyle = '#ff0000';
                  ctx.fillRect(-boss.w / 2 - 2, -boss.h / 2 - lightBarHeight + 2, boss.w * 0.3, lightBarHeight - 4);
              }
              if (flashFrame === 2 || flashFrame === 3) {
                  ctx.fillStyle = '#0000ff';
                  ctx.fillRect(boss.w / 2 - boss.w * 0.3 + 2, -boss.h / 2 - lightBarHeight + 2, boss.w * 0.3, lightBarHeight - 4);
              }
              
              // Windows - more realistic
              ctx.fillStyle = '#1e293b';
              ctx.fillRect(-boss.w / 2 + 25, -boss.h / 2 + 12, 50, 25);
              ctx.fillRect(boss.w / 2 - 75, -boss.h / 2 + 12, 50, 25);
              
              // Window frames
              ctx.strokeStyle = '#64748b';
              ctx.lineWidth = 2;
              ctx.strokeRect(-boss.w / 2 + 25, -boss.h / 2 + 12, 50, 25);
              ctx.strokeRect(boss.w / 2 - 75, -boss.h / 2 + 12, 50, 25);
              
              // Grille
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(-boss.w / 2 + 10, boss.h / 2 - 25, boss.w - 20, 8);
              for (let i = 0; i < 5; i++) {
                  ctx.fillRect(-boss.w / 2 + 15 + i * 35, boss.h / 2 - 25, 2, 8);
              }
              
              // Wheels - more detailed
              ctx.fillStyle = '#000000';
              ctx.beginPath();
              ctx.arc(-boss.w / 2 + 25, boss.h / 2 - 8, 14, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(boss.w / 2 - 25, boss.h / 2 - 8, 14, 0, Math.PI * 2);
              ctx.fill();
              
              // Wheel rims
              ctx.fillStyle = '#64748b';
              ctx.beginPath();
              ctx.arc(-boss.w / 2 + 25, boss.h / 2 - 8, 8, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(boss.w / 2 - 25, boss.h / 2 - 8, 8, 0, Math.PI * 2);
              ctx.fill();
              
              // Police badge/emblem
              ctx.fillStyle = '#fbbf24';
              ctx.beginPath();
              ctx.arc(0, -boss.h / 2 + 30, 12, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#000000';
              ctx.font = 'bold 14px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('משטרה', 0, -boss.h / 2 + 30);
              
              ctx.restore();
          } else if (boss.type === 'rival_skater') {
              // Draw rival skater (simplified player-like)
              ctx.save();
              ctx.translate(boss.x + boss.w / 2, boss.y + boss.h / 2);
              
              // Body
              ctx.fillStyle = '#e74c3c';
              ctx.fillRect(-20, -40, 40, 60);
              
              // Head
              ctx.fillStyle = '#f1c40f';
              ctx.beginPath();
              ctx.arc(0, -50, 15, 0, Math.PI * 2);
              ctx.fill();
              
              // Board
              ctx.fillStyle = '#1e1b18';
              ctx.fillRect(-30, 20, 60, 8);
              
              ctx.restore();
          }
      });
  };

  const updateFloatingTexts = () => {
      const st = gameState.current;
      st.floatingTexts.forEach(t => { t.y -= 1; t.life--; });
      st.floatingTexts = st.floatingTexts.filter(t => t.life > 0);
  };

  const drawObstacles = (ctx: CanvasRenderingContext2D) => {
      gameState.current.obstacles.forEach(obs => {
           if (obs.type === 'dog') {
               drawDetailedDog(ctx, obs.x, obs.y, obs.w, obs.h, obs.animFrame);
           } else if (obs.type === 'cat') {
               drawDetailedCat(ctx, obs.x, obs.y, obs.w, obs.h);
           } else if (obs.type === 'car') {
               // Draw regular car (similar to police car but without police features)
               ctx.save();
               ctx.translate(obs.x + obs.w / 2, obs.y + obs.h / 2);
               
               // Car body - more realistic shape
               const bodyGradient = ctx.createLinearGradient(-obs.w / 2, -obs.h / 2, -obs.w / 2, obs.h / 2);
               bodyGradient.addColorStop(0, '#64748b'); // Lighter gray top
               bodyGradient.addColorStop(1, '#475569'); // Darker gray bottom
               ctx.fillStyle = bodyGradient;
               
               // Main body with rounded corners
               const r = 8;
               ctx.beginPath();
               ctx.moveTo(-obs.w / 2 + r, -obs.h / 2);
               ctx.lineTo(obs.w / 2 - r, -obs.h / 2);
               ctx.quadraticCurveTo(obs.w / 2, -obs.h / 2, obs.w / 2, -obs.h / 2 + r);
               ctx.lineTo(obs.w / 2, obs.h / 2 - r);
               ctx.quadraticCurveTo(obs.w / 2, obs.h / 2, obs.w / 2 - r, obs.h / 2);
               ctx.lineTo(-obs.w / 2 + r, obs.h / 2);
               ctx.quadraticCurveTo(-obs.w / 2, obs.h / 2, -obs.w / 2, obs.h / 2 - r);
               ctx.lineTo(-obs.w / 2, -obs.h / 2 + r);
               ctx.quadraticCurveTo(-obs.w / 2, -obs.h / 2, -obs.w / 2 + r, -obs.h / 2);
               ctx.closePath();
               ctx.fill();
               
               // Windows
               ctx.fillStyle = '#1e293b';
               ctx.fillRect(-obs.w / 2 + 25, -obs.h / 2 + 12, 50, 25);
               ctx.fillRect(obs.w / 2 - 75, -obs.h / 2 + 12, 50, 25);
               
               // Window frames
               ctx.strokeStyle = '#64748b';
               ctx.lineWidth = 2;
               ctx.strokeRect(-obs.w / 2 + 25, -obs.h / 2 + 12, 50, 25);
               ctx.strokeRect(obs.w / 2 - 75, -obs.h / 2 + 12, 50, 25);
               
               // Grille
               ctx.fillStyle = '#0f172a';
               ctx.fillRect(-obs.w / 2 + 10, obs.h / 2 - 25, obs.w - 20, 8);
               for (let i = 0; i < 5; i++) {
                   ctx.fillRect(-obs.w / 2 + 15 + i * 35, obs.h / 2 - 25, 2, 8);
               }
               
               // Wheels
               ctx.fillStyle = '#000000';
               ctx.beginPath();
               ctx.arc(-obs.w / 2 + 25, obs.h / 2 - 8, 14, 0, Math.PI * 2);
               ctx.fill();
               ctx.beginPath();
               ctx.arc(obs.w / 2 - 25, obs.h / 2 - 8, 14, 0, Math.PI * 2);
               ctx.fill();
               
               // Wheel rims
               ctx.fillStyle = '#64748b';
               ctx.beginPath();
               ctx.arc(-obs.w / 2 + 25, obs.h / 2 - 8, 8, 0, Math.PI * 2);
               ctx.fill();
               ctx.beginPath();
               ctx.arc(obs.w / 2 - 25, obs.h / 2 - 8, 8, 0, Math.PI * 2);
               ctx.fill();
               
               ctx.restore();
           } else {
               drawShadow(ctx, obs.x, obs.w, 0);
               
               // Try to use image if available
               const imageKey = obs.type;
               const img = obstacleImagesRef.current[imageKey];
               
               if (img && img.complete && img.naturalWidth > 0) {
                   // Draw image-based obstacle
                   ctx.drawImage(img, obs.x, obs.y, obs.w, obs.h);
               } else {
                   // Fallback to programmatic drawing
                   if (obs.type === 'rail') {
                       ctx.fillStyle = '#64748b'; ctx.fillRect(obs.x + 20, obs.y + 15, 10, obs.h - 15); ctx.fillRect(obs.x + obs.w - 30, obs.y + 15, 10, obs.h - 15);
                       const grd = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + 15);
                       grd.addColorStop(0, '#e2e8f0'); grd.addColorStop(0.5, '#94a3b8'); grd.addColorStop(1, '#475569');
                       ctx.fillStyle = grd; drawRoundedRect(ctx, obs.x, obs.y, obs.w, 15, 7);
                   } 
                   else if (obs.type === 'bench' || obs.type === 'bench-1' || obs.type === 'bench-2') {
                       ctx.fillStyle = '#1e293b'; ctx.fillRect(obs.x + 10, obs.y + 15, 12, 35); ctx.fillRect(obs.x + obs.w - 22, obs.y + 15, 12, 35);
                       ctx.fillStyle = '#7c2d12'; drawRoundedRect(ctx, obs.x, obs.y, obs.w, 15, 4);
                       ctx.fillStyle = '#9a3412'; ctx.fillRect(obs.x, obs.y+6, obs.w, 3);
                   }
                   else if (obs.type.includes('ramp')) {
                       // Improved Ramp Visuals
                       ctx.fillStyle = '#d6d3d1'; // Light Concrete
                       ctx.strokeStyle = '#78716c';
                       ctx.lineWidth = 2;
                       
                       ctx.beginPath();
                       ctx.moveTo(obs.x, obs.y + obs.h);
                       if (obs.type === 'ramp-kicker') {
                            // Kicker (Straight wedge)
                            ctx.lineTo(obs.x + obs.w, obs.y + 30);
                            ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
                            ctx.fill(); ctx.stroke();
                            // Coping
                            ctx.fillStyle = '#ef4444'; ctx.fillRect(obs.x + obs.w - 6, obs.y + 30, 6, 6);
                       } else if (obs.type === 'ramp-quarter' || obs.type === 'ramp-vert') {
                            // Quarter Pipe (Curved)
                            const topY = obs.y + (obs.type === 'ramp-vert' ? 0 : 20);
                            ctx.quadraticCurveTo(obs.x + obs.w * 0.4, obs.y + obs.h, obs.x + obs.w, topY);
                            ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
                            ctx.lineTo(obs.x, obs.y + obs.h);
                            ctx.fill(); ctx.stroke();
                            
                            // Wood panel detail
                            ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1;
                            for(let i=0; i<3; i++) {
                                ctx.beginPath(); 
                                const offset = i * 30;
                                ctx.moveTo(obs.x + 20 + offset, obs.y + obs.h);
                                ctx.quadraticCurveTo(obs.x + obs.w * 0.5 + offset, obs.y + obs.h - 20, obs.x + obs.w, topY + 20 + offset);
                                ctx.stroke();
                            }

                            // Metal Coping
                            ctx.fillStyle = '#525252'; ctx.beginPath(); ctx.arc(obs.x + obs.w - 2, topY, 5, 0, Math.PI*2); ctx.fill();
                            ctx.fillStyle = '#a3a3a3'; ctx.beginPath(); ctx.arc(obs.x + obs.w - 2, topY - 2, 2, 0, Math.PI*2); ctx.fill();
                       }
                   } else if (obs.type === 'bush') {
                       // Realistic bush (שיח) - rounded top, needs to jump over
                       ctx.save();
                       
                       // Main bush body - rounded top
                       const bushGradient = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.h);
                       bushGradient.addColorStop(0, '#2d5016'); // Dark green top
                       bushGradient.addColorStop(0.5, '#3d6b1f'); // Medium green middle
                       bushGradient.addColorStop(1, '#4a7c28'); // Lighter green bottom
                       ctx.fillStyle = bushGradient;
                       
                       // Rounded top bush shape
                       ctx.beginPath();
                       ctx.moveTo(obs.x, obs.y + obs.h);
                       ctx.lineTo(obs.x, obs.y + obs.h * 0.3);
                       ctx.quadraticCurveTo(obs.x + obs.w * 0.2, obs.y, obs.x + obs.w * 0.4, obs.y + obs.h * 0.1);
                       ctx.quadraticCurveTo(obs.x + obs.w * 0.5, obs.y - obs.h * 0.1, obs.x + obs.w * 0.6, obs.y + obs.h * 0.1);
                       ctx.quadraticCurveTo(obs.x + obs.w * 0.8, obs.y, obs.x + obs.w, obs.y + obs.h * 0.3);
                       ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
                       ctx.closePath();
                       ctx.fill();
                       
                       // Leaves/clusters for texture - deterministic based on obstacle ID
                       ctx.fillStyle = '#1e3d0f';
                       const seed = obs.id % 1000; // Use obstacle ID as seed
                       for (let i = 0; i < 8; i++) {
                           const pseudoRandom = ((seed + i * 137) % 100) / 100; // Pseudo-random
                           const leafX = obs.x + (obs.w / 8) * i + pseudoRandom * 10;
                           const leafY = obs.y + obs.h * (0.2 + pseudoRandom * 0.3);
                           const leafSize = 8 + pseudoRandom * 6;
                           ctx.beginPath();
                           ctx.arc(leafX, leafY, leafSize, 0, Math.PI * 2);
                           ctx.fill();
                       }
                       
                       // Highlights
                       ctx.fillStyle = 'rgba(255,255,255,0.1)';
                       ctx.beginPath();
                       ctx.arc(obs.x + obs.w * 0.3, obs.y + obs.h * 0.2, obs.w * 0.15, 0, Math.PI * 2);
                       ctx.fill();
                       
                       ctx.restore();
                   } else if (obs.type === 'fire-hydrant') {
                       // Fire hydrant (עמוד כיבוי אש) - programmatic fallback
                       ctx.fillStyle = '#dc2626'; // Red
                       ctx.fillRect(obs.x + obs.w * 0.2, obs.y, obs.w * 0.6, obs.h);
                       ctx.fillStyle = '#991b1b'; // Darker red
                       ctx.fillRect(obs.x + obs.w * 0.25, obs.y + obs.h * 0.1, obs.w * 0.5, obs.h * 0.2);
                       ctx.fillStyle = '#525252'; // Gray top
                       ctx.fillRect(obs.x + obs.w * 0.3, obs.y, obs.w * 0.4, obs.h * 0.15);
                   } else if (obs.type === 'trash-can') {
                       // Trash can (פח אשפה) - programmatic fallback
                       ctx.fillStyle = '#1f2937'; // Dark gray
                       ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
                       ctx.fillStyle = '#374151'; // Lighter gray
                       ctx.fillRect(obs.x + 5, obs.y + 5, obs.w - 10, obs.h - 10);
                       ctx.fillStyle = '#4b5563'; // Lid
                       ctx.fillRect(obs.x, obs.y, obs.w, 8);
                   } else {
                       // Fallback for other types
                       ctx.fillStyle = '#795548'; ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
                   }
               }
           }
      });
  };

  const drawCoins = (ctx: CanvasRenderingContext2D) => {
      gameState.current.coinsArr.forEach(c => {
          ctx.save();
          ctx.translate(c.x, c.y);
          if (c.type === 'coin') {
              const scaleX = Math.sin(gameState.current.frame * 0.1);
              ctx.scale(scaleX, 1);
              ctx.fillStyle = '#f1c40f'; ctx.shadowColor = '#f39c12'; ctx.shadowBlur = 15;
              ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
              ctx.strokeStyle = '#b45309'; ctx.lineWidth = 3; ctx.stroke();
              if (Math.abs(scaleX) > 0.3) {
                  ctx.fillStyle = '#b45309'; ctx.font = 'bold 20px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('₪', 0, 1);
              }
          }
          ctx.restore();
      });
  };

  const drawLostObjects = (ctx: CanvasRenderingContext2D) => {
      const st = gameState.current;
      st.lostObjects.forEach(obj => {
          ctx.save();
          ctx.translate(obj.x, obj.y);
          
          // Add a subtle floating animation
          const floatOffset = Math.sin(st.frame * 0.1) * 5;
          ctx.translate(0, floatOffset);
          
          // Add a slight rotation for visual interest
          ctx.rotate(obj.rotation * 0.3);
          
              // Try to draw object sprite image if available - make it prominent
          const img = lostObjectImagesRef.current[obj.spriteType];
          if (img) {
              // Draw shadow for depth
              ctx.save();
              ctx.globalAlpha = 0.3;
              ctx.fillStyle = '#000';
              ctx.beginPath();
              ctx.ellipse(0, 50, 40, 8, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.globalAlpha = 1;
              ctx.restore();
              
              // Draw the object image - make it larger and more prominent
              const objectSize = 80; // Larger size for prominence
              ctx.drawImage(img, -objectSize / 2, -objectSize / 2, objectSize, objectSize);
              
              // Add a glow effect to make it stand out
              let glowColor = '#3498db';
              if (obj.spriteType === 'school_bag') {
                  glowColor = '#3498db'; // Blue for bag
              } else if (obj.spriteType === 'dubi') {
                  glowColor = '#e74c3c'; // Red for dubi
              } else if (obj.spriteType === 'book') {
                  glowColor = '#9b59b6'; // Purple for book
              }
              ctx.shadowColor = glowColor;
              ctx.shadowBlur = 20;
              ctx.drawImage(img, -objectSize / 2, -objectSize / 2, objectSize, objectSize);
              ctx.shadowBlur = 0;
          } else {
              // Fallback: draw a prominent object representation
              let glowColor = '#3498db';
              let icon = '🎒';
              if (obj.spriteType === 'school_bag') {
                  glowColor = '#3498db';
                  icon = '🎒';
              } else if (obj.spriteType === 'dubi') {
                  glowColor = '#e74c3c';
                  icon = '🧸';
              } else if (obj.spriteType === 'book') {
                  glowColor = '#9b59b6';
                  icon = '📚';
              }
              ctx.fillStyle = glowColor;
              ctx.shadowColor = glowColor;
              ctx.shadowBlur = 15;
              ctx.beginPath();
              ctx.arc(0, 0, 35, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;
              ctx.strokeStyle = glowColor;
              ctx.lineWidth = 3;
              ctx.stroke();
              // Draw object icon
              ctx.fillStyle = '#fff';
              ctx.font = 'bold 32px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(icon, 0, 0);
          }
          
          ctx.restore();
      });
  };

  const drawOwnerNPCs = (ctx: CanvasRenderingContext2D) => {
      const st = gameState.current;
      st.ownerNPCs.forEach(npc => {
          // Draw shadow
          drawShadow(ctx, npc.x, npc.w, GROUND_Y - (npc.y + npc.h));
          
          ctx.save();
          ctx.translate(npc.x + npc.w / 2, npc.y + npc.h / 2);
          
          // Try to draw sprite image if available (sad child or happy child)
          const img = ownerNPCImagesRef.current[npc.state];
          if (img) {
              // Draw the child image - maintain aspect ratio
              const imgAspect = img.width / img.height;
              let drawWidth = npc.w;
              let drawHeight = npc.h;
              
              if (imgAspect > 1) {
                  // Image is wider than tall
                  drawHeight = drawWidth / imgAspect;
              } else {
                  // Image is taller than wide
                  drawWidth = drawHeight * imgAspect;
              }
              
              ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
          } else {
              // Fallback: draw a simple representation
              ctx.fillStyle = npc.state === 'happy' ? '#2ecc71' : '#95a5a6';
              ctx.fillRect(-npc.w / 2, -npc.h / 2, npc.w, npc.h);
              ctx.strokeStyle = '#34495e';
              ctx.lineWidth = 2;
              ctx.strokeRect(-npc.w / 2, -npc.h / 2, npc.w, npc.h);
              // Draw face
              ctx.fillStyle = '#f39c12';
              ctx.beginPath();
              ctx.arc(0, -20, 15, 0, Math.PI * 2);
              ctx.fill();
              // Draw expression
              ctx.fillStyle = '#000';
              if (npc.state === 'happy') {
                  // Happy face
                  ctx.beginPath();
                  ctx.arc(-5, -25, 3, 0, Math.PI * 2);
                  ctx.arc(5, -25, 3, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.beginPath();
                  ctx.arc(0, -18, 8, 0, Math.PI);
                  ctx.stroke();
              } else {
                  // Sad/waiting face
                  ctx.beginPath();
                  ctx.arc(-5, -25, 3, 0, Math.PI * 2);
                  ctx.arc(5, -25, 3, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.beginPath();
                  ctx.arc(0, -15, 8, Math.PI, 0, true);
                  ctx.stroke();
              }
          }
          
          ctx.restore();
          
          // Draw arrow and text label if in waiting state (sad child)
          if (npc.state === 'waiting') {
              ctx.save();
              // Draw downward arrow above NPC - make it more prominent
              const arrowY = npc.y - 40;
              const arrowX = npc.x + npc.w / 2;
              
              // Draw arrow with glow
              ctx.shadowColor = '#f1c40f';
              ctx.shadowBlur = 10;
              ctx.fillStyle = '#f1c40f';
              ctx.strokeStyle = '#f39c12';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(arrowX, arrowY);
              ctx.lineTo(arrowX - 12, arrowY + 18);
              ctx.lineTo(arrowX + 12, arrowY + 18);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
              ctx.shadowBlur = 0;
              
              // Draw text label "השבת אבידה" - make it more prominent
              ctx.fillStyle = '#fff';
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 5;
              ctx.font = 'bold 20px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              const textY = arrowY - 8;
              ctx.strokeText('השבת אבידה', arrowX, textY);
              ctx.fillText('השבת אבידה', arrowX, textY);
              
              ctx.restore();
          }
      });
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
      gameState.current.particles.forEach(p => {
          ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha = 1;
  };
  
  const drawTzedakahMessage = (ctx: CanvasRenderingContext2D) => {
      const st = gameState.current;
      if (st.tzedakahMessageTimer > 0) {
          ctx.save();
          const alpha = Math.min(1, st.tzedakahMessageTimer / 60); // Fade in/out
          ctx.globalAlpha = alpha;
          
          // Draw semi-transparent background
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(0, CANVAS_HEIGHT / 2 - 80, CANVAS_WIDTH, 160);
          
          // Draw glowing text
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 20;
          ctx.fillStyle = '#ffd700';
          ctx.strokeStyle = '#ffaa00';
          ctx.lineWidth = 4;
          ctx.font = 'bold 48px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const message = "צדקה תציל ממוות";
          ctx.strokeText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
          ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
          
          ctx.shadowBlur = 0;
          ctx.restore();
          
          // Decrement timer
          st.tzedakahMessageTimer--;
      }
  };

  const drawFloatingTexts = (ctx: CanvasRenderingContext2D) => {
      gameState.current.floatingTexts.forEach(t => {
          ctx.globalAlpha = Math.min(1, t.life / 20); ctx.fillStyle = t.color;
          ctx.font = 'bold 24px Arial'; ctx.strokeStyle = 'black'; ctx.lineWidth = 3;
          // Center text for messages at top (y < 250), otherwise use original position
          const isTopMessage = t.y < 250;
          if (isTopMessage) {
              ctx.textAlign = 'center';
              ctx.textBaseline = 'top';
          } else {
              ctx.textAlign = 'left';
              ctx.textBaseline = 'alphabetic';
          }
          ctx.strokeText(t.text, t.x, t.y); ctx.fillText(t.text, t.x, t.y);
          // Reset alignment
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
      });
      ctx.globalAlpha = 1;
  };

  const gameLoop = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Always draw background and player, even when paused
    if (isPausedRef.current) {
      drawBackground(ctx, gameState.current.speed, gameState.current.frame);
      drawObstacles(ctx);
      drawBosses(ctx);
      drawCoins(ctx);
      drawLostObjects(ctx);
      drawOwnerNPCs(ctx);
      drawPlayer(ctx, gameState.current.player);
      drawParticles(ctx);
      drawFloatingTexts(ctx);
      drawTzedakahMessage(ctx);
      return;
    }

    gameState.current.frame++;
    updatePlayer();
    updateObstacles();
    updateCoins();
    updateLostObjects();
    updateOwnerNPCs();
    updateBosses();
    updateParticles();
    updateFloatingTexts();
    drawBackground(ctx, gameState.current.speed, gameState.current.frame);
    drawObstacles(ctx);
    drawBosses(ctx);
    drawCoins(ctx);
    drawLostObjects(ctx);
    drawOwnerNPCs(ctx);
    drawPlayer(ctx, gameState.current.player);
    drawParticles(ctx);
    drawFloatingTexts(ctx);
    drawTzedakahMessage(ctx);
  }, [character]);

  // Load background image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Allow cross-origin if needed
    img.onload = () => {
      backgroundImageRef.current = img;
    };
    img.onerror = () => {
      // If image doesn't exist, continue with programmatic background
      backgroundImageRef.current = null;
    };
    // Try to load background image from public folder
    img.src = '/jerusalem-background.png';
  }, []);

  // Load obstacle images
  useEffect(() => {
    const obstacleTypes: Obstacle['type'][] = ['bush', 'ramp-kicker', 'ramp-quarter', 'fire-hydrant', 'bench', 'bench-1', 'bench-2', 'trash-can'];
    
    obstacleTypes.forEach(type => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        obstacleImagesRef.current[type] = img;
      };
      img.onerror = () => {
        // Image doesn't exist, will use programmatic drawing
      };
      // Try to load from public folder with naming convention: obstacle-{type}.png
      img.src = `/obstacle-${type}.png`;
    });
  }, []);

  // Load character face images
  useEffect(() => {
    // Load face image for nave (נוה עודד)
    const faceImageKey = 'nave-face';
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      characterFaceImagesRef.current[faceImageKey] = img;
    };
    img.onerror = () => {
    };
    // Try to load from public/faces folder
    img.src = '/faces/character1-face.png';
  }, []);

  // Load lost object images (bag, dubi, and book)
  useEffect(() => {
    // Load bag image
    const bagImg = new Image();
    bagImg.crossOrigin = 'anonymous';
    bagImg.onload = () => {
      lostObjectImagesRef.current['school_bag'] = bagImg;
    };
    bagImg.onerror = () => {
      // Image doesn't exist, will use programmatic drawing
    };
    bagImg.src = '/lost_bag.png';
    
    // Load dubi (teddy bear) image
    const dubiImg = new Image();
    dubiImg.crossOrigin = 'anonymous';
    dubiImg.onload = () => {
      lostObjectImagesRef.current['dubi'] = dubiImg;
    };
    dubiImg.onerror = () => {
      // Image doesn't exist, will use programmatic drawing
    };
    dubiImg.src = '/dubi_object.png';
    
    // Load book image
    const bookImg = new Image();
    bookImg.crossOrigin = 'anonymous';
    bookImg.onload = () => {
      lostObjectImagesRef.current['book'] = bookImg;
    };
    bookImg.onerror = () => {
      // Image doesn't exist, will use programmatic drawing
    };
    bookImg.src = '/book_object.png';
  }, []);

  // Load owner NPC images
  useEffect(() => {
    // Load sad child (waiting state)
    const sadImg = new Image();
    sadImg.crossOrigin = 'anonymous';
    sadImg.onload = () => {
      ownerNPCImagesRef.current['waiting'] = sadImg;
    };
    sadImg.onerror = () => {
      // Image doesn't exist, will use programmatic drawing
    };
    sadImg.src = '/npc_sad.png';
    
    // Load happy child (happy state)
    const happyImg = new Image();
    happyImg.crossOrigin = 'anonymous';
    happyImg.onload = () => {
      ownerNPCImagesRef.current['happy'] = happyImg;
    };
    happyImg.onerror = () => {
      // Image doesn't exist, will use programmatic drawing
    };
    happyImg.src = '/npc_happy.png';
  }, []);

  // Resize canvas to fit container while maintaining aspect ratio - Optimized for mobile
  useEffect(() => {
    const resizeCanvas = () => {
      if (!canvasRef.current || !containerRef.current) return;
      
      const container = containerRef.current;
      const canvas = canvasRef.current;
      
      // Use getBoundingClientRect for accurate dimensions (accounts for mobile browser UI)
      const containerRect = container.getBoundingClientRect();
      let containerWidth = containerRect.width;
      let containerHeight = containerRect.height;
      
      // For mobile, use window dimensions as fallback if container is 0
      if (containerWidth === 0 || containerHeight === 0) {
        containerWidth = window.innerWidth;
        containerHeight = window.innerHeight;
      }
      
      if (containerWidth === 0 || containerHeight === 0) return;
      
      // Calculate scale to fit container while maintaining 16:9 aspect ratio
      const aspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
      let displayWidth = containerWidth;
      let displayHeight = containerWidth / aspectRatio;
      
      // If height exceeds container, scale by height instead
      if (displayHeight > containerHeight) {
        displayHeight = containerHeight;
        displayWidth = containerHeight * aspectRatio;
      }
      
      // Ensure we don't exceed container bounds
      if (displayWidth > containerWidth) {
        displayWidth = containerWidth;
        displayHeight = containerWidth / aspectRatio;
      }
      
      // Set canvas display size with better mobile handling
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
      canvas.style.maxWidth = '100%';
      canvas.style.maxHeight = '100%';
      canvas.style.objectFit = 'contain';
    };
    
    // Resize immediately
    resizeCanvas();
    
    // Use ResizeObserver for better performance
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        resizeCanvas();
      });
      resizeObserver.observe(containerRef.current);
    }
    
    // Fallback to window events
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', () => {
      setTimeout(resizeCanvas, 100);
    });
    
    // Also resize after delays to handle mobile browser UI changes
    const timeoutId1 = setTimeout(resizeCanvas, 100);
    const timeoutId2 = setTimeout(resizeCanvas, 300);
    const timeoutId3 = setTimeout(resizeCanvas, 500);
    const timeoutId4 = setTimeout(resizeCanvas, 1000);
    
    // Handle mobile viewport changes (address bar hide/show)
    let lastHeight = window.innerHeight;
    const handleViewportChange = () => {
      const currentHeight = window.innerHeight;
      if (Math.abs(currentHeight - lastHeight) > 50) {
        lastHeight = currentHeight;
        setTimeout(resizeCanvas, 100);
      }
    };
    
    window.addEventListener('resize', handleViewportChange);
    
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', resizeCanvas);
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      clearTimeout(timeoutId4);
    };
  }, []);

  // Initialize game only when sessionId changes (new game started)
  useEffect(() => {
    if (isActive && sessionId > 0) {
        initGame();
        // Draw initial frame
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                drawBackground(ctx, gameState.current.speed, gameState.current.frame);
                drawPlayer(ctx, gameState.current.player);
            }
        }
    }
  }, [sessionId, character]);

  // Update refs when props change
  useEffect(() => {
    isActiveRef.current = isActive;
    isPausedRef.current = isPaused;
  }, [isActive, isPaused]);

  useEffect(() => {
    // Cancel any existing loop first
    if (reqRef.current) {
        cancelAnimationFrame(reqRef.current);
        reqRef.current = undefined;
    }
    
    // Start game loop if active
    if (isActive) {
        const loop = () => {
            if (!isActiveRef.current) {
                // Stop loop if not active anymore
                if (reqRef.current) {
                    cancelAnimationFrame(reqRef.current);
                    reqRef.current = undefined;
                }
                return;
            }
            gameLoop();
            // Continue loop
            reqRef.current = requestAnimationFrame(loop);
        };
        // Start the loop immediately
        loop();
    }
    
    return () => { 
        if (reqRef.current) {
            cancelAnimationFrame(reqRef.current);
            reqRef.current = undefined;
        }
    };
  }, [isActive, isPaused, gameLoop]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-slate-900" style={{ pointerEvents: 'none' }}>
      <canvas 
          ref={canvasRef} 
          width={CANVAS_WIDTH} 
          height={CANVAS_HEIGHT}
          className="bg-slate-900 shadow-2xl"
          style={{
            imageRendering: 'auto',
            touchAction: 'pan-x pan-y', // Allow scrolling on canvas too
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            maxWidth: '100%',
            maxHeight: '100%',
            pointerEvents: 'none'
          }}
      />
    </div>
  );
});

export default GameEngine;