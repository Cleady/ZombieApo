import { WORLD_WIDTH, WORLD_HEIGHT, POTION_COST, WEAPON_STATS, SHIELD_TIERS } from './constants';
import type { BuildingType, WeaponType, Resources, GameStats, ResourceType } from './types';
import { Player } from './entities/Player';
import type { PlayerInput } from './entities/Player';
import { Building } from './entities/Building';
import { ResourceNode } from './entities/ResourceNode';
import { Projectile } from './entities/Projectile';
import { ParticleManager } from './entities/Particle';
import { FloatingTextManager } from './entities/FloatingText';
import { Grid } from './systems/Grid';
import { WaveManager } from './systems/WaveManager';
import { Camera } from './systems/Camera';
import { Renderer } from './systems/Renderer';
import { soundManager } from './audio/SoundManager';

export interface UIState {
  resources: Resources;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  shieldTier: number;
  potionsCount: number;
  wave: number;
  phase: string;
  phaseTimer: number;
  phaseProgress: number;
  activeZombieCount: number;
  isBossWave: boolean;
  bossHp: number;
  bossMaxHp: number;
  selectedBuilding: Building | null;
  placementType: BuildingType | null;
  selectedWeapon: WeaponType;
  weaponTiers: Record<WeaponType, number>;
  isGameOver: boolean;
  gameStats: GameStats;
  isMuted: boolean;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  public player: Player;
  public grid: Grid;
  public resourceNodes: ResourceNode[] = [];
  public projectiles: Projectile[] = [];
  public particleManager: ParticleManager;
  public floatingTexts: FloatingTextManager;
  public waveManager: WaveManager;
  public camera: Camera;
  public renderer: Renderer;

  public resources: Resources = { wood: 100, stone: 80, gold: 20 };
  public score: number = 0;
  public selectedBuilding: Building | null = null;
  public placementType: BuildingType | null = null;
  public isGameOver: boolean = false;
  public isRunning: boolean = false;

  private nextProjId: number = 1;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Input state
  private input: PlayerInput = {
    up: false,
    down: false,
    left: false,
    right: false,
    mouseX: WORLD_WIDTH / 2,
    mouseY: WORLD_HEIGHT / 2,
    isMouseDown: false,
  };
  private screenMouseX: number = 0;
  private screenMouseY: number = 0;

  private onUIUpdate?: (state: UIState) => void;
  private uiUpdateTimer: number = 0;

  constructor(canvas: HTMLCanvasElement, onUIUpdate?: (state: UIState) => void) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');
    this.ctx = ctx;
    this.onUIUpdate = onUIUpdate;

    this.player = new Player(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    this.grid = new Grid();
    this.particleManager = new ParticleManager();
    this.floatingTexts = new FloatingTextManager();
    this.waveManager = new WaveManager();
    this.camera = new Camera(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    this.renderer = new Renderer();

    this.initMap();
    this.bindEvents();
    this.resize();
  }

  private initMap() {
    this.resourceNodes = [];
    let nextNodeId = 1;
    const center = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };

    // Procedurally scatter trees and stones across the world
    // Safe clearing around player spawn
    const safeRadius = 240;

    // Generate ~140 trees
    for (let i = 0; i < 140; i++) {
      const x = 80 + Math.random() * (WORLD_WIDTH - 160);
      const y = 80 + Math.random() * (WORLD_HEIGHT - 160);
      if (Math.hypot(x - center.x, y - center.y) > safeRadius) {
        this.resourceNodes.push(new ResourceNode(nextNodeId++, 'wood', x, y));
      }
    }

    // Generate ~90 stones
    for (let i = 0; i < 90; i++) {
      const x = 80 + Math.random() * (WORLD_WIDTH - 160);
      const y = 80 + Math.random() * (WORLD_HEIGHT - 160);
      if (Math.hypot(x - center.x, y - center.y) > safeRadius) {
        this.resourceNodes.push(new ResourceNode(nextNodeId++, 'stone', x, y));
      }
    }
  }

  public resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.canvas.width = width;
    this.canvas.height = height;
    this.camera.resize(width, height);
  }

  public start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private loop = (timestamp: number) => {
    if (!this.isRunning) return;

    const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    if (this.isGameOver) return;

    // Update mouse world pos based on camera
    const worldMouse = this.camera.screenToWorld(this.screenMouseX, this.screenMouseY);
    this.input.mouseX = worldMouse.x;
    this.input.mouseY = worldMouse.y;

    const buildings = this.grid.getAllBuildings();
    const goldStash = this.grid.getGoldStash();

    // Check game over condition: Gold Stash destroyed after placement
    if (goldStash && goldStash.isDestroyed) {
      this.triggerGameOver();
      return;
    }
    if (this.player.isDead) {
      this.triggerGameOver();
      return;
    }

    // Update Player
    this.player.update(
      dt,
      this.input,
      buildings,
      this.resourceNodes,
      this.waveManager.activeZombies,
      this.particleManager,
      this.floatingTexts,
      (type, targetX, targetY, dmg) => {
        this.spawnProjectile(type, this.player.x, this.player.y, targetX, targetY, dmg);
      },
      (resType: ResourceType, amt: number) => {
        this.resources[resType] += amt;
      }
    );

    // Update Camera
    this.camera.update(dt, this.player.x, this.player.y);

    // Update Resource Nodes
    for (const node of this.resourceNodes) {
      node.update(dt);
    }

    // Update Buildings
    for (const b of buildings) {
      b.update(
        dt,
        this.waveManager.activeZombies,
        { x: this.player.x, y: this.player.y },
        (building, target) => {
          this.handleTowerShoot(building, target);
        },
        (_building, goldAmt) => {
          this.resources.gold += goldAmt;
          this.score += goldAmt;
          soundManager.playGold();
          this.floatingTexts.add(`+${goldAmt} Gold`, _building.x, _building.y - 14, '#fbbf24', 13);
        }
      );
    }

    // Update Wave Manager
    this.waveManager.update(dt, goldStash !== null, (wave, bonusGold) => {
      this.resources.gold += bonusGold;
      this.score += bonusGold * 2;
      this.floatingTexts.add(`Wave ${wave} Complete! +${bonusGold} Gold`, this.player.x, this.player.y - 35, '#fbbf24', 18);
    });

    // Update Zombies
    for (const z of this.waveManager.activeZombies) {
      z.update(dt, goldStash, this.player, buildings, this.waveManager.activeZombies);
    }

    // Remove Dead Zombies & claim rewards
    const { killedCount, goldGained, scoreGained } = this.waveManager.removeDeadZombies();
    if (killedCount > 0) {
      this.resources.gold += goldGained;
      this.score += scoreGained;
    }

    // Update Projectiles
    this.updateProjectiles(dt);

    // Update Particles & Floating Texts
    this.particleManager.update(dt);
    this.floatingTexts.update(dt);

    // Clean up destroyed buildings
    this.grid.cleanupDestroyed();
    if (this.selectedBuilding && this.selectedBuilding.isDestroyed) {
      this.selectedBuilding = null;
    }

    // Notify React UI every ~60ms
    this.uiUpdateTimer += dt;
    if (this.uiUpdateTimer >= 0.06) {
      this.uiUpdateTimer = 0;
      this.emitUIUpdate();
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      const { detonated } = proj.update(dt, this.particleManager);

      if (detonated) {
        this.detonateAoE(proj.x, proj.y, proj.damage, proj.splashRadius);
        this.camera.shake(proj.splashRadius > 100 ? 8 : 4, 0.25);
        this.projectiles.splice(i, 1);
        continue;
      }

      if (proj.isExpired) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check collision with zombies
      for (const z of this.waveManager.activeZombies) {
        if (z.isDead) continue;
        const dist = Math.hypot(z.x - proj.x, z.y - proj.y);
        if (dist <= z.radius + 6) {
          // Direct hit!
          if (proj.splashRadius > 0) {
            this.detonateAoE(proj.x, proj.y, proj.damage, proj.splashRadius);
            this.camera.shake(6, 0.2);
          } else {
            soundManager.playZombieHit();
            const kx = Math.cos(proj.angle) * 80;
            const ky = Math.sin(proj.angle) * 80;
            z.takeDamage(proj.damage, kx, ky, this.particleManager, this.floatingTexts);

            // Mage chain lightning logic
            if (proj.type === 'mage' && proj.chainCount > 0) {
              this.handleMageChain(z, proj.damage * 0.75, proj.chainCount);
            }
          }
          this.projectiles.splice(i, 1);
          break;
        }
      }
    }
  }

  private detonateAoE(x: number, y: number, damage: number, radius: number) {
    soundManager.playExplosion();
    this.particleManager.emitExplosion(x, y, radius);

    for (const z of this.waveManager.activeZombies) {
      if (z.isDead) continue;
      const dist = Math.hypot(z.x - x, z.y - y);
      if (dist <= radius + z.radius) {
        const falloff = 1 - (dist / (radius + z.radius)) * 0.4;
        const dmg = Math.round(damage * falloff);
        const angle = Math.atan2(z.y - y, z.x - x);
        const kx = Math.cos(angle) * 160;
        const ky = Math.sin(angle) * 160;
        z.takeDamage(dmg, kx, ky, this.particleManager, this.floatingTexts);
      }
    }
  }

  private handleMageChain(sourceEnemy: { id: number; x: number; y: number }, damage: number, chainsLeft: number) {
    let currentSource = sourceEnemy;
    const hitIds = new Set<number>([sourceEnemy.id]);

    for (let c = 0; c < chainsLeft; c++) {
      let closest: { id: number; x: number; y: number; takeDamage: (d: number, kx: number, ky: number, p: ParticleManager, f: FloatingTextManager) => boolean } | null = null;
      let closestDist = 160; // Max chain jump distance

      for (const z of this.waveManager.activeZombies) {
        if (hitIds.has(z.id) || z.isDead) continue;
        const d = Math.hypot(z.x - currentSource.x, z.y - currentSource.y);
        if (d < closestDist) {
          closestDist = d;
          closest = z;
        }
      }

      if (closest) {
        hitIds.add(closest.id);
        // Visual electric bolt beam
        this.particleManager.emit((currentSource.x + closest.x) / 2, (currentSource.y + closest.y) / 2, 4, '#c084fc', 30, 3, 4);
        soundManager.playMage();
        closest.takeDamage(damage, 0, 0, this.particleManager, this.floatingTexts);
        currentSource = closest;
      } else {
        break;
      }
    }
  }

  private handleTowerShoot(building: Building, target: { id: number; x: number; y: number }) {
    const stats = building.getStats();
    if (!stats) return;

    if (building.type === 'arrowTower') {
      soundManager.playArrow();
      this.projectiles.push(
        new Projectile(this.nextProjId++, 'arrow', building.x, building.y, target.x, target.y, stats.damage || 15)
      );
    } else if (building.type === 'cannonTower') {
      soundManager.playCannon();
      this.projectiles.push(
        new Projectile(
          this.nextProjId++,
          'cannonball',
          building.x,
          building.y,
          target.x,
          target.y,
          stats.damage || 45,
          stats.splashRadius || 65
        )
      );
    } else if (building.type === 'bombTower') {
      soundManager.playExplosion();
      this.projectiles.push(
        new Projectile(
          this.nextProjId++,
          'bomb',
          building.x,
          building.y,
          target.x,
          target.y,
          stats.damage || 75,
          stats.splashRadius || 90
        )
      );
    } else if (building.type === 'mageTower') {
      soundManager.playMage();
      this.projectiles.push(
        new Projectile(
          this.nextProjId++,
          'mage',
          building.x,
          building.y,
          target.x,
          target.y,
          stats.damage || 30,
          0,
          stats.chainCount || 2
        )
      );
    }
  }

  public spawnProjectile(
    type: 'arrow' | 'bomb',
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    damage: number
  ) {
    if (type === 'arrow') {
      this.projectiles.push(new Projectile(this.nextProjId++, 'arrow', startX, startY, targetX, targetY, damage));
    } else {
      this.projectiles.push(new Projectile(this.nextProjId++, 'bomb', startX, startY, targetX, targetY, damage, 80));
    }
  }

  private render() {
    let ghostPlacement: {
      type: BuildingType;
      cellX: number;
      cellY: number;
      valid: boolean;
    } | null = null;

    if (this.placementType) {
      const cell = Grid.worldToCell(this.input.mouseX, this.input.mouseY);
      const { valid } = this.grid.canPlace(
        this.placementType,
        cell.cellX,
        cell.cellY,
        this.resources,
        this.resourceNodes,
        { x: this.player.x, y: this.player.y, radius: this.player.radius }
      );
      ghostPlacement = {
        type: this.placementType,
        cellX: cell.cellX,
        cellY: cell.cellY,
        valid,
      };
    }

    this.renderer.render(
      this.ctx,
      this.camera,
      this.player,
      this.grid.getAllBuildings(),
      this.resourceNodes,
      this.waveManager.activeZombies,
      this.projectiles,
      this.particleManager,
      this.floatingTexts,
      this.waveManager.phase,
      this.waveManager.getPhaseProgress(),
      this.selectedBuilding,
      ghostPlacement
    );
  }

  private triggerGameOver() {
    this.isGameOver = true;
    soundManager.playGameOver();
    this.emitUIUpdate();
  }

  public restart() {
    this.player = new Player(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    this.grid = new Grid();
    this.resourceNodes = [];
    this.projectiles = [];
    this.particleManager = new ParticleManager();
    this.floatingTexts = new FloatingTextManager();
    this.waveManager = new WaveManager();
    this.camera = new Camera(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);

    this.resources = { wood: 100, stone: 80, gold: 20 };
    this.score = 0;
    this.selectedBuilding = null;
    this.placementType = null;
    this.isGameOver = false;

    this.initMap();
    this.emitUIUpdate();
  }

  // Building interactions
  public selectPlacement(type: BuildingType) {
    this.placementType = type;
    this.selectedBuilding = null;
    this.emitUIUpdate();
  }

  public cancelPlacement() {
    this.placementType = null;
    this.emitUIUpdate();
  }

  public tryPlaceBuilding() {
    if (!this.placementType) return;

    const cell = Grid.worldToCell(this.input.mouseX, this.input.mouseY);
    const { valid, cost, reason } = this.grid.canPlace(
      this.placementType,
      cell.cellX,
      cell.cellY,
      this.resources,
      this.resourceNodes,
      { x: this.player.x, y: this.player.y, radius: this.player.radius }
    );

    if (valid) {
      this.resources.wood -= cost.wood;
      this.resources.stone -= cost.stone;
      this.resources.gold -= cost.gold;

      const building = this.grid.placeBuilding(this.placementType, cell.cellX, cell.cellY);
      soundManager.playPlace();
      this.particleManager.emit(building.x, building.y, 8, '#b45309', 50, 3, 3, true);

      // If Gold Stash placed, start game cycle!
      if (this.placementType === 'goldStash') {
        this.waveManager.startCycle();
        this.floatingTexts.add('Wave Cycle Started! Prepare your defenses!', building.x, building.y - 30, '#fbbf24', 16);
        this.placementType = null; // deselect stash
      }
      this.emitUIUpdate();
    } else if (reason) {
      this.floatingTexts.add(reason, this.input.mouseX, this.input.mouseY - 15, '#ef4444', 14);
    }
  }

  public upgradeBuilding(building: Building): boolean {
    const next = building.getNextTierStats();
    if (!next) return false;

    // Check tier cap: non-stash buildings cannot exceed Gold Stash tier!
    const stash = this.grid.getGoldStash();
    if (building.type !== 'goldStash') {
      const maxAllowed = stash ? stash.tier : 1;
      if (building.tier >= maxAllowed) {
        this.floatingTexts.add(`Upgrade Gold Stash to unlock Tier ${building.tier + 1}!`, building.x, building.y - 20, '#ef4444', 14);
        return false;
      }
    }

    if (
      this.resources.wood >= next.cost.wood &&
      this.resources.stone >= next.cost.stone &&
      this.resources.gold >= next.cost.gold
    ) {
      this.resources.wood -= next.cost.wood;
      this.resources.stone -= next.cost.stone;
      this.resources.gold -= next.cost.gold;

      building.upgrade();
      this.particleManager.emit(building.x, building.y, 10, '#fbbf24', 70, 3.5, 3);
      this.floatingTexts.add(`Upgraded to Tier ${building.tier}!`, building.x, building.y - 20, '#fbbf24', 15);
      this.emitUIUpdate();
      return true;
    } else {
      this.floatingTexts.add('Insufficient resources to upgrade', building.x, building.y - 20, '#ef4444', 13);
      return false;
    }
  }

  public repairBuilding(building: Building): boolean {
    if (building.hp >= building.maxHp) return false;

    const missingHp = building.maxHp - building.hp;
    const woodNeeded = Math.ceil((missingHp / building.maxHp) * 15);
    const stoneNeeded = Math.ceil((missingHp / building.maxHp) * 10);

    if (this.resources.wood >= woodNeeded && this.resources.stone >= stoneNeeded) {
      this.resources.wood -= woodNeeded;
      this.resources.stone -= stoneNeeded;
      building.repair();
      this.particleManager.emit(building.x, building.y, 6, '#22c55e', 40, 3, 3);
      this.floatingTexts.add('Repaired!', building.x, building.y - 18, '#22c55e', 14);
      this.emitUIUpdate();
      return true;
    } else {
      this.floatingTexts.add('Not enough wood/stone to repair', building.x, building.y - 18, '#ef4444', 13);
      return false;
    }
  }

  public repairAllNearby() {
    const buildings = this.grid.getAllBuildings();
    let repairedCount = 0;
    for (const b of buildings) {
      if (b.hp < b.maxHp) {
        const dist = Math.hypot(b.x - this.player.x, b.y - this.player.y);
        if (dist <= 300) {
          if (this.repairBuilding(b)) {
            repairedCount++;
          }
        }
      }
    }
    if (repairedCount > 0) {
      soundManager.playRepair();
    }
  }

  public upgradeAllBuildings() {
    const buildings = this.grid.getAllBuildings();
    let upgradedCount = 0;
    for (const b of buildings) {
      if (this.upgradeBuilding(b)) {
        upgradedCount++;
      }
    }
    if (upgradedCount > 0) {
      soundManager.playUpgrade();
    }
  }

  public sellBuilding(building: Building) {
    const refund = building.getSellRefund();
    this.resources.wood += refund.wood;
    this.resources.stone += refund.stone;
    this.resources.gold += refund.gold;

    this.grid.removeBuilding(building.cellX, building.cellY);
    soundManager.playPlace();
    this.floatingTexts.add(
      `+${refund.wood}W +${refund.stone}S +${refund.gold}G`,
      building.x,
      building.y - 18,
      '#fbbf24',
      14
    );

    if (this.selectedBuilding?.id === building.id) {
      this.selectedBuilding = null;
    }
    this.emitUIUpdate();
  }

  // Shop interactions
  public buyWeaponUpgrade(type: WeaponType): boolean {
    const currentTier = this.player.weaponTiers[type];
    const statsList = WEAPON_STATS[type];

    if (currentTier >= statsList.length) return false;

    const nextStats = statsList[currentTier]; // next tier index is currentTier (0-indexed)
    if (
      this.resources.wood >= nextStats.cost.wood &&
      this.resources.stone >= nextStats.cost.stone &&
      this.resources.gold >= nextStats.cost.gold
    ) {
      this.resources.wood -= nextStats.cost.wood;
      this.resources.stone -= nextStats.cost.stone;
      this.resources.gold -= nextStats.cost.gold;

      this.player.weaponTiers[type]++;
      this.player.selectedWeapon = type;
      soundManager.playUpgrade();
      this.floatingTexts.add(
        `Unlocked ${type.toUpperCase()} Tier ${this.player.weaponTiers[type]}!`,
        this.player.x,
        this.player.y - 25,
        '#38bdf8',
        16
      );
      this.emitUIUpdate();
      return true;
    }
    return false;
  }

  public buyShieldUpgrade(): boolean {
    if (this.player.shieldTier >= SHIELD_TIERS.length) return false;
    const nextConfig = SHIELD_TIERS[this.player.shieldTier];

    if (
      this.resources.wood >= nextConfig.cost.wood &&
      this.resources.stone >= nextConfig.cost.stone &&
      this.resources.gold >= nextConfig.cost.gold
    ) {
      this.resources.wood -= nextConfig.cost.wood;
      this.resources.stone -= nextConfig.cost.stone;
      this.resources.gold -= nextConfig.cost.gold;

      this.player.upgradeShield();
      this.floatingTexts.add(
        `Shield Upgraded to Tier ${this.player.shieldTier}!`,
        this.player.x,
        this.player.y - 25,
        '#06b6d4',
        16
      );
      this.emitUIUpdate();
      return true;
    }
    return false;
  }

  public buyPotion(): boolean {
    if (this.resources.gold >= POTION_COST.gold) {
      this.resources.gold -= POTION_COST.gold;
      this.player.potionsCount++;
      soundManager.playGold();
      this.floatingTexts.add('+1 Potion', this.player.x, this.player.y - 20, '#22c55e', 15);
      this.emitUIUpdate();
      return true;
    }
    return false;
  }

  public selectWeapon(type: WeaponType) {
    if (this.player.weaponTiers[type] > 0) {
      this.player.selectedWeapon = type;
      this.placementType = null;
      this.emitUIUpdate();
    }
  }

  private emitUIUpdate() {
    if (!this.onUIUpdate) return;

    const boss = this.waveManager.bossZombie;
    this.onUIUpdate({
      resources: { ...this.resources },
      health: Math.round(this.player.hp),
      maxHealth: this.player.maxHp,
      shield: Math.round(this.player.shield),
      maxShield: this.player.maxShield,
      shieldTier: this.player.shieldTier,
      potionsCount: this.player.potionsCount,
      wave: this.waveManager.waveNumber,
      phase: this.waveManager.phase,
      phaseTimer: Math.ceil(this.waveManager.phaseTimer),
      phaseProgress: this.waveManager.getPhaseProgress(),
      activeZombieCount: this.waveManager.activeZombies.length + this.waveManager.zombiesToSpawn.length,
      isBossWave: this.waveManager.isBossWave,
      bossHp: boss ? Math.round(boss.hp) : 0,
      bossMaxHp: boss ? boss.maxHp : 0,
      selectedBuilding: this.selectedBuilding,
      placementType: this.placementType,
      selectedWeapon: this.player.selectedWeapon,
      weaponTiers: { ...this.player.weaponTiers },
      isGameOver: this.isGameOver,
      gameStats: {
        wave: this.waveManager.waveNumber,
        zombiesKilled: this.waveManager.zombiesKilledTotal,
        timeSurvived: Math.floor(this.waveManager.totalTimeSurvived),
        resourcesGathered: { ...this.resources },
        score: this.score,
      },
      isMuted: soundManager.getMuted(),
    });
  }

  private bindEvents() {
    window.addEventListener('resize', () => this.resize());

    // Keyboard events
    window.addEventListener('keydown', (e) => {
      // Ignore if inside an input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') this.input.up = true;
      if (key === 's' || key === 'arrowdown') this.input.down = true;
      if (key === 'a' || key === 'arrowleft') this.input.left = true;
      if (key === 'd' || key === 'arrowright') this.input.right = true;

      // Hotkeys 1-9
      if (key >= '1' && key <= '9') {
        const num = parseInt(key, 10);
        this.handleHotbarKey(num);
      }

      // Quick Repair hotkey R
      if (key === 'r') {
        if (this.selectedBuilding) {
          this.repairBuilding(this.selectedBuilding);
        } else {
          this.repairAllNearby();
        }
      }

      // Upgrade hotkey E
      if (key === 'e') {
        if (this.selectedBuilding) {
          this.upgradeBuilding(this.selectedBuilding);
        } else {
          this.upgradeAllBuildings();
        }
      }

      // Potion hotkey F
      if (key === 'f') {
        this.player.usePotion(this.floatingTexts);
        this.emitUIUpdate();
      }

      // Mute hotkey M
      if (key === 'm') {
        soundManager.toggleMute();
        this.emitUIUpdate();
      }

      // Escape key to deselect or cancel
      if (key === 'escape') {
        this.placementType = null;
        this.selectedBuilding = null;
        this.emitUIUpdate();
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') this.input.up = false;
      if (key === 's' || key === 'arrowdown') this.input.down = false;
      if (key === 'a' || key === 'arrowleft') this.input.left = false;
      if (key === 'd' || key === 'arrowright') this.input.right = false;
    });

    // Mouse movement
    window.addEventListener('mousemove', (e) => {
      this.screenMouseX = e.clientX;
      this.screenMouseY = e.clientY;
    });

    // Mouse clicks
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        // Left click
        if (this.placementType) {
          this.tryPlaceBuilding();
        } else {
          // Check if clicked an existing building to select it
          const world = this.camera.screenToWorld(e.clientX, e.clientY);
          const cell = Grid.worldToCell(world.x, world.y);
          const b = this.grid.getBuildingAt(cell.cellX, cell.cellY);
          if (b && !b.isDestroyed) {
            this.selectedBuilding = b;
            this.emitUIUpdate();
          } else {
            this.selectedBuilding = null;
            this.input.isMouseDown = true;
          }
        }
      } else if (e.button === 2) {
        // Right click: cancel placement or deselect
        this.placementType = null;
        this.selectedBuilding = null;
        this.emitUIUpdate();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.input.isMouseDown = false;
      }
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  private handleHotbarKey(num: number) {
    // 1: Pickaxe
    // 2: Spear
    // 3: Bow
    // 4: Bomb
    // 5: Wall
    // 6: Door
    // 7: Gold Mine
    // 8: Arrow Tower
    // 9: Cannon Tower
    const stash = this.grid.getGoldStash();

    if (num === 1) this.selectWeapon('pickaxe');
    else if (num === 2) this.selectWeapon('spear');
    else if (num === 3) this.selectWeapon('bow');
    else if (num === 4) this.selectWeapon('bomb');
    else if (num === 5) {
      if (!stash) this.selectPlacement('goldStash');
      else this.selectPlacement('wall');
    } else if (num === 6) this.selectPlacement('door');
    else if (num === 7) this.selectPlacement('goldMine');
    else if (num === 8) this.selectPlacement('arrowTower');
    else if (num === 9) this.selectPlacement('cannonTower');
  }
}
