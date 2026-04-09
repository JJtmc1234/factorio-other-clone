import { CHUNK_SIZE } from "./types.js";
// One starting lake: centered at tile (30, 20), radius 10
const LAKE_CENTER_X = 30;
const LAKE_CENTER_Y = 20;
const LAKE_RADIUS = 10;
const LAKE_SAND_RADIUS = LAKE_RADIUS + 2;
// Safe spawn zone — always grass
const SPAWN_SAFE_RADIUS = 12;
function distToLake(tx, ty) {
    const dx = tx - LAKE_CENTER_X;
    const dy = ty - LAKE_CENTER_Y;
    return Math.sqrt(dx * dx + dy * dy);
}
export class World {
    constructor() {
        this.chunks = new Map();
    }
    chunkKey(cx, cy) {
        return `${cx},${cy}`;
    }
    generateChunk(cx, cy) {
        const tiles = [];
        for (let ty = 0; ty < CHUNK_SIZE; ty++) {
            tiles[ty] = [];
            for (let tx = 0; tx < CHUNK_SIZE; tx++) {
                const worldX = cx * CHUNK_SIZE + tx;
                const worldY = cy * CHUNK_SIZE + ty;
                const distSpawn = Math.sqrt(worldX * worldX + worldY * worldY);
                const distL = distToLake(worldX, worldY);
                let type;
                if (distSpawn < SPAWN_SAFE_RADIUS) {
                    // Always grass near spawn
                    type = "grass";
                }
                else if (distL < LAKE_RADIUS) {
                    type = "water";
                }
                else if (distL < LAKE_SAND_RADIUS) {
                    type = "sand";
                }
                else {
                    type = "grass";
                }
                tiles[ty][tx] = { type, revealed: false };
            }
        }
        return tiles;
    }
    getChunk(cx, cy) {
        const key = this.chunkKey(cx, cy);
        if (!this.chunks.has(key)) {
            this.chunks.set(key, this.generateChunk(cx, cy));
        }
        return this.chunks.get(key);
    }
    getTile(tx, ty) {
        const cx = Math.floor(tx / CHUNK_SIZE);
        const cy = Math.floor(ty / CHUNK_SIZE);
        const lx = ((tx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const ly = ((ty % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        return this.getChunk(cx, cy)[ly][lx];
    }
    revealAround(tx, ty, radius) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx * dx + dy * dy <= radius * radius) {
                    const tile = this.getTile(tx + dx, ty + dy);
                    tile.revealed = true;
                }
            }
        }
    }
    isWalkable(tx, ty) {
        return this.getTile(tx, ty).type !== "water";
    }
}
//# sourceMappingURL=world.js.map