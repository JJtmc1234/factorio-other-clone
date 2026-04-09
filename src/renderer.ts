import { TILE_SIZE, ResourceType } from "./types.js";
import { World } from "./world.js";
import { Player } from "./player.js";

const TILE_COLORS: Record<string, string> = {
  grass: "#4a7c3f",
  water: "#1a6b8a",
  sand:  "#c2a84a",
};

const WATER_DARK = "#0f4a63";

const ORE_COLORS: Record<string, string> = {
  iron:   "#7ab3d4",
  copper: "#c87941",
  coal:   "#2a2a2a",
  stone:  "#b5a882",
};

function tooltipText(r: ResourceType): string {
  if (r.kind === "ore") return `${r.ore} ore: ${r.amount}`;
  if (r.kind === "tree") return `Tree: 4 wood`;
  if (r.kind === "rock") {
    if (r.coal > 0) return `${r.label}: ${r.stone} stone, ${r.coal} coal`;
    return `${r.label}: ${r.stone} stone`;
  }
  return "";
}

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
    const camX = player.pixelX - this.width / 2;
    const camY = player.pixelY - this.height / 2;

    const startTX = Math.floor(camX / TILE_SIZE) - 1;
    const startTY = Math.floor(camY / TILE_SIZE) - 1;
    const endTX = startTX + Math.ceil(this.width / TILE_SIZE) + 2;
    const endTY = startTY + Math.ceil(this.height / TILE_SIZE) + 2;

    for (let ty = startTY; ty < endTY; ty++) {
      for (let tx = startTX; tx < endTX; tx++) {
        const tile = world.getTile(tx, ty);
        const screenX = Math.floor(tx * TILE_SIZE - camX);
        const screenY = Math.floor(ty * TILE_SIZE - camY);

        if (tile.visibility === "unknown") {
          ctx.fillStyle = "#000";
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          continue;
        }

        // Draw base tile color
        ctx.fillStyle = TILE_COLORS[tile.type] ?? "#888";
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        if (tile.visibility === "charted") {
          // Full detail
          if (tile.type === "water") {
            ctx.fillStyle = WATER_DARK;
            ctx.fillRect(screenX + 4, screenY + 8, TILE_SIZE - 8, 3);
            ctx.fillRect(screenX + 8, screenY + 18, TILE_SIZE - 12, 3);
          }
          if (tile.type === "grass") {
            ctx.fillStyle = "#3d6b34";
            ctx.fillRect(screenX + 6, screenY + 6, 2, 2);
            ctx.fillRect(screenX + 20, screenY + 18, 2, 2);
          }
          ctx.fillStyle = "rgba(0,0,0,0.08)";
          ctx.fillRect(screenX, screenY, TILE_SIZE, 1);
          ctx.fillRect(screenX, screenY, 1, TILE_SIZE);
          // Draw ore under full detail (charted only)
          const r = tile.resource;
          if (r && r.kind === "ore") {
            ctx.fillStyle = ORE_COLORS[r.ore];
            ctx.globalAlpha = 0.75;
            ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            ctx.globalAlpha = 1;
          }
        } else {
          // Fog of war — greyed out, no detail
          // Still show ore dimly so you remember where patches are
          const r = tile.resource;
          if (r && r.kind === "ore") {
            ctx.fillStyle = ORE_COLORS[r.ore];
            ctx.globalAlpha = 0.25;
            ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            ctx.globalAlpha = 1;
          }
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  drawPlayer(player: Player): void {
    const ctx = this.ctx;
    const cx = this.width / 2;
    const cy = this.height / 2;

    // Shadow just under feet
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

  drawResources(world: World, player: Player): void {
    const ctx = this.ctx;
    const camX = player.pixelX - this.width / 2;
    const camY = player.pixelY - this.height / 2;
    const startTX = Math.floor(camX / TILE_SIZE) - 1;
    const startTY = Math.floor(camY / TILE_SIZE) - 1;
    const endTX = startTX + Math.ceil(this.width / TILE_SIZE) + 2;
    const endTY = startTY + Math.ceil(this.height / TILE_SIZE) + 2;

    for (let ty = startTY; ty < endTY; ty++) {
      for (let tx = startTX; tx < endTX; tx++) {
        const tile = world.getTile(tx, ty);
        if (!tile.resource || tile.visibility === "unknown") continue;
        const sx = Math.floor(tx * TILE_SIZE - camX);
        const sy = Math.floor(ty * TILE_SIZE - camY);
        const r = tile.resource;

        if (r.kind === "ore") {
          // ore already drawn in drawWorld
        } else if (r.kind === "tree") {
          // 2x2 tile tree sprite
          const w = TILE_SIZE * 2;
          const h = TILE_SIZE * 2;
          ctx.fillStyle = "#1e3d10";
          ctx.beginPath();
          ctx.arc(sx + w/2, sy + h/2 + 4, 26, 0, Math.PI*2);
          ctx.fill();
          ctx.fillStyle = "#2d5a1b";
          ctx.beginPath();
          ctx.arc(sx + w/2, sy + h/2, 22, 0, Math.PI*2);
          ctx.fill();
          ctx.fillStyle = "#3d7a27";
          ctx.beginPath();
          ctx.arc(sx + w/2 - 5, sy + h/2 - 5, 14, 0, Math.PI*2);
          ctx.fill();
        } else if (r.kind === "rock") {
          const huge = r.label === "Huge Rock";
          const sand = r.label === "Big Sand Rock";
          // huge: 3x4 tiles, big: 2x2 tiles
          const rw = huge ? TILE_SIZE * 3 : TILE_SIZE * 2;
          const rh = huge ? TILE_SIZE * 4 : TILE_SIZE * 2;
          const cx2 = sx + rw / 2;
          const cy2 = sy + rh / 2;
          ctx.fillStyle = sand ? "#c8b870" : (huge ? "#666" : "#888");
          ctx.beginPath();
          ctx.ellipse(cx2, cy2 + 4, rw * 0.45, rh * 0.35, 0.2, 0, Math.PI*2);
          ctx.fill();
          ctx.fillStyle = sand ? "#e0d090" : (huge ? "#888" : "#aaa");
          ctx.beginPath();
          ctx.ellipse(cx2 - rw*0.07, cy2 - rh*0.05, rw * 0.35, rh * 0.28, -0.2, 0, Math.PI*2);
          ctx.fill();
        }
      }
    }
  }

  drawTooltip(world: World, player: Player, mouseX: number, mouseY: number): void {
    const ctx = this.ctx;
    const camX = player.pixelX - this.width / 2;
    const camY = player.pixelY - this.height / 2;
    const tx = Math.floor((mouseX + camX) / TILE_SIZE);
    const ty = Math.floor((mouseY + camY) / TILE_SIZE);
    const tile = world.getTile(tx, ty);
    if (!tile.resource || tile.visibility === "unknown") return;

    const text = tooltipText(tile.resource);
    ctx.font = "12px monospace";
    const w = ctx.measureText(text).width + 16;
    let bx = mouseX + 12;
    let by = mouseY - 28;
    if (bx + w > this.width) bx = mouseX - w - 4;
    if (by < 0) by = mouseY + 12;
    ctx.fillStyle = "rgba(20,20,20,0.88)";
    ctx.fillRect(bx, by, w, 22);
    ctx.fillStyle = "#fff";
    ctx.fillText(text, bx + 8, by + 15);
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
