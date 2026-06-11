export const BODIES = ["pickup", "van", "bug", "fire", "rex"] as const;
export const WHEELS = ["mega", "star", "spike", "pinwheel"] as const;
export const DECALS = ["none", "flames", "bolt", "stars", "eyes"] as const;

export type BodyId = (typeof BODIES)[number];
export type WheelId = (typeof WHEELS)[number];
export type DecalId = (typeof DECALS)[number];

export const PALETTE = [
  { id: "red", main: "#ff5d5d", dark: "#d63b3b" },
  { id: "orange", main: "#ff922b", dark: "#e8590c" },
  { id: "yellow", main: "#ffd43b", dark: "#f0a800" },
  { id: "green", main: "#51cf66", dark: "#2f9e44" },
  { id: "teal", main: "#22cdb7", dark: "#0ca678" },
  { id: "blue", main: "#4dabf7", dark: "#1971c2" },
  { id: "purple", main: "#9775fa", dark: "#7048e8" },
  { id: "pink", main: "#f783ac", dark: "#d6336c" },
] as const;

export type ColorId = (typeof PALETTE)[number]["id"];
export type PaletteEntry = (typeof PALETTE)[number];

export function colorOf(id: ColorId): PaletteEntry {
  return PALETTE.find((p) => p.id === id) ?? PALETTE[0];
}

export type TruckConfig = {
  body: BodyId;
  wheels: WheelId;
  decal: DecalId;
  colorId: ColorId;
};

export const GARAGE_SIZE = 4;

export const DEFAULT_GARAGE: TruckConfig[] = [
  { body: "pickup", wheels: "mega", decal: "flames", colorId: "red" },
  { body: "van", wheels: "star", decal: "bolt", colorId: "blue" },
  { body: "rex", wheels: "spike", decal: "eyes", colorId: "green" },
  { body: "fire", wheels: "pinwheel", decal: "stars", colorId: "purple" },
];

export function cycle<T>(list: readonly T[], cur: T): T {
  return list[(list.indexOf(cur) + 1) % list.length];
}

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export function randomTruck(): TruckConfig {
  return {
    body: pick(BODIES),
    wheels: pick(WHEELS),
    decal: pick(DECALS),
    colorId: pick(PALETTE).id,
  };
}

const STORAGE_KEY = "monster-garage-v1";

export type GarageSave = { trucks: TruckConfig[]; active: number };

export function loadGarage(): GarageSave | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { trucks?: TruckConfig[]; active?: number };
    if (!Array.isArray(data.trucks) || data.trucks.length !== GARAGE_SIZE) return null;
    const valid = data.trucks.every(
      (t) =>
        (BODIES as readonly string[]).includes(t.body) &&
        (WHEELS as readonly string[]).includes(t.wheels) &&
        (DECALS as readonly string[]).includes(t.decal) &&
        PALETTE.some((p) => p.id === t.colorId)
    );
    if (!valid) return null;
    const active = typeof data.active === "number" ? data.active : 0;
    return { trucks: data.trucks, active: Math.min(GARAGE_SIZE - 1, Math.max(0, active)) };
  } catch {
    return null;
  }
}

export function saveGarage(save: GarageSave) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    // storage full or blocked: the game just won't persist
  }
}
