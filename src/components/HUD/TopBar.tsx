import React from 'react';
import { Sun, Moon, Skull, ShieldAlert } from 'lucide-react';
import type { UIState } from '../../game/GameEngine';

interface TopBarProps {
  uiState: UIState;
}

export const TopBar: React.FC<TopBarProps> = ({ uiState }) => {
  const { wave, phase, phaseTimer, phaseProgress, activeZombieCount, isBossWave, bossHp, bossMaxHp } = uiState;

  const isDay = phase === 'day';
  const isSunset = phase === 'sunset';
  const isNight = phase === 'night';
  const isPeaceful = phase === 'peaceful';

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-20">
      {/* Boss Health Bar if Boss Wave and Boss Alive */}
      {isBossWave && bossMaxHp > 0 && bossHp > 0 && (
        <div className="w-80 sm:w-96 mb-2 bg-slate-900/90 border-2 border-red-500/80 rounded-xl p-2 shadow-2xl backdrop-blur-md animate-pulse">
          <div className="flex justify-between items-center mb-1 text-xs font-bold text-red-400 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Skull className="w-4 h-4 text-red-500" />
              ANCIENT ZOMBIE TITAN
            </span>
            <span>{bossHp} / {bossMaxHp} HP</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-red-500 transition-all duration-150"
              style={{ width: `${Math.max(0, (bossHp / bossMaxHp) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Top Bar Card */}
      <div className="flex items-center gap-4 bg-slate-900/85 backdrop-blur-md px-6 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl">
        {/* Wave Indicator */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
          <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Survival</div>
            <div className="text-base font-black text-white leading-none">
              {isPeaceful ? 'PREP PHASE' : `WAVE ${wave}`}
            </div>
          </div>
        </div>

        {/* Phase and Timer Progress */}
        <div className="flex flex-col items-center min-w-[140px]">
          <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
            {isDay && (
              <>
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <span className="text-amber-300">DAY PHASE</span>
              </>
            )}
            {isSunset && (
              <>
                <Sun className="w-4 h-4 text-orange-500 animate-pulse" />
                <span className="text-orange-400">SUNSET (PREPARE!)</span>
              </>
            )}
            {isNight && (
              <>
                <Moon className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-cyan-300">NIGHT ATTACK</span>
              </>
            )}
            {isPeaceful && <span className="text-emerald-400">EXPLORATION</span>}
            {!isPeaceful && (
              <span className="text-slate-400 font-mono text-[11px] ml-1">({phaseTimer}s)</span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
            <div
              className={`h-full transition-all duration-200 ${
                isDay
                  ? 'bg-amber-400'
                  : isSunset
                  ? 'bg-orange-500'
                  : isNight
                  ? 'bg-cyan-500'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, phaseProgress * 100)}%` }}
            />
          </div>
        </div>

        {/* Zombies Remaining Counter (During Night) */}
        {isNight && (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-700">
            <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
              <Skull className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Horde</div>
              <div className="text-base font-black text-red-400 leading-none">
                {activeZombieCount} Left
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Guide notice when Gold Stash not yet placed */}
      {isPeaceful && (
        <div className="mt-2 text-xs font-bold text-amber-300 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/40 animate-pulse">
          Gather wood & stone, then press [5] to place your Gold Stash!
        </div>
      )}
    </div>
  );
};
