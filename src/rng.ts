// Seeded RNG (mulberry32) — deterministic per seed
export class RNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state |= 0;
    this.state = this.state + 0x6d2b79f5 | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Random int in [min, max] inclusive
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Random float in [min, max]
  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
}

// Deterministic seed from chunk coordinates
export function chunkSeed(cx: number, cy: number): number {
  // Wang hash
  let h = (cx * 1619 + cy * 31337 + 1013904223) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  return h ^ (h >>> 16);
}
