import { WORLD_WIDTH, WORLD_HEIGHT, GRID_SIZE } from '../constants';
import { Camera } from './Camera';
import { Player } from '../entities/Player';
import { Building } from '../entities/Building';
import { ResourceNode } from '../entities/ResourceNode';
import { Zombie } from '../entities/Zombie';
import { Projectile } from '../entities/Projectile';
import { ParticleManager } from '../entities/Particle';
import { FloatingTextManager } from '../entities/FloatingText';
import type { BuildingType, GamePhase } from '../types';
import { BUILDING_STATS } from '../constants';

export class Renderer {
  private lightingCanvas: HTMLCanvasElement;
  private lightingCtx: CanvasRenderingContext2D | null;

  constructor() {
    this.lightingCanvas = document.createElement('canvas');
    this.lightingCtx = this.lightingCanvas.getContext('2d');
  }

  public render(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    player: Player,
    buildings: Building[],
    resourceNodes: ResourceNode[],
    zombies: Zombie[],
    projectiles: Projectile[],
    particleManager: ParticleManager,
    floatingTexts: FloatingTextManager,
    phase: GamePhase,
    phaseProgress: number,
    selectedBuilding: Building | null,
    ghostPlacement: {
      type: BuildingType;
      cellX: number;
      cellY: number;
      valid: boolean;
    } | null
  ) {
    const width = camera.viewportWidth;
    const height = camera.viewportHeight;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    camera.applyTransform(ctx);

    // 1. Draw World Background & Grid
    this.renderEnvironment(ctx, camera);

    // 2. Draw Resource Nodes (Trees & Stones)
    for (const node of resourceNodes) {
      // Frustum culling
      if (this.isInView(node.x, node.y, 40, camera)) {
        node.render(ctx);
      }
    }

    // 3. Draw Buildings
    for (const building of buildings) {
      if (this.isInView(building.x, building.y, 50, camera)) {
        building.render(ctx, selectedBuilding?.id === building.id);
      }
    }

    // 4. Draw Ghost Placement Preview
    if (ghostPlacement) {
      this.renderGhostPlacement(ctx, ghostPlacement);
    }

    // 5. Draw Zombies
    for (const zombie of zombies) {
      if (this.isInView(zombie.x, zombie.y, 50, camera)) {
        zombie.render(ctx);
      }
    }

    // 6. Draw Player
    player.render(ctx);

    // 7. Draw Projectiles
    for (const proj of projectiles) {
      if (this.isInView(proj.x, proj.y, 30, camera)) {
        proj.render(ctx);
      }
    }

    // 8. Draw Particles
    particleManager.render(ctx);

    // 9. Day/Night Lighting Overlay with Dynamic Halos
    this.renderLighting(ctx, camera, player, buildings, projectiles, phase, phaseProgress);

    // 10. Draw Floating Texts (on top of lighting so clearly readable!)
    floatingTexts.render(ctx);

    ctx.restore();
  }

  private isInView(x: number, y: number, margin: number, camera: Camera): boolean {
    const left = camera.x - camera.viewportWidth / 2 - margin;
    const right = camera.x + camera.viewportWidth / 2 + margin;
    const top = camera.y - camera.viewportHeight / 2 - margin;
    const bottom = camera.y + camera.viewportHeight / 2 + margin;
    return x >= left && x <= right && y >= top && y <= bottom;
  }

  private renderEnvironment(ctx: CanvasRenderingContext2D, camera: Camera) {
    // Fill lush green background
    ctx.fillStyle = '#56ab2f';
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    const startX = Math.max(0, Math.floor((camera.x - camera.viewportWidth / 2) / GRID_SIZE) * GRID_SIZE);
    const endX = Math.min(WORLD_WIDTH, Math.ceil((camera.x + camera.viewportWidth / 2) / GRID_SIZE) * GRID_SIZE);
    const startY = Math.max(0, Math.floor((camera.y - camera.viewportHeight / 2) / GRID_SIZE) * GRID_SIZE);
    const endY = Math.min(WORLD_HEIGHT, Math.ceil((camera.y + camera.viewportHeight / 2) / GRID_SIZE) * GRID_SIZE);

    for (let x = startX; x <= endX; x += GRID_SIZE) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += GRID_SIZE) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // World Boundaries: Striped barrier border
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, WORLD_WIDTH - 12, WORLD_HEIGHT - 12);

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, WORLD_WIDTH - 12, WORLD_HEIGHT - 12);
  }

  private renderGhostPlacement(
    ctx: CanvasRenderingContext2D,
    ghost: { type: BuildingType; cellX: number; cellY: number; valid: boolean }
  ) {
    const x = ghost.cellX * GRID_SIZE + GRID_SIZE / 2;
    const y = ghost.cellY * GRID_SIZE + GRID_SIZE / 2;
    const half = GRID_SIZE / 2 - 2;

    ctx.save();
    ctx.translate(x, y);

    // Fill color: semi-transparent green or red
    const fillColor = ghost.valid ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)';
    const strokeColor = ghost.valid ? '#22c55e' : '#ef4444';

    ctx.fillStyle = fillColor;
    ctx.fillRect(-half, -half, half * 2, half * 2);

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-half, -half, half * 2, half * 2);

    // Attack range preview circle if tower
    const stats = BUILDING_STATS[ghost.type][0];
    if (stats.range) {
      ctx.beginPath();
      ctx.arc(0, 0, stats.range, 0, Math.PI * 2);
      ctx.fillStyle = ghost.valid ? 'rgba(56, 189, 248, 0.08)' : 'rgba(239, 68, 68, 0.08)';
      ctx.fill();
      ctx.strokeStyle = ghost.valid ? 'rgba(56, 189, 248, 0.5)' : 'rgba(239, 68, 68, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  private renderLighting(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    player: Player,
    buildings: Building[],
    projectiles: Projectile[],
    phase: GamePhase,
    phaseProgress: number
  ) {
    if (phase === 'day' || phase === 'peaceful') {
      return; // Clear bright daylight
    }

    // Determine ambient darkness color and alpha
    let darknessAlpha = 0;
    let overlayColor = '10, 16, 38'; // Navy darkness

    if (phase === 'sunset') {
      darknessAlpha = phaseProgress * 0.45;
      overlayColor = '180, 83, 9'; // Golden amber sunset
    } else if (phase === 'night') {
      darknessAlpha = 0.88;
      overlayColor = '10, 16, 38';
    }

    if (darknessAlpha <= 0) return;

    // Use lighting canvas to cut out soft circular holes for light sources
    const w = camera.viewportWidth;
    const h = camera.viewportHeight;

    if (this.lightingCanvas.width !== w || this.lightingCanvas.height !== h) {
      this.lightingCanvas.width = w;
      this.lightingCanvas.height = h;
    }

    if (!this.lightingCtx) return;
    const lCtx = this.lightingCtx;

    // 1. Fill with darkness
    lCtx.clearRect(0, 0, w, h);
    lCtx.fillStyle = `rgba(${overlayColor}, ${darknessAlpha})`;
    lCtx.fillRect(0, 0, w, h);

    // 2. Cut out glowing light halos using destination-out
    lCtx.globalCompositeOperation = 'destination-out';

    // Player light halo
    const pScreen = camera.worldToScreen(player.x, player.y);
    this.drawLightHalo(lCtx, pScreen.x, pScreen.y, 165);

    // Gold Stash halo (large warm beacon)
    for (const b of buildings) {
      if (b.type === 'goldStash' && !b.isDestroyed) {
        const bScreen = camera.worldToScreen(b.x, b.y);
        this.drawLightHalo(lCtx, bScreen.x, bScreen.y, 220);
      } else if (
        (b.type === 'arrowTower' || b.type === 'cannonTower' || b.type === 'bombTower' || b.type === 'mageTower') &&
        !b.isDestroyed
      ) {
        const bScreen = camera.worldToScreen(b.x, b.y);
        this.drawLightHalo(lCtx, bScreen.x, bScreen.y, 110);
      }
    }

    // Projectile glowing lights (bombs, mage missiles)
    for (const proj of projectiles) {
      if (proj.type === 'bomb' || proj.type === 'mage') {
        const prScreen = camera.worldToScreen(proj.x, proj.y);
        this.drawLightHalo(lCtx, prScreen.x, prScreen.y, 90);
      }
    }

    lCtx.globalCompositeOperation = 'source-over';

    // Draw darkness layer onto main canvas in screen coordinates
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to screen space
    ctx.drawImage(this.lightingCanvas, 0, 0);
    ctx.restore();
  }

  private drawLightHalo(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.7)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
