import { Wall, Collectible, Shadow } from './types';

// Simple level generator
export const generateLevel = (levelIndex: number) => {
  const walls: Wall[] = [];
  const shadows: Shadow[] = [];
  const collectibles: Collectible[] = [];
  
  // World bounds
  const width = 1200;
  const height = 800;
  
  // Border Walls
  walls.push({ x: 0, y: 0, width: width, height: 20, color: '#334155' }); // Top
  walls.push({ x: 0, y: height - 20, width: width, height: 20, color: '#334155' }); // Bottom
  walls.push({ x: 0, y: 0, width: 20, height: height, color: '#334155' }); // Left
  walls.push({ x: width - 20, y: 0, width: 20, height: height, color: '#334155' }); // Right

  // Procedural-ish Obstacles
  const numObstacles = 10 + levelIndex * 3;
  for (let i = 0; i < numObstacles; i++) {
    walls.push({
      x: Math.random() * (width - 100) + 50,
      y: Math.random() * (height - 100) + 50,
      width: Math.random() * 100 + 40,
      height: Math.random() * 100 + 40,
      color: '#1e293b'
    });
  }

  // Shadows (Enemies)
  const numShadows = 3 + levelIndex;
  for (let i = 0; i < numShadows; i++) {
    shadows.push({
      x: Math.random() * (width - 200) + 100,
      y: Math.random() * (height - 200) + 100,
      width: 30,
      height: 30,
      vx: 1,
      vy: 1,
      speed: 1.5 + (levelIndex * 0.2),
      active: true
    });
  }

  // Light Orbs (Health)
  for (let i = 0; i < 5; i++) {
    collectibles.push({
      x: Math.random() * (width - 100) + 50,
      y: Math.random() * (height - 100) + 50,
      width: 15,
      height: 15,
      type: 'orb',
      collected: false,
      pulseOffset: Math.random() * 100
    });
  }

  // Runes (Objective)
  const runesNeeded = 3;
  for (let i = 0; i < runesNeeded; i++) {
    collectibles.push({
      x: Math.random() * (width - 100) + 50,
      y: Math.random() * (height - 100) + 50,
      width: 20,
      height: 20,
      type: 'rune',
      collected: false,
      pulseOffset: Math.random() * 100
    });
  }

  // Portal (Exit - initially hidden/inactive logic handled in game loop)
  collectibles.push({
    x: width - 100,
    y: height - 100,
    width: 60,
    height: 60,
    type: 'portal',
    collected: false,
    pulseOffset: 0
  });

  return { walls, shadows, collectibles, width, height };
};
