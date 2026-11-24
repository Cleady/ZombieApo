import React from 'react';
import { Skull, RotateCcw, Trophy, Clock, Target, Award } from 'lucide-react';
import type { GameStats } from '../../game/types';

interface GameOverModalProps {
  isOpen: boolean;
  gameStats: GameStats;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ isOpen, gameStats, onRestart }) => {
  if (!isOpen) return null;

  const minutes = Math.floor(gameStats.timeSurvived / 60);
  const seconds = gameStats.timeSurvived % 60;
  const timeFormatted = `${minutes}m ${seconds.toString().padStart(2, '0')}s`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-red-500/80 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col items-center text-center">
        {/* Skull Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/50 flex items-center justify-center mb-4 text-red-400 shadow-lg shadow-red-500/20 animate-bounce">
          <Skull className="w-9 h-9" />
        </div>

        <h2 className="text-2xl font-black text-white tracking-wide mb-1">BASE DESTROYED</h2>
        <p className="text-xs text-slate-400 mb-6">The zombie horde breached your defenses</p>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col items-center">
            <Trophy className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[10px] uppercase font-bold text-slate-400">Wave Reached</span>
            <span className="text-xl font-black text-amber-400">Wave {gameStats.wave}</span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col items-center">
            <Target className="w-4 h-4 text-red-400 mb-1" />
            <span className="text-[10px] uppercase font-bold text-slate-400">Zombies Slain</span>
            <span className="text-xl font-black text-red-400">{gameStats.zombiesKilled}</span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col items-center">
            <Clock className="w-4 h-4 text-cyan-400 mb-1" />
            <span className="text-[10px] uppercase font-bold text-slate-400">Time Survived</span>
            <span className="text-lg font-black text-cyan-300 font-mono">{timeFormatted}</span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col items-center">
            <Award className="w-4 h-4 text-purple-400 mb-1" />
            <span className="text-[10px] uppercase font-bold text-slate-400">Final Score</span>
            <span className="text-xl font-black text-purple-300">{gameStats.score.toLocaleString()}</span>
          </div>
        </div>

        {/* Restart Button */}
        <button
          onClick={onRestart}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-red-500/25 active:scale-98 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
};
