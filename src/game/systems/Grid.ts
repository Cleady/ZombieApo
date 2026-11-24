import type { BuildingType, BuildingCost } from '../types';
import { GRID_SIZE, GRID_COLS, GRID_ROWS, BUILDING_STATS, MAX_BUILDING_COUNTS } from '../constants';
import { Building } from '../entities/Building';
import { ResourceNode } from '../entities/ResourceNode';

export class Grid {
  private buildings: Map<string, Building> = new Map();
  private nextBuildingId: number = 1;

  public static getCellKey(cellX: number, cellY: number): string {
    return `${cellX},${cellY}`;
  }

  public static worldToCell(worldX: number, worldY: number): { cellX: number; cellY: number } {
    return {
      cellX: Math.floor(worldX / GRID_SIZE),
      cellY: Math.floor(worldY / GRID_SIZE),
    };
  }

  public static cellToWorld(cellX: number, cellY: number): { x: number; y: number } {
    return {
      x: cellX * GRID_SIZE + GRID_SIZE / 2,
      y: cellY * GRID_SIZE + GRID_SIZE / 2,
    };
  }

  public getBuildingAt(cellX: number, cellY: number): Building | undefined {
    return this.buildings.get(Grid.getCellKey(cellX, cellY));
  }

  public getAllBuildings(): Building[] {
    return Array.from(this.buildings.values());
  }

  public getBuildingCount(type: BuildingType): number {
    let count = 0;
    for (const b of this.buildings.values()) {
      if (b.type === type && !b.isDestroyed) {
        count++;
      }
    }
    return count;
  }

  public getGoldStash(): Building | null {
    for (const b of this.buildings.values()) {
      if (b.type === 'goldStash' && !b.isDestroyed) {
        return b;
      }
    }
    return null;
  }

  public canPlace(
    type: BuildingType,
    cellX: number,
    cellY: number,
    resources: { wood: number; stone: number; gold: number },
    resourceNodes: ResourceNode[],
    playerPos: { x: number; y: number; radius: number }
  ): { valid: boolean; reason?: string; cost: BuildingCost } {
    const cost = BUILDING_STATS[type][0].cost;

    // Check bounds
    if (cellX < 1 || cellX >= GRID_COLS - 1 || cellY < 1 || cellY >= GRID_ROWS - 1) {
      return { valid: false, reason: 'Outside build area', cost };
    }

    // Check building limits
    const maxLimit = MAX_BUILDING_COUNTS[type];
    if (maxLimit !== undefined) {
      const currentCount = this.getBuildingCount(type);
      if (currentCount >= maxLimit) {
        return { valid: false, reason: `Max ${maxLimit} ${type} reached`, cost };
      }
    }

    // First building MUST be Gold Stash before placing anything else
    const goldStash = this.getGoldStash();
    if (!goldStash && type !== 'goldStash') {
      return { valid: false, reason: 'Place Gold Stash first!', cost };
    }

    // Check if cell already occupied by building
    if (this.buildings.has(Grid.getCellKey(cellX, cellY))) {
      return { valid: false, reason: 'Space already occupied', cost };
    }

    // Check resource affordability
    if (
      resources.wood < cost.wood ||
      resources.stone < cost.stone ||
      resources.gold < cost.gold
    ) {
      return { valid: false, reason: 'Insufficient resources', cost };
    }

    const cellCenter = Grid.cellToWorld(cellX, cellY);
    const half = GRID_SIZE / 2;

    // Check player overlap
    const distToPlayer = Math.hypot(playerPos.x - cellCenter.x, playerPos.y - cellCenter.y);
    if (distToPlayer < playerPos.radius + half - 4) {
      return { valid: false, reason: 'Obstructed by player', cost };
    }

    // Check resource nodes overlap (Tree / Stone)
    for (const node of resourceNodes) {
      if (node.isDepleted) continue;
      const dist = Math.hypot(node.x - cellCenter.x, node.y - cellCenter.y);
      if (dist < node.radius + half - 2) {
        return { valid: false, reason: 'Blocked by resource node', cost };
      }
    }

    return { valid: true, cost };
  }

  public placeBuilding(type: BuildingType, cellX: number, cellY: number): Building {
    const building = new Building(this.nextBuildingId++, type, cellX, cellY);
    this.buildings.set(Grid.getCellKey(cellX, cellY), building);
    return building;
  }

  public removeBuilding(cellX: number, cellY: number): boolean {
    const key = Grid.getCellKey(cellX, cellY);
    return this.buildings.delete(key);
  }

  public cleanupDestroyed() {
    for (const [key, b] of this.buildings.entries()) {
      if (b.isDestroyed) {
        this.buildings.delete(key);
      }
    }
  }
}
