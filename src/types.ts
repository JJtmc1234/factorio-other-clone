export const TILE_SIZE = 32;
export const CHUNK_SIZE = 16;
export const FOG_RADIUS = 8; // tiles revealed around player

export type TileType = "grass" | "water" | "sand";

export interface Tile {
  type: TileType;
  revealed: boolean;
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
