import React, { useRef, useEffect } from 'react';
import { GameEngine } from '../../game/GameEngine';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../game/constants';
import { MapPin } from 'lucide-react';

interface MinimapProps {
  gameEngine: GameEngine | null;
}

export const Minimap: React.FC<MinimapProps> = ({ gameEngine }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;

    const renderMinimap = () => {
      if (!canvasRef.current || !gameEngine) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const mapW = canvas.width;
      const mapH = canvas.height;
      const scaleX = mapW / WORLD_WIDTH;
      const scaleY = mapH / WORLD_HEIGHT;

      // Clear minimap
      ctx.fillStyle = '#3f7e22'; // Darker grass
      ctx.fillRect(0, 0, mapW, mapH);

      // Border
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, mapW, mapH);

      // 1. Draw Trees and Stones
      for (const node of gameEngine.resourceNodes) {
        if (node.isDepleted) continue;
        ctx.fillStyle = node.type === 'wood' ? '#22c55e' : '#94a3b8';
        ctx.fillRect(node.x * scaleX - 1, node.y * scaleY - 1, 2, 2);
      }

      // 2. Draw Buildings
      for (const b of gameEngine.grid.getAllBuildings()) {
        if (b.isDestroyed) continue;
        if (b.type === 'goldStash') {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(b.x * scaleX, b.y * scaleY, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = b.type === 'wall' ? '#64748b' : '#38bdf8';
          ctx.fillRect(b.x * scaleX - 1.5, b.y * scaleY - 1.5, 3, 3);
        }
      }

      // 3. Draw Zombies (Flashing Red Dots)
      ctx.fillStyle = '#ef4444';
      for (const z of gameEngine.waveManager.activeZombies) {
        if (z.isDead) continue;
        const zRadius = z.type === 'boss' ? 3.5 : z.type === 'brute' ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.arc(z.x * scaleX, z.y * scaleY, zRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Draw Camera Viewport Box
      const cam = gameEngine.camera;
      const vpW = cam.viewportWidth * scaleX;
      const vpH = cam.viewportHeight * scaleY;
      const vpX = (cam.x - cam.viewportWidth / 2) * scaleX;
      const vpY = (cam.y - cam.viewportHeight / 2) * scaleY;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(vpX, vpY, vpW, vpH);

      // 5. Draw Player (Bright Cyan/Green with Aim Pointer)
      const p = gameEngine.player;
      const px = p.x * scaleX;
      const py = p.y * scaleY;

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();

      // Aim direction line
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(p.angle) * 7, py + Math.sin(p.angle) * 7);
      ctx.stroke();

      animId = requestAnimationFrame(renderMinimap);
    };

    renderMinimap();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [gameEngine]);

  return (
    <div className="absolute bottom-4 left-4 z-20 pointer-events-auto">
      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700/80 bg-slate-900/90 shadow-2xl backdrop-blur-md">
        <canvas ref={canvasRef} width={160} height={160} className="block" />
        <div className="absolute top-1.5 left-2 flex items-center gap-1 text-[10px] font-bold text-slate-300 pointer-events-none drop-shadow">
          <MapPin className="w-3 h-3 text-emerald-400" />
          <span>RADAR</span>
        </div>
      </div>
    </div>
  );
};
