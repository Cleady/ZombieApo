import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import type { UIState } from './game/GameEngine';
import type { BuildingType, WeaponType } from './game/types';
import { TopBar } from './components/HUD/TopBar';
import { Hotbar } from './components/HUD/Hotbar';
import { Minimap } from './components/HUD/Minimap';
import { ResourceHUD } from './components/HUD/ResourceHUD';
import { BuildingCard } from './components/HUD/BuildingCard';
import { ShopModal } from './components/HUD/ShopModal';
import { GameOverModal } from './components/HUD/GameOverModal';
import { ControlsOverlay } from './components/HUD/ControlsOverlay';
import { soundManager } from './game/audio/SoundManager';

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);

  const [uiState, setUiState] = useState<UIState>({
    resources: { wood: 100, stone: 80, gold: 20 },
    health: 100,
    maxHealth: 100,
    shield: 0,
    maxShield: 0,
    shieldTier: 0,
    potionsCount: 2,
    wave: 0,
    phase: 'peaceful',
    phaseTimer: 0,
    phaseProgress: 0,
    activeZombieCount: 0,
    isBossWave: false,
    bossHp: 0,
    bossMaxHp: 0,
    selectedBuilding: null,
    placementType: null,
    selectedWeapon: 'pickaxe',
    weaponTiers: { pickaxe: 1, spear: 0, bow: 0, bomb: 0 },
    isGameOver: false,
    gameStats: {
      wave: 0,
      zombiesKilled: 0,
      timeSurvived: 0,
      resourcesGathered: { wood: 100, stone: 80, gold: 20 },
      score: 0,
    },
    isMuted: soundManager.getMuted(),
  });

  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, (state) => {
      setUiState(state);
    });
    gameEngineRef.current = engine;
    engine.start();

    // Keydown for B key to toggle shop
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key.toLowerCase() === 'b') {
        setIsShopOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      engine.stop();
    };
  }, []);

  const handleSelectWeapon = useCallback((weapon: WeaponType) => {
    gameEngineRef.current?.selectWeapon(weapon);
  }, []);

  const handleSelectBuilding = useCallback((type: BuildingType) => {
    gameEngineRef.current?.selectPlacement(type);
  }, []);

  const handleUpgradeBuilding = useCallback((b: any) => {
    gameEngineRef.current?.upgradeBuilding(b);
  }, []);

  const handleRepairBuilding = useCallback((b: any) => {
    gameEngineRef.current?.repairBuilding(b);
  }, []);

  const handleSellBuilding = useCallback((b: any) => {
    gameEngineRef.current?.sellBuilding(b);
  }, []);

  const handleCloseBuildingCard = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.selectedBuilding = null;
      setUiState((prev) => ({ ...prev, selectedBuilding: null }));
    }
  }, []);

  const handleUpgradeWeapon = useCallback((type: WeaponType) => {
    gameEngineRef.current?.buyWeaponUpgrade(type);
  }, []);

  const handleUpgradeShield = useCallback(() => {
    gameEngineRef.current?.buyShieldUpgrade();
  }, []);

  const handleBuyPotion = useCallback(() => {
    gameEngineRef.current?.buyPotion();
  }, []);

  const handleUsePotion = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.player.usePotion(gameEngineRef.current.floatingTexts);
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = soundManager.toggleMute();
    setUiState((prev) => ({ ...prev, isMuted: muted }));
  }, []);

  const handleRestart = useCallback(() => {
    gameEngineRef.current?.restart();
  }, []);

  // Compute Stash Tier to restrict upgrades
  const stash = gameEngineRef.current?.grid.getGoldStash();
  const stashTier = stash ? stash.tier : 1;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Interactive HTML5 Canvas Game World */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair touch-none"
      />

      {/* HUD: Top Bar (Wave, Day/Night Progress, Zombies, Boss Bar) */}
      <TopBar uiState={uiState} />

      {/* HUD: Controls Overlay & Mute Button (Top Right) */}
      <ControlsOverlay
        isMuted={uiState.isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* HUD: Minimap (Bottom Left) */}
      <Minimap gameEngine={gameEngineRef.current} />

      {/* HUD: Hotbar (Bottom Center) */}
      <Hotbar
        uiState={uiState}
        onSelectWeapon={handleSelectWeapon}
        onSelectBuilding={handleSelectBuilding}
      />

      {/* HUD: Resource HUD & Player Bars (Bottom Right) */}
      <ResourceHUD
        uiState={uiState}
        onOpenShop={() => setIsShopOpen(true)}
        onUsePotion={handleUsePotion}
      />

      {/* Floating Building Action Card (When a building is selected) */}
      {uiState.selectedBuilding && gameEngineRef.current && (
        <BuildingCard
          building={uiState.selectedBuilding}
          camera={gameEngineRef.current.camera}
          resources={uiState.resources}
          stashTier={stashTier}
          onUpgrade={handleUpgradeBuilding}
          onRepair={handleRepairBuilding}
          onSell={handleSellBuilding}
          onClose={handleCloseBuildingCard}
        />
      )}

      {/* Shop Modal [B] */}
      <ShopModal
        uiState={uiState}
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        onUpgradeWeapon={handleUpgradeWeapon}
        onUpgradeShield={handleUpgradeShield}
        onBuyPotion={handleBuyPotion}
      />

      {/* Game Over Summary Modal */}
      <GameOverModal
        isOpen={uiState.isGameOver}
        gameStats={uiState.gameStats}
        onRestart={handleRestart}
      />
    </div>
  );
};

export default App;
