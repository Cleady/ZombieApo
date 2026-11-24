import React, { useState } from 'react';
import { X, Pickaxe, Shield, Crosshair, Bomb, Sparkles, FlaskConical, CheckCircle2 } from 'lucide-react';
import type { WeaponType } from '../../game/types';
import { WEAPON_STATS, SHIELD_TIERS, POTION_COST, POTION_HEAL_AMOUNT } from '../../game/constants';
import type { UIState } from '../../game/GameEngine';

interface ShopModalProps {
  uiState: UIState;
  isOpen: boolean;
  onClose: () => void;
  onUpgradeWeapon: (type: WeaponType) => void;
  onUpgradeShield: () => void;
  onBuyPotion: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  uiState,
  isOpen,
  onClose,
  onUpgradeWeapon,
  onUpgradeShield,
  onBuyPotion,
}) => {
  const [activeTab, setActiveTab] = useState<'weapons' | 'defense'>('weapons');
  const { resources, weaponTiers, shieldTier, potionsCount } = uiState;

  if (!isOpen) return null;

  const weaponList: { type: WeaponType; name: string; desc: string; icon: React.ElementType }[] = [
    {
      type: 'pickaxe',
      name: 'Mining Pickaxe',
      desc: 'Rapid harvesting tool & close melee defense. Higher tiers gather much more wood & stone per swing.',
      icon: Pickaxe,
    },
    {
      type: 'spear',
      name: 'Hunter Spear',
      desc: 'Piercing thrust weapon with extended reach & strong knockback against advancing zombie hordes.',
      icon: Shield,
    },
    {
      type: 'bow',
      name: 'Compound Bow',
      desc: 'Rapid ranged arrows allowing safe engagement of zombies from behind fortified perimeter walls.',
      icon: Crosshair,
    },
    {
      type: 'bomb',
      name: 'Catapult Bomb',
      desc: 'Devastating throwable explosive dealing heavy AoE splash damage to dense enemy clusters.',
      icon: Bomb,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              SURVIVOR ARSENAL & SHOP
            </h2>
            <p className="text-xs text-slate-400">Upgrade weapons, craft shields, and purchase battle supplies</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resource Banner */}
        <div className="flex items-center justify-end gap-3 py-2.5 px-4 my-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-xs font-mono font-bold">
          <span className="text-amber-400">Wood: {resources.wood}</span>
          <span className="text-slate-400">Stone: {resources.stone}</span>
          <span className="text-yellow-400 font-extrabold">Gold: {resources.gold}</span>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('weapons')}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
              activeTab === 'weapons'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/60 shadow-lg shadow-sky-500/10'
                : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 border border-slate-700/40'
            }`}
          >
            Weapons & Tools
          </button>
          <button
            onClick={() => setActiveTab('defense')}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
              activeTab === 'defense'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 border border-slate-700/40'
            }`}
          >
            Armor & Utility
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {activeTab === 'weapons' ? (
            weaponList.map((w) => {
              const currentTier = weaponTiers[w.type];
              const statsList = WEAPON_STATS[w.type];
              const isMax = currentTier >= statsList.length;
              const nextStats = !isMax ? statsList[currentTier] : null;
              const Icon = w.icon;

              const canAfford =
                nextStats &&
                resources.wood >= nextStats.cost.wood &&
                resources.stone >= nextStats.cost.stone &&
                resources.gold >= nextStats.cost.gold;

              return (
                <div
                  key={w.type}
                  className="flex items-center justify-between p-3.5 bg-slate-800/50 border border-slate-700/70 rounded-2xl hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sky-400">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white">{w.name}</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          {currentTier === 0 ? 'LOCKED' : `Tier ${currentTier}`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 max-w-md mt-0.5">{w.desc}</p>
                      {nextStats && (
                        <div className="text-[11px] text-sky-300 font-mono mt-1">
                          Next: Dmg {nextStats.damage} | Spd {nextStats.cooldown}s{' '}
                          {nextStats.harvestPower ? `| Harvest +${nextStats.harvestPower}` : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upgrade / Buy Button */}
                  <div>
                    {isMax ? (
                      <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" /> MAX
                      </div>
                    ) : (
                      <button
                        onClick={() => onUpgradeWeapon(w.type)}
                        disabled={!canAfford}
                        className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95'
                            : 'bg-slate-800/40 border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <span>{currentTier === 0 ? 'Unlock' : `Upgrade T${currentTier + 1}`}</span>
                        {nextStats && (
                          <span className="text-[10px] font-mono mt-0.5">
                            {nextStats.cost.wood}W {nextStats.cost.stone}S {nextStats.cost.gold}G
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <>
              {/* Zombie Energy Shield */}
              <div className="flex items-center justify-between p-3.5 bg-slate-800/50 border border-slate-700/70 rounded-2xl hover:border-slate-600 transition-all">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-400">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white">Zombie Kinetic Shield</span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                        {shieldTier === 0 ? 'LOCKED' : `Tier ${shieldTier}`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 max-w-md mt-0.5">
                      Absorbs incoming zombie damage before health is lost. Regenerates after 3 seconds without taking damage.
                    </p>
                    {shieldTier < SHIELD_TIERS.length && (
                      <div className="text-[11px] text-cyan-300 font-mono mt-1">
                        Next: Capacity {SHIELD_TIERS[shieldTier].maxShield} | Regen {SHIELD_TIERS[shieldTier].regenRate}/s
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  {shieldTier >= SHIELD_TIERS.length ? (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" /> MAX
                    </div>
                  ) : (
                    (() => {
                      const next = SHIELD_TIERS[shieldTier];
                      const canAfford =
                        resources.wood >= next.cost.wood &&
                        resources.stone >= next.cost.stone &&
                        resources.gold >= next.cost.gold;

                      return (
                        <button
                          onClick={onUpgradeShield}
                          disabled={!canAfford}
                          className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                            canAfford
                              ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 font-black shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95'
                              : 'bg-slate-800/40 border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <span>{shieldTier === 0 ? 'Synthesize' : `Upgrade T${shieldTier + 1}`}</span>
                          <span className="text-[10px] font-mono mt-0.5">
                            {next.cost.wood}W {next.cost.stone}S {next.cost.gold}G
                          </span>
                        </button>
                      );
                    })()
                  )}
                </div>
              </div>

              {/* Health Potion */}
              <div className="flex items-center justify-between p-3.5 bg-slate-800/50 border border-slate-700/70 rounded-2xl hover:border-slate-600 transition-all">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400">
                    <FlaskConical className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white">Revitalizing Health Potion</span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                        In Bag: {potionsCount}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 max-w-md mt-0.5">
                      Instantly restores {POTION_HEAL_AMOUNT} Health when used during battle. Bound to key [F].
                    </p>
                  </div>
                </div>

                <div>
                  <button
                    onClick={onBuyPotion}
                    disabled={resources.gold < POTION_COST.gold}
                    className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                      resources.gold >= POTION_COST.gold
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-black shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95'
                        : 'bg-slate-800/40 border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span>Buy Potion</span>
                    <span className="text-[10px] font-mono mt-0.5">{POTION_COST.gold} Gold</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
