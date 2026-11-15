export type MonthRow = {
  year: number;
  month: number;
  modis: number;
  viirs: number;
};

export type AlphaFit = {
  byMonth: number[];
  global: number;
  samples: number;
  scaled: boolean;
};

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export const BASELINE = { start: 2003, end: 2022 };

/** One active cell per sensor per day. Negative coords floor consistently. */
export function cellId(lat: number, lon: number, step = 0.01): string {
  const y = Math.floor(lat / step);
  const x = Math.floor(lon / step);
  return `${y}:${x}`;
}

export function fitAlpha(rows: MonthRow[]): AlphaFit {
  const buckets: number[][] = Array.from({ length: 13 }, () => []);
  const all: number[] = [];
  for (const row of rows) {
    if (row.modis > 0 && row.viirs > 0) {
      const ratio = row.modis / row.viirs;
      buckets[row.month]?.push(ratio);
      all.push(ratio);
    }
  }
  const global = median(all);
  const scaled = Number.isFinite(global) && global > 0;
  const byMonth = buckets.map((bucket, index) => {
    if (index === 0) return 0;
    return bucket.length >= 3 ? median(bucket) : global;
  });
  return { byMonth, global: scaled ? global : Number.NaN, samples: all.length, scaled };
}

/** MODIS-equivalent active cell-days. Overlap years blend both sensors. */
export function harmonizedValue(row: MonthRow, alpha: AlphaFit): number {
  const scale = alpha.byMonth[row.month];
  const usable = alpha.scaled && Number.isFinite(scale) && scale > 0;
  if (!usable) {
    if (row.modis > 0) return row.modis;
    return row.viirs;
  }
  if (row.viirs <= 0) return row.modis;
  if (row.modis <= 0) return scale * row.viirs;
  return 0.5 * row.modis + 0.5 * scale * row.viirs;
}

/** What the record looks like if you swap products in 2012 and do nothing else. */
export function spliceValue(row: MonthRow): number {
  if (row.year < 2012 || row.viirs <= 0) return row.modis;
  return row.viirs;
}

export function seriesValue(
  row: MonthRow,
  alpha: AlphaFit,
  mode: "harmonized" | "splice" | "modis" | "viirs",
): number {
  if (mode === "modis") return row.modis;
  if (mode === "viirs") return row.viirs;
  if (mode === "splice") return spliceValue(row);
  return harmonizedValue(row, alpha);
}

export function monthSamples(
  rows: MonthRow[],
  month: number,
  alpha: AlphaFit,
  start = BASELINE.start,
  end = BASELINE.end,
): number[] {
  return rows
    .filter((row) => row.month === month && row.year >= start && row.year <= end)
    .map((row) => harmonizedValue(row, alpha));
}

export function climatology(rows: MonthRow[], alpha: AlphaFit): number[] {
  const out = [0];
  for (let month = 1; month <= 12; month += 1) {
    const values = monthSamples(rows, month, alpha);
    const fallback =
      values.length >= 5
        ? values
        : rows.filter((row) => row.month === month).map((row) => harmonizedValue(row, alpha));
    out.push(median(fallback));
  }
  return out;
}

export type SeasonPoint = {
  month: number;
  label: string;
  median: number;
  p10: number;
  p90: number;
  selected: number;
};

export function seasonProfile(
  rows: MonthRow[],
  alpha: AlphaFit,
  year: number,
  mode: "harmonized" | "splice" | "modis" | "viirs",
): SeasonPoint[] {
  const clim = climatology(rows, alpha);
  return MONTHS.map((label, index) => {
    const month = index + 1;
    const baseline = monthSamples(rows, month, alpha);
    const pool =
      baseline.length >= 5
        ? baseline
        : rows.filter((row) => row.month === month).map((row) => harmonizedValue(row, alpha));
    const selected = rows.find((row) => row.year === year && row.month === month);
    return {
      month,
      label,
      median: clim[month] ?? 0,
      p10: quantile(pool, 0.1),
      p90: quantile(pool, 0.9),
      selected: selected ? seriesValue(selected, alpha, mode) : 0,
    };
  });
}

export type EraBar = { name: string; value: number };

export function eraComparison(rows: MonthRow[], alpha: AlphaFit): EraBar[] {
  const annual = (pred: (row: MonthRow) => boolean, pick: (row: MonthRow) => number) => {
    const totals = new Map<number, number>();
    for (const row of rows) {
      if (!pred(row)) continue;
      totals.set(row.year, (totals.get(row.year) ?? 0) + pick(row));
    }
    const values = [...totals.values()];
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };
  return [
    {
      name: "MODIS era",
      value: Math.round(annual((row) => row.year >= 2003 && row.year <= 2011, (row) => row.modis)),
    },
    {
      name: "VIIRS raw",
      value: Math.round(
        annual((row) => row.year >= 2012 && row.year <= 2022, (row) => row.viirs),
      ),
    },
    {
      name: "Harmonized",
      value: Math.round(
        annual(
          (row) => row.year >= 2012 && row.year <= 2022,
          (row) => harmonizedValue(row, alpha),
        ),
      ),
    },
  ];
}

export function criticalMonths(clim: number[]): number[] {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    .sort((a, b) => (clim[b] ?? 0) - (clim[a] ?? 0))
    .slice(0, 3)
    .sort((a, b) => a - b);
}

export function ratio(value: number, baseline: number): number | null {
  if (!Number.isFinite(baseline) || baseline <= 0) return null;
  return value / baseline;
}

function median(values: number[]): number {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return Number.NaN;
  const sorted = [...clean].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid] ?? Number.NaN;
  return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

function quantile(values: number[], q: number): number {
  const clean = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!clean.length) return 0;
  const pos = (clean.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  const a = clean[lo] ?? 0;
  const b = clean[hi] ?? a;
  return a + (b - a) * (pos - lo);
}
