import type { EnemyType } from '../types';
import { ENEMY_CONFIGS } from '../constants';
import { Building } from './Building';
import { ParticleManager } from './Particle';
import { FloatingTextManager } from './FloatingText';

export class Zombie {
  public id: number;
  public type: EnemyType;
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public angle: number = 0;
  public radius: number;
  public maxHp: number;
  public hp: number;
  public speed: number;
  public damage: number;
  public attackRate: number;
  public attackTimer: number = 0;
  public color: string;
  public outline: string;
  public goldReward: number;
  public score: number;
  public isDead: boolean = false;

  // Visual feedback
  public hitFlashTimer: number = 0;
  public walkCycle: number = 0;
  public armSwing: number = 0;

  constructor(id: number, type: EnemyType, x: number, y: number, waveNumber: number = 1) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;

    const cfg = ENEMY_CONFIGS[type];
    // Wave scaling multiplier: +15% HP and +8% damage per wave
    const waveHpMult = 1 + (waveNumber - 1) * 0.16;
    const waveDmgMult = 1 + (waveNumber - 1) * 0.08;

    this.maxHp = Math.round(cfg.baseHp * waveHpMult);
    this.hp = this.maxHp;
    this.speed = cfg.speed * (0.95 + Math.random() * 0.1);
    this.radius = cfg.radius;
    this.damage = Math.round(cfg.damage * waveDmgMult);
    this.attackRate = cfg.attackRate;
    this.color = cfg.color;
    this.outline = cfg.outline;
    this.goldReward = Math.round(cfg.goldReward * (1 + (waveNumber - 1) * 0.1));
    this.score = cfg.score;
  }

  public takeDamage(
    amount: number,
    knockbackX: number = 0,
    knockbackY: number = 0,
    particleManager?: ParticleManager,
    floatingTexts?: FloatingTextManager
  ): boolean {
    if (this.isDead) return false;

    this.hp -= amount;
    this.hitFlashTimer = 0.12;

    // Apply knockback (brute and boss have heavy resistance)
    const resist = this.type === 'boss' ? 0.1 : this.type === 'brute' ? 0.35 : 1.0;
    this.vx += knockbackX * resist;
    this.vy += knockbackY * resist;

    if (particleManager) {
      particleManager.emit(this.x, this.y, 4, '#84cc16', 60, 3, 3); // green blood
    }

    if (floatingTexts) {
      floatingTexts.add(`-${amount}`, this.x, this.y - 10, '#f87171', 13);
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      if (particleManager) {
        particleManager.emit(this.x, this.y, 14, '#65a30d', 110, 4.5, 2.5);
      }
      return true; // died
    }
    return false;
  }

  public update(
    dt: number,
    goldStash: Building | null,
    player: { x: number; y: number; takeDamage: (dmg: number) => void },
    buildings: Building[],
    otherZombies: Zombie[]
  ) {
    if (this.isDead) return;

    // Hit flash decay
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    this.attackTimer -= dt;

    // Determine target position:
    // If player is close, target player; otherwise target Gold Stash (or player if no stash)
    let targetX = player.x;
    let targetY = player.y;

    if (goldStash && !goldStash.isDestroyed) {
      const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
      if (distToPlayer > 180) {
        targetX = goldStash.x;
        targetY = goldStash.y;
      }
    }

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distToTarget = Math.hypot(dx, dy);

    this.angle = Math.atan2(dy, dx);
    this.walkCycle += dt * 8;
    this.armSwing = Math.sin(this.walkCycle);

    // Desired velocity towards target
    let moveVx = (dx / (distToTarget || 1)) * this.speed;
    let moveVy = (dy / (distToTarget || 1)) * this.speed;

    // Check collision with buildings:
    // If blocked by a building, stop and attack it!
    let blockedBuilding: Building | null = null;
    const futureX = this.x + moveVx * dt;
    const futureY = this.y + moveVy * dt;

    for (const b of buildings) {
      if (b.isDestroyed) continue;
      // Distance from zombie center to building center
      const bHalf = b.width / 2;
      const closestX = Math.max(b.x - bHalf, Math.min(futureX, b.x + bHalf));
      const closestY = Math.max(b.y - bHalf, Math.min(futureY, b.y + bHalf));
      const distSq = (futureX - closestX) ** 2 + (futureY - closestY) ** 2;

      if (distSq < this.radius ** 2) {
        blockedBuilding = b;
        break;
      }
    }

    if (blockedBuilding) {
      // Stop movement towards building and attack it
      moveVx = 0;
      moveVy = 0;

      if (this.attackTimer <= 0) {
        this.attackTimer = this.attackRate;
        blockedBuilding.takeDamage(this.damage);
      }
    } else {
      // Check if close enough to attack player
      const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
      if (distToPlayer < this.radius + 18) {
        moveVx = 0;
        moveVy = 0;
        if (this.attackTimer <= 0) {
          this.attackTimer = this.attackRate;
          player.takeDamage(this.damage);
        }
      }
    }

    // Flocking / soft collision repulsion with other zombies
    let repulseX = 0;
    let repulseY = 0;
    const searchRadius = this.radius * 2.2;

    for (const other of otherZombies) {
      if (other === this || other.isDead) continue;
      const ox = other.x - this.x;
      const oy = other.y - this.y;
      const d = Math.hypot(ox, oy);
      if (d > 0 && d < searchRadius) {
        const force = (searchRadius - d) / searchRadius;
        repulseX -= (ox / d) * force * 70;
        repulseY -= (oy / d) * force * 70;
      }
    }

    // Apply movement with dampening
    this.vx = this.vx * 0.88 + (moveVx + repulseX) * 0.12;
    this.vy = this.vy * 0.88 + (moveVy + repulseY) * 0.12;

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(3, 4, this.radius, this.radius * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Boss ominous red aura
    if (this.type === 'boss') {
      const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.18;
      ctx.fillStyle = 'rgba(220, 38, 38, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, (this.radius + 12) * pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    // Flash white/red when hit
    const bodyColor = this.hitFlashTimer > 0 ? '#ffffff' : this.color;
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = this.outline;

    // Zombie hands outstretched forward (with walking motion)
    const handDist = this.radius * 0.9;
    const handSpread = this.radius * 0.65;
    const swing1 = this.armSwing * 4;
    const swing2 = -this.armSwing * 4;

    ctx.fillStyle = bodyColor;
    // Left hand
    ctx.beginPath();
    ctx.arc(handDist + swing1, -handSpread, this.radius * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Right hand
    ctx.beginPath();
    ctx.arc(handDist + swing2, handSpread, this.radius * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Main body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Piercing glowing eyes
    const eyeX = this.radius * 0.45;
    const eyeY = this.radius * 0.32;
    ctx.fillStyle = this.type === 'runner' ? '#facc15' : this.type === 'boss' ? '#fbbf24' : '#ef4444';

    ctx.beginPath();
    ctx.arc(eyeX, -eyeY, 2.5, 0, Math.PI * 2);
    ctx.arc(eyeX, eyeY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Boss crown / spikes
    if (this.type === 'boss') {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-10, -18);
      ctx.lineTo(-4, -26);
      ctx.lineTo(0, -18);
      ctx.lineTo(4, -26);
      ctx.lineTo(10, -18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();

    // Overhead Health bar when damaged (not rotated)
    if (this.hp < this.maxHp && this.type !== 'boss') {
      ctx.save();
      ctx.translate(this.x, this.y);
      const barW = this.radius * 2;
      const barH = 5;
      const pct = Math.max(0, this.hp / this.maxHp);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(-barW / 2, -this.radius - 12, barW, barH);

      ctx.fillStyle = pct > 0.4 ? '#ef4444' : '#b91c1c';
      ctx.fillRect(-barW / 2 + 1, -this.radius - 11, (barW - 2) * pct, barH - 2);
      ctx.restore();
    }
  }
}
