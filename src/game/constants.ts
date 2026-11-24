import type { BuildingType, BuildingTierStats, WeaponType, WeaponTierStats } from './types';

export const WORLD_WIDTH = 3072;
export const WORLD_HEIGHT = 3072;
export const GRID_SIZE = 48;
export const GRID_COLS = WORLD_WIDTH / GRID_SIZE; // 64
export const GRID_ROWS = WORLD_HEIGHT / GRID_SIZE; // 64

export const DAY_DURATION = 42; // seconds
export const SUNSET_DURATION = 5; // seconds
export const NIGHT_DURATION = 42; // seconds

export const PLAYER_BASE_SPEED = 250;
export const PLAYER_RADIUS = 18;
export const PLAYER_MAX_HP = 100;
export const PLAYER_REGEN_DELAY = 5.0; // seconds without damage
export const PLAYER_REGEN_RATE = 10; // HP per second

export const POTION_HEAL_AMOUNT = 50;
export const POTION_COST = { wood: 0, stone: 0, gold: 50 };

// Colors for .io vector styling
export const COLORS = {
  grass: '#5aab34',
  grassGrid: '#529c2f',
  grassTileDark: '#4e952c',
  border: '#2c401e',
  outline: '#1e293b',
  playerBody: '#38bdf8',
  playerHands: '#0284c7',
  wood: '#d97706',
  stone: '#94a3b8',
  gold: '#fbbf24',
  danger: '#ef4444',
  healthGreen: '#22c55e',
  shieldBlue: '#06b6d4',
  nightOverlay: 'rgba(10, 16, 38, 0.88)',
  sunsetOverlay: 'rgba(217, 119, 6, 0.35)',
};

// Maximum limits
export const MAX_BUILDING_COUNTS: Partial<Record<BuildingType, number>> = {
  goldStash: 1,
  goldMine: 8,
};

// 8 Tiers for Buildings
export const BUILDING_STATS: Record<BuildingType, BuildingTierStats[]> = {
  goldStash: [
    { tier: 1, maxHp: 1000, cost: { wood: 50, stone: 50, gold: 0 }, goldPerSecond: 1 },
    { tier: 2, maxHp: 1800, cost: { wood: 120, stone: 120, gold: 50 }, goldPerSecond: 2 },
    { tier: 3, maxHp: 2800, cost: { wood: 250, stone: 250, gold: 120 }, goldPerSecond: 4 },
    { tier: 4, maxHp: 4200, cost: { wood: 500, stone: 500, gold: 260 }, goldPerSecond: 7 },
    { tier: 5, maxHp: 6000, cost: { wood: 950, stone: 950, gold: 550 }, goldPerSecond: 12 },
    { tier: 6, maxHp: 8500, cost: { wood: 1700, stone: 1700, gold: 1100 }, goldPerSecond: 18 },
    { tier: 7, maxHp: 12000, cost: { wood: 3000, stone: 3000, gold: 2200 }, goldPerSecond: 26 },
    { tier: 8, maxHp: 18000, cost: { wood: 5500, stone: 5500, gold: 4500 }, goldPerSecond: 40 },
  ],
  wall: [
    { tier: 1, maxHp: 250, cost: { wood: 15, stone: 10, gold: 0 } },
    { tier: 2, maxHp: 500, cost: { wood: 30, stone: 25, gold: 0 } },
    { tier: 3, maxHp: 900, cost: { wood: 65, stone: 55, gold: 10 } },
    { tier: 4, maxHp: 1500, cost: { wood: 130, stone: 110, gold: 25 } },
    { tier: 5, maxHp: 2400, cost: { wood: 240, stone: 210, gold: 60 } },
    { tier: 6, maxHp: 3800, cost: { wood: 440, stone: 380, gold: 140 } },
    { tier: 7, maxHp: 5800, cost: { wood: 800, stone: 700, gold: 300 } },
    { tier: 8, maxHp: 9000, cost: { wood: 1500, stone: 1300, gold: 650 } },
  ],
  door: [
    { tier: 1, maxHp: 220, cost: { wood: 20, stone: 10, gold: 0 } },
    { tier: 2, maxHp: 450, cost: { wood: 40, stone: 25, gold: 0 } },
    { tier: 3, maxHp: 800, cost: { wood: 80, stone: 55, gold: 10 } },
    { tier: 4, maxHp: 1350, cost: { wood: 160, stone: 110, gold: 25 } },
    { tier: 5, maxHp: 2150, cost: { wood: 290, stone: 210, gold: 60 } },
    { tier: 6, maxHp: 3400, cost: { wood: 520, stone: 380, gold: 140 } },
    { tier: 7, maxHp: 5200, cost: { wood: 950, stone: 700, gold: 300 } },
    { tier: 8, maxHp: 8000, cost: { wood: 1750, stone: 1300, gold: 650 } },
  ],
  goldMine: [
    { tier: 1, maxHp: 200, cost: { wood: 35, stone: 25, gold: 0 }, goldPerSecond: 1 },
    { tier: 2, maxHp: 350, cost: { wood: 70, stone: 50, gold: 20 }, goldPerSecond: 2 },
    { tier: 3, maxHp: 600, cost: { wood: 140, stone: 100, gold: 50 }, goldPerSecond: 4 },
    { tier: 4, maxHp: 1000, cost: { wood: 280, stone: 200, gold: 110 }, goldPerSecond: 8 },
    { tier: 5, maxHp: 1600, cost: { wood: 520, stone: 380, gold: 240 }, goldPerSecond: 15 },
    { tier: 6, maxHp: 2500, cost: { wood: 950, stone: 700, gold: 500 }, goldPerSecond: 26 },
    { tier: 7, maxHp: 3800, cost: { wood: 1700, stone: 1300, gold: 1000 }, goldPerSecond: 42 },
    { tier: 8, maxHp: 5800, cost: { wood: 3000, stone: 2400, gold: 2100 }, goldPerSecond: 70 },
  ],
  arrowTower: [
    { tier: 1, maxHp: 300, cost: { wood: 30, stone: 20, gold: 0 }, range: 240, fireRate: 0.5, damage: 16 },
    { tier: 2, maxHp: 500, cost: { wood: 60, stone: 45, gold: 15 }, range: 260, fireRate: 0.45, damage: 26 },
    { tier: 3, maxHp: 850, cost: { wood: 120, stone: 90, gold: 40 }, range: 280, fireRate: 0.4, damage: 42 },
    { tier: 4, maxHp: 1400, cost: { wood: 230, stone: 180, gold: 90 }, range: 305, fireRate: 0.35, damage: 68 },
    { tier: 5, maxHp: 2200, cost: { wood: 420, stone: 340, gold: 200 }, range: 330, fireRate: 0.3, damage: 105 },
    { tier: 6, maxHp: 3400, cost: { wood: 780, stone: 620, gold: 420 }, range: 355, fireRate: 0.26, damage: 160 },
    { tier: 7, maxHp: 5200, cost: { wood: 1450, stone: 1150, gold: 850 }, range: 380, fireRate: 0.22, damage: 245 },
    { tier: 8, maxHp: 7800, cost: { wood: 2700, stone: 2100, gold: 1800 }, range: 410, fireRate: 0.18, damage: 380 },
  ],
  cannonTower: [
    { tier: 1, maxHp: 350, cost: { wood: 45, stone: 40, gold: 0 }, range: 210, fireRate: 1.4, damage: 45, splashRadius: 65 },
    { tier: 2, maxHp: 600, cost: { wood: 90, stone: 80, gold: 25 }, range: 225, fireRate: 1.3, damage: 80, splashRadius: 75 },
    { tier: 3, maxHp: 1050, cost: { wood: 180, stone: 160, gold: 65 }, range: 240, fireRate: 1.2, damage: 135, splashRadius: 85 },
    { tier: 4, maxHp: 1700, cost: { wood: 350, stone: 310, gold: 145 }, range: 260, fireRate: 1.1, damage: 220, splashRadius: 95 },
    { tier: 5, maxHp: 2700, cost: { wood: 650, stone: 580, gold: 310 }, range: 280, fireRate: 1.0, damage: 360, splashRadius: 110 },
    { tier: 6, maxHp: 4200, cost: { wood: 1200, stone: 1050, gold: 640 }, range: 300, fireRate: 0.9, damage: 560, splashRadius: 125 },
    { tier: 7, maxHp: 6400, cost: { wood: 2200, stone: 1900, gold: 1300 }, range: 325, fireRate: 0.8, damage: 880, splashRadius: 140 },
    { tier: 8, maxHp: 9600, cost: { wood: 4100, stone: 3600, gold: 2700 }, range: 350, fireRate: 0.7, damage: 1400, splashRadius: 160 },
  ],
  bombTower: [
    { tier: 1, maxHp: 320, cost: { wood: 50, stone: 55, gold: 10 }, range: 230, fireRate: 2.0, damage: 75, splashRadius: 90 },
    { tier: 2, maxHp: 560, cost: { wood: 100, stone: 110, gold: 35 }, range: 245, fireRate: 1.85, damage: 135, splashRadius: 100 },
    { tier: 3, maxHp: 980, cost: { wood: 200, stone: 220, gold: 85 }, range: 260, fireRate: 1.7, damage: 230, splashRadius: 115 },
    { tier: 4, maxHp: 1600, cost: { wood: 390, stone: 430, gold: 190 }, range: 280, fireRate: 1.55, damage: 380, splashRadius: 130 },
    { tier: 5, maxHp: 2550, cost: { wood: 720, stone: 800, gold: 400 }, range: 300, fireRate: 1.4, damage: 620, splashRadius: 150 },
    { tier: 6, maxHp: 4000, cost: { wood: 1350, stone: 1500, gold: 820 }, range: 325, fireRate: 1.25, damage: 980, splashRadius: 170 },
    { tier: 7, maxHp: 6100, cost: { wood: 2500, stone: 2750, gold: 1680 }, range: 350, fireRate: 1.1, damage: 1550, splashRadius: 195 },
    { tier: 8, maxHp: 9200, cost: { wood: 4600, stone: 5100, gold: 3450 }, range: 380, fireRate: 0.95, damage: 2450, splashRadius: 220 },
  ],
  mageTower: [
    { tier: 1, maxHp: 280, cost: { wood: 40, stone: 60, gold: 15 }, range: 250, fireRate: 0.8, damage: 30, chainCount: 2 },
    { tier: 2, maxHp: 480, cost: { wood: 80, stone: 120, gold: 45 }, range: 270, fireRate: 0.72, damage: 55, chainCount: 3 },
    { tier: 3, maxHp: 820, cost: { wood: 160, stone: 240, gold: 100 }, range: 290, fireRate: 0.65, damage: 95, chainCount: 3 },
    { tier: 4, maxHp: 1350, cost: { wood: 310, stone: 460, gold: 220 }, range: 315, fireRate: 0.58, damage: 155, chainCount: 4 },
    { tier: 5, maxHp: 2150, cost: { wood: 580, stone: 860, gold: 460 }, range: 340, fireRate: 0.52, damage: 250, chainCount: 4 },
    { tier: 6, maxHp: 3350, cost: { wood: 1080, stone: 1600, gold: 950 }, range: 365, fireRate: 0.46, damage: 395, chainCount: 5 },
    { tier: 7, maxHp: 5100, cost: { wood: 2000, stone: 2950, gold: 1950 }, range: 395, fireRate: 0.4, damage: 620, chainCount: 6 },
    { tier: 8, maxHp: 7700, cost: { wood: 3700, stone: 5500, gold: 4000 }, range: 430, fireRate: 0.35, damage: 980, chainCount: 7 },
  ],
};

// Weapons Tiers (Pickaxe, Spear, Bow, Bomb)
export const WEAPON_STATS: Record<WeaponType, WeaponTierStats[]> = {
  pickaxe: [
    { tier: 1, damage: 12, range: 48, cooldown: 0.4, harvestPower: 3, cost: { wood: 0, stone: 0, gold: 0 } },
    { tier: 2, damage: 20, range: 50, cooldown: 0.36, harvestPower: 6, cost: { wood: 60, stone: 40, gold: 30 } },
    { tier: 3, damage: 32, range: 52, cooldown: 0.32, harvestPower: 10, cost: { wood: 140, stone: 100, gold: 80 } },
    { tier: 4, damage: 50, range: 54, cooldown: 0.28, harvestPower: 16, cost: { wood: 300, stone: 220, gold: 180 } },
    { tier: 5, damage: 78, range: 56, cooldown: 0.25, harvestPower: 25, cost: { wood: 620, stone: 460, gold: 400 } },
    { tier: 6, damage: 120, range: 58, cooldown: 0.22, harvestPower: 38, cost: { wood: 1250, stone: 950, gold: 850 } },
    { tier: 7, damage: 180, range: 60, cooldown: 0.2, harvestPower: 58, cost: { wood: 2500, stone: 1900, gold: 1800 } },
    { tier: 8, damage: 270, range: 64, cooldown: 0.18, harvestPower: 88, cost: { wood: 5000, stone: 3800, gold: 3800 } },
  ],
  spear: [
    { tier: 1, damage: 30, range: 85, cooldown: 0.55, cost: { wood: 50, stone: 30, gold: 20 } },
    { tier: 2, damage: 50, range: 90, cooldown: 0.5, cost: { wood: 110, stone: 70, gold: 60 } },
    { tier: 3, damage: 85, range: 95, cooldown: 0.46, cost: { wood: 240, stone: 160, gold: 140 } },
    { tier: 4, damage: 140, range: 100, cooldown: 0.42, cost: { wood: 500, stone: 350, gold: 320 } },
    { tier: 5, damage: 225, range: 105, cooldown: 0.38, cost: { wood: 1050, stone: 750, gold: 700 } },
    { tier: 6, damage: 350, range: 110, cooldown: 0.34, cost: { wood: 2150, stone: 1550, gold: 1500 } },
    { tier: 7, damage: 540, range: 115, cooldown: 0.3, cost: { wood: 4300, stone: 3100, gold: 3200 } },
    { tier: 8, damage: 820, range: 120, cooldown: 0.26, cost: { wood: 8500, stone: 6200, gold: 6800 } },
  ],
  bow: [
    { tier: 1, damage: 22, range: 350, cooldown: 0.65, cost: { wood: 70, stone: 20, gold: 40 } },
    { tier: 2, damage: 38, range: 380, cooldown: 0.58, cost: { wood: 150, stone: 50, gold: 100 } },
    { tier: 3, damage: 64, range: 410, cooldown: 0.52, cost: { wood: 320, stone: 120, gold: 220 } },
    { tier: 4, damage: 105, range: 440, cooldown: 0.46, cost: { wood: 680, stone: 260, gold: 480 } },
    { tier: 5, damage: 165, range: 470, cooldown: 0.4, cost: { wood: 1400, stone: 560, gold: 1050 } },
    { tier: 6, damage: 255, range: 500, cooldown: 0.35, cost: { wood: 2850, stone: 1150, gold: 2200 } },
    { tier: 7, damage: 390, range: 530, cooldown: 0.3, cost: { wood: 5700, stone: 2350, gold: 4600 } },
    { tier: 8, damage: 590, range: 560, cooldown: 0.25, cost: { wood: 11000, stone: 4700, gold: 9500 } },
  ],
  bomb: [
    { tier: 1, damage: 70, range: 250, cooldown: 1.4, cost: { wood: 40, stone: 80, gold: 50 } },
    { tier: 2, damage: 120, range: 270, cooldown: 1.3, cost: { wood: 90, stone: 170, gold: 120 } },
    { tier: 3, damage: 200, range: 290, cooldown: 1.2, cost: { wood: 200, stone: 360, gold: 260 } },
    { tier: 4, damage: 330, range: 310, cooldown: 1.1, cost: { wood: 430, stone: 750, gold: 560 } },
    { tier: 5, damage: 530, range: 330, cooldown: 1.0, cost: { wood: 900, stone: 1550, gold: 1200 } },
    { tier: 6, damage: 830, range: 350, cooldown: 0.9, cost: { wood: 1850, stone: 3200, gold: 2500 } },
    { tier: 7, damage: 1280, range: 370, cooldown: 0.8, cost: { wood: 3800, stone: 6500, gold: 5200 } },
    { tier: 8, damage: 1950, range: 400, cooldown: 0.7, cost: { wood: 7800, stone: 13200, gold: 10800 } },
  ],
};

// Zombie Shield tiers (up to 4 tiers)
export const SHIELD_TIERS = [
  { tier: 1, maxShield: 50, regenRate: 8, cost: { wood: 80, stone: 80, gold: 60 } },
  { tier: 2, maxShield: 100, regenRate: 14, cost: { wood: 200, stone: 200, gold: 180 } },
  { tier: 3, maxShield: 175, regenRate: 22, cost: { wood: 450, stone: 450, gold: 450 } },
  { tier: 4, maxShield: 280, regenRate: 35, cost: { wood: 1000, stone: 1000, gold: 1100 } },
];

// Enemy Base Configurations
export const ENEMY_CONFIGS = {
  walker: {
    baseHp: 65,
    speed: 90,
    radius: 17,
    damage: 8,
    attackRate: 1.0,
    color: '#65a30d',
    outline: '#1e293b',
    goldReward: 3,
    score: 10,
  },
  runner: {
    baseHp: 38,
    speed: 155,
    radius: 13,
    damage: 6,
    attackRate: 0.7,
    color: '#e11d48',
    outline: '#1e293b',
    goldReward: 4,
    score: 15,
  },
  brute: {
    baseHp: 320,
    speed: 55,
    radius: 26,
    damage: 28,
    attackRate: 1.5,
    color: '#7c3aed',
    outline: '#1e293b',
    goldReward: 12,
    score: 40,
  },
  boss: {
    baseHp: 2200,
    speed: 68,
    radius: 38,
    damage: 65,
    attackRate: 1.2,
    color: '#dc2626',
    outline: '#0f172a',
    goldReward: 75,
    score: 250,
  },
};
