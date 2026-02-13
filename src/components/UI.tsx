import { motion, AnimatePresence } from 'framer-motion';
import { GameState } from '../game/types';
import { Play, RotateCcw, Zap, Hexagon, Wind, CircleDot, Headphones } from 'lucide-react';
import { useState, useEffect } from 'react';

interface UIProps {
  gameState: GameState;
  score: number;
  runesCollected: number;
  totalRunes: number;
  orbsCollected: number;
  lightLevel: number;
  onInit: () => void;
  onSkipLore: () => void;
  onStart: () => void;
  onRestart: () => void;
}

export const UI = ({ 
  gameState, 
  score, 
  runesCollected, 
  totalRunes, 
  orbsCollected, 
  lightLevel, 
  onInit,
  onSkipLore,
  onStart, 
  onRestart 
}: UIProps) => {
  
  // Lore Text Logic
  const [loreIndex, setLoreIndex] = useState(0);
  const loreLines = [
    "The Void consumes all.",
    "Your spark is fading.",
    "Shadows hunger for the last light.",
    "Collect the Runes.",
    "Escape the Abyss."
  ];

  useEffect(() => {
    if (gameState === 'LORE') {
      const interval = setInterval(() => {
        setLoreIndex(prev => {
          if (prev < loreLines.length - 1) return prev + 1;
          // If finished, auto-skip after a delay
          setTimeout(onSkipLore, 2000);
          return prev;
        });
      }, 2500);
      return () => clearInterval(interval);
    } else {
      setLoreIndex(0);
    }
  }, [gameState, onSkipLore]);

  return (
    <>
      {/* HUD - Only visible when playing */}
      <AnimatePresence>
        {gameState === 'PLAYING' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none z-20"
          >
            {/* Left: Objectives */}
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                {/* Runes Tracker */}
                <div className="bg-slate-900/80 backdrop-blur border border-slate-700/50 p-3 rounded-xl shadow-lg flex items-center gap-3">
                  <div className="relative">
                    <Hexagon className="w-8 h-8 text-cyan-400 fill-cyan-950" />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-cyan-200">
                      {runesCollected}
                    </span>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold tracking-wider">RUNES</div>
                    <div className="text-cyan-100 font-mono font-bold leading-none">{runesCollected} / {totalRunes}</div>
                  </div>
                </div>

                {/* Orbs Tracker */}
                <div className="bg-slate-900/80 backdrop-blur border border-slate-700/50 p-3 rounded-xl shadow-lg flex items-center gap-3">
                  <div className="relative">
                    <CircleDot className="w-8 h-8 text-yellow-400 fill-yellow-950/50" />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-yellow-200">
                      {orbsCollected}
                    </span>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold tracking-wider">ORBS</div>
                    <div className="text-yellow-100 font-mono font-bold leading-none">{orbsCollected}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-900/80 backdrop-blur border border-slate-700/50 px-3 py-1.5 rounded-lg shadow-lg self-start">
                <span className="text-xs text-slate-400 font-mono">SCORE: {score.toString().padStart(5, '0')}</span>
              </div>
            </div>
            
            {/* Right: Light Bar */}
            <div className="flex flex-col items-end gap-1">
              <div className="w-72 h-8 bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-full p-1 shadow-lg relative overflow-hidden">
                <motion.div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                  initial={{ width: '100%' }}
                  animate={{ width: `${lightLevel}%` }}
                  transition={{ type: 'tween', ease: 'linear', duration: 0.2 }}
                />
                <div className="absolute inset-0 flex items-center justify-center gap-2 text-[10px] font-black tracking-widest text-white/90 drop-shadow-md">
                  <Zap className="w-3 h-3 fill-current" />
                  LIGHT INTEGRITY
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                <Wind className="w-3 h-3" />
                SPACE TO DASH
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INTRO SCREEN (Click to Start) */}
      <AnimatePresence>
        {gameState === 'INTRO' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center cursor-pointer"
            onClick={onInit}
          >
            <motion.div 
              animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="text-cyan-500 mb-8"
            >
              <Headphones className="w-16 h-16" />
            </motion.div>
            <h1 className="text-3xl font-bold tracking-[0.5em] text-slate-200 mb-4">LUMINA</h1>
            <p className="text-slate-500 font-mono text-sm animate-pulse">CLICK TO INITIALIZE SYSTEM</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LORE SCREEN */}
      <AnimatePresence>
        {gameState === 'LORE' && (
          <motion.div 
            className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1 } }}
          >
            <div className="max-w-2xl h-32 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={loreIndex}
                  initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                  transition={{ duration: 0.8 }}
                  className="text-2xl md:text-4xl font-light text-slate-200 tracking-wide font-serif italic"
                >
                  "{loreLines[loreIndex]}"
                </motion.p>
              </AnimatePresence>
            </div>
            
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              onClick={onSkipLore}
              className="absolute bottom-12 text-slate-600 text-xs hover:text-slate-400 transition-colors uppercase tracking-widest"
            >
              [ Skip Sequence ]
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menus (Main, Game Over, Victory) */}
      <AnimatePresence>
        {(gameState === 'MENU' || gameState === 'GAME_OVER' || gameState === 'VICTORY') && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm z-40">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-12 rounded-3xl shadow-2xl max-w-md text-center relative overflow-hidden ring-1 ring-white/10"
            >
              {/* Background Ambient Glow */}
              <div className="absolute -top-32 -left-32 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px]" />
              <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px]" />

              <div className="relative z-10">
                <h1 className="text-7xl font-black text-white mb-2 tracking-tighter drop-shadow-2xl">
                  LUMINA
                </h1>
                <div className="h-1 w-24 bg-gradient-to-r from-cyan-500 to-purple-500 mx-auto mb-6 rounded-full" />

                {gameState === 'GAME_OVER' && (
                  <div className="mb-8 animate-pulse">
                    <h2 className="text-2xl font-bold text-red-400 tracking-widest">SIGNAL LOST</h2>
                    <p className="text-slate-500 font-mono text-sm mt-2">FINAL SCORE: {score}</p>
                    <p className="text-slate-500 font-mono text-xs mt-1">ORBS COLLECTED: {orbsCollected}</p>
                  </div>
                )}

                {gameState === 'VICTORY' && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-green-400 tracking-widest">ESCAPE SUCCESSFUL</h2>
                    <p className="text-slate-500 font-mono text-sm mt-2">FINAL SCORE: {score}</p>
                  </div>
                )}

                {gameState === 'MENU' && (
                  <div className="text-left bg-slate-950/50 border border-slate-800 p-6 rounded-xl mb-8 space-y-3 text-sm text-slate-300">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1"><kbd className="kbd">W</kbd><kbd className="kbd">A</kbd><kbd className="kbd">S</kbd><kbd className="kbd">D</kbd></div>
                      <span className="text-slate-500">to move</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <kbd className="kbd w-16">SPACE</kbd>
                      <span className="text-slate-500">to dash</span>
                    </div>
                    <div className="h-px bg-slate-800 my-2" />
                    {/* FIXED: Changed <p> to <div> to avoid invalid nesting of div inside p */}
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_10px_#facc15]" /> Collect Orbs to survive</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" /> Find 3 Runes to exit</div>
                  </div>
                )}

                <button
                  onClick={gameState === 'MENU' ? onStart : onRestart}
                  className="group relative w-full py-4 bg-white text-slate-950 font-black text-lg rounded-xl overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-xl hover:shadow-cyan-500/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 via-white to-purple-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center justify-center gap-2">
                    {gameState === 'MENU' ? <Play className="w-5 h-5 fill-current" /> : <RotateCcw className="w-5 h-5" />}
                    {gameState === 'MENU' ? 'ENTER ABYSS' : 'RETRY'}
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
