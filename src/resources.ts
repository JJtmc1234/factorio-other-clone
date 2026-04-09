import { Tile, OreType, ResourceType, CHUNK_SIZE } from "./types.js";
import { RNG, chunkSeed } from "./rng.js";

// Min distance from spawn for resources
const SPAWN_CLEAR_RADIUS = 16;

// Ore patch config
interface OrePatchConfig {
  ore: OreType;
  baseFrequency: number; // patches per chunk on average (0..1)
  baseRadius: number;
  baseAmount: number;
  distanceScale: number; // richness multiplier per 100 tiles from spawn
}

const ORE_CONFIGS: OrePatchConfig[] = [
  { ore: "iron",   baseFrequency: 0.5, baseRadius: 8,  baseAmount: 800,  distanceScale: 1.5 },
  { ore: "copper", baseFrequency: 0.4, baseRadius: 7,  baseAmount: 600,  distanceScale: 1.5 },
  { ore: "coal",   baseFrequency: 0.35,baseRadius: 6,  baseAmount: 500,  distanceScale: 1.3 },
  { ore: "stone",  baseFrequency: 0.3, baseRadius: 6,  baseAmount: 400,  distanceScale: 1.2 },
];

// Tree forest config
const TREE_FREQUENCY = 0.45; // probability a chunk has a forest patch
const TREE_PATCH_RADIUS = 6;
const TREE_DENSITY = 0.4; // fraction of tiles in patch that have trees

// Rock spawn chances per tile (rare)
const ROCK_CHANCE = 0.008;
const HUGE_ROCK_CHANCE = 0.002;
const HUGE_ROCK_MIN_DIST = 40; // only far from spawn

function distFromSpawn(tx: number, ty: number): number {
  return Math.sqrt(tx * tx + ty * ty);
}

export function generateResources(
  tiles: Tile[][],
  cx: number,
  cy: number
): void {
  const rng = new RNG(chunkSeed(cx, cy));
  const chunkOriginX = cx * CHUNK_SIZE;
  const chunkOriginY = cy * CHUNK_SIZE;
  const chunkCenterX = chunkOriginX + CHUNK_SIZE / 2;
  const chunkCenterY = chunkOriginY + CHUNK_SIZE / 2;
  const distCenter = distFromSpawn(chunkCenterX, chunkCenterY);

  // --- ORE PATCHES ---
  for (const cfg of ORE_CONFIGS) {
    if (rng.next() > cfg.baseFrequency) continue;
    if (distCenter < SPAWN_CLEAR_RADIUS * 2) continue;

    // Patch center (within this chunk or slightly outside)
    const patchX = chunkOriginX + rng.int(0, CHUNK_SIZE - 1);
    const patchY = chunkOriginY + rng.int(0, CHUNK_SIZE - 1);

    const distScale = 1 + (distCenter / 100) * cfg.distanceScale;
    const radius = cfg.baseRadius * (0.7 + rng.float(0, 0.6));
    const amount = Math.floor(cfg.baseAmount * distScale * (0.6 + rng.float(0, 0.8)));

    // Ellipse axes for irregular shape
    const rx = radius * (0.7 + rng.float(0, 0.6));
    const ry = radius * (0.7 + rng.float(0, 0.6));
    const angle = rng.float(0, Math.PI);

    for (let ty = 0; ty < CHUNK_SIZE; ty++) {
      for (let tx = 0; tx < CHUNK_SIZE; tx++) {
        const worldX = chunkOriginX + tx;
        const worldY = chunkOriginY + ty;

        if (distFromSpawn(worldX, worldY) < SPAWN_CLEAR_RADIUS) continue;
        if (tiles[ty][tx].type === "water") continue;
        if (tiles[ty][tx].resource) continue;

        const dx = worldX - patchX;
        const dy = worldY - patchY;
        // Rotate
        const rdx = dx * Math.cos(angle) + dy * Math.sin(angle);
        const rdy = -dx * Math.sin(angle) + dy * Math.cos(angle);
        const inEllipse = (rdx / rx) ** 2 + (rdy / ry) ** 2;

        if (inEllipse <= 1) {
          // More ore in center, less at edges
          const density = 1 - inEllipse;
          const tileAmount = Math.max(1, Math.floor(amount * density * (0.5 + rng.float(0, 1))));
          tiles[ty][tx].resource = { kind: "ore", ore: cfg.ore, amount: tileAmount };
        }
      }
    }
  }

  // --- TREE PATCHES ---
  if (rng.next() < TREE_FREQUENCY) {
    const patchX = chunkOriginX + rng.int(0, CHUNK_SIZE - 1);
    const patchY = chunkOriginY + rng.int(0, CHUNK_SIZE - 1);
    const radius = TREE_PATCH_RADIUS * (0.5 + rng.float(0, 1));

    for (let ty = 0; ty < CHUNK_SIZE; ty++) {
      for (let tx = 0; tx < CHUNK_SIZE; tx++) {
        const worldX = chunkOriginX + tx;
        const worldY = chunkOriginY + ty;
        if (tiles[ty][tx].type !== "grass") continue;
        if (tiles[ty][tx].resource) continue;
        if (distFromSpawn(worldX, worldY) < SPAWN_CLEAR_RADIUS) continue;

        const dist = Math.sqrt((worldX - patchX) ** 2 + (worldY - patchY) ** 2);
        if (dist <= radius && rng.next() < TREE_DENSITY) {
          tiles[ty][tx].resource = { kind: "tree", wood: 4 };
        }
      }
    }
  }

  // --- ROCKS (per-tile chance) ---
  for (let ty = 0; ty < CHUNK_SIZE; ty++) {
    for (let tx = 0; tx < CHUNK_SIZE; tx++) {
      const worldX = chunkOriginX + tx;
      const worldY = chunkOriginY + ty;
      const dist = distFromSpawn(worldX, worldY);

      if (tiles[ty][tx].type === "water") continue;
      if (tiles[ty][tx].resource) continue;
      if (dist < SPAWN_CLEAR_RADIUS) continue;

      const roll = rng.next();

      if (dist >= HUGE_ROCK_MIN_DIST && roll < HUGE_ROCK_CHANCE) {
        const stone = rng.int(24, 50);
        const coal  = rng.int(24, 50);
        tiles[ty][tx].resource = {
          kind: "rock",
          stone,
          coal,
          label: "Huge Rock"
        };
      } else if (roll < ROCK_CHANCE) {
        // Big rock or big sand rock
        if (tiles[ty][tx].type === "sand" && rng.next() < 0.6) {
          tiles[ty][tx].resource = {
            kind: "rock",
            stone: rng.int(19, 25),
            coal: 0,
            label: "Big Sand Rock"
          };
        } else {
          tiles[ty][tx].resource = {
            kind: "rock",
            stone: 20,
            coal: 0,
            label: "Big Rock"
          };
        }
      }
    }
  }
}
