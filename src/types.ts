export const TILE_SIZE = 32;
export const CHUNK_SIZE = 16;
export const PLAYER_CHART_RADIUS = 250; // tiles charted around player (500x500)
export const CHART_DECAY_MS = 10000;   // 10 seconds before chunk goes to fog of war

export type TileType = "grass" | "water" | "sand";

export type TileVisibility =
  | "unknown"   // black, never seen
  | "charted"   // actively scanned, bright, zoomable
  | "fog";      // last known state, greyed out

export interface Tile {
  type: TileType;
  visibility: TileVisibility;
}

export interface ChunkCoord {
  cx: number;
  cy: number;
}

export interface WorldPos {
  x: number; // tile x
  y: number; // tile y
}

export interface PixelPos {
  x: number;
  y: number;
}

export interface PlayerState {
  // pixel position (subpixel movement)
  px: number;
  py: number;
  speed: number; // tiles per second
}
