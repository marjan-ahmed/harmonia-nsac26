export type MonthlyRow = {
  year: number;
  month: number;
  modis: number;
  viirs: number;
  harmonized: number;
  modisFrp?: number;
  viirsFrp?: number;
};

export type Archive = {
  rows: MonthlyRow[];
  /** Per-calendar-month median VIIRS/MODIS, index 1–12. */
  ratioByMonth: number[] | null;
};

const MONTH_INDEX: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  june: 6,
  jun: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

export function parseArchive(text: string): Archive {
  const tables = text
    .replace(/^\uFEFF/, "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const rows: MonthlyRow[] = [];
  let ratioByMonth: number[] | null = null;

  for (const block of tables.length ? tables : [text]) {
    const lines = block.split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith("#"));
    if (lines.length < 2) continue;
    const header = splitCsv(lines[0] ?? "").map((cell) => normalizeHeader(cell));
    const col = (names: string[]) => header.findIndex((name) => names.includes(name));
    const yearI = col(["year", "yr"]);
    const monthI = col(["month", "mon"]);
    const harmonizedI = col(["harmonized_modis_eq", "harmonized", "modis_eq"]);
    const ratioI = col(["median_ratio", "month_median_ratio", "ratio_median", "viirs_modis_median"]);

    if (harmonizedI >= 0 && yearI >= 0 && monthI >= 0) {
      const modisI = col(["modis", "modis_count", "modis_detections", "terra_aqua"]);
      const viirsI = col(["viirs", "viirs_snpp", "viirs_s_npp", "viirs_count", "snpp"]);
      for (let i = 1; i < lines.length; i += 1) {
        const cells = splitCsv(lines[i] ?? "");
        const year = Number(cells[yearI]);
        const month = monthNumber(cells[monthI] ?? "");
        const harmonized = Number(cells[harmonizedI]);
        if (!year || !month || !Number.isFinite(harmonized)) continue;
        rows.push({
          year,
          month,
          modis: modisI >= 0 ? numberOrZero(cells[modisI]) : 0,
          viirs: viirsI >= 0 ? numberOrZero(cells[viirsI]) : 0,
          harmonized,
        });
      }
      continue;
    }

    if (ratioI >= 0 && monthI >= 0 && yearI < 0) {
      const ratios = Array.from({ length: 13 }, () => Number.NaN);
      for (let i = 1; i < lines.length; i += 1) {
        const cells = splitCsv(lines[i] ?? "");
        const month = monthNumber(cells[monthI] ?? "");
        const ratio = Number(cells[ratioI]);
        if (month && Number.isFinite(ratio)) ratios[month] = ratio;
      }
      if (ratios.some((value) => Number.isFinite(value))) ratioByMonth = ratios;
    }
  }

  rows.sort((a, b) => a.year - b.year || a.month - b.month);
  return { rows, ratioByMonth };
}

/** FIRMS monthly summary: one row per month and sensor. Harmonized count is VIIRS / that month's median ratio. */
export function fromSensorSummary(text: string): Archive {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith("#"));
  const header = splitCsv(lines[0] ?? "").map((cell) => normalizeHeader(cell));
  const monthI = header.indexOf("month");
  const sensorI = header.indexOf("sensor_family");
  const detI = header.indexOf("detections");
  if (monthI < 0 || sensorI < 0 || detI < 0) return { rows: [], ratioByMonth: null };

  const by = new Map<string, { year: number; month: number; modis: number; viirs: number }>();
  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCsv(lines[i] ?? "");
    const [yearText, monthText] = (cells[monthI] ?? "").split("-");
    const year = Number(yearText);
    const month = Number(monthText);
    if (!year || month < 1 || month > 12) continue;
    const key = `${year}-${month}`;
    const slot = by.get(key) ?? { year, month, modis: 0, viirs: 0 };
    const detections = Number(cells[detI]);
    const sensor = (cells[sensorI] ?? "").toUpperCase();
    if (sensor.startsWith("MODIS")) slot.modis = detections;
    if (sensor.startsWith("VIIRS")) slot.viirs = detections;
    by.set(key, slot);
  }

  const partial = [...by.values()].map((row) => ({ ...row, harmonized: 0 }));
  const ratioByMonth = ratioByMonthFromRows(partial);
  const rows = partial
    .map((row) => {
      const scale = ratioByMonth[row.month] ?? Number.NaN;
      return {
        ...row,
        harmonized: Number.isFinite(scale) && scale > 0 ? row.viirs / scale : row.modis,
      };
    })
    .sort((a, b) => a.year - b.year || a.month - b.month);
  return { rows, ratioByMonth };
}

/** One archive per region from region,month,sensor_family,detections,frp_sum_mw. */
export function archivesByRegion(text: string): Record<string, Archive> {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith("#"));
  const header = splitCsv(lines[0] ?? "").map((cell) => normalizeHeader(cell));
  const col = (name: string) => header.indexOf(name);
  const regionI = col("region");
  const monthI = col("month");
  const sensorI = col("sensor_family");
  const detI = col("detections");
  const frpI = col("frp_sum_mw");
  if (regionI < 0 || monthI < 0 || sensorI < 0 || detI < 0) return {};

  const by = new Map<
    string,
    { year: number; month: number; modis: number; viirs: number; modisFrp: number; viirsFrp: number }
  >();
  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCsv(lines[i] ?? "");
    const region = cells[regionI] ?? "";
    const [yearText, monthText] = (cells[monthI] ?? "").split("-");
    const year = Number(yearText);
    const month = Number(monthText);
    if (!region || !year || month < 1 || month > 12) continue;
    const key = `${region}|${year}-${month}`;
    const slot = by.get(key) ?? { year, month, modis: 0, viirs: 0, modisFrp: 0, viirsFrp: 0 };
    const detections = Number(cells[detI]);
    const frp = frpI >= 0 ? Number(cells[frpI]) : 0;
    const sensor = (cells[sensorI] ?? "").toUpperCase();
    if (sensor.startsWith("MODIS")) {
      slot.modis = detections;
      slot.modisFrp = Number.isFinite(frp) ? frp : 0;
    }
    if (sensor.startsWith("VIIRS")) {
      slot.viirs = detections;
      slot.viirsFrp = Number.isFinite(frp) ? frp : 0;
    }
    by.set(key, slot);
  }

  const grouped = new Map<string, MonthlyRow[]>();
  for (const [key, slot] of by) {
    const region = key.slice(0, key.indexOf("|"));
    const list = grouped.get(region) ?? [];
    list.push({ ...slot, harmonized: 0 });
    grouped.set(region, list);
  }

  const out: Record<string, Archive> = {};
  for (const [region, partial] of grouped) {
    const ratioByMonth = ratioByMonthFromRows(partial);
    const rows = partial
      .map((row) => {
        const scale = ratioByMonth[row.month] ?? Number.NaN;
        return {
          ...row,
          harmonized: Number.isFinite(scale) && scale > 0 ? row.viirs / scale : row.modis,
        };
      })
      .sort((a, b) => a.year - b.year || a.month - b.month);
    out[region] = { rows, ratioByMonth };
  }
  return out;
}


export function valueFor(row: MonthlyRow, mode: "harmonized" | "raw"): number {
  return mode === "raw" ? row.viirs : row.harmonized;
}

/** Median of the harmonized series for each calendar month. Index 0 is unused. */
export function harmonizedMedianByMonth(rows: MonthlyRow[]): number[] {
  const buckets: number[][] = Array.from({ length: 13 }, () => []);
  for (const row of rows) buckets[row.month]?.push(row.harmonized);
  return buckets.map((bucket) => median(bucket));
}

/** Median VIIRS/MODIS by calendar month. */
export function ratioByMonthFromRows(rows: MonthlyRow[]): number[] {
  const buckets: number[][] = Array.from({ length: 13 }, () => []);
  for (const row of rows) {
    if (row.modis > 0 && row.viirs > 0) buckets[row.month]?.push(row.viirs / row.modis);
  }
  return buckets.map((bucket) => median(bucket));
}

export function overallMedianRatio(rows: MonthlyRow[]): number {
  const ratios = rows.filter((row) => row.modis > 0 && row.viirs > 0).map((row) => row.viirs / row.modis);
  return median(ratios);
}

/** Median |VIIRS / month-ratio − MODIS| / MODIS on the same months used to fit the ratio. */
export function inSampleMedianError(rows: MonthlyRow[], ratios: number[]): number {
  const errors: number[] = [];
  for (const row of rows) {
    const scale = ratios[row.month] ?? Number.NaN;
    if (!(row.modis > 0) || !(scale > 0)) continue;
    errors.push(Math.abs(row.viirs / scale - row.modis) / row.modis);
  }
  return median(errors);
}

export function quantile(values: number[], q: number): number {
  const clean = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!clean.length) return Number.NaN;
  const pos = (clean.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  const a = clean[lo] ?? 0;
  const b = clean[hi] ?? a;
  return a + (b - a) * (pos - lo);
}

export function median(values: number[]): number {
  return quantile(values, 0.5);
}

function numberOrZero(raw: string | undefined): number {
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function monthNumber(raw: string): number {
  const text = raw.trim().toLowerCase();
  const numeric = Number(text);
  if (numeric >= 1 && numeric <= 12) return numeric;
  return MONTH_INDEX[text] ?? 0;
}

function normalizeHeader(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "_");
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
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}
