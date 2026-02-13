import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Player, Wall, Shadow, Collectible, Particle, FloatingText } from './types';
import { generateLevel } from './levels';
import { checkCollision } from '../lib/utils';
import { UI } from '../components/UI';
import { audio } from './audio';

export const LuminaGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  // Start in INTRO to require user interaction for AudioContext
  const [gameState, setGameState] = useState<GameState>('INTRO');
  const [score, setScore] = useState(0);
  const [runes, setRunes] = useState(0);
  const [orbs, setOrbs] = useState(0);
  const [lightLevel, setLightLevel] = useState(100);

  // Game State Refs
  const playerRef = useRef<Player>({
    x: 100, y: 100, width: 20, height: 20,
    vx: 0, vy: 0, speed: 4,
    lightRadius: 150, baseLightRadius: 150, maxLightRadius: 280,
    dashCooldown: 0, isDashing: false
  });
  
  const keysRef = useRef<Set<string>>(new Set());
  const levelRef = useRef<{
    walls: Wall[];
    shadows: Shadow[];
    collectibles: Collectible[];
    width: number;
    height: number;
  }>({ walls: [], shadows: [], collectibles: [], width: 0, height: 0 });

  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const screenShakeRef = useRef<number>(0);

  // --- Helpers ---
  const addScreenShake = (amount: number) => {
    screenShakeRef.current = amount;
  };

  const addFloatingText = (x: number, y: number, text: string, color: string) => {
    floatingTextsRef.current.push({
      x, y, text, color,
      life: 1.0,
      vy: -1.5
    });
  };

  const createExplosion = (x: number, y: number, color: string, count: number = 10) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0,
        color: color,
        size: Math.random() * 3 + 1,
        decay: Math.random() * 0.03 + 0.01
      });
    }
  };

  // --- Input ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase());
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // --- Flow Control ---
  const initSystem = useCallback(async () => {
    await audio.init();
    setGameState('LORE');
  }, []);

  const skipLore = useCallback(() => {
    setGameState('MENU');
    // Generate initial level for background visualization
    levelRef.current = generateLevel(1);
  }, []);

  const startGame = useCallback(() => {
    const levelData = generateLevel(1);
    levelRef.current = levelData;
    playerRef.current = {
      x: 100, y: 100, width: 20, height: 20,
      vx: 0, vy: 0, speed: 4,
      lightRadius: 150, baseLightRadius: 150, maxLightRadius: 280,
      dashCooldown: 0, isDashing: false
    };
    particlesRef.current = [];
    floatingTextsRef.current = [];
    screenShakeRef.current = 0;
    setScore(0);
    setRunes(0);
    setOrbs(0);
    setLightLevel(100);
    setGameState('PLAYING');
  }, []);

  const update = useCallback(() => {
    // We can run updates in MENU too for background effects, but logic is different
    if (gameState !== 'PLAYING') return;

    const player = playerRef.current;
    const { walls, shadows, collectibles, width, height } = levelRef.current;
    const keys = keysRef.current;

    // 1. Player Movement & Dash
    let currentSpeed = player.speed;
    
    // Dash Logic
    if (player.dashCooldown > 0) player.dashCooldown--;
    if (keys.has(' ') && player.dashCooldown <= 0) {
      player.isDashing = true;
      player.dashCooldown = 40; // Cooldown frames
      currentSpeed = 12; // Dash speed
      addScreenShake(3);
      createExplosion(player.x + player.width/2, player.y + player.height/2, '#22d3ee', 5);
      audio.playDashSound();
    } else {
      player.isDashing = false;
    }
    
    // Decaying speed if dashing
    if (player.dashCooldown > 30) currentSpeed = 10;

    player.vx = 0;
    player.vy = 0;
    if (keys.has('w') || keys.has('arrowup')) player.vy = -currentSpeed;
    if (keys.has('s') || keys.has('arrowdown')) player.vy = currentSpeed;
    if (keys.has('a') || keys.has('arrowleft')) player.vx = -currentSpeed;
    if (keys.has('d') || keys.has('arrowright')) player.vx = currentSpeed;

    if (player.vx !== 0 && player.vy !== 0) {
      player.vx *= 0.707;
      player.vy *= 0.707;
    }

    // Movement trails
    if (Math.random() < 0.3 || player.isDashing) {
      particlesRef.current.push({
        x: player.x + player.width/2 + (Math.random() - 0.5) * 10,
        y: player.y + player.height/2 + (Math.random() - 0.5) * 10,
        vx: 0, vy: 0,
        life: 1.0, maxLife: 1.0,
        color: 'rgba(34, 211, 238, 0.5)',
        size: Math.random() * 2 + 1,
        decay: 0.05
      });
    }

    // Collision
    const nextX = player.x + player.vx;
    const nextY = player.y + player.vy;

    let collidedX = false;
    if (nextX < 0 || nextX + player.width > width) collidedX = true;
    for (const wall of walls) {
      if (checkCollision({ ...player, x: nextX }, wall)) { collidedX = true; break; }
    }
    if (!collidedX) player.x = nextX;

    let collidedY = false;
    if (nextY < 0 || nextY + player.height > height) collidedY = true;
    for (const wall of walls) {
      if (checkCollision({ ...player, y: nextY }, wall)) { collidedY = true; break; }
    }
    if (!collidedY) player.y = nextY;

    // 2. Light Logic (Flicker & Decay)
    const flicker = Math.sin(Date.now() / 100) * 2 + (Math.random() - 0.5) * 5;
    player.lightRadius = Math.max(0, player.baseLightRadius + flicker);
    
    player.baseLightRadius -= 0.08; // Slow decay
    if (player.baseLightRadius < 20) {
      setGameState('GAME_OVER');
      return;
    }
    setLightLevel((player.baseLightRadius / player.maxLightRadius) * 100);

    // 3. Shadows (AI)
    for (const shadow of shadows) {
      if (!shadow.active) continue;

      const dx = (player.x + player.width/2) - (shadow.x + shadow.width/2);
      const dy = (player.y + player.height/2) - (shadow.y + shadow.height/2);
      const dist = Math.sqrt(dx*dx + dy*dy);

      // Chase
      if (dist < player.lightRadius + 150) {
        shadow.angle = Math.atan2(dy, dx);
        shadow.x += Math.cos(shadow.angle) * shadow.speed;
        shadow.y += Math.sin(shadow.angle) * shadow.speed;
        
        // Shadow trails
        if (Math.random() < 0.2) {
          particlesRef.current.push({
            x: shadow.x + shadow.width/2,
            y: shadow.y + shadow.height/2,
            vx: (Math.random() - 0.5),
            vy: (Math.random() - 0.5),
            life: 1.0, maxLife: 1.0,
            color: 'rgba(239, 68, 68, 0.3)', // Red smoke
            size: Math.random() * 4 + 2,
            decay: 0.02
          });
        }
      } else {
        // Idle
        shadow.x += Math.sin(Date.now() / 500) * 0.5;
        shadow.y += Math.cos(Date.now() / 500) * 0.5;
      }

      if (checkCollision(player, shadow) && !player.isDashing) {
        setGameState('GAME_OVER');
        addScreenShake(20);
        return;
      }
    }

    // 4. Collectibles
    for (const item of collectibles) {
      if (item.collected) continue;
      if (checkCollision(player, item)) {
        if (item.type === 'orb') {
          item.collected = true;
          player.baseLightRadius = Math.min(player.baseLightRadius + 60, player.maxLightRadius);
          setScore(s => s + 100);
          setOrbs(o => o + 1);
          createExplosion(item.x + item.width/2, item.y + item.height/2, '#fcd34d', 15);
          addFloatingText(item.x, item.y, "+LIGHT", "#fcd34d");
          addScreenShake(2);
          audio.playPickupSound('orb');
        } else if (item.type === 'rune') {
          item.collected = true;
          setRunes(r => r + 1);
          setScore(s => s + 500);
          createExplosion(item.x + item.width/2, item.y + item.height/2, '#22d3ee', 20);
          addFloatingText(item.x, item.y, "+RUNE", "#22d3ee");
          addScreenShake(5);
          audio.playPickupSound('rune');
        } else if (item.type === 'portal') {
          const runesCount = collectibles.filter(c => c.type === 'rune' && c.collected).length;
          if (runesCount >= 3) {
            setGameState('VICTORY');
            return;
          }
        }
      }
    }

    // 5. Particles Update
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) particlesRef.current.splice(i, 1);
    }

    // 6. Floating Text Update
    for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y += ft.vy;
        ft.life -= 0.02;
        if (ft.life <= 0) floatingTextsRef.current.splice(i, 1);
    }

    // 7. Screen Shake Decay
    if (screenShakeRef.current > 0) {
      screenShakeRef.current *= 0.9; // Decay
      if (screenShakeRef.current < 0.5) screenShakeRef.current = 0;
    }

  }, [gameState]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const player = playerRef.current;
    const { walls, shadows, collectibles } = levelRef.current;

    // Apply Screen Shake
    ctx.save();
    if (screenShakeRef.current > 0) {
      const dx = (Math.random() - 0.5) * screenShakeRef.current;
      const dy = (Math.random() - 0.5) * screenShakeRef.current;
      ctx.translate(dx, dy);
    }

    // 1. Background
    ctx.fillStyle = '#020617'; // Slate-950
    ctx.fillRect(0, 0, width, height);
    
    // Grid pattern
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const gridSize = 40;
    for(let x=0; x<width; x+=gridSize) { ctx.moveTo(x,0); ctx.lineTo(x,height); }
    for(let y=0; y<height; y+=gridSize) { ctx.moveTo(0,y); ctx.lineTo(width,y); }
    ctx.stroke();

    // 2. Walls (with bevel)
    walls.forEach(w => {
      ctx.fillStyle = '#1e293b'; // Base
      ctx.fillRect(w.x, w.y, w.width, w.height);
      ctx.fillStyle = '#334155';
      ctx.fillRect(w.x, w.y, w.width, 4);
      ctx.fillRect(w.x, w.y, 4, w.height);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(w.x, w.y + w.height - 4, w.width, 4);
      ctx.fillRect(w.x + w.width - 4, w.y, 4, w.height);
    });

    // 3. Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // 4. Collectibles
    const time = Date.now() / 200;
    collectibles.forEach(c => {
      if (c.collected) return;
      const pulse = Math.sin(time + c.pulseOffset) * 3;
      
      if (c.type === 'orb') {
        ctx.fillStyle = '#fcd34d';
        ctx.shadowColor = '#fcd34d';
        ctx.shadowBlur = 20 + pulse;
        ctx.beginPath();
        ctx.arc(c.x + c.width/2, c.y + c.height/2, 5, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (c.type === 'rune') {
        ctx.fillStyle = '#22d3ee';
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 25 + pulse;
        ctx.beginPath();
        const cx = c.x + c.width/2;
        const cy = c.y + c.height/2;
        const r = 12;
        for(let i=0; i<6; i++) {
            const ang = i * Math.PI/3 + (time/5); // Spin
            ctx.lineTo(cx + Math.cos(ang)*r, cy + Math.sin(ang)*r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (c.type === 'portal') {
        const runesCount = collectibles.filter(i => i.type === 'rune' && i.collected).length;
        const isOpen = runesCount >= 3;
        
        ctx.save();
        ctx.translate(c.x + c.width/2, c.y + c.height/2);
        if (isOpen) {
            ctx.rotate(time/2);
            ctx.fillStyle = '#a855f7';
            ctx.shadowColor = '#d8b4fe';
            ctx.shadowBlur = 40;
            ctx.fillRect(-25, -25, 50, 50);
        } else {
            ctx.fillStyle = '#334155';
            ctx.fillRect(-20, -20, 40, 40);
            ctx.strokeStyle = '#475569';
            ctx.strokeRect(-20, -20, 40, 40);
        }
        ctx.restore();
      }
    });

    // 5. Shadows
    shadows.forEach(s => {
      if (!s.active) return;
      ctx.save();
      ctx.translate(s.x + s.width/2, s.y + s.height/2);
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI*2);
      ctx.fill();
      const lookX = Math.cos(s.angle || 0) * 5;
      const lookY = Math.sin(s.angle || 0) * 5;
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(lookX - 4, lookY - 2, 3, 0, Math.PI*2);
      ctx.arc(lookX + 4, lookY - 2, 3, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    });

    // 6. Player
    ctx.save();
    ctx.translate(player.x + player.width/2, player.y + player.height/2);
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#ccfbf1';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    // 7. Floating Text
    floatingTextsRef.current.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = ft.life;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
    });
    ctx.globalAlpha = 1.0;

    ctx.restore();

    // 8. LIGHTING / FOG OF WAR
    // Only draw the darkness if we are in PLAYING state or MENU (to show background)
    // In INTRO/LORE, the UI covers it, but we can draw it anyway for consistency
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    
    let shakeX = 0, shakeY = 0;
    if (screenShakeRef.current > 0) {
        shakeX = (Math.random() - 0.5) * screenShakeRef.current;
        shakeY = (Math.random() - 0.5) * screenShakeRef.current;
    }
    const px = player.x + player.width/2 + shakeX;
    const py = player.y + player.height/2 + shakeY;
    
    // In MENU, player has light. In LORE, maybe it's dark?
    // Let's keep the light logic consistent
    ctx.arc(px, py, player.lightRadius, 0, Math.PI*2, true);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.96)';
    ctx.fill();

    const gradient = ctx.createRadialGradient(px, py, player.lightRadius * 0.85, px, py, player.lightRadius);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.96)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(px, py, player.lightRadius, 0, Math.PI*2);
    ctx.fill();

    // Scanlines
    const scanGradient = ctx.createLinearGradient(0, 0, 0, height);
    scanGradient.addColorStop(0, 'rgba(0,0,0,0.1)');
    scanGradient.addColorStop(0.5, 'rgba(0,0,0,0)');
    scanGradient.addColorStop(1, 'rgba(0,0,0,0.1)');
    ctx.fillStyle = scanGradient;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();

  }, []);

  // Loop
  useEffect(() => {
    const loop = () => {
      update();
      draw();
      requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [update, draw]);

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden flex items-center justify-center">
      <div className="relative border-4 border-slate-800 rounded-lg shadow-2xl overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          className="block bg-slate-900"
          style={{ maxWidth: '100vw', maxHeight: '100vh' }}
        />
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] opacity-20" />
      </div>
      
      <UI 
        gameState={gameState} 
        score={score}
        runesCollected={runes}
        totalRunes={3}
        orbsCollected={orbs}
        lightLevel={lightLevel}
        onInit={initSystem}
        onSkipLore={skipLore}
        onStart={startGame}
        onRestart={startGame}
      />
    </div>
  );
};
