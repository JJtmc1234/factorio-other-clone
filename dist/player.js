import { TILE_SIZE } from "./types.js";
const SPEED = 5; // tiles per second
export class Player {
    constructor(startTileX, startTileY) {
        this.keys = new Set();
        this.state = {
            px: startTileX * TILE_SIZE,
            py: startTileY * TILE_SIZE,
            speed: SPEED,
        };
        window.addEventListener("keydown", (e) => {
            this.keys.add(e.key);
            e.preventDefault();
        });
        window.addEventListener("keyup", (e) => this.keys.delete(e.key));
    }
    // Hitbox is center of sprite
    get tileX() {
        return Math.floor((this.state.px + TILE_SIZE / 2) / TILE_SIZE);
    }
    get tileY() {
        return Math.floor((this.state.py + TILE_SIZE / 2) / TILE_SIZE);
    }
    get pixelX() { return this.state.px; }
    get pixelY() { return this.state.py; }
    update(dt, world) {
        const dist = this.state.speed * TILE_SIZE * dt;
        let dx = 0;
        let dy = 0;
        if (this.keys.has("ArrowLeft") || this.keys.has("a"))
            dx -= 1;
        if (this.keys.has("ArrowRight") || this.keys.has("d"))
            dx += 1;
        if (this.keys.has("ArrowUp") || this.keys.has("w"))
            dy -= 1;
        if (this.keys.has("ArrowDown") || this.keys.has("s"))
            dy += 1;
        // Normalize diagonal
        if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }
        const newPx = this.state.px + dx * dist;
        const newPy = this.state.py + dy * dist;
        // Collision: use center of player for tile lookup
        const newTx = Math.floor((newPx + TILE_SIZE / 2) / TILE_SIZE);
        const newTy = Math.floor((newPy + TILE_SIZE / 2) / TILE_SIZE);
        const curTx = this.tileX;
        const curTy = this.tileY;
        // Fix diagonal squeeze: only allow move if target tile AND
        // the axis-aligned intermediate tile are both walkable
        const canMoveX = world.isWalkable(newTx, curTy);
        const canMoveY = world.isWalkable(curTx, newTy);
        // Prevent diagonal squeeze through two touching water tiles
        const canMoveBoth = canMoveX && canMoveY && world.isWalkable(newTx, newTy);
        if (dx !== 0 && dy !== 0) {
            // Diagonal: require all three checks
            if (canMoveBoth) {
                this.state.px = newPx;
                this.state.py = newPy;
            }
            else {
                if (canMoveX)
                    this.state.px = newPx;
                if (canMoveY)
                    this.state.py = newPy;
            }
        }
        else {
            if (canMoveX)
                this.state.px = newPx;
            if (canMoveY)
                this.state.py = newPy;
        }
    }
}
//# sourceMappingURL=player.js.map