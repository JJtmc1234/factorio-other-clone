import { World } from "./world.js";
import { Player } from "./player.js";
import { TILE_SIZE } from "./types.js";

const MM_TILE = 3;       // pixels per tile on minimap
const MM_RADIUS = 40;    // tiles shown in each direction
const MM_SIZE = MM_RADIUS * 2 * MM_TILE;

const MINI_COLORS: Record<string, string> = {
  grass: "#4a7c3f",
  water: "#1a6b8a",
  sand:  "#c2a84a",
};

export class Minimap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  isFullMap: boolean = false;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = MM_SIZE;
    this.canvas.height = MM_SIZE;
    this.canvas.style.position = "absolute";
    this.canvas.style.bottom = "16px";
    this.canvas.style.right = "16px";
    this.canvas.style.border = "2px solid #555";
    this.canvas.style.borderRadius = "4px";
    this.canvas.style.imageRendering = "pixelated";
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d")!;
  }

  draw(world: World, player: Player): void {
    const ctx = this.ctx;
    const ptx = player.tileX;
    const pty = player.tileY;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, MM_SIZE, MM_SIZE);

    for (let dy = -MM_RADIUS; dy < MM_RADIUS; dy++) {
      for (let dx = -MM_RADIUS; dx < MM_RADIUS; dx++) {
        const tx = ptx + dx;
        const ty = pty + dy;
        const tile = world.getTile(tx, ty);

        const sx = (dx + MM_RADIUS) * MM_TILE;
        const sy = (dy + MM_RADIUS) * MM_TILE;

        if (!tile.revealed) {
          ctx.fillStyle = "#111";
        } else {
          ctx.fillStyle = MINI_COLORS[tile.type] ?? "#888";
        }
        ctx.fillRect(sx, sy, MM_TILE, MM_TILE);
      }
    }

    // Player dot
    const px = MM_RADIUS * MM_TILE;
    const py = MM_RADIUS * MM_TILE;
    ctx.fillStyle = "#fff";
    ctx.fillRect(px - 2, py - 2, 5, 5);
  }

  drawFullMap(world: World, player: Player, screenW: number, screenH: number): void {
    // Render full map overlay into an offscreen canvas then draw to main
    const FULL_TILE = 4;
    const FULL_RADIUS = 80;

    // Create overlay
    const overlay = document.getElementById("fullmap-overlay") as HTMLDivElement;
    const fc = document.getElementById("fullmap-canvas") as HTMLCanvasElement;
    const fctx = fc.getContext("2d")!;

    const size = FULL_RADIUS * 2 * FULL_TILE;
    fc.width = size;
    fc.height = size;

    fctx.fillStyle = "#000";
    fctx.fillRect(0, 0, size, size);

    const ptx = player.tileX;
    const pty = player.tileY;

    for (let dy = -FULL_RADIUS; dy < FULL_RADIUS; dy++) {
      for (let dx = -FULL_RADIUS; dx < FULL_RADIUS; dx++) {
        const tx = ptx + dx;
        const ty = pty + dy;
        const tile = world.getTile(tx, ty);
        const sx = (dx + FULL_RADIUS) * FULL_TILE;
        const sy = (dy + FULL_RADIUS) * FULL_TILE;

        fctx.fillStyle = tile.revealed
          ? (MINI_COLORS[tile.type] ?? "#888")
          : "#111";
        fctx.fillRect(sx, sy, FULL_TILE, FULL_TILE);
      }
    }

    // Player dot
    fctx.fillStyle = "#fff";
    fctx.fillRect(FULL_RADIUS * FULL_TILE - 3, FULL_RADIUS * FULL_TILE - 3, 7, 7);

    overlay.style.display = "flex";
  }

  hide(): void {
    const overlay = document.getElementById("fullmap-overlay") as HTMLDivElement;
    overlay.style.display = "none";
  }
}
