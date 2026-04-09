import { Tile, TileType, TileVisibility, CHUNK_SIZE, CHART_DECAY_MS } from "./types.js";
import { noise2d } from "./noise.js";

const LAKE_CENTER_X = 30;
const LAKE_CENTER_Y = 20;
const LAKE_RADIUS = 10;
const LAKE_SAND_RADIUS = LAKE_RADIUS + 2;
const SPAWN_SAFE_RADIUS = 12;

function distToLake(tx: number, ty: number): number {
  const dx = tx - LAKE_CENTER_X;
  const dy = ty - LAKE_CENTER_Y;
  return Math.sqrt(dx * dx + dy * dy);
}

interface Chunk {
  tiles: Tile[][];
  lastChartedAt: number; // ms timestamp, 0 = never
}

export class World {
  private chunks: Map<string, Chunk> = new Map();

  private chunkKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  private generateChunk(cx: number, cy: number): Chunk {
    const tiles: Tile[][] = [];
    for (let ty = 0; ty < CHUNK_SIZE; ty++) {
      tiles[ty] = [];
      for (let tx = 0; tx < CHUNK_SIZE; tx++) {
        const worldX = cx * CHUNK_SIZE + tx;
        const worldY = cy * CHUNK_SIZE + ty;
        const distSpawn = Math.sqrt(worldX * worldX + worldY * worldY);
        const distL = distToLake(worldX, worldY);

        let type: TileType;
        if (distSpawn < SPAWN_SAFE_RADIUS) type = "grass";
        else if (distL < LAKE_RADIUS) type = "water";
        else if (distL < LAKE_SAND_RADIUS) type = "sand";
        else type = "grass";

        tiles[ty][tx] = { type, visibility: "unknown" };
      }
    }
    return { tiles, lastChartedAt: 0 };
  }

  getChunk(cx: number, cy: number): Chunk {
    const key = this.chunkKey(cx, cy);
    if (!this.chunks.has(key)) {
      this.chunks.set(key, this.generateChunk(cx, cy));
    }
    return this.chunks.get(key)!;
  }

  getTile(tx: number, ty: number): Tile {
    const cx = Math.floor(tx / CHUNK_SIZE);
    const cy = Math.floor(ty / CHUNK_SIZE);
    const lx = ((tx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((ty % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return this.getChunk(cx, cy).tiles[ly][lx];
  }

  // Chart a radius around a tile — marks chunks as actively charted
  chartAround(tx: number, ty: number, radius: number, now: number): void {
    // Work at chunk level for performance
    const chunkRadius = Math.ceil(radius / CHUNK_SIZE) + 1;
    const centerCX = Math.floor(tx / CHUNK_SIZE);
    const centerCY = Math.floor(ty / CHUNK_SIZE);

    for (let dcy = -chunkRadius; dcy <= chunkRadius; dcy++) {
      for (let dcx = -chunkRadius; dcx <= chunkRadius; dcx++) {
        const cx = centerCX + dcx;
        const cy = centerCY + dcy;
        // Check if chunk center is within radius
        const chunkCenterX = cx * CHUNK_SIZE + CHUNK_SIZE / 2;
        const chunkCenterY = cy * CHUNK_SIZE + CHUNK_SIZE / 2;
        const dist = Math.sqrt((chunkCenterX - tx) ** 2 + (chunkCenterY - ty) ** 2);
        if (dist <= radius + CHUNK_SIZE) {
          const chunk = this.getChunk(cx, cy);
          chunk.lastChartedAt = now;
          // Mark all tiles in chunk as at least fog (known)
          for (let ly = 0; ly < CHUNK_SIZE; ly++) {
            for (let lx = 0; lx < CHUNK_SIZE; lx++) {
              if (chunk.tiles[ly][lx].visibility === "unknown") {
                chunk.tiles[ly][lx].visibility = "fog";
              }
            }
          }
        }
      }
    }
  }

  // Update chunk visibility based on decay
  updateVisibility(now: number): void {
    for (const chunk of this.chunks.values()) {
      const isCharted = chunk.lastChartedAt > 0 &&
        (now - chunk.lastChartedAt) < CHART_DECAY_MS;
      for (let ly = 0; ly < CHUNK_SIZE; ly++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
          const tile = chunk.tiles[ly][lx];
          if (tile.visibility === "unknown") continue;
          tile.visibility = isCharted ? "charted" : "fog";
        }
      }
    }
  }

  isWalkable(tx: number, ty: number): boolean {
    return this.getTile(tx, ty).type !== "water";
  }

  // Pre-chart a large starting area (decays naturally after 10s)
  preChartStartingArea(radius: number, now: number): void {
    this.chartAround(0, 0, radius, now);
  }
}
