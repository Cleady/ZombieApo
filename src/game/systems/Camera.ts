import { WORLD_WIDTH, WORLD_HEIGHT } from '../constants';

export class Camera {
  public x: number = WORLD_WIDTH / 2;
  public y: number = WORLD_HEIGHT / 2;
  public viewportWidth: number = 800;
  public viewportHeight: number = 600;

  // Screen shake
  public shakeDuration: number = 0;
  public shakeIntensity: number = 0;
  public shakeOffsetX: number = 0;
  public shakeOffsetY: number = 0;

  constructor(initialX: number = WORLD_WIDTH / 2, initialY: number = WORLD_HEIGHT / 2) {
    this.x = initialX;
    this.y = initialY;
  }

  public resize(width: number, height: number) {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  public shake(intensity: number = 6, duration: number = 0.2) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
  }

  public update(dt: number, targetX: number, targetY: number) {
    // Smooth camera lerp
    this.x += (targetX - this.x) * Math.min(1, dt * 7);
    this.y += (targetY - this.y) * Math.min(1, dt * 7);

    // Clamp to map boundaries
    const halfW = this.viewportWidth / 2;
    const halfH = this.viewportHeight / 2;

    if (this.viewportWidth < WORLD_WIDTH) {
      this.x = Math.max(halfW, Math.min(WORLD_WIDTH - halfW, this.x));
    } else {
      this.x = WORLD_WIDTH / 2;
    }

    if (this.viewportHeight < WORLD_HEIGHT) {
      this.y = Math.max(halfH, Math.min(WORLD_HEIGHT - halfH, this.y));
    } else {
      this.y = WORLD_HEIGHT / 2;
    }

    // Shake update
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const mag = this.shakeIntensity * (this.shakeDuration / 0.2);
      this.shakeOffsetX = (Math.random() - 0.5) * mag * 2;
      this.shakeOffsetY = (Math.random() - 0.5) * mag * 2;
    } else {
      this.shakeIntensity = 0;
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  public applyTransform(ctx: CanvasRenderingContext2D) {
    ctx.translate(
      Math.round(this.viewportWidth / 2 - this.x + this.shakeOffsetX),
      Math.round(this.viewportHeight / 2 - this.y + this.shakeOffsetY)
    );
  }

  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: screenX - this.viewportWidth / 2 + this.x - this.shakeOffsetX,
      y: screenY - this.viewportHeight / 2 + this.y - this.shakeOffsetY,
    };
  }

  public worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX - this.x + this.viewportWidth / 2 + this.shakeOffsetX,
      y: worldY - this.y + this.viewportHeight / 2 + this.shakeOffsetY,
    };
  }
}
