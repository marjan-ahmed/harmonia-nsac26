import { cellId } from "@/lib/fire/harmonize";
import type { MonthRow } from "@/lib/fire/harmonize";

export type FirePoint = {
  lat: number;
  lon: number;
  date: string;
  sensor: "MODIS" | "VIIRS";
  satellite: string;
  confidence: number;
  frp: number;
  cell: string;
};

export function aggregateCellDays(points: FirePoint[], step = 0.01): MonthRow[] {
  const modis = new Map<string, Set<string>>();
  const viirs = new Map<string, Set<string>>();
  for (const point of points) {
    const [yearText, monthText] = point.date.split("-");
    const year = Number(yearText);
    const month = Number(monthText);
    if (!year || !month) continue;
    const key = `${year}-${month}`;
    const cell = `${point.date}|${cellId(point.lat, point.lon, step)}`;
    const bucket = point.sensor === "MODIS" ? modis : viirs;
    let set = bucket.get(key);
    if (!set) {
      set = new Set();
      bucket.set(key, set);
    }
    set.add(cell);
  }
  const keys = new Set([...modis.keys(), ...viirs.keys()]);
  return [...keys]
    .map((key) => {
      const [year, month] = key.split("-").map(Number);
      return {
        year: year ?? 0,
        month: month ?? 0,
        modis: modis.get(key)?.size ?? 0,
        viirs: viirs.get(key)?.size ?? 0,
      };
    })
    .sort((a, b) => a.year - b.year || a.month - b.month);
}

export function withCells(points: FirePoint[], step = 0.01): FirePoint[] {
  return points.map((point) => ({ ...point, cell: cellId(point.lat, point.lon, step) }));
}
