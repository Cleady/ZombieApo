import { ParticleManager } from './Particle';

export type ProjectileType = 'arrow' | 'cannonball' | 'bomb' | 'mage';

export interface ChainTarget {
  x: number;
  y: number;
}

export class Projectile {
  public id: number;
  public type: ProjectileType;
  public x: number;
  public y: number;
  public targetX: number;
  public targetY: number;
  public angle: number;
  public speed: number;
  public damage: number;
  public splashRadius: number;
  public chainCount: number;
  public life: number = 0;
  public maxLife: number = 2.5;
  public isExpired: boolean = false;

  // Arc physics for mortar/cannonball/bomb
  private totalDistance: number;
  private distanceTraveled: number = 0;

  constructor(
    id: number,
    type: ProjectileType,
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    damage: number,
    splashRadius: number = 0,
    chainCount: number = 0
  ) {
    this.id = id;
    this.type = type;
    this.x = startX;
    this.y = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.damage = damage;
    this.splashRadius = splashRadius;
    this.chainCount = chainCount;

    const dx = targetX - startX;
    const dy = targetY - startY;
    this.totalDistance = Math.hypot(dx, dy);
    this.angle = Math.atan2(dy, dx);

    switch (type) {
      case 'arrow':
        this.speed = 550;
        this.maxLife = 1.2;
        break;
      case 'cannonball':
        this.speed = 360;
        this.maxLife = 2.0;
        break;
      case 'bomb':
        this.speed = 280;
        this.maxLife = 2.2;
        break;
      case 'mage':
        this.speed = 460;
        this.maxLife = 1.5;
        break;
    }
  }

  public update(dt: number, particleManager: ParticleManager): { detonated: boolean } {
    this.life += dt;
    const step = this.speed * dt;
    this.distanceTraveled += step;

    this.x += Math.cos(this.angle) * step;
    this.y += Math.sin(this.angle) * step;

    // Trail particle
    if (this.type === 'arrow' && Math.random() < 0.4) {
      particleManager.emit(this.x, this.y, 1, '#cbd5e1', 15, 2, 4);
    } else if (this.type === 'cannonball' && Math.random() < 0.5) {
      particleManager.emit(this.x, this.y, 1, '#64748b', 20, 3, 3);
    } else if (this.type === 'bomb') {
      particleManager.emit(this.x, this.y, 2, '#f97316', 30, 3, 4);
    } else if (this.type === 'mage') {
      particleManager.emit(this.x, this.y, 2, '#c084fc', 25, 3.5, 4);
    }

    // Detonate condition for mortar/bomb/cannonball reaching target distance
    if ((this.type === 'bomb' || this.type === 'cannonball') && this.distanceTraveled >= this.totalDistance) {
      this.isExpired = true;
      return { detonated: true };
    }

    if (this.life >= this.maxLife) {
      this.isExpired = true;
      return { detonated: this.type === 'bomb' || this.type === 'cannonball' };
    }

    return { detonated: false };
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#1e293b';

    switch (this.type) {
      case 'arrow':
        // Wooden shaft + steel arrowhead + feathers
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-10, -1.5, 20, 3);
        // Arrow head
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(6, -4);
        ctx.lineTo(6, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Fletching feathers
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-10, -3.5, 3, 7);
        break;

      case 'cannonball':
        // Shadow offset based on height arc
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Highlight
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(-2, -2, 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'bomb':
        // Bomb sphere
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Fuse cap
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-9, -2, 4, 4);
        // Spark
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(-11, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'mage':
        // Glowing magic missile
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Inner white hot core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(2, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  }
}
