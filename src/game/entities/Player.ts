import type { WeaponType, ResourceType } from '../types';
import {
  PLAYER_BASE_SPEED,
  PLAYER_RADIUS,
  PLAYER_MAX_HP,
  PLAYER_REGEN_DELAY,
  PLAYER_REGEN_RATE,
  WEAPON_STATS,
  SHIELD_TIERS,
  POTION_HEAL_AMOUNT,
  WORLD_WIDTH,
  WORLD_HEIGHT,
} from '../constants';
import { soundManager } from '../audio/SoundManager';
import { Building } from './Building';
import { ResourceNode } from './ResourceNode';
import { Zombie } from './Zombie';
import { ParticleManager } from './Particle';
import { FloatingTextManager } from './FloatingText';

export interface PlayerInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  mouseX: number;
  mouseY: number;
  isMouseDown: boolean;
}

export class Player {
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public angle: number = 0;
  public radius: number = PLAYER_RADIUS;

  // Health and Shield
  public hp: number = PLAYER_MAX_HP;
  public maxHp: number = PLAYER_MAX_HP;
  public shield: number = 0;
  public maxShield: number = 0;
  public shieldTier: number = 0;
  public potionsCount: number = 2; // Start with 2 free potions
  public damageCooldownTimer: number = 0; // seconds since last damage
  public isDead: boolean = false;

  // Weapons and Tools
  public weaponTiers: Record<WeaponType, number> = {
    pickaxe: 1,
    spear: 0, // 0 = locked
    bow: 0,
    bomb: 0,
  };
  public selectedWeapon: WeaponType = 'pickaxe';
  public attackCooldown: number = 0;

  // Attack animations
  public swingProgress: number = 0; // 0 to 1
  public thrustProgress: number = 0; // 0 to 1

  constructor(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
  }

  public getWeaponStats(type: WeaponType = this.selectedWeapon) {
    const tier = this.weaponTiers[type];
    if (tier <= 0) return null;
    return WEAPON_STATS[type][tier - 1];
  }

  public takeDamage(amount: number, floatingTexts?: FloatingTextManager): boolean {
    if (this.isDead) return false;

    this.damageCooldownTimer = PLAYER_REGEN_DELAY;
    soundManager.playPlayerHurt();

    let remaining = amount;
    // Shield absorbs damage first
    if (this.shield > 0) {
      if (this.shield >= remaining) {
        this.shield -= remaining;
        remaining = 0;
      } else {
        remaining -= this.shield;
        this.shield = 0;
      }
    }

    if (remaining > 0) {
      this.hp -= remaining;
      if (floatingTexts) {
        floatingTexts.add(`-${remaining}`, this.x, this.y - 12, '#ef4444', 15);
      }
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      return true;
    }
    return false;
  }

  public usePotion(floatingTexts?: FloatingTextManager): boolean {
    if (this.potionsCount > 0 && this.hp < this.maxHp) {
      this.potionsCount--;
      const heal = Math.min(POTION_HEAL_AMOUNT, this.maxHp - this.hp);
      this.hp += heal;
      soundManager.playPotion();
      if (floatingTexts) {
        floatingTexts.add(`+${heal} HP`, this.x, this.y - 15, '#22c55e', 16);
      }
      return true;
    }
    return false;
  }

  public upgradeShield(): boolean {
    if (this.shieldTier < SHIELD_TIERS.length) {
      this.shieldTier++;
      const config = SHIELD_TIERS[this.shieldTier - 1];
      this.maxShield = config.maxShield;
      this.shield = this.maxShield;
      soundManager.playUpgrade();
      return true;
    }
    return false;
  }

  public update(
    dt: number,
    input: PlayerInput,
    buildings: Building[],
    resourceNodes: ResourceNode[],
    zombies: Zombie[],
    particleManager: ParticleManager,
    floatingTexts: FloatingTextManager,
    onShootProjectile: (
      type: 'arrow' | 'bomb',
      targetX: number,
      targetY: number,
      damage: number
    ) => void,
    onHarvest: (type: ResourceType, amount: number) => void
  ) {
    if (this.isDead) return;

    // Movement calculation
    let mx = 0;
    let my = 0;
    if (input.up) my -= 1;
    if (input.down) my += 1;
    if (input.left) mx -= 1;
    if (input.right) mx += 1;

    if (mx !== 0 && my !== 0) {
      mx *= 0.7071;
      my *= 0.7071;
    }

    const targetVx = mx * PLAYER_BASE_SPEED;
    const targetVy = my * PLAYER_BASE_SPEED;

    this.vx += (targetVx - this.vx) * dt * 14;
    this.vy += (targetVy - this.vy) * dt * 14;

    // Next position
    let nextX = this.x + this.vx * dt;
    let nextY = this.y + this.vy * dt;

    // World boundary collision
    nextX = Math.max(this.radius + 10, Math.min(WORLD_WIDTH - this.radius - 10, nextX));
    nextY = Math.max(this.radius + 10, Math.min(WORLD_HEIGHT - this.radius - 10, nextY));

    // Building collision (doors allow player to walk through!)
    for (const b of buildings) {
      if (b.isDestroyed || b.type === 'door') continue;

      const half = b.width / 2;
      const closestX = Math.max(b.x - half, Math.min(nextX, b.x + half));
      const closestY = Math.max(b.y - half, Math.min(nextY, b.y + half));
      const distX = nextX - closestX;
      const distY = nextY - closestY;
      const distSq = distX * distX + distY * distY;

      if (distSq < this.radius * this.radius) {
        const d = Math.sqrt(distSq) || 1;
        const overlap = this.radius - d;
        nextX += (distX / d) * overlap;
        nextY += (distY / d) * overlap;
      }
    }

    this.x = nextX;
    this.y = nextY;

    // Aim towards mouse
    this.angle = Math.atan2(input.mouseY - this.y, input.mouseX - this.x);

    // Health and Shield Regen
    if (this.damageCooldownTimer > 0) {
      this.damageCooldownTimer -= dt;
    } else {
      if (this.hp < this.maxHp) {
        this.hp = Math.min(this.maxHp, this.hp + PLAYER_REGEN_RATE * dt);
      }
      if (this.shieldTier > 0 && this.shield < this.maxShield) {
        const regenRate = SHIELD_TIERS[this.shieldTier - 1].regenRate;
        this.shield = Math.min(this.maxShield, this.shield + regenRate * dt);
      }
    }

    // Cooldown and attack animations
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    if (this.swingProgress > 0) {
      this.swingProgress = Math.max(0, this.swingProgress - dt * 5.5);
    }
    if (this.thrustProgress > 0) {
      this.thrustProgress = Math.max(0, this.thrustProgress - dt * 6);
    }

    // Attack Triggering
    if (input.isMouseDown && this.attackCooldown <= 0) {
      const stats = this.getWeaponStats();
      if (stats) {
        this.attackCooldown = stats.cooldown;

        if (this.selectedWeapon === 'pickaxe') {
          this.swingProgress = 1.0;
          this.handlePickaxeAttack(stats, resourceNodes, zombies, particleManager, floatingTexts, onHarvest);
        } else if (this.selectedWeapon === 'spear') {
          this.thrustProgress = 1.0;
          this.handleSpearAttack(stats, zombies, particleManager, floatingTexts);
        } else if (this.selectedWeapon === 'bow') {
          soundManager.playArrow();
          onShootProjectile('arrow', input.mouseX, input.mouseY, stats.damage);
        } else if (this.selectedWeapon === 'bomb') {
          soundManager.playExplosion();
          onShootProjectile('bomb', input.mouseX, input.mouseY, stats.damage);
        }
      }
    }
  }

  private handlePickaxeAttack(
    stats: { damage: number; range: number; harvestPower?: number },
    resourceNodes: ResourceNode[],
    zombies: Zombie[],
    particleManager: ParticleManager,
    floatingTexts: FloatingTextManager,
    onHarvest: (type: ResourceType, amount: number) => void
  ) {
    const reach = this.radius + stats.range;
    const hitX = this.x + Math.cos(this.angle) * reach * 0.75;
    const hitY = this.y + Math.sin(this.angle) * reach * 0.75;

    // Check hit on resource nodes
    let hitNode: ResourceNode | null = null;
    let closestNodeDist = reach;

    for (const node of resourceNodes) {
      if (node.isDepleted) continue;
      const dist = Math.hypot(node.x - hitX, node.y - hitY);
      if (dist <= node.radius + 20 && dist < closestNodeDist) {
        closestNodeDist = dist;
        hitNode = node;
      }
    }

    if (hitNode) {
      const power = stats.harvestPower || 3;
      const { harvested } = hitNode.hit(power);
      if (harvested > 0) {
        onHarvest(hitNode.type, harvested);
        if (hitNode.type === 'wood') {
          soundManager.playChop();
          particleManager.emit(hitNode.x, hitNode.y, 6, '#d97706', 45, 3.5, 3, true);
          floatingTexts.add(`+${harvested} Wood`, hitNode.x, hitNode.y - 12, '#4ade80', 14);
        } else {
          soundManager.playMine();
          particleManager.emit(hitNode.x, hitNode.y, 6, '#94a3b8', 50, 3, 3, true);
          floatingTexts.add(`+${harvested} Stone`, hitNode.x, hitNode.y - 12, '#cbd5e1', 14);
        }
      }
      return;
    }

    // Check hit on zombies
    for (const z of zombies) {
      if (z.isDead) continue;
      const dist = Math.hypot(z.x - hitX, z.y - hitY);
      if (dist <= z.radius + 18) {
        soundManager.playZombieHit();
        const kx = Math.cos(this.angle) * 120;
        const ky = Math.sin(this.angle) * 120;
        z.takeDamage(stats.damage, kx, ky, particleManager, floatingTexts);
      }
    }
  }

  private handleSpearAttack(
    stats: { damage: number; range: number },
    zombies: Zombie[],
    particleManager: ParticleManager,
    floatingTexts: FloatingTextManager
  ) {
    soundManager.playArrow(); // whoosh sound
    const reach = this.radius + stats.range;
    const hitX = this.x + Math.cos(this.angle) * reach;
    const hitY = this.y + Math.sin(this.angle) * reach;

    // Pierce hit on all zombies along the spear thrust line
    for (const z of zombies) {
      if (z.isDead) continue;
      const dist = Math.hypot(z.x - hitX, z.y - hitY);
      if (dist <= z.radius + 25) {
        soundManager.playZombieHit();
        const kx = Math.cos(this.angle) * 220;
        const ky = Math.sin(this.angle) * 220;
        z.takeDamage(stats.damage, kx, ky, particleManager, floatingTexts);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(3, 5, this.radius, this.radius * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shield bubble if active
    if (this.shield > 0) {
      const shieldRatio = this.shield / this.maxShield;
      ctx.strokeStyle = `rgba(6, 182, 212, ${0.4 + shieldRatio * 0.4})`;
      ctx.lineWidth = 3;
      ctx.fillStyle = `rgba(6, 182, 212, ${0.1 + shieldRatio * 0.15})`;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Hands and Weapon
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#1e293b';

    const handSpread = 12;
    const handDist = 14;

    // Render Equipped Weapon
    this.renderWeapon(ctx, handDist, handSpread);

    // Player Hands
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(handDist, -handSpread, 5.5, 0, Math.PI * 2);
    ctx.arc(handDist, handSpread, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Player Body (Classic .io circle)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(this.radius * 0.5, -4.5, 2.8, 0, Math.PI * 2);
    ctx.arc(this.radius * 0.5, 4.5, 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderWeapon(ctx: CanvasRenderingContext2D, handDist: number, handSpread: number) {
    ctx.save();

    if (this.selectedWeapon === 'pickaxe') {
      // Swing rotation
      const swingAngle = (1 - this.swingProgress) * 1.4 - 0.7;
      ctx.translate(handDist + 4, handSpread);
      ctx.rotate(swingAngle);

      // Wooden handle
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-2, -18, 4, 24);
      ctx.strokeRect(-2, -18, 4, 24);

      // Curved pick head
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(-10, -18);
      ctx.lineTo(10, -18);
      ctx.lineTo(12, -22);
      ctx.lineTo(0, -20);
      ctx.lineTo(-12, -22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.selectedWeapon === 'spear') {
      // Thrust offset
      const thrust = (1 - Math.abs(this.thrustProgress - 0.5) * 2) * 24;
      ctx.translate(handDist + thrust, 0);

      // Spear shaft
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-15, -2, 45, 4);
      ctx.strokeRect(-15, -2, 45, 4);

      // Spear tip
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(35, 0);
      ctx.lineTo(24, -6);
      ctx.lineTo(24, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.selectedWeapon === 'bow') {
      ctx.translate(handDist + 6, 0);

      // Bow curve
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 16, -Math.PI / 2.5, Math.PI / 2.5);
      ctx.stroke();

      // String
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(7, -13);
      ctx.lineTo(0, 0);
      ctx.lineTo(7, 13);
      ctx.stroke();
    } else if (this.selectedWeapon === 'bomb') {
      ctx.translate(handDist + 5, 0);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Fuse spark
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, -9, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
