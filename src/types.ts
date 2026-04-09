export const TILE_SIZE = 32;
export const CHUNK_SIZE = 16;
export const PLAYER_CHART_RADIUS = 250; // tiles charted around player (500x500)
export const CHART_DECAY_MS = 10000;    // 10 seconds before chunk goes to fog of war

export type TileType = "grass" | "water" | "sand";

export type TileVisibility =
  | "unknown"   // black, never seen
  | "charted"   // actively scanned, bright, zoomable
  | "fog";      // last known state, greyed out

export type OreType = "iron" | "copper" | "coal" | "stone";

export type ResourceType =
  | { kind: "ore";  ore: OreType; amount: number }
  | { kind: "tree"; wood: number }                        // always 4
  | { kind: "rock"; stone: number; coal: number; label: string };

export interface Tile {
  type: TileType;
  visibility: TileVisibility;
  resource?: ResourceType;
}

export interface ChunkCoord {
  cx: number;
  cy: number;
}

export interface WorldPos {
  x: number;
  y: number;
}

export interface PixelPos {
  x: number;
  y: number;
}

export interface PlayerState {
  px: number;
  py: number;
  speed: number;
}
