import { TILE_SIZE } from "./types.js";
const TILE_COLORS = {
    grass: "#4a7c3f",
    water: "#1a6b8a",
    sand: "#c2a84a",
};
const WATER_DARK = "#0f4a63";
export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.width = canvas.width;
        this.height = canvas.height;
    }
    resize(w, h) {
        this.canvas.width = w;
        this.canvas.height = h;
        this.width = w;
        this.height = h;
    }
    clear() {
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    drawWorld(world, player) {
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
                }
                else {
                    // Fog of war — greyed out, no detail
                    ctx.fillStyle = "rgba(0,0,0,0.5)";
                    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }
    drawPlayer(player) {
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
    drawHUD(player) {
        const ctx = this.ctx;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(8, 8, 180, 28);
        ctx.fillStyle = "#fff";
        ctx.font = "13px monospace";
        ctx.fillText(`Tile: (${player.tileX}, ${player.tileY})`, 16, 27);
    }
}
//# sourceMappingURL=renderer.js.map