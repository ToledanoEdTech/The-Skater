export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  SHOP = 'SHOP',
  LEADERBOARD = 'LEADERBOARD'
}

export type TrickType = 'none' | 'kickflip' | 'superman' | '360';
export type GadgetType = 'none' | 'rainbow_trail' | 'neon_board' | 'gold_chain' | 'fire_trail' | 'ice_board' | 'diamond_sparkles' | 'lightning_aura' | 'cosmic_wings' | 'neon_glow';

export interface CharacterConfig {
  id: string;
  name: string;
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  type: 'kippah' | 'hat';
  beard?: boolean;
  uniqueFeature?: 'glasses' | 'cap' | 'long_hair' | 'curly_hair' | 'bald' | 'mustache';
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
  type: 'bench' | 'bush' | 'dog' | 'cat' | 'ramp-kicker' | 'ramp-quarter' | 'ramp-vert' | 'rail' | 'fire-hydrant' | 'bench-1' | 'bench-2' | 'trash-can' | 'car';
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
    isCarryingLostObject?: boolean;
    carryingObjectType?: 'school_bag' | 'dubi' | 'book';
}

export type MissionType = 'collect_coins' | 'trick_combo' | 'crash_distance' | 'grind_distance' | 'survive_time' | 'ramp_jumps' | 'return_lost_objects';
export interface Mission {
    id: string;
    type: MissionType;
    description: string;
    target: number;
    progress: number;
    reward: number;
    completed: boolean;
}

export type StageType = 'haredi_neighborhood' | 'tel_aviv_promenade' | 'desert' | 'western_wall';
export interface Stage {
    type: StageType;
    name: string;
    distance: number; // Distance at which this stage starts
    color: string;
}

export type BossType = 'police_car' | 'rival_skater';
export interface Boss {
    id: number;
    type: BossType;
    x: number;
    y: number;
    w: number;
    h: number;
    speed: number;
    health: number;
    markedForDeletion: boolean;
    animFrame: number;
}

export interface LostObject {
    id: number;
    x: number;
    y: number;
    spriteType: 'school_bag' | 'dubi' | 'book'; // Types of lost objects
    markedForDeletion: boolean;
    rotation: number;
}

export type OwnerNPCState = 'waiting' | 'happy';

export interface OwnerNPC {
    id: number;
    x: number;
    y: number;
    w: number;
    h: number;
    state: OwnerNPCState;
    markedForDeletion: boolean;
}