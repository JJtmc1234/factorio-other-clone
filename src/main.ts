import { World } from "./world.js";
import { Player } from "./player.js";
import { Renderer } from "./renderer.js";
import { Minimap } from "./minimap.js";
import { PLAYER_CHART_RADIUS } from "./types.js";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const world = new World();
const player = new Player(2, 2);
const renderer = new Renderer(canvas);
const minimap = new Minimap();

let mapOpen = false;
let lastTime = 0;
let mouseX = 0;
let mouseY = 0;
window.addEventListener("mousemove", (e) => { mouseX = e.clientX; mouseY = e.clientY; });

function resize(): void {
  renderer.resize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", resize);
resize();

// Map toggle
window.addEventListener("keydown", (e) => {
  if (e.key === "m" || e.key === "M") {
    mapOpen = !mapOpen;
    if (mapOpen) {
      minimap.openFullMap(world, player);
    } else {
      minimap.hide();
    }
  }
  if (e.key === "Escape" && mapOpen) {
    mapOpen = false;
    minimap.hide();
  }
});

// Pre-chart 500 tile radius around spawn (decays to fog after 10s)
const startNow = performance.now();
world.preChartStartingArea(500, startNow);

// Also permanently chart tiny spawn zone so player isn't blind
world.chartAround(2, 2, 12, startNow);

function gameLoop(timestamp: number): void {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  player.update(dt, world);

  // Chart around player every frame
  world.chartAround(player.tileX, player.tileY, PLAYER_CHART_RADIUS, timestamp);

  // Update visibility (charted → fog after 10s)
  world.updateVisibility(timestamp);

  renderer.clear();
  renderer.drawWorld(world, player);
  renderer.drawResources(world, player);
  renderer.drawPlayer(player);
  renderer.drawHUD(player);
  renderer.drawTooltip(world, player, mouseX, mouseY);

  if (!mapOpen) minimap.draw(world, player);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame((t) => {
  lastTime = t;
  gameLoop(t);
});
