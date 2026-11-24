import type { BuildingType, BuildingTierStats } from '../types';
import { BUILDING_STATS, GRID_SIZE } from '../constants';
import { soundManager } from '../audio/SoundManager';

export class Building {
  public id: number;
  public type: BuildingType;
  public tier: number = 1;
  public cellX: number;
  public cellY: number;
  public x: number; // center x
  public y: number; // center y
  public maxHp: number;
  public hp: number;
  public width: number = GRID_SIZE;
  public height: number = GRID_SIZE;
  public isDestroyed: boolean = false;

  // Tower combat state
  public targetAngle: number = 0;
  public attackTimer: number = 0;
  public targetId: number | null = null;

  // Gold Mine state
  public goldTimer: number = 0;

  // Visual effects
  public recoil: number = 0;
  public doorOpenAmount: number = 0; // 0 = closed, 1 = fully open

  constructor(id: number, type: BuildingType, cellX: number, cellY: number, tier: number = 1) {
    this.id = id;
    this.type = type;
    this.cellX = cellX;
    this.cellY = cellY;
    this.x = cellX * GRID_SIZE + GRID_SIZE / 2;
    this.y = cellY * GRID_SIZE + GRID_SIZE / 2;
    this.tier = tier;

    const stats = this.getStats();
    this.maxHp = stats.maxHp;
    this.hp = this.maxHp;
  }

  public getStats(): BuildingTierStats {
    const list = BUILDING_STATS[this.type];
    return list[Math.min(this.tier - 1, list.length - 1)];
  }

  public getNextTierStats(): BuildingTierStats | null {
    const list = BUILDING_STATS[this.type];
    if (this.tier < list.length) {
      return list[this.tier];
    }
    return null;
  }

  public upgrade(): boolean {
    const next = this.getNextTierStats();
    if (next) {
      this.tier++;
      const stats = this.getStats();
      const hpGain = stats.maxHp - this.maxHp;
      this.maxHp = stats.maxHp;
      this.hp = Math.min(this.maxHp, this.hp + hpGain);
      soundManager.playUpgrade();
      return true;
    }
    return false;
  }

  public repair(amount: number = this.maxHp) {
    if (this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + amount);
      soundManager.playRepair();
    }
  }

  public takeDamage(amount: number) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDestroyed = true;
    }
  }

  public getSellRefund(): { wood: number; stone: number; gold: number } {
    let totalWood = 0;
    let totalStone = 0;
    let totalGold = 0;
    const list = BUILDING_STATS[this.type];
    for (let i = 0; i < this.tier; i++) {
      totalWood += list[i].cost.wood;
      totalStone += list[i].cost.stone;
      totalGold += list[i].cost.gold;
    }
    return {
      wood: Math.floor(totalWood * 0.5),
      stone: Math.floor(totalStone * 0.5),
      gold: Math.floor(totalGold * 0.5),
    };
  }

  public update(
    dt: number,
    enemies: { id: number; x: number; y: number; hp: number }[],
    playerPos: { x: number; y: number },
    onShoot: (b: Building, target: { id: number; x: number; y: number }) => void,
    onMineGold: (b: Building, amount: number) => void
  ) {
    // Recoil decay
    if (this.recoil > 0) {
      this.recoil = Math.max(0, this.recoil - dt * 6);
    }

    // Door open/close logic depending on player proximity
    if (this.type === 'door') {
      const distToPlayer = Math.hypot(playerPos.x - this.x, playerPos.y - this.y);
      const targetOpen = distToPlayer < 75 ? 1 : 0;
      this.doorOpenAmount += (targetOpen - this.doorOpenAmount) * dt * 10;
    }

    // Gold Mine income
    if (this.type === 'goldMine' || this.type === 'goldStash') {
      const stats = this.getStats();
      if (stats.goldPerSecond && stats.goldPerSecond > 0) {
        this.goldTimer += dt;
        if (this.goldTimer >= 1.0) {
          this.goldTimer -= 1.0;
          onMineGold(this, stats.goldPerSecond);
        }
      }
    }

    // Tower target acquisition and firing
    const stats = this.getStats();
    if (stats.range && stats.fireRate) {
      this.attackTimer -= dt;

      // Find closest enemy within range
      let closestEnemy: { id: number; x: number; y: number; hp: number } | null = null;
      let closestDist = stats.range;

      for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
        if (dist <= closestDist) {
          closestDist = dist;
          closestEnemy = enemy;
        }
      }

      if (closestEnemy) {
        this.targetId = closestEnemy.id;
        const desiredAngle = Math.atan2(closestEnemy.y - this.y, closestEnemy.x - this.x);
        // Smooth rotation
        let diff = desiredAngle - this.targetAngle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.targetAngle += diff * Math.min(1, dt * 12);

        if (this.attackTimer <= 0) {
          this.attackTimer = stats.fireRate;
          this.recoil = 1.0;
          onShoot(this, closestEnemy);
        }
      } else {
        this.targetId = null;
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, isSelected: boolean = false) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const half = GRID_SIZE / 2 - 2;

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(-half + 3, -half + 5, half * 2, half * 2);

    // Selected glow
    if (isSelected) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.5;
      ctx.strokeRect(-half - 3, -half - 3, (half + 3) * 2, (half + 3) * 2);
    }

    // Render by building type
    switch (this.type) {
      case 'goldStash':
        this.renderGoldStash(ctx, half);
        break;
      case 'wall':
        this.renderWall(ctx, half);
        break;
      case 'door':
        this.renderDoor(ctx, half);
        break;
      case 'goldMine':
        this.renderGoldMine(ctx, half);
        break;
      case 'arrowTower':
        this.renderArrowTower(ctx, half);
        break;
      case 'cannonTower':
        this.renderCannonTower(ctx, half);
        break;
      case 'bombTower':
        this.renderBombTower(ctx, half);
        break;
      case 'mageTower':
        this.renderMageTower(ctx, half);
        break;
    }

    // Tier badge on top-left of building
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(-half + 2, -half + 2, 16, 12);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`T${this.tier}`, -half + 10, -half + 8);

    // Health bar if damaged
    if (this.hp < this.maxHp) {
      const barW = GRID_SIZE - 6;
      const barH = 5;
      const pct = Math.max(0, this.hp / this.maxHp);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(-barW / 2, -half - 8, barW, barH);

      ctx.fillStyle = pct > 0.4 ? '#22c55e' : '#ef4444';
      ctx.fillRect(-barW / 2 + 1, -half - 7, (barW - 2) * pct, barH - 2);
    }

    ctx.restore();
  }

  // Visual renderers for each structure
  private renderGoldStash(ctx: CanvasRenderingContext2D, half: number) {
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#1e293b';

    // Tier-based opulent coloring
    const baseColor = this.tier >= 5 ? '#f59e0b' : '#fbbf24';
    ctx.fillStyle = baseColor;
    ctx.fillRect(-half, -half, half * 2, half * 2);
    ctx.strokeRect(-half, -half, half * 2, half * 2);

    // Inner gold vault plate
    ctx.fillStyle = '#fde047';
    ctx.fillRect(-half + 6, -half + 6, (half - 6) * 2, (half - 6) * 2);

    // Center glowing vault jewel
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Star shine
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-2, -3, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderWall(ctx: CanvasRenderingContext2D, half: number) {
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#1e293b';

    // Colors scale with tier: Tier 1 Wood/Slate -> Tier 8 Dark Adamantite
    let wallColor = '#64748b';
    if (this.tier === 1) wallColor = '#94a3b8';
    else if (this.tier === 2) wallColor = '#64748b';
    else if (this.tier === 3) wallColor = '#475569';
    else if (this.tier === 4) wallColor = '#334155';
    else if (this.tier === 5) wallColor = '#1e293b';
    else if (this.tier >= 6) wallColor = '#0f172a';

    ctx.fillStyle = wallColor;
    ctx.fillRect(-half, -half, half * 2, half * 2);
    ctx.strokeRect(-half, -half, half * 2, half * 2);

    // Wall rivet corners
    ctx.fillStyle = this.tier >= 4 ? '#fbbf24' : '#cbd5e1';
    const offset = half - 5;
    [-offset, offset].forEach((rx) => {
      [-offset, offset].forEach((ry) => {
        ctx.beginPath();
        ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Center reinforcement cross
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-half + 4, 0);
    ctx.lineTo(half - 4, 0);
    ctx.moveTo(0, -half + 4);
    ctx.lineTo(0, half - 4);
    ctx.stroke();
  }

  private renderDoor(ctx: CanvasRenderingContext2D, half: number) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#1e293b';

    // Door frame
    ctx.fillStyle = '#475569';
    ctx.fillRect(-half, -half, half * 2, half * 2);
    ctx.strokeRect(-half, -half, half * 2, half * 2);

    // Sliding / Swinging leaves
    const openOffset = this.doorOpenAmount * (half - 4);
    ctx.fillStyle = '#b45309'; // Wooden gate

    // Left leaf
    ctx.fillRect(-half + 3, -half + 3, half - 3 - openOffset, (half - 3) * 2);
    ctx.strokeRect(-half + 3, -half + 3, half - 3 - openOffset, (half - 3) * 2);

    // Right leaf
    ctx.fillRect(openOffset, -half + 3, half - 3 - openOffset, (half - 3) * 2);
    ctx.strokeRect(openOffset, -half + 3, half - 3 - openOffset, (half - 3) * 2);

    // Golden handle / lock
    if (this.doorOpenAmount < 0.5) {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  private renderGoldMine(ctx: CanvasRenderingContext2D, half: number) {
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#1e293b';

    // Stone base
    ctx.fillStyle = '#475569';
    ctx.fillRect(-half, -half, half * 2, half * 2);
    ctx.strokeRect(-half, -half, half * 2, half * 2);

    // Mine shaft entrance / gear
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, 0, half * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Rotating gold gear or nuggets
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, 0, half * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pickaxe icon or gold cross
    ctx.fillStyle = '#fde047';
    ctx.fillRect(-3, -3, 6, 6);
  }

  private renderArrowTower(ctx: CanvasRenderingContext2D, half: number) {
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#1e293b';

    // Base structure
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(0, 0, half * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner rim
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, 0, half * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Turret ballista pointing towards target
    ctx.save();
    ctx.rotate(this.targetAngle);
    const recoilOff = -this.recoil * 5;

    // Crossbow arms
    ctx.fillStyle = '#78350f';
    ctx.fillRect(recoilOff + 2, -11, 4, 22);
    ctx.strokeRect(recoilOff + 2, -11, 4, 22);

    // Barrel / arrow guide
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(recoilOff, -3, 16, 6);
    ctx.strokeRect(recoilOff, -3, 16, 6);

    ctx.restore();
  }

  private renderCannonTower(ctx: CanvasRenderingContext2D, half: number) {
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#1e293b';

    // Dark steel octagonal / circular base
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(0, 0, half * 0.92, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rotating heavy cannon
    ctx.save();
    ctx.rotate(this.targetAngle);
    const recoilOff = -this.recoil * 7;

    // Cannon body
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(recoilOff - 4, -6, 22, 12);
    ctx.strokeRect(recoilOff - 4, -6, 22, 12);

    // Muzzle ring
    ctx.fillStyle = '#64748b';
    ctx.fillRect(recoilOff + 15, -7, 4, 14);
    ctx.strokeRect(recoilOff + 15, -7, 4, 14);

    // Center swivel cap
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  private renderBombTower(ctx: CanvasRenderingContext2D, half: number) {
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#1e293b';

    // Fiery red/orange base
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(-half, -half, half * 2, half * 2);
    ctx.strokeRect(-half, -half, half * 2, half * 2);

    // Rotating mortar cup
    ctx.save();
    ctx.rotate(this.targetAngle);
    const recoilOff = -this.recoil * 6;

    // Mortar tube
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(recoilOff - 3, -8, 20, 16);
    ctx.strokeRect(recoilOff - 3, -8, 20, 16);

    // Bomb in barrel with glowing fuse
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(recoilOff + 13, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderMageTower(ctx: CanvasRenderingContext2D, half: number) {
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#1e293b';

    // Arcane purple base
    ctx.fillStyle = '#6b21a8';
    ctx.beginPath();
    ctx.arc(0, 0, half * 0.92, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Runes ring
    ctx.fillStyle = '#9333ea';
    ctx.beginPath();
    ctx.arc(0, 0, half * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Floating pulsing crystal
    const pulse = 1 + Math.sin(Date.now() * 0.006) * 0.15;
    ctx.save();
    ctx.rotate(this.targetAngle);
    ctx.scale(pulse, pulse);

    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(0, -7);
    ctx.lineTo(-7, 0);
    ctx.lineTo(0, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(2, -2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
