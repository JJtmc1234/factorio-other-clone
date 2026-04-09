import { World } from "./world.js";
import { Player } from "./player.js";

const MM_TILE = 2;
const MM_RADIUS = 60;
const MM_SIZE = MM_RADIUS * 2 * MM_TILE;

const TILE_COLORS: Record<string, string> = {
  grass: "#4a7c3f",
  water: "#1a6b8a",
  sand:  "#c2a84a",
};

const FOG_TINT = "rgba(0,0,0,0.55)"; // greyed out fog-of-war overlay

export class Minimap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Full map state
  private fullMapCanvas: HTMLCanvasElement;
  private fullMapCtx: CanvasRenderingContext2D;
  isFullMap: boolean = false;

  // Zoom state
  private zoom: number = 1;
  private minZoom: number = 0.5;
  private maxZoom: number = 4;
  private mapOffsetX: number = 0;
  private mapOffsetY: number = 0;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;

  constructor() {
    // Minimap
    this.canvas = document.createElement("canvas");
    this.canvas.width = MM_SIZE;
    this.canvas.height = MM_SIZE;
    this.canvas.style.cssText = `
      position:absolute; bottom:16px; right:16px;
      border:2px solid #555; border-radius:4px;
      image-rendering:pixelated;
    `;
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d")!;

    // Full map canvas (offscreen rendering)
    this.fullMapCanvas = document.createElement("canvas");
    this.fullMapCtx = this.fullMapCanvas.getContext("2d")!;

    // Zoom on full map
    const overlay = document.getElementById("fullmap-overlay")!;
    overlay.addEventListener("wheel", (e) => {
      if (!this.isFullMap) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.8 : 1.25;
      this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * delta));
      this.renderFullMap();
    });

    // Drag to pan full map — wire to document so drag works outside canvas
    overlay.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      this.dragStartX = e.clientX - this.mapOffsetX;
      this.dragStartY = e.clientY - this.mapOffsetY;
      e.preventDefault();
    });
    document.addEventListener("mousemove", (e) => {
      if (!this.isDragging || !this.isFullMap) return;
      this.mapOffsetX = e.clientX - this.dragStartX;
      this.mapOffsetY = e.clientY - this.dragStartY;
      this.renderFullMap();
    });
    document.addEventListener("mouseup", () => { this.isDragging = false; });
  }

  private _world?: World;
  private _player?: Player;

  draw(world: World, player: Player): void {
    this._world = world;
    this._player = player;
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

        if (tile.visibility === "unknown") {
          ctx.fillStyle = "#000";
          ctx.fillRect(sx, sy, MM_TILE, MM_TILE);
          continue;
        }
        ctx.fillStyle = TILE_COLORS[tile.type] ?? "#888";
        ctx.fillRect(sx, sy, MM_TILE, MM_TILE);
        // Resource dot (1px)
        if (tile.resource) {
          if (tile.resource.kind === "ore") {
            const oc: Record<string,string> = {iron:"#7ab3d4",copper:"#c87941",coal:"#111",stone:"#b5a882"};
            ctx.fillStyle = oc[tile.resource.ore] ?? "#fff";
            ctx.fillRect(sx, sy, MM_TILE, MM_TILE);
          } else if (tile.resource.kind === "tree") {
            ctx.fillStyle = "#1e3d10";
            ctx.fillRect(sx, sy, MM_TILE, MM_TILE);
          } else if (tile.resource.kind === "rock") {
            ctx.fillStyle = "#aaa";
            ctx.fillRect(sx, sy, MM_TILE, MM_TILE);
          }
        }
        if (tile.visibility === "fog") {
          ctx.fillStyle = FOG_TINT;
          ctx.fillRect(sx, sy, MM_TILE, MM_TILE);
        }
      }
    }

    // Player dot
    ctx.fillStyle = "#fff";
    ctx.fillRect(MM_RADIUS * MM_TILE - 2, MM_RADIUS * MM_TILE - 2, 4, 4);
  }

  openFullMap(world: World, player: Player): void {
    this._world = world;
    this._player = player;
    this.isFullMap = true;
    this.zoom = 1;
    this.mapOffsetX = 0;
    this.mapOffsetY = 0;
    document.getElementById("fullmap-overlay")!.style.display = "flex";
    this.renderFullMap();
  }

  private renderFullMap(): void {
    if (!this._world || !this._player) return;
    const world = this._world;
    const player = this._player;

    const FULL_TILE = 3;
    const FULL_RADIUS = 200; // 400 tile radius view
    const baseSize = FULL_RADIUS * 2 * FULL_TILE;

    this.fullMapCanvas.width = baseSize;
    this.fullMapCanvas.height = baseSize;

    const fctx = this.fullMapCtx;
    fctx.fillStyle = "#000";
    fctx.fillRect(0, 0, baseSize, baseSize);

    const ptx = player.tileX;
    const pty = player.tileY;

    for (let dy = -FULL_RADIUS; dy < FULL_RADIUS; dy++) {
      for (let dx = -FULL_RADIUS; dx < FULL_RADIUS; dx++) {
        const tx = ptx + dx;
        const ty = pty + dy;
        const tile = world.getTile(tx, ty);
        const sx = (dx + FULL_RADIUS) * FULL_TILE;
        const sy = (dy + FULL_RADIUS) * FULL_TILE;

        if (tile.visibility === "unknown") continue;

        fctx.fillStyle = TILE_COLORS[tile.type] ?? "#888";
        fctx.fillRect(sx, sy, FULL_TILE, FULL_TILE);

        // Resources
        if (tile.resource) {
          const oc: Record<string,string> = {iron:"#7ab3d4",copper:"#c87941",coal:"#111",stone:"#b5a882"};
          if (tile.resource.kind === "ore") fctx.fillStyle = oc[tile.resource.ore];
          else if (tile.resource.kind === "tree") fctx.fillStyle = "#1e3d10";
          else fctx.fillStyle = "#aaa";
          fctx.fillRect(sx, sy, FULL_TILE, FULL_TILE);
        }

        if (tile.visibility === "fog") {
          fctx.fillStyle = FOG_TINT;
          fctx.fillRect(sx, sy, FULL_TILE, FULL_TILE);
        }
      }
    }

    // Player dot
    fctx.fillStyle = "#fff";
    fctx.fillRect(FULL_RADIUS * FULL_TILE - 3, FULL_RADIUS * FULL_TILE - 3, 6, 6);

    // Draw to screen with zoom
    const fc = document.getElementById("fullmap-canvas") as HTMLCanvasElement;
    const displaySize = Math.min(window.innerWidth * 0.85, window.innerHeight * 0.8);
    fc.width = displaySize;
    fc.height = displaySize;
    fc.style.width = displaySize + "px";
    fc.style.height = displaySize + "px";

    const fdc = fc.getContext("2d")!;
    fdc.imageSmoothingEnabled = false;
    fdc.fillStyle = "#000";
    fdc.fillRect(0, 0, displaySize, displaySize);

    const scaledSize = baseSize * this.zoom;
    const drawX = (displaySize - scaledSize) / 2 + this.mapOffsetX;
    const drawY = (displaySize - scaledSize) / 2 + this.mapOffsetY;

    // Clip to canvas
    fdc.save();
    fdc.beginPath();
    fdc.rect(0, 0, displaySize, displaySize);
    fdc.clip();
    fdc.drawImage(this.fullMapCanvas, drawX, drawY, scaledSize, scaledSize);
    fdc.restore();

    // Zoom hint
    fdc.fillStyle = "rgba(0,0,0,0.6)";
    fdc.fillRect(4, 4, 120, 22);
    fdc.fillStyle = "#aaa";
    fdc.font = "12px monospace";
    fdc.fillText(`Zoom: ${this.zoom.toFixed(1)}x  (scroll)`, 8, 18);
  }

  hide(): void {
    this.isFullMap = false;
    document.getElementById("fullmap-overlay")!.style.display = "none";
  }
}
