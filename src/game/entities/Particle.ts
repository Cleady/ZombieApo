export interface ParticleData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  vRot: number;
  isSquare?: boolean;
}

export class ParticleManager {
  private particles: ParticleData[] = [];

  public emit(
    x: number,
    y: number,
    count: number,
    color: string,
    speed: number = 80,
    size: number = 4,
    decay: number = 2.5,
    isSquare: boolean = false
  ) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (Math.random() * 0.7 + 0.3) * speed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: size * (0.6 + Math.random() * 0.8),
        color,
        alpha: 1.0,
        decay: decay * (0.8 + Math.random() * 0.4),
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 8,
        isSquare,
      });
    }
  }

  // Explosion effect with smoke + fire sparks
  public emitExplosion(x: number, y: number, radius: number = 50) {
    // Fire sparks
    this.emit(x, y, 16, '#fbbf24', radius * 3.5, 5, 2.8);
    this.emit(x, y, 12, '#f97316', radius * 2.8, 6, 2.2);
    this.emit(x, y, 10, '#ef4444', radius * 2.0, 7, 1.8);
    // Smoke puffs
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * radius * 1.2;
      this.particles.push({
        x: x + Math.cos(angle) * 10,
        y: y + Math.sin(angle) * 10,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 10 + Math.random() * 8,
        color: '#475569',
        alpha: 0.7,
        decay: 1.4,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 3,
        isSquare: false,
      });
    }
  }

  public update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.rotation += p.vRot * dt;
      p.alpha -= p.decay * dt;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      ctx.fillStyle = p.color;
      if (p.isSquare) {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }
}
