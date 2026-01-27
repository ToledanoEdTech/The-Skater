import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, GRAVITY, JUMP_FORCE, BASE_SPEED 
} from '../constants';
import { 
  CharacterConfig, Obstacle, Coin, Particle, FloatingText, PowerUpState, TrickType, PlayerState, GadgetType
} from '../types';
import { audioService } from '../services/audioService';

interface GameEngineProps {
  character: CharacterConfig;
  isActive: boolean;
  isPaused: boolean;
  sessionId: number; 
  activePowerups: PowerUpState;
  equippedGadget: GadgetType;
  onScoreUpdate: (score: number, coins: number, combo: number) => void;
  onGameOver: (finalScore: number, finalCoins: number) => void;
  onPowerupExpire: (type: keyof PowerUpState) => void;
}

export interface GameEngineHandle {
  performTrick: (type: TrickType) => void;
  jump: () => void;
}

const GameEngine = forwardRef<GameEngineHandle, GameEngineProps>(({
  character, isActive, isPaused, sessionId, activePowerups, equippedGadget, onScoreUpdate, onGameOver, onPowerupExpire
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reqRef = useRef<number>();
  
  // Mutable Game State
  const gameState = useRef({
    frame: 0,
    score: 0,
    coins: 0,
    speed: BASE_SPEED,
    combo: 1,
    comboTimer: 0,
    timeOfDay: 0, // 0-1. 0=Day, 0.5=Sunset, 1=Night
    
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
      flashCounter: 0,
      crashed: false,
      crashTimer: 0,
    } as PlayerState,

    obstacles: [] as Obstacle[],
    coinsArr: [] as Coin[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    powerupTimers: { shield: 0, magnet: 0, double: 0, slow: 0 }
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
        
        // Gadget: Rainbow Trail
        if (equippedGadget === 'rainbow_trail') {
            spawnParticles(p.x + 30, p.y + 100, 'rainbow', 'sparkle', 10);
        } else {
            spawnParticles(p.x + 30, p.y + 100, '#fff', 'dust', 5);
        }
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
        
        if (type === '360') { p.angle = Math.PI * 2; text = "360 FLIP!"; }
        if (type === 'superman') { p.angle = 0; points = 300; text = "SUPERMAN!"; audioService.playSuperTrick(); }
        if (type === 'kickflip') { p.boardAngle = Math.PI * 2; points = 250; text = "KICKFLIP!"; audioService.playTrick(); }
        
        if (p.rampBoosted) { points *= 2; text = "RAMP " + text; }
        if (activePowerups.double) { points *= 2; text = "x2 " + text; }
        
        gameState.current.score += points;
        spawnFloatingText(text, p.x, p.y);
        if (type !== 'superman') audioService.playTrick();
        
        const color = equippedGadget === 'rainbow_trail' ? 'rainbow' : '#f1c40f';
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
    st.player.y = GROUND_Y - st.player.height;
    st.player.vy = 0;
    st.player.crashed = false;
    st.player.crashTimer = 0;
    st.player.angle = 0;
    st.player.grinding = false;
    st.obstacles = [];
    st.coinsArr = [];
    st.particles = [];
    st.floatingTexts = [];
    st.powerupTimers = { shield: 0, magnet: 0, double: 0, slow: 0 };
    
    if (activePowerups.magnet) st.powerupTimers.magnet = 600;
    if (activePowerups.double) st.powerupTimers.double = 600;
    if (activePowerups.slow) st.powerupTimers.slow = 300;
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
            if (p.trickType === '360') { p.angle -= 0.2; if (p.angle < 0) p.angle = 0; ctx.rotate(p.angle); }
            else if (p.trickType === 'superman') ctx.rotate(Math.PI / 2);
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
                p.boardAngle -= 0.4; if (p.boardAngle < 0) p.boardAngle = 0; 
                ctx.rotate(p.boardAngle); 
            }
            if (p.trickType === 'superman' && p.tricking) ctx.translate(-20, 20);
            if (p.grinding) ctx.rotate(0.2); 
        }

        // Gadget: Neon Board
        if (equippedGadget === 'neon_board') {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ff00';
            ctx.fillStyle = '#00ff00'; 
        } else {
            ctx.fillStyle = '#1e1b18'; 
        }
        
        drawRoundedRect(ctx, -35, 35, 70, 8, 4);
        ctx.shadowBlur = 0; // Reset shadow

        if (equippedGadget !== 'neon_board') {
            ctx.fillStyle = '#d35400'; 
            ctx.fillRect(-35, 40, 70, 3);
        }
        
        // Trucks & Wheels
        ctx.fillStyle = '#bdc3c7'; 
        ctx.fillRect(-25, 43, 10, 8);
        ctx.fillRect(15, 43, 10, 8);

        ctx.fillStyle = '#ecf0f1'; 
        ctx.beginPath(); ctx.arc(-20, 52, 7, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(20, 52, 7, 0, Math.PI*2); ctx.fill();
        
        ctx.restore();
    }

    const breathing = p.crashed ? 0 : Math.sin(gameState.current.frame * 0.1) * 1;
    const runAnim = p.crashed ? 0 : (p.grounded && !p.grinding ? Math.sin(gameState.current.frame * 0.4) : 0);
    
    // Legs & Shoes
    const drawLeg = (isBack: boolean) => {
        ctx.save();
        const offset = isBack ? -8 : 8;
        const rotate = isBack ? runAnim * 0.1 : -runAnim * 0.1;
        ctx.translate(offset, 15);
        ctx.rotate(rotate);
        
        ctx.fillStyle = character.pants;
        ctx.beginPath(); ctx.moveTo(-6, -5); ctx.lineTo(6, -5); ctx.lineTo(5, 15); ctx.lineTo(-7, 15); ctx.fill();
        
        ctx.translate(0, 15);
        const shinRot = isBack ? runAnim * 0.1 : (-runAnim * 0.1 + (p.grounded && !p.grinding ? 0 : 0.3));
        ctx.rotate(shinRot + (p.grinding ? (isBack ? 0 : 0.3) : 0));
        
        ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(5, 0); ctx.lineTo(6, 15); ctx.lineTo(-8, 15); ctx.fill();
        
        ctx.fillStyle = '#34495e';
        ctx.beginPath(); ctx.moveTo(-8, 15); ctx.lineTo(8, 15); ctx.lineTo(8, 20); ctx.lineTo(-8, 20); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillRect(-8, 20, 16, 3);
        ctx.restore();
    };

    drawLeg(true);
    drawLeg(false);

    // Torso
    ctx.translate(0, breathing);
    ctx.fillStyle = character.shirt;
    ctx.beginPath();
    ctx.moveTo(-16, -20); ctx.lineTo(16, -20); ctx.lineTo(14, 15); ctx.lineTo(-14, 15);
    ctx.fill();
    
    // Gadget: Gold Chain
    if (equippedGadget === 'gold_chain') {
        ctx.save();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, -20, 10, 0, Math.PI); ctx.stroke();
        ctx.fillStyle = '#ffd700';
        ctx.font = '10px Arial'; ctx.textAlign='center'; ctx.fillText('ח', 0, -8);
        ctx.restore();
    }
    
    // Tzitzit
    if (character.id === 'rabbi' || character.type === 'kippah') {
       ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
       ctx.beginPath(); ctx.moveTo(14, 15); ctx.quadraticCurveTo(16, 25, 18, 28); ctx.stroke();
       ctx.beginPath(); ctx.moveTo(14, 15); ctx.quadraticCurveTo(12, 25, 10, 28); ctx.stroke();
       ctx.beginPath(); ctx.moveTo(-14, 15); ctx.quadraticCurveTo(-16, 25, -18, 28); ctx.stroke();
       ctx.beginPath(); ctx.moveTo(-14, 15); ctx.quadraticCurveTo(-12, 25, -10, 28); ctx.stroke();
    }
    
    // Arms
    const drawArm = (isBack: boolean) => {
        const armWag = p.crashed ? 2 : (p.grinding ? -1.2 : (p.grounded ? Math.cos(gameState.current.frame * 0.4) * 0.3 : -0.5));
        const rot = isBack ? armWag : -armWag;
        const xOff = isBack ? -14 : 14;
        
        ctx.save();
        ctx.translate(xOff, -12);
        ctx.rotate(rot);
        ctx.strokeStyle = character.skin; ctx.lineWidth = 9; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(isBack ? -5 : 5, 12); ctx.stroke();
        ctx.fillStyle = character.skin; ctx.beginPath(); ctx.arc(isBack ? -6 : 6, 16, 5, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    };

    drawArm(true);
    drawArm(false);

    // Head
    ctx.translate(0, -22);
    ctx.fillStyle = character.skin;
    ctx.fillRect(-5, 0, 10, 8); // Neck
    ctx.beginPath(); ctx.arc(0, -8, 15, 0, Math.PI * 2); ctx.fill(); // Head
    
    if (character.beard) {
        ctx.fillStyle = '#ecf0f1';
        ctx.beginPath(); ctx.moveTo(-15, -8); ctx.quadraticCurveTo(-15, 15, 0, 18); ctx.quadraticCurveTo(15, 15, 15, -8); ctx.fill();
    }
    
    if (!character.beard) {
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
        ctx.beginPath(); 
        if(p.crashed) { ctx.arc(0, 2, 3, 0, Math.PI*2); } 
        else { ctx.arc(0, 0, 5, 0.2, Math.PI-0.2); }
        ctx.stroke();
    }

    if (p.crashed) {
        ctx.lineWidth = 2; ctx.strokeStyle = '#000';
        ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(-4, -6); ctx.moveTo(-4, -10); ctx.lineTo(-8, -6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(4, -10); ctx.lineTo(8, -6); ctx.moveTo(8, -10); ctx.lineTo(4, -6); ctx.stroke();
    } else {
        ctx.fillStyle = '#111';
        drawRoundedRect(ctx, -12, -14, 24, 8, 2);
    }
    
    if (character.type === 'hat') {
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.ellipse(0, -18, 22, 5, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-15, -18); ctx.lineTo(-12, -35); ctx.lineTo(12, -35); ctx.lineTo(15, -18); ctx.fill();
        ctx.fillStyle = '#333'; ctx.fillRect(-14, -22, 28, 4);
    } else {
        ctx.fillStyle = character.hair;
        ctx.beginPath(); ctx.arc(0, -10, 16, Math.PI, 0); ctx.lineTo(16, -5); ctx.lineTo(12, 5); ctx.lineTo(-12, 5); ctx.lineTo(-16, -5); ctx.fill();
        if (character.type === 'kippah') {
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, -20, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#3498db'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(0, -16); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-10, -20); ctx.lineTo(10, -20); ctx.stroke();
        }
    }

    ctx.restore();
  };

  const drawDetailedDog = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, frame: number) => {
    drawShadow(ctx, x, w, 0);
    ctx.save();
    ctx.translate(x + w/2, y + h/2);
    const runCycle = (frame * 0.2) % (Math.PI * 2);
    const bob = Math.sin(runCycle * 2) * 2;
    ctx.translate(0, bob);
    ctx.scale(-1, 1); 
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
      ctx.save(); ctx.translate(x + w/2, y + h/2); ctx.fillStyle = '#4b5563'; 
      ctx.beginPath(); ctx.moveTo(-20, 15); ctx.quadraticCurveTo(0, -20, 20, 15); ctx.lineTo(20, 25); ctx.lineTo(-20, 25); ctx.fill();
      ctx.translate(-15, 0); ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-8, -5); ctx.lineTo(-12, -15); ctx.lineTo(-2, -8); ctx.fill(); ctx.beginPath(); ctx.moveTo(2, -8); ctx.lineTo(8, -15); ctx.lineTo(8, -5); ctx.fill();
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.ellipse(-4, 0, 2, 3, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(2, 0, 2, 3, 0, 0, Math.PI*2); ctx.fill();
      ctx.restore();
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, speed: number, frame: number) => {
    // Determine Time of Day Cycle
    // 0 - 3000: Day -> Sunset
    // 3000 - 4500: Sunset -> Night
    // 4500+: Night
    let skyStart, skyEnd, sunMoonY, groundStart, groundEnd, starAlpha, streetLightAlpha;
    
    const cyclePos = Math.min(frame, 6000); 
    let phase = 0; // 0=Day, 1=Sunset, 2=Night
    let t = 0;

    if (cyclePos < 3000) {
        // Day -> Sunset
        phase = 0;
        t = cyclePos / 3000;
        skyStart = interpolateColor('#38bdf8', '#f97316', t); // Blue -> Orange
        skyEnd = interpolateColor('#0ea5e9', '#7c3aed', t); // Deep Blue -> Purple
        groundStart = interpolateColor('#16a34a', '#111827', t);
        groundEnd = interpolateColor('#15803d', '#000000', t);
        sunMoonY = 100 + t * 400; // Sun goes down
        starAlpha = 0;
        streetLightAlpha = t > 0.8 ? (t - 0.8) * 5 : 0;
    } else if (cyclePos < 5000) {
        // Sunset -> Night
        phase = 1;
        t = (cyclePos - 3000) / 2000;
        skyStart = interpolateColor('#f97316', '#020617', t);
        skyEnd = interpolateColor('#7c3aed', '#312e81', t);
        groundStart = '#111827';
        groundEnd = '#000000';
        sunMoonY = 500 + t * 200; // Sun gone
        starAlpha = t;
        streetLightAlpha = 1;
    } else {
        // Full Night
        phase = 2;
        skyStart = '#020617';
        skyEnd = '#312e81';
        groundStart = '#111827';
        groundEnd = '#000000';
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

    // Ground
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
    groundGrad.addColorStop(0, groundStart);
    groundGrad.addColorStop(1, groundEnd);
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
    
    // Noise
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for(let i=0; i<100; i++) {
        const nx = (i * 83 + frame * speed) % CANVAS_WIDTH;
        const ny = GROUND_Y + (i * 29) % (CANVAS_HEIGHT - GROUND_Y);
        ctx.fillRect(nx, ny, 2, 2);
    }
    
    // Road Markings
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = streetLightAlpha * 10;
    ctx.fillStyle = '#facc15';
    const dashOffset = -(frame * speed) % 200;
    for (let i = -1; i < (CANVAS_WIDTH / 200) + 2; i++) {
        ctx.fillRect(i * 200 + dashOffset, GROUND_Y + 75, 100, 8);
    }
    ctx.shadowBlur = 0;
  };

  const handleCollision = (obs: Obstacle) => {
    const p = gameState.current.player;
    if (p.crashed || p.flashCounter > 0) return;

    // RAMP AUTO-JUMP LOGIC
    if (obs.type.includes('ramp')) {
        // If hitting the front/body of the ramp, launch player up
        if (p.x + p.width > obs.x) {
            p.vy = JUMP_FORCE * 1.3;
            p.grounded = false;
            p.rampBoosted = true;
            p.grinding = false; // Cannot grind if launching
            audioService.playJump();
            spawnFloatingText("AIR TIME!", p.x, p.y - 60, '#fbbf24');
            spawnParticles(p.x + 30, p.y + p.height, '#fff', 'dust', 10);
            return; // Safe!
        }
    }

    if (activePowerups.shield) {
      p.flashCounter = 60;
      onPowerupExpire('shield');
      audioService.playCrash();
      spawnFloatingText("SHIELD BROKEN", p.x, p.y, '#3498db');
      return;
    }

    // Grind Logic
    if (obs.type === 'rail' || obs.type === 'bench') {
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
            (o.type === 'rail' || o.type === 'bench') && 
            p.x + p.width/2 > o.x && p.x + p.width/2 < o.x + o.w &&
            Math.abs((p.y + p.height) - o.y) < 10
        );
        
        if (!stillGrinding) {
            p.grinding = false;
            p.grounded = false;
        }
    }

    if (p.flashCounter > 0) p.flashCounter--;
    
    if (!p.crashed && isActive && !isPaused) {
       let speedMult = st.speed / BASE_SPEED;
       let multiplier = st.combo * (activePowerups.double ? 2 : 1);
       st.score += 0.1 * speedMult * multiplier;
       
       if (st.frame % 60 === 0) onScoreUpdate(Math.floor(st.score), st.coins, st.combo);
    }
  };

  const updateObstacles = () => {
      const st = gameState.current;
      
      if (st.frame % Math.floor(2000 / st.speed) === 0) {
          const types: Obstacle['type'][] = ['bench', 'bush', 'dog', 'cat', 'ramp-kicker', 'rail', 'ramp-quarter', 'ramp-vert'];
          const type = types[Math.floor(Math.random() * types.length)];
          let w = 80, h = 60;
          if (type === 'bench') { w = 120; h = 50; }
          if (type === 'bush') { w = 90; h = 60; }
          if (type === 'dog') { w = 70; h = 50; }
          if (type === 'cat') { w = 50; h = 40; }
          if (type === 'ramp-kicker') { w = 120; h = 80; }
          if (type === 'ramp-quarter') { w = 140; h = 110; }
          if (type === 'ramp-vert') { w = 140; h = 160; }
          if (type === 'rail') { w = 250; h = 80; }

          st.obstacles.push({
              id: Date.now() + Math.random(),
              type,
              x: CANVAS_WIDTH + 100,
              y: GROUND_Y - h,
              w, h,
              markedForDeletion: false,
              animFrame: 0
          });
      }

      st.obstacles.forEach(obs => {
          obs.x -= st.speed;
          obs.animFrame++;
          if (obs.x + obs.w < -100) obs.markedForDeletion = true;
          
          const p = st.player;
          const isGrindable = (obs.type === 'rail' || obs.type === 'bench');
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
                  handleCollision(obs); // Launch
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
          if (Math.abs(p.x - c.x) < 50 && Math.abs(p.y - c.y) < 50) {
              c.markedForDeletion = true;
              st.coins++;
              st.score += 100;
              audioService.playCoin();
              spawnParticles(c.x, c.y, '#f1c40f', 'sparkle', 5);
              onScoreUpdate(st.score, st.coins, st.combo);
          }
      });
      st.coinsArr = st.coinsArr.filter(c => !c.markedForDeletion);
  };
  
  const updateParticles = () => {
      const st = gameState.current;
      st.particles.forEach(p => { p.x += p.speedX; p.y += p.speedY; p.life -= p.decay; });
      st.particles = st.particles.filter(p => p.life > 0);
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
           } else {
               drawShadow(ctx, obs.x, obs.w, 0);
               
               if (obs.type === 'rail') {
                   ctx.fillStyle = '#64748b'; ctx.fillRect(obs.x + 20, obs.y + 15, 10, obs.h - 15); ctx.fillRect(obs.x + obs.w - 30, obs.y + 15, 10, obs.h - 15);
                   const grd = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + 15);
                   grd.addColorStop(0, '#e2e8f0'); grd.addColorStop(0.5, '#94a3b8'); grd.addColorStop(1, '#475569');
                   ctx.fillStyle = grd; drawRoundedRect(ctx, obs.x, obs.y, obs.w, 15, 7);
               } 
               else if (obs.type === 'bench') {
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
               } else {
                   ctx.fillStyle = '#795548'; ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
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

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
      gameState.current.particles.forEach(p => {
          ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha = 1;
  };
  
  const drawFloatingTexts = (ctx: CanvasRenderingContext2D) => {
      gameState.current.floatingTexts.forEach(t => {
          ctx.globalAlpha = Math.min(1, t.life / 20); ctx.fillStyle = t.color;
          ctx.font = 'bold 24px Arial'; ctx.strokeStyle = 'black'; ctx.lineWidth = 3;
          ctx.strokeText(t.text, t.x, t.y); ctx.fillText(t.text, t.x, t.y);
      });
      ctx.globalAlpha = 1;
  };

  const gameLoop = () => {
    if (!canvasRef.current || isPaused) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    gameState.current.frame++;
    updatePlayer();
    updateObstacles();
    updateCoins();
    updateParticles();
    updateFloatingTexts();
    drawBackground(ctx, gameState.current.speed, gameState.current.frame);
    drawObstacles(ctx);
    drawCoins(ctx);
    drawPlayer(ctx, gameState.current.player);
    drawParticles(ctx);
    drawFloatingTexts(ctx);
    if (isActive) reqRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    if (isActive) {
        if (!gameState.current.player.crashed || sessionId > 0) initGame(); 
        reqRef.current = requestAnimationFrame(gameLoop);
    }
    return () => { if (reqRef.current) cancelAnimationFrame(reqRef.current); };
  }, [isActive, sessionId, equippedGadget]);

  return (
    <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT}
        className="w-full h-full object-contain bg-slate-900 shadow-2xl"
        style={{
          imageRendering: 'pixelated',
          touchAction: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none'
        }}
    />
  );
});

export default GameEngine;