export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  SHOP = 'SHOP',
  LEADERBOARD = 'LEADERBOARD'
}

export type TrickType = 'none' | 'kickflip' | 'superman' | '360';
export type GadgetType = 'none' | 'rainbow_trail' | 'neon_board' | 'gold_chain';

export interface CharacterConfig {
  id: string;
  name: string;
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  type: 'kippah' | 'hat';
  beard?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  color: string;
  size: number;
  speedX: number;
  speedY: number;
  life: number;
  decay: number;
  type: 'dust' | 'star' | 'sparkle';
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  life: number;
  color: string;
}

export interface Obstacle {
  id: number;
  type: 'bench' | 'bush' | 'dog' | 'cat' | 'ramp-kicker' | 'ramp-quarter' | 'ramp-vert' | 'rail';
  x: number;
  y: number;
  w: number;
  h: number;
  markedForDeletion: boolean;
  animFrame: number;
}

export interface Coin {
  id: number;
  x: number;
  y: number;
  type: 'coin' | 'powerup';
  powerType?: PowerUpType;
  markedForDeletion: boolean;
  rotation: number;
}

export type PowerUpType = 'shield' | 'magnet' | 'double' | 'slow';

export interface PowerUpState {
  shield: boolean;
  magnet: boolean;
  double: boolean;
  slow: boolean;
}

export interface HighScoreEntry {
  name: string;
  score: number;
}

export interface PlayerState {
    x: number;
    y: number;
    vy: number;
    width: number;
    height: number;
    grounded: boolean;
    tricking: boolean;
    trickType: TrickType;
    angle: number;
    boardAngle: number;
    jumpCount: number;
    rampBoosted: boolean;
    grinding: boolean;
    flashCounter: number;
    crashed: boolean;
    crashTimer: number;
}