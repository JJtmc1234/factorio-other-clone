import { World } from "./world.js";
import { Player } from "./player.js";
import { Renderer } from "./renderer.js";
import { Minimap } from "./minimap.js";
import { FOG_RADIUS } from "./types.js";
const canvas = document.getElementById("game");
const world = new World();
const player = new Player(2, 2);
const renderer = new Renderer(canvas);
const minimap = new Minimap();
let mapOpen = false;
let lastTime = 0;
// Resize canvas to window
function resize() {
    renderer.resize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", resize);
resize();
// Map toggle
window.addEventListener("keydown", (e) => {
    if (e.key === "m" || e.key === "M") {
        mapOpen = !mapOpen;
        if (mapOpen) {
            minimap.drawFullMap(world, player, window.innerWidth, window.innerHeight);
        }
        else {
            minimap.hide();
        }
    }
    if (e.key === "Escape" && mapOpen) {
        mapOpen = false;
        minimap.hide();
    }
});
// Reveal starting area
world.revealAround(2, 2, FOG_RADIUS);
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap at 50ms
    lastTime = timestamp;
    player.update(dt, world);
    world.revealAround(player.tileX, player.tileY, FOG_RADIUS);
    renderer.clear();
    renderer.drawWorld(world, player);
    renderer.drawPlayer(player);
    renderer.drawHUD(player);
    if (!mapOpen)
        minimap.draw(world, player);
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame((t) => {
    lastTime = t;
    gameLoop(t);
});
//# sourceMappingURL=main.js.map