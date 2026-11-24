import type { GamePhase, EnemyType } from '../types';
import { DAY_DURATION, SUNSET_DURATION, NIGHT_DURATION, WORLD_WIDTH, WORLD_HEIGHT } from '../constants';
import { Zombie } from '../entities/Zombie';
import { soundManager } from '../audio/SoundManager';
import confetti from 'canvas-confetti';

export class WaveManager {
  public phase: GamePhase = 'peaceful';
  public waveNumber: number = 0;
  public phaseTimer: number = 0;
  public totalTimeSurvived: number = 0;
  public zombiesKilledTotal: number = 0;

  // Wave spawn state
  public zombiesToSpawn: { type: EnemyType }[] = [];
  public spawnTimer: number = 0;
  public activeZombies: Zombie[] = [];
  private nextZombieId: number = 1;

  public isBossWave: boolean = false;
  public bossZombie: Zombie | null = null;

  public startCycle() {
    this.phase = 'day';
    this.waveNumber = 1;
    this.phaseTimer = DAY_DURATION;
  }

  public getPhaseProgress(): number {
    if (this.phase === 'peaceful') return 0;
    if (this.phase === 'day') return 1 - this.phaseTimer / DAY_DURATION;
    if (this.phase === 'sunset') return 1 - this.phaseTimer / SUNSET_DURATION;
    if (this.phase === 'night') return 1 - this.phaseTimer / NIGHT_DURATION;
    return 0;
  }

  public update(
    dt: number,
    hasGoldStash: boolean,
    onWaveComplete: (wave: number, bonusGold: number) => void
  ) {
    if (!hasGoldStash) {
      this.phase = 'peaceful';
      return;
    }

    if (this.phase === 'peaceful') {
      this.startCycle();
    }

    this.totalTimeSurvived += dt;

    if (this.phase === 'day') {
      this.phaseTimer -= dt;
      if (this.phaseTimer <= 0) {
        this.phase = 'sunset';
        this.phaseTimer = SUNSET_DURATION;
        soundManager.playWaveStart();
      }
    } else if (this.phase === 'sunset') {
      this.phaseTimer -= dt;
      if (this.phaseTimer <= 0) {
        this.phase = 'night';
        this.phaseTimer = NIGHT_DURATION;
        this.prepareWaveSpawns();
      }
    } else if (this.phase === 'night') {
      this.phaseTimer -= dt;

      // Spawn queue processing
      if (this.zombiesToSpawn.length > 0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          this.spawnTimer = Math.max(0.25, 1.2 - this.waveNumber * 0.05);
          const next = this.zombiesToSpawn.shift();
          if (next) {
            this.spawnEnemy(next.type);
          }
        }
      }

      // Check for night completion:
      // Night timer is up AND all spawned zombies are defeated!
      const allSpawned = this.zombiesToSpawn.length === 0;
      const allDefeated = this.activeZombies.length === 0;

      if ((this.phaseTimer <= 0 && allDefeated) || (allSpawned && allDefeated && this.phaseTimer < NIGHT_DURATION - 5)) {
        // Wave complete!
        const bonusGold = this.waveNumber * 40 + (this.isBossWave ? 150 : 0);
        soundManager.playWaveClear();

        try {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.25 },
          });
        } catch {
          // ignore confetti if headless
        }

        onWaveComplete(this.waveNumber, bonusGold);

        // Advance to next day
        this.waveNumber++;
        this.phase = 'day';
        this.phaseTimer = DAY_DURATION;
        this.bossZombie = null;
        this.isBossWave = false;
      }
    }
  }

  private prepareWaveSpawns() {
    this.zombiesToSpawn = [];
    this.isBossWave = this.waveNumber % 5 === 0;

    const baseCount = 10 + this.waveNumber * 5;

    // Distribute enemy types based on wave number
    for (let i = 0; i < baseCount; i++) {
      const rand = Math.random();
      if (this.waveNumber >= 3 && rand < 0.2) {
        this.zombiesToSpawn.push({ type: 'brute' });
      } else if (this.waveNumber >= 2 && rand < 0.45) {
        this.zombiesToSpawn.push({ type: 'runner' });
      } else {
        this.zombiesToSpawn.push({ type: 'walker' });
      }
    }

    // Add Boss if boss wave
    if (this.isBossWave) {
      this.zombiesToSpawn.push({ type: 'boss' });
      // Add extra brute escorts
      this.zombiesToSpawn.push({ type: 'brute' });
      this.zombiesToSpawn.push({ type: 'brute' });
    }

    // Shuffle spawns
    for (let i = this.zombiesToSpawn.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.zombiesToSpawn[i], this.zombiesToSpawn[j]] = [this.zombiesToSpawn[j], this.zombiesToSpawn[i]];
    }

    this.spawnTimer = 0.5;
  }

  private spawnEnemy(type: EnemyType) {
    // Spawn around outer borders of world
    let x = 0;
    let y = 0;
    const edge = Math.floor(Math.random() * 4);
    const margin = 40;

    switch (edge) {
      case 0: // Top
        x = Math.random() * WORLD_WIDTH;
        y = margin;
        break;
      case 1: // Bottom
        x = Math.random() * WORLD_WIDTH;
        y = WORLD_HEIGHT - margin;
        break;
      case 2: // Left
        x = margin;
        y = Math.random() * WORLD_HEIGHT;
        break;
      case 3: // Right
        x = WORLD_WIDTH - margin;
        y = Math.random() * WORLD_HEIGHT;
        break;
    }

    const zombie = new Zombie(this.nextZombieId++, type, x, y, this.waveNumber);
    if (type === 'boss') {
      this.bossZombie = zombie;
    }
    this.activeZombies.push(zombie);
  }

  public removeDeadZombies(): { killedCount: number; goldGained: number; scoreGained: number } {
    let killedCount = 0;
    let goldGained = 0;
    let scoreGained = 0;

    for (let i = this.activeZombies.length - 1; i >= 0; i--) {
      const z = this.activeZombies[i];
      if (z.isDead) {
        killedCount++;
        goldGained += z.goldReward;
        scoreGained += z.score;
        this.zombiesKilledTotal++;
        soundManager.playZombieDeath();
        this.activeZombies.splice(i, 1);
      }
    }

    return { killedCount, goldGained, scoreGained };
  }
}
