import { aggregateCellDays, type FirePoint } from "@/lib/fire/points";

export function parseFirmsCsv(text: string, hint?: "MODIS" | "VIIRS"): FirePoint[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];
  const header = splitCsv(lines[0] ?? "").map((cell) => cell.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const latI = idx("latitude");
  const lonI = idx("longitude");
  const dateI = idx("acq_date");
  if (latI < 0 || lonI < 0 || dateI < 0) return [];
  const confI = idx("confidence");
  const frpI = idx("frp");
  const satI = idx("satellite");
  const instI = idx("instrument");
  const typeI = idx("type");
  const points: FirePoint[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    if (points.length >= 80000) break;
    const cells = splitCsv(lines[i] ?? "");
    const lat = Number(cells[latI]);
    const lon = Number(cells[lonI]);
    const date = (cells[dateI] ?? "").trim();
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    if (typeI >= 0) {
      const kind = Number(cells[typeI]);
      if (Number.isFinite(kind) && kind !== 0) continue;
    }
    const satellite = satI >= 0 ? (cells[satI] ?? "").trim() : "";
    const instrument = instI >= 0 ? (cells[instI] ?? "").trim() : "";
    const sensor = detectSensor(instrument, satellite, hint);
    if (!sensor) continue;
    const confidence = normalizeConfidence(confI >= 0 ? (cells[confI] ?? "") : "");
    if (confidence < 30) continue;
    const frp = frpI >= 0 ? Number(cells[frpI]) : Number.NaN;
    points.push({
      lat,
      lon,
      date,
      sensor,
      satellite: satellite || sensor,
      confidence,
      frp: Number.isFinite(frp) ? frp : 0,
      cell: "",
    });
  }
  return points;
}

export function rowsFromPoints(points: FirePoint[]) {
  return aggregateCellDays(points);
}

function detectSensor(
  instrument: string,
  satellite: string,
  hint?: "MODIS" | "VIIRS",
): "MODIS" | "VIIRS" | null {
  const blob = `${instrument} ${satellite}`.toLowerCase();
  if (blob.includes("modis") || blob.includes("terra") || blob.includes("aqua")) return "MODIS";
  if (
    blob.includes("viirs") ||
    blob.includes("noaa") ||
    blob.includes("suomi") ||
    blob.includes("npp") ||
    blob.includes("jpss") ||
    blob === "n" ||
    blob.includes(" n")
  ) {
    return "VIIRS";
  }
  return hint ?? null;
}

function normalizeConfidence(raw: string): number {
  const value = raw.trim().toLowerCase();
  if (value === "l" || value === "low") return 20;
  if (value === "n" || value === "nominal") return 50;
  if (value === "h" || value === "high") return 80;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      quoted = !quoted;
      continue;
    }
    if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}
