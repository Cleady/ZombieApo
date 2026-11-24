import React from 'react';
import { ArrowUpCircle, Wrench, DollarSign, X } from 'lucide-react';
import { Building } from '../../game/entities/Building';
import { Camera } from '../../game/systems/Camera';
import type { Resources } from '../../game/types';

interface BuildingCardProps {
  building: Building;
  camera: Camera;
  resources: Resources;
  stashTier: number;
  onUpgrade: (b: Building) => void;
  onRepair: (b: Building) => void;
  onSell: (b: Building) => void;
  onClose: () => void;
}

export const BuildingCard: React.FC<BuildingCardProps> = ({
  building,
  camera,
  resources,
  stashTier,
  onUpgrade,
  onRepair,
  onSell,
  onClose,
}) => {
  const screenPos = camera.worldToScreen(building.x, building.y);
  const nextStats = building.getNextTierStats();
  const refund = building.getSellRefund();

  // Tier cap check
  const isCappedByStash = building.type !== 'goldStash' && building.tier >= stashTier;

  const canAffordUpgrade =
    nextStats &&
    !isCappedByStash &&
    resources.wood >= nextStats.cost.wood &&
    resources.stone >= nextStats.cost.stone &&
    resources.gold >= nextStats.cost.gold;

  const hpPercent = (building.hp / building.maxHp) * 100;
  const isFullHp = building.hp >= building.maxHp;

  // Format building display name
  const nameMap: Record<string, string> = {
    goldStash: 'Gold Stash',
    wall: 'Fortified Wall',
    door: 'Reinforced Door',
    goldMine: 'Gold Mine',
    arrowTower: 'Arrow Tower',
    cannonTower: 'Cannon Tower',
    bombTower: 'Bomb Tower',
    mageTower: 'Mage Tower',
  };

  return (
    <div
      className="absolute z-30 pointer-events-auto transform -translate-x-1/2 -translate-y-full mb-8"
      style={{
        left: `${screenPos.x}px`,
        top: `${screenPos.y - 32}px`,
      }}
    >
      <div className="w-64 bg-slate-900/95 backdrop-blur-md rounded-2xl border-2 border-slate-700/80 p-3 shadow-2xl animate-fade-in text-white">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm text-sky-400">
              {nameMap[building.type] || building.type}
            </span>
            <span className="bg-amber-400/20 text-amber-300 font-mono font-black text-[10px] px-1.5 py-0.5 rounded-full border border-amber-400/30">
              T{building.tier}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-0.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* HP Bar */}
        <div className="py-2">
          <div className="flex justify-between text-[10px] font-bold text-slate-300 mb-1">
            <span>Structure Integrity</span>
            <span className="font-mono">{building.hp} / {building.maxHp}</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all ${
                hpPercent > 50 ? 'bg-emerald-400' : hpPercent > 25 ? 'bg-amber-400' : 'bg-red-500'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-1.5 pt-1">
          {/* Upgrade Button */}
          {nextStats ? (
            <button
              onClick={() => onUpgrade(building)}
              disabled={!canAffordUpgrade}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                canAffordUpgrade
                  ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 hover:bg-amber-500/30 active:scale-95'
                  : 'bg-slate-800/40 border-slate-700/50 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <ArrowUpCircle className="w-4 h-4 text-amber-400" />
                <span>Upgrade [E]</span>
              </div>
              <div className="text-[10px] font-mono text-amber-200">
                {isCappedByStash ? (
                  <span className="text-red-400">Needs Stash T{building.tier + 1}</span>
                ) : (
                  <span>
                    {nextStats.cost.wood}W {nextStats.cost.stone}S {nextStats.cost.gold}G
                  </span>
                )}
              </div>
            </button>
          ) : (
            <div className="text-center text-[11px] font-bold text-emerald-400 bg-emerald-950/40 py-1 rounded-xl border border-emerald-800/40">
              Max Tier Reached!
            </div>
          )}

          {/* Repair Button */}
          <button
            onClick={() => onRepair(building)}
            disabled={isFullHp}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              !isFullHp
                ? 'bg-emerald-500/20 border-emerald-500/80 text-emerald-300 hover:bg-emerald-500/30 active:scale-95'
                : 'bg-slate-800/40 border-slate-700/50 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-emerald-400" />
              <span>Repair [R]</span>
            </div>
            <span className="text-[10px] text-slate-400">
              {isFullHp ? 'Full HP' : 'Fix with Wood/Stone'}
            </span>
          </button>

          {/* Sell Button */}
          <button
            onClick={() => onSell(building)}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-xl border border-rose-500/60 bg-rose-950/30 text-rose-300 text-xs font-bold hover:bg-rose-900/40 active:scale-95 transition-all"
          >
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-rose-400" />
              <span>Sell (50% Refund)</span>
            </div>
            <span className="text-[10px] font-mono text-rose-200">
              +{refund.wood}W +{refund.stone}S +{refund.gold}G
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
