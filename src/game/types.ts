export type Point = { x: number; y: number };

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Player extends Entity {
  vx: number;
  vy: number;
  speed: number;
  lightRadius: number;
  baseLightRadius: number; // For flickering reference
  maxLightRadius: number;
  dashCooldown: number;
  isDashing: boolean;
}

export interface Wall extends Entity {
  color: string;
}

export interface Shadow extends Entity {
  vx: number;
  vy: number;
  speed: number;
  active: boolean;
  angle: number; // For facing direction
}

export interface Collectible extends Entity {
  type: 'orb' | 'rune' | 'portal';
  collected: boolean;
  pulseOffset: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  decay: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
}

// Added 'INTRO' and 'LORE' states
export type GameState = 'INTRO' | 'LORE' | 'MENU' | 'PLAYING' | 'GAME_OVER' | 'VICTORY';
