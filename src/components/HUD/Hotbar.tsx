import React from 'react';
import { Pickaxe, Shield, Crosshair, Bomb, Castle, DoorClosed, Coins, Target, Flame, Sparkles } from 'lucide-react';
import type { BuildingType, WeaponType } from '../../game/types';
import { BUILDING_STATS } from '../../game/constants';
import type { UIState } from '../../game/GameEngine';

interface HotbarProps {
  uiState: UIState;
  onSelectWeapon: (weapon: WeaponType) => void;
  onSelectBuilding: (type: BuildingType) => void;
}

export const Hotbar: React.FC<HotbarProps> = ({ uiState, onSelectWeapon, onSelectBuilding }) => {
  const { resources, placementType, selectedWeapon, weaponTiers } = uiState;

  // Check if player has placed Gold Stash
  const hasStash = (weaponTiers.pickaxe > 0 && uiState.phase !== 'peaceful') || false;

  const hotbarItems = [
    {
      slot: 1,
      type: 'weapon' as const,
      weaponType: 'pickaxe' as WeaponType,
      label: 'Pickaxe',
      tier: weaponTiers.pickaxe,
      icon: Pickaxe,
      isUnlocked: weaponTiers.pickaxe > 0,
      isSelected: selectedWeapon === 'pickaxe' && !placementType,
    },
    {
      slot: 2,
      type: 'weapon' as const,
      weaponType: 'spear' as WeaponType,
      label: 'Spear',
      tier: weaponTiers.spear,
      icon: Shield,
      isUnlocked: weaponTiers.spear > 0,
      isSelected: selectedWeapon === 'spear' && !placementType,
    },
    {
      slot: 3,
      type: 'weapon' as const,
      weaponType: 'bow' as WeaponType,
      label: 'Bow',
      tier: weaponTiers.bow,
      icon: Crosshair,
      isUnlocked: weaponTiers.bow > 0,
      isSelected: selectedWeapon === 'bow' && !placementType,
    },
    {
      slot: 4,
      type: 'weapon' as const,
      weaponType: 'bomb' as WeaponType,
      label: 'Bomb',
      tier: weaponTiers.bomb,
      icon: Bomb,
      isUnlocked: weaponTiers.bomb > 0,
      isSelected: selectedWeapon === 'bomb' && !placementType,
    },
    // Buildings
    {
      slot: 5,
      type: 'building' as const,
      buildingType: (hasStash ? 'wall' : 'goldStash') as BuildingType,
      label: hasStash ? 'Wall' : 'Gold Stash',
      cost: hasStash ? BUILDING_STATS.wall[0].cost : BUILDING_STATS.goldStash[0].cost,
      icon: Castle,
      isSelected: placementType === (hasStash ? 'wall' : 'goldStash'),
    },
    {
      slot: 6,
      type: 'building' as const,
      buildingType: 'door' as BuildingType,
      label: 'Door',
      cost: BUILDING_STATS.door[0].cost,
      icon: DoorClosed,
      isSelected: placementType === 'door',
    },
    {
      slot: 7,
      type: 'building' as const,
      buildingType: 'goldMine' as BuildingType,
      label: 'Gold Mine',
      cost: BUILDING_STATS.goldMine[0].cost,
      icon: Coins,
      isSelected: placementType === 'goldMine',
    },
    {
      slot: 8,
      type: 'building' as const,
      buildingType: 'arrowTower' as BuildingType,
      label: 'Arrow Twr',
      cost: BUILDING_STATS.arrowTower[0].cost,
      icon: Target,
      isSelected: placementType === 'arrowTower',
    },
    {
      slot: 9,
      type: 'building' as const,
      buildingType: 'cannonTower' as BuildingType,
      label: 'Cannon Twr',
      cost: BUILDING_STATS.cannonTower[0].cost,
      icon: Flame,
      isSelected: placementType === 'cannonTower',
    },
  ];

  // Extra tier-8 towers (Bomb Tower, Mage Tower)
  const extraBuildings = [
    {
      buildingType: 'bombTower' as BuildingType,
      label: 'Bomb Twr',
      cost: BUILDING_STATS.bombTower[0].cost,
      icon: Bomb,
      isSelected: placementType === 'bombTower',
    },
    {
      buildingType: 'mageTower' as BuildingType,
      label: 'Mage Twr',
      cost: BUILDING_STATS.mageTower[0].cost,
      icon: Sparkles,
      isSelected: placementType === 'mageTower',
    },
  ];

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-20 pointer-events-auto">
      {/* Top mini-bar for Bomb & Mage Towers */}
      <div className="flex items-center gap-2">
        {extraBuildings.map((b) => {
          const Icon = b.icon;
          const canAfford =
            resources.wood >= b.cost.wood &&
            resources.stone >= b.cost.stone &&
            resources.gold >= b.cost.gold;

          return (
            <button
              key={b.buildingType}
              onClick={() => onSelectBuilding(b.buildingType)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-lg backdrop-blur-md ${
                b.isSelected
                  ? 'bg-sky-500/30 border-sky-400 text-white shadow-sky-500/20 scale-105'
                  : canAfford
                  ? 'bg-slate-900/80 border-slate-700/80 text-slate-200 hover:border-slate-500'
                  : 'bg-slate-950/60 border-slate-800 text-slate-500 opacity-60'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-purple-400" />
              <span>{b.label}</span>
              <span className="text-[10px] text-amber-300 font-mono">
                {b.cost.wood}W {b.cost.stone}S {b.cost.gold}G
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Hotbar Slots 1-9 */}
      <div className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md p-2 rounded-2xl border border-slate-700/80 shadow-2xl">
        {hotbarItems.map((item) => {
          const Icon = item.icon;
          const isWeapon = item.type === 'weapon';

          let canAfford = true;
          if (!isWeapon && item.cost) {
            canAfford =
              resources.wood >= item.cost.wood &&
              resources.stone >= item.cost.stone &&
              resources.gold >= item.cost.gold;
          }

          const isLockedWeapon = isWeapon && !item.isUnlocked;

          return (
            <button
              key={item.slot}
              onClick={() => {
                if (isWeapon) {
                  if (item.weaponType) onSelectWeapon(item.weaponType);
                } else if (item.buildingType) {
                  onSelectBuilding(item.buildingType);
                }
              }}
              disabled={isLockedWeapon}
              className={`relative flex flex-col items-center justify-between w-14 h-16 p-1.5 rounded-xl border transition-all ${
                item.isSelected
                  ? 'bg-sky-500/25 border-sky-400 text-white shadow-lg shadow-sky-500/30 -translate-y-1 scale-105'
                  : isLockedWeapon
                  ? 'bg-slate-950/40 border-slate-800 text-slate-600 cursor-not-allowed'
                  : canAfford
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                  : 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-70'
              }`}
            >
              {/* Slot Number Badge */}
              <span className="absolute top-1 left-1.5 text-[10px] font-mono font-bold text-slate-400">
                {item.slot}
              </span>

              {/* Tier badge for weapons */}
              {isWeapon && item.isUnlocked && (
                <span className="absolute top-1 right-1.5 text-[9px] font-bold text-amber-400 font-mono">
                  T{item.tier}
                </span>
              )}

              {/* Icon */}
              <div className="my-auto">
                <Icon
                  className={`w-6 h-6 ${
                    item.isSelected
                      ? 'text-sky-300'
                      : isLockedWeapon
                      ? 'text-slate-600'
                      : 'text-slate-300'
                  }`}
                />
              </div>

              {/* Bottom Label or Cost */}
              <div className="w-full text-center">
                <div className="text-[10px] font-extrabold truncate leading-tight">
                  {item.label}
                </div>
                {!isWeapon && item.cost && (
                  <div className="text-[8px] font-mono text-amber-300/80 truncate leading-none">
                    {item.cost.wood}W {item.cost.stone}S
                  </div>
                )}
                {isLockedWeapon && (
                  <div className="text-[8px] font-bold text-rose-400/80 leading-none">
                    [Shop]
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
