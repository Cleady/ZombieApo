# ZombieApo

An open-source 2D top-down survival, base-building, and tower defense web game built with Vite, React, TypeScript, and HTML5 Canvas.

## Features

- **60 FPS Canvas Game Engine**: Smooth requestAnimationFrame game loop with delta-time physics.
- **Scrollable 2D World**: 3072x3072 pixel map with a 48x48 building grid.
- **Classic .io Vector Graphics**: Clean top-down vector aesthetic with dark outlines and vibrant colors.
- **Day & Night Cycles**:
  - **Day Phase**: Gather resources (Wood, Stone), expand fortified walls, build Gold Mines, and place defensive towers.
  - **Sunset**: Warning phase before nightfall.
  - **Night Phase**: Deep ambient darkness with glowing dynamic light halos around the player, base, and active defenses.
- **Escalating Zombie Hordes**:
  - Walkers, Runners, Brutes, and Titan Bosses (every 5 waves).
- **8 Fortifications & Towers (Tiers 1-8)**:
  - Gold Stash, Fortified Walls, Player Doors, Gold Mines, Arrow Towers, Cannon Towers, Bomb Towers, and Mage Towers.
- **Survivor Arsenal**:
  - Weapons: Mining Pickaxe, Hunter Spear, Compound Bow, and Thrown Bombs.
  - Equipment: Zombie Kinetic Shield and Health Potions.
- **Web Audio API Synthesizer**: Fully procedural sound effects with volume and mute toggle.
- **Real-Time Minimap / Radar**: Live tracking of the player, base, terrain nodes, and enemy clusters.

## Controls

- **Move**: `W`, `A`, `S`, `D` or Arrow Keys
- **Aim & Attack / Mine**: Mouse Aim + Left-Click
- **Select Weapon / Building**: Keys `1` to `9`
- **Shop Modal**: `B`
- **Upgrade Structure**: `E`
- **Quick Repair**: `R`
- **Drink Health Potion**: `F`
- **Toggle Audio Mute**: `M`
- **Cancel Placement / Deselect**: `Escape` or Right-Click

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Cleady/ZombieApo.git

# Navigate to project directory
cd ZombieApo

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## License

Open source under the MIT License.
