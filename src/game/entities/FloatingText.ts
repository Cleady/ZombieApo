export interface FloatingTextData {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
  fontSize: number;
}

export class FloatingTextManager {
  private items: FloatingTextData[] = [];
  private nextId = 1;

  public add(text: string, x: number, y: number, color: string = '#ffffff', fontSize: number = 14) {
    this.items.push({
      id: this.nextId++,
      text,
      x: x + (Math.random() - 0.5) * 16,
      y: y + (Math.random() - 0.5) * 8,
      color,
      life: 0.85,
      maxLife: 0.85,
      vy: -35,
      fontSize,
    });
  }

  public update(dt: number) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.life -= dt;
      item.y += item.vy * dt;
      if (item.life <= 0) {
        this.items.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const item of this.items) {
      const progress = item.life / item.maxLife;
      const alpha = Math.min(1, progress * 1.5);
      const scale = 1 + (1 - progress) * 0.25;

      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;

      ctx.font = `bold ${item.fontSize}px 'Nunito', 'Fredoka', 'Outfit', sans-serif`;
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#0f172a';
      ctx.strokeText(item.text, 0, 0);

      ctx.fillStyle = item.color;
      ctx.fillText(item.text, 0, 0);

      ctx.restore();
    }

    ctx.restore();
  }
}
