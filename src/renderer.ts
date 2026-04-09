import { TILE_SIZE, CHUNK_SIZE } from "./types.js";
import { World } from "./world.js";
import { Player } from "./player.js";

const TILE_COLORS: Record<string, string> = {
  grass: "#4a7c3f",
  water: "#1a6b8a",
  sand:  "#c2a84a",
};

const WATER_DARK  = "#0f4a63";
const FOG_COLOR   = "rgba(0,0,0,0.92)";
const SEEN_COLOR  = "rgba(0,0,0,0.45)";

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  width: number;
  height: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.width = canvas.width;
    this.height = canvas.height;
  }

  resize(w: number, h: number): void {
    this.canvas.width = w;
    this.canvas.height = h;
    this.width = w;
    this.height = h;
  }

  clear(): void {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawWorld(world: World, player: Player): void {
    const ctx = this.ctx;

    // Camera: player centered
    const camX = player.pixelX - this.width / 2;
    const camY = player.pixelY - this.height / 2;

    // Which tiles are visible?
    const startTX = Math.floor(camX / TILE_SIZE) - 1;
    const startTY = Math.floor(camY / TILE_SIZE) - 1;
    const endTX = startTX + Math.ceil(this.width / TILE_SIZE) + 2;
    const endTY = startTY + Math.ceil(this.height / TILE_SIZE) + 2;

    for (let ty = startTY; ty < endTY; ty++) {
      for (let tx = startTX; tx < endTX; tx++) {
        const tile = world.getTile(tx, ty);
        const screenX = Math.floor(tx * TILE_SIZE - camX);
        const screenY = Math.floor(ty * TILE_SIZE - camY);

        if (!tile.revealed) {
          ctx.fillStyle = "#000";
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          continue;
        }

        // Draw tile
        ctx.fillStyle = TILE_COLORS[tile.type] ?? "#888";
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Water shimmer lines
        if (tile.type === "water") {
          ctx.fillStyle = WATER_DARK;
          ctx.fillRect(screenX + 4, screenY + 8, TILE_SIZE - 8, 3);
          ctx.fillRect(screenX + 8, screenY + 18, TILE_SIZE - 12, 3);
        }

        // Grass detail dots
        if (tile.type === "grass") {
          ctx.fillStyle = "#3d6b34";
          ctx.fillRect(screenX + 6, screenY + 6, 2, 2);
          ctx.fillRect(screenX + 20, screenY + 18, 2, 2);
        }

        // Grid line
        ctx.fillStyle = "rgba(0,0,0,0.08)";
        ctx.fillRect(screenX, screenY, TILE_SIZE, 1);
        ctx.fillRect(screenX, screenY, 1, TILE_SIZE);
      }
    }

    // Fog of war overlay — semi-transparent on seen, opaque on unseen
    // (already handled above — revealed=false → black)
    // Add a soft edge around revealed area
    for (let ty = startTY; ty < endTY; ty++) {
      for (let tx = startTX; tx < endTX; tx++) {
        // Already drawn black for unrevealed
      }
    }
  }

  drawPlayer(player: Player): void {
    const ctx = this.ctx;
    const cx = this.width / 2;
    const cy = this.height / 2;

    // Shadow — just under the feet (bottom of sprite)
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 11, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = "#e8a020";
    ctx.fillRect(cx - 8, cy - 10, 16, 20);

    // Head
    ctx.fillStyle = "#f5c87a";
    ctx.fillRect(cx - 6, cy - 22, 12, 14);

    // Eyes
    ctx.fillStyle = "#222";
    ctx.fillRect(cx - 4, cy - 18, 3, 3);
    ctx.fillRect(cx + 1, cy - 18, 3, 3);

    // Helmet
    ctx.fillStyle = "#c0392b";
    ctx.fillRect(cx - 7, cy - 24, 14, 5);
  }

  drawHUD(player: Player): void {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(8, 8, 180, 28);
    ctx.fillStyle = "#fff";
    ctx.font = "13px monospace";
    ctx.fillText(`Tile: (${player.tileX}, ${player.tileY})`, 16, 27);
  }
}
