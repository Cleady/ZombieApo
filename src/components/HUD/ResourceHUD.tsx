import React from 'react';
import { Trees, Mountain, Coins, Heart, Shield, ShoppingBag, FlaskConical, Award } from 'lucide-react';
import type { UIState } from '../../game/GameEngine';

interface ResourceHUDProps {
  uiState: UIState;
  onOpenShop: () => void;
  onUsePotion: () => void;
}

export const ResourceHUD: React.FC<ResourceHUDProps> = ({ uiState, onOpenShop, onUsePotion }) => {
  const { resources, health, maxHealth, shield, maxShield, potionsCount, gameStats } = uiState;

  const hpPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const shieldPercent = maxShield > 0 ? Math.max(0, Math.min(100, (shield / maxShield) * 100)) : 0;

  return (
    <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2.5 z-20 pointer-events-auto">
      {/* Resource Cards Bar */}
      <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700/80 shadow-2xl">
        {/* Wood */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-amber-950/40 border border-amber-800/40">
          <Trees className="w-4 h-4 text-amber-500" />
          <span className="font-mono font-bold text-amber-300 text-sm">
            {resources.wood.toLocaleString()}
          </span>
        </div>

        {/* Stone */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <Mountain className="w-4 h-4 text-slate-400" />
          <span className="font-mono font-bold text-slate-200 text-sm">
            {resources.stone.toLocaleString()}
          </span>
        </div>

        {/* Gold */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-yellow-950/40 border border-yellow-700/40">
          <Coins className="w-4 h-4 text-yellow-400 animate-pulse" />
          <span className="font-mono font-bold text-yellow-300 text-sm">
            {resources.gold.toLocaleString()}
          </span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-indigo-950/40 border border-indigo-800/40">
          <Award className="w-4 h-4 text-indigo-400" />
          <span className="font-mono font-bold text-indigo-200 text-sm">
            {gameStats.score.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Player HP, Shield, Potion & Shop Controls */}
      <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md p-3 rounded-2xl border border-slate-700/80 shadow-2xl">
        {/* Health & Shield Bars */}
        <div className="flex flex-col gap-1.5 w-44">
          {/* Health Bar */}
          <div>
            <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-300 mb-0.5">
              <span className="flex items-center gap-1 text-red-400">
                <Heart className="w-3 h-3 fill-red-500 text-red-500" /> HP
              </span>
              <span className="font-mono">{health} / {maxHealth}</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-emerald-500 transition-all duration-150"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Shield Bar (if unlocked) */}
          {maxShield > 0 && (
            <div>
              <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-300 mb-0.5">
                <span className="flex items-center gap-1 text-cyan-400">
                  <Shield className="w-3 h-3 fill-cyan-500 text-cyan-500" /> SHIELD
                </span>
                <span className="font-mono">{shield} / {maxShield}</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
                <div
                  className="h-full bg-cyan-400 transition-all duration-150"
                  style={{ width: `${shieldPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Potion Button [F] */}
        <button
          onClick={onUsePotion}
          disabled={potionsCount <= 0 || health >= maxHealth}
          className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-xl border transition-all ${
            potionsCount > 0 && health < maxHealth
              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-800/50 border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
          }`}
          title="Drink Potion [F] - Heals 50 HP"
        >
          <FlaskConical className="w-5 h-5" />
          <span className="text-[9px] font-bold">[F]</span>
          <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-full">
            {potionsCount}
          </span>
        </button>

        {/* Shop Button [B] */}
        <button
          onClick={onOpenShop}
          className="flex flex-col items-center justify-center w-14 h-12 rounded-xl border border-amber-500/80 bg-gradient-to-b from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-95 transition-all"
        >
          <ShoppingBag className="w-5 h-5 text-slate-950" />
          <span className="text-[10px] uppercase tracking-wider font-extrabold">SHOP [B]</span>
        </button>
      </div>
    </div>
  );
};
