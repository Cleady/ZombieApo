import type { ResourceType } from '../types';

export class ResourceNode {
  public id: number;
  public type: ResourceType;
  public x: number;
  public y: number;
  public radius: number;
  public maxHp: number;
  public hp: number;
  public isDepleted: boolean = false;
  public respawnTimer: number = 0;
  public maxRespawnTime: number = 30; // seconds to regrow

  // Shake feedback
  public shakeTimer: number = 0;
  private shakeOffset = { x: 0, y: 0 };

  // Random visual variations
  public rotation: number;
  private stonePoints: { x: number; y: number }[] = [];

  constructor(id: number, type: ResourceType, x: number, y: number) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.rotation = Math.random() * Math.PI * 2;

    if (type === 'wood') {
      this.radius = 24;
      this.maxHp = 90;
      this.hp = this.maxHp;
    } else {
      // stone
      this.radius = 22;
      this.maxHp = 120;
      this.hp = this.maxHp;
      // Generate jagged stone polygon points
      const pointsCount = 6 + Math.floor(Math.random() * 3);
      for (let i = 0; i < pointsCount; i++) {
        const angle = (i / pointsCount) * Math.PI * 2;
        const dist = this.radius * (0.8 + Math.random() * 0.35);
        this.stonePoints.push({
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
        });
      }
    }
  }

  public hit(power: number): { harvested: number; depleted: boolean } {
    if (this.isDepleted) return { harvested: 0, depleted: false };

    this.hp -= power * 8;
    this.shakeTimer = 0.16; // 160ms of shake

    const harvested = power;

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDepleted = true;
      this.respawnTimer = this.maxRespawnTime;
      return { harvested, depleted: true };
    }

    return { harvested, depleted: false };
  }

  public update(dt: number) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const mag = (this.shakeTimer / 0.16) * 5;
      this.shakeOffset.x = (Math.random() - 0.5) * mag * 2;
      this.shakeOffset.y = (Math.random() - 0.5) * mag * 2;
    } else {
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
    }

    if (this.isDepleted) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.isDepleted = false;
        this.hp = this.maxHp;
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (this.isDepleted) {
      // Render small stump or small pebble
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#1e293b';
      if (this.type === 'wood') {
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    const drawX = this.x + this.shakeOffset.x;
    const drawY = this.y + this.shakeOffset.y;

    ctx.save();
    ctx.translate(drawX, drawY);

    if (this.type === 'wood') {
      // Tree: Multi-layered lush green vector style
      // Trunk shadow
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(3, 8, this.radius, this.radius * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Outer dark green leaves
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#1e293b';
      ctx.fillStyle = '#16a34a'; // Emerald
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Middle brighter ring
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(-2, -2, this.radius * 0.72, 0, Math.PI * 2);
      ctx.fill();

      // Inner highlight
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.arc(-4, -5, this.radius * 0.42, 0, Math.PI * 2);
      ctx.fill();

      // Leaf texture dots
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(-6, -7, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Stone: Jagged faceted rock
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(4, 6, this.radius * 1.05, this.radius * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#1e293b';
      ctx.fillStyle = '#64748b'; // Slate

      if (this.stonePoints.length > 0) {
        ctx.beginPath();
        ctx.moveTo(this.stonePoints[0].x, this.stonePoints[0].y);
        for (let i = 1; i < this.stonePoints.length; i++) {
          ctx.lineTo(this.stonePoints[i].x, this.stonePoints[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Shading facet
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(this.stonePoints[0].x * 0.6, this.stonePoints[0].y * 0.6);
        for (let i = 1; i < Math.floor(this.stonePoints.length / 2); i++) {
          ctx.lineTo(this.stonePoints[i].x * 0.6, this.stonePoints[i].y * 0.6);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // Health bar if damaged
    if (this.hp < this.maxHp) {
      const barW = this.radius * 1.8;
      const barH = 5;
      const pct = Math.max(0, this.hp / this.maxHp);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(-barW / 2, -this.radius - 12, barW, barH);

      ctx.fillStyle = pct > 0.4 ? '#22c55e' : '#ef4444';
      ctx.fillRect(-barW / 2 + 1, -this.radius - 11, (barW - 2) * pct, barH - 2);
    }

    ctx.restore();
  }
}
