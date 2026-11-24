// Game types and interfaces

export type ResourceType = 'wood' | 'stone' | 'gold';

export interface Resources {
  wood: number;
  stone: number;
  gold: number;
}

export type BuildingType =
  | 'goldStash'
  | 'wall'
  | 'door'
  | 'goldMine'
  | 'arrowTower'
  | 'cannonTower'
  | 'bombTower'
  | 'mageTower';

export type WeaponType = 'pickaxe' | 'spear' | 'bow' | 'bomb';

export type EnemyType = 'walker' | 'runner' | 'brute' | 'boss';

export type GamePhase = 'peaceful' | 'day' | 'sunset' | 'night';

export interface BuildingCost {
  wood: number;
  stone: number;
  gold: number;
}

export interface BuildingTierStats {
  tier: number;
  maxHp: number;
  cost: BuildingCost;
  // Specific stats depending on building
  range?: number;
  fireRate?: number; // seconds between attacks
  damage?: number;
  splashRadius?: number;
  goldPerSecond?: number;
  chainCount?: number;
}

export interface WeaponTierStats {
  tier: number;
  damage: number;
  range: number;
  cooldown: number; // in seconds
  cost: BuildingCost;
  harvestPower?: number; // extra wood/stone per hit for pickaxe
}

export interface ShopItem {
  id: string;
  name: string;
  type: 'weapon' | 'shield' | 'potion';
  weaponType?: WeaponType;
  currentTier: number;
  maxTier: number;
  description: string;
  cost: BuildingCost;
  statsDisplay: string;
}

export interface GameStats {
  wave: number;
  zombiesKilled: number;
  timeSurvived: number; // in seconds
  resourcesGathered: {
    wood: number;
    stone: number;
    gold: number;
  };
  score: number;
}
