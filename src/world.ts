import { Tile, TileType, CHUNK_SIZE } from "./types.js";
import { noise2d } from "./noise.js";

const WATER_THRESHOLD = -0.1;
const SAND_THRESHOLD = -0.05;
const NOISE_SCALE = 0.07;

export class World {
  private chunks: Map<string, Tile[][]> = new Map();

  private chunkKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  private generateChunk(cx: number, cy: number): Tile[][] {
    const tiles: Tile[][] = [];
    for (let ty = 0; ty < CHUNK_SIZE; ty++) {
      tiles[ty] = [];
      for (let tx = 0; tx < CHUNK_SIZE; tx++) {
        const wx = (cx * CHUNK_SIZE + tx) * NOISE_SCALE;
        const wy = (cy * CHUNK_SIZE + ty) * NOISE_SCALE;
        const n = noise2d(wx, wy);

        let type: TileType;
        if (n < WATER_THRESHOLD) type = "water";
        else if (n < SAND_THRESHOLD) type = "sand";
        else type = "grass";

        // Ensure spawn area (chunk 0,0) is always land
        if (cx === 0 && cy === 0 && tx < 5 && ty < 5) type = "grass";

        tiles[ty][tx] = { type, revealed: false };
      }
    }
    return tiles;
  }

  getChunk(cx: number, cy: number): Tile[][] {
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
    return this.getChunk(cx, cy)[ly][lx];
  }

  revealAround(tx: number, ty: number, radius: number): void {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= radius * radius) {
          const tile = this.getTile(tx + dx, ty + dy);
          tile.revealed = true;
        }
      }
    }
  }

  isWalkable(tx: number, ty: number): boolean {
    return this.getTile(tx, ty).type !== "water";
  }
}
