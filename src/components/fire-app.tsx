import { useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Upload } from "lucide-react";
import { FireMap } from "@/components/fire-map";
import bundledCsv from "@/data/region_months.csv?raw";
import bundledDays from "@/data/region_days.csv?raw";
import { MONTHS } from "@/lib/fire/harmonize";
import {
  harmonizedMedianByMonth,
  archivesByRegion,
  fromSensorSummary,
  inSampleMedianError,
  overallMedianRatio,
  quantile,
  valueFor,
  type Archive,
  type MonthlyRow,
} from "@/lib/fire/monthly";

type Mode = "harmonized" | "raw";
type Paint = "activity" | "anomaly";

const count = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const two = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ratioFmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

const pct = new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });

const PLACES = [
  {
    id: "argentina",
    name: "Argentina",
    note: "Full extract.",
    west: -73.6,
    south: -55.1,
    east: -53.6,
    north: -21.8,
  },
  {
    id: "larioja",
    name: "La Rioja",
    note: "Box 27.98°S–31.87°S, 69.67°W–65.45°W. A rectangle, not the provincial boundary.",
    west: -69.67,
    south: -31.87,
    east: -65.45,
    north: -27.98,
  },
  {
    id: "chilecito",
    name: "Chilecito",
    note: "Box 28.85°S–29.55°S, 67.95°W–67.15°W. 731 MODIS detections in the whole record, so one active month makes a large multiple.",
    west: -67.95,
    south: -29.55,
    east: -67.15,
    north: -28.85,
  },
] as const;

export function FireApp() {
  const regions = useMemo(() => archivesByRegion(bundledCsv), []);
  const [regionId, setRegionId] = useState<(typeof PLACES)[number]["id"]>("argentina");
  const place = PLACES.find((item) => item.id === regionId) ?? PLACES[0];
  const bundled = regions[regionId] ?? { rows: [], ratioByMonth: [] as number[] };
  const [override, setOverride] = useState<Archive | null>(null);
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<Mode>("harmonized");
  const [paint, setPaint] = useState<Paint>("activity");
  const [focus, setFocus] = useState({ year: 2020, month: 8 });
  const [day, setDay] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const archive = override ?? bundled;
  const rows = archive.rows;
  const medians = useMemo(() => harmonizedMedianByMonth(rows), [rows]);
  const ratios = archive.ratioByMonth ?? [];
  const overall = overallMedianRatio(rows);
  const fitError = inSampleMedianError(rows, ratios);
  const years = [...new Set(rows.map((row) => row.year))].sort((a, b) => b - a);
  const focusRow = rows.find((row) => row.year === focus.year && row.month === focus.month) ?? null;
  const maxCell = Math.max(1, ...rows.map((row) => valueFor(row, mode)));
  const augustMedian = medians[focus.month] ?? Number.NaN;
  const harmonizedAnomaly = focusRow ? divide(focusRow.harmonized, augustMedian) : null;
  const rawAnomaly = focusRow ? divide(focusRow.viirs, augustMedian) : null;
  const season = useMemo(() => seasonOf(rows, medians, focus.year, mode), [rows, medians, focus.year, mode]);
  const bars = useMemo(() => annualMeans(rows), [rows]);
  const hot = topMonths(medians);
  const previous = rows.find((row) => row.year === focus.year - 1 && row.month === focus.month) ?? null;
  const peak = useMemo(() => {
    let best: MonthlyRow | null = null;
    for (const row of rows) {
      if (!best || row.harmonized > best.harmonized) best = row;
    }
    return best;
  }, [rows]);
  const flag =
    harmonizedAnomaly == null
      ? null
      : harmonizedAnomaly >= 2
        ? "Outside normal"
        : harmonizedAnomaly >= 1.5
          ? "Above normal"
          : "Inside normal";
  const dayTable = useMemo(() => parseDayFile(bundledDays)[regionId], [regionId]);
  const monthLength = new Date(focus.year, focus.month, 0).getDate();
  const activeDay = day != null && day <= monthLength ? day : null;
  const dayHistory = useMemo(() => {
    if (activeDay == null) return [];
    const list: { year: number; modis: number; viirs: number; harmonized: number }[] = [];
    for (const year of years) {
      const key = isoDate(year, focus.month, activeDay);
      if (key < "2012-01-20" || key > "2025-12-31") continue;
      const found = dayTable?.get(key);
      const modis = found?.modis ?? 0;
      const viirs = found?.viirs ?? 0;
      list.push({ year, modis, viirs, harmonized: harmonizedDay(found, ratios[focus.month] ?? Number.NaN) });
    }
    return list.sort((a, b) => a.year - b.year);
  }, [activeDay, years, focus.month, dayTable, ratios]);
  const dayNow = dayHistory.find((item) => item.year === focus.year) ?? null;
  const dayMedian = quantile(
    dayHistory.map((item) => item.harmonized),
    0.5,
  );
  const dayHarmonizedAnomaly = dayNow ? divide(dayNow.harmonized, dayMedian) : null;
  const dayRawAnomaly = dayNow ? divide(dayNow.viirs, dayMedian) : null;

  async function onFile(file: File | undefined) {
    if (!file) return;
    const next = fromSensorSummary(await file.text());
    if (!next.rows.length) {
      setNote("That file has no sensor rows. Need month, sensor_family, and detections.");
      return;
    }
    setOverride(next);
    setNote("");
    const august = next.rows.find((row) => row.year === 2020 && row.month === 8);
    const last = next.rows[next.rows.length - 1] ?? next.rows[0]!;
    setFocus(august ? { year: 2020, month: 8 } : { year: last.year, month: last.month });
    setMode("harmonized");
  }

  return (
    <main className="min-h-screen bg-bg text-fg">
      <header>
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-10 pb-2 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs tracking-wide text-muted">MODIS and VIIRS · 2012–2025</p>
            <h1 className="mt-2 font-display text-5xl font-light tracking-tight sm:text-6xl">
              <Link to="/">Harmonia</Link>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
              One quiet scale for burning. The sensor changes. The calendar does not.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-fg px-4 text-sm font-medium text-white"
            >
              <Upload className="size-4" aria-hidden="true" />
              Load monthly CSV
            </button>
            <button
              type="button"
              disabled={!rows.length}
              onClick={() => downloadText(toCsv(rows), "monthly_summary_harmonized.csv")}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-surface px-4 text-sm font-medium shadow-soft disabled:opacity-40"
            >
              <Download className="size-4" aria-hidden="true" />
              Monthly CSV
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(event) => {
                void onFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
        <p className="rounded-3xl bg-surface px-4 py-3 text-sm leading-relaxed text-muted shadow-soft">
          MODIS Collection 6.1 Terra+Aqua and VIIRS S-NPP Collection 2, counted as delivered in the supplied Argentina
          extracts, 2012–2025. MODIS confidence runs 0–100 and VIIRS includes low, nominal, and high. All type codes
          are kept. Monthly detection counts. The harmonized number is the VIIRS count divided by that calendar
          month’s median VIIRS/MODIS ratio
          {Number.isFinite(overall) ? ` (overall median ${ratioFmt.format(overall)})` : ""}. In-sample median absolute
          error against MODIS is {Number.isFinite(fitError) ? pct.format(fitError) : "—"}. That fit uses the same
          months, so it is not an independent validation. These files start 20 January 2012 and end 31 December 2025,
          so 2001–2011 is not shown. The map bins are 0.05°, not a 0.01° cell-day index, and not burned area.
        </p>
        {note ? <p className="text-sm text-ember">{note}</p> : null}

        <div className="flex w-fit flex-wrap gap-1 rounded-full bg-raised p-1">
          {PLACES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setRegionId(item.id);
                setOverride(null);
                setNote("");
                setDay(null);
              }}
              className={
                item.id === regionId && !override
                  ? "min-h-11 rounded-full bg-surface px-4 text-sm font-medium text-fg shadow-soft"
                  : "min-h-11 rounded-full px-4 text-sm font-medium text-muted"
              }
            >
              {item.name}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted">{place.note}</p>

        <section className="overflow-hidden rounded-3xl bg-surface shadow-soft">
          <div className="flex items-end justify-between gap-3 px-4 pt-4">
            <div>
              <h2 className="font-display text-3xl font-light tracking-tight">
                {MONTHS[focus.month - 1]} {focus.year}
              </h2>
              <p className="text-sm text-muted">Copper is MODIS. Blue is VIIRS. Bins inside {place.name}.</p>
            </div>
          </div>
          <div className="p-3">
            <FireMap year={focus.year} month={focus.month} bounds={place} />
          </div>
        </section>

        {!rows.length ? (
          <section className="rounded-3xl bg-surface shadow-soft px-4 py-8 text-sm leading-relaxed text-muted">
            <p className="font-display text-2xl text-fg">No monthly rows loaded</p>
            <p className="mt-2 max-w-2xl">
              The calendar reads monthly_summary.csv from the FIRMS extracts: month, sensor_family, detections.
            </p>
          </section>
        ) : (
          <>
            <section className="grid gap-4 lg:grid-cols-3">
              <article className="rounded-3xl bg-surface shadow-soft p-4 lg:col-span-2">
                <p className="text-xs font-medium tracking-widest text-muted uppercase">
                  {MONTHS[focus.month - 1]} {focus.year} · {place.name}
                </p>
                <p className="mt-2 font-display text-4xl font-light tracking-tight sm:text-5xl">
                  {harmonizedAnomaly == null
                    ? "No median yet"
                    : `${two.format(mode === "raw" ? (rawAnomaly ?? 0) : harmonizedAnomaly)}× the ${MONTHS[focus.month - 1]} median`}
                </p>
                {flag ? (
                  <p className="mt-3">
                    <span
                      className={
                        flag === "Inside normal"
                          ? "inline-flex min-h-11 items-center rounded-full border border-line px-3 text-sm font-medium"
                          : "inline-flex min-h-11 items-center rounded-full bg-ember px-3 text-sm font-medium text-bg"
                      }
                    >
                      {flag}
                    </span>
                    <span className="ml-3 text-sm text-muted">Flag trips at 1.5× and 2× the harmonized month median.</span>
                  </p>
                ) : null}
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                  {focusRow ? (
                    <>
                      Harmonized {count.format(Math.round(focusRow.harmonized))} is{" "}
                      {harmonizedAnomaly == null ? "—" : `${two.format(harmonizedAnomaly)}×`} the{" "}
                      {MONTHS[focus.month - 1]} median of {count.format(Math.round(augustMedian))}. Raw VIIRS{" "}
                      {count.format(Math.round(focusRow.viirs))} is{" "}
                      {rawAnomaly == null ? "—" : `${two.format(rawAnomaly)}×`} that same median.
                    </>
                  ) : (
                    "That month is not in the file."
                  )}
                </p>
              </article>
              <article className="rounded-3xl bg-surface shadow-soft p-4">
                <p className="text-xs font-medium tracking-widest text-muted uppercase">This month</p>
                <dl className="mt-3 space-y-2 text-sm">
                  <Row label="Harmonized MODIS-eq" value={focusRow ? count.format(Math.round(focusRow.harmonized)) : "—"} />
                  <Row label="VIIRS S-NPP" value={focusRow ? count.format(Math.round(focusRow.viirs)) : "—"} />
                  <Row label="MODIS Terra+Aqua" value={focusRow ? count.format(Math.round(focusRow.modis)) : "—"} />
                  <Row
                    label="Month median ratio"
                    value={Number.isFinite(ratios[focus.month] ?? Number.NaN) ? ratioFmt.format(ratios[focus.month] ?? 0) : "—"}
                  />
                  <Row label="Busiest months" value={hot.map((month) => MONTHS[month - 1]).join(" · ") || "—"} />
                  <Row
                    label="MODIS FRP sum"
                    value={focusRow ? `${count.format(Math.round(focusRow.modisFrp ?? 0))} MW` : "—"}
                  />
                  <Row
                    label="VIIRS FRP sum"
                    value={focusRow ? `${count.format(Math.round(focusRow.viirsFrp ?? 0))} MW` : "—"}
                  />
                  <Row
                    label={previous ? `${MONTHS[focus.month - 1]} ${previous.year}` : "Year before"}
                    value={
                      previous
                        ? `${count.format(Math.round(previous.harmonized))} harmonized`
                        : "No prior year"
                    }
                  />
                </dl>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  FRP is the sum of detected pixel FRP, not energy from unique fires.
                </p>
                {peak ? (
                  <button
                    type="button"
                    onClick={() => setFocus({ year: peak.year, month: peak.month })}
                    className="mt-4 min-h-11 w-full rounded-full bg-raised px-3 text-sm font-medium"
                  >
                    Busiest month: {MONTHS[peak.month - 1]} {peak.year}
                  </button>
                ) : null}
              </article>
            </section>

            <div className="flex flex-wrap gap-2">
              <Toggle
                options={[
                  ["harmonized", "Harmonized"],
                  ["raw", "Raw"],
                ]}
                value={mode}
                onChange={setMode}
              />
              <Toggle
                options={[
                  ["activity", "Activity"],
                  ["anomaly", "Anomaly"],
                ]}
                value={paint}
                onChange={setPaint}
              />
            </div>

            {override ? null : (
              <section className="rounded-3xl bg-surface p-4 shadow-soft">
                <h2 className="font-display text-3xl font-light tracking-tight">Choose a day</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted">
                  {place.name}, {MONTHS[focus.month - 1]} {focus.year}. Pick a date. The row under it is that same date
                  in the other years, on the MODIS scale. The map above is still the whole month.
                </p>
                <div className="mt-4 flex flex-wrap gap-1">
                  {Array.from({ length: monthLength }, (_, index) => index + 1).map((date) => {
                    const key = isoDate(focus.year, focus.month, date);
                    const found = dayTable?.get(key);
                    const value = mode === "raw" ? (found?.viirs ?? 0) : harmonizedDay(found, ratios[focus.month] ?? Number.NaN);
                    const selected = activeDay === date;
                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => setDay(selected ? null : date)}
                        aria-pressed={selected}
                        className={
                          "flex h-11 w-11 flex-col items-center justify-center rounded-md text-xs " +
                          (selected ? "bg-fg text-white" : value > 0 ? "bg-raised text-fg" : "text-muted")
                        }
                      >
                        <span className="font-medium">{date}</span>
                      </button>
                    );
                  })}
                </div>
                {activeDay != null && dayNow ? (
                  <div className="mt-4">
                    <p className="font-display text-3xl font-light tracking-tight">
                      {dayHarmonizedAnomaly == null
                        ? "No usual count for this date"
                        : `${two.format(mode === "raw" ? (dayRawAnomaly ?? 0) : dayHarmonizedAnomaly)}× a usual ${MONTHS[focus.month - 1]} ${activeDay}`}
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      {MONTHS[focus.month - 1]} {activeDay}, {focus.year}: harmonized {count.format(Math.round(dayNow.harmonized))},
                      VIIRS {count.format(dayNow.viirs)}, MODIS {count.format(dayNow.modis)}. The usual harmonized count
                      for this date is {count.format(Math.round(dayMedian))}.
                    </p>
                    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                      {dayHistory.map((item) => (
                        <button
                          key={item.year}
                          type="button"
                          onClick={() => setFocus({ year: item.year, month: focus.month })}
                          className={
                            "min-w-16 rounded-2xl px-3 py-2 text-left " +
                            (item.year === focus.year ? "bg-fg text-white" : "bg-raised")
                          }
                        >
                          <span className="block text-xs">{item.year}</span>
                          <span className="block text-sm font-medium">
                            {compact(mode === "raw" ? item.viirs : item.harmonized)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            )}

            <section className="grid gap-4 lg:grid-cols-5">
              <div className="min-w-0 rounded-3xl bg-surface shadow-soft p-3 sm:p-4 lg:col-span-3">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <h2 className="font-display text-3xl font-light tracking-tight">Burning calendar</h2>
                    <p className="text-sm text-muted">
                      {mode === "harmonized"
                        ? "Each cell is the VIIRS count divided by that month’s median ratio."
                        : "Each cell is the raw VIIRS S-NPP monthly count."}{" "}
                      {paint === "anomaly" ? "Ember is above that month’s harmonized median." : "Recent years sit on top."}
                    </p>
                  </div>
                  <div className="hidden items-center gap-2 text-xs text-muted sm:flex">
                    <span>Low</span>
                    <span className="h-2 w-16 rounded-full bg-gradient-to-r from-raised to-ember" />
                    <span>High</span>
                  </div>
                </div>
                <div className="max-h-screen overflow-auto">
                  <table className="border-separate border-spacing-1">
                    <thead>
                      <tr>
                        <th className="sticky left-0 bg-surface p-1 text-left text-xs font-medium text-muted">Year</th>
                        {MONTHS.map((label) => (
                          <th key={label} className="p-1 text-center text-xs font-medium text-muted">
                            {label.slice(0, 1)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {years.map((year) => (
                        <tr key={year}>
                          <th className="sticky left-0 bg-surface px-1 text-left text-xs font-medium text-muted">{year}</th>
                          {MONTHS.map((label, index) => {
                            const month = index + 1;
                            const row = rows.find((item) => item.year === year && item.month === month);
                            const value = row ? valueFor(row, mode) : 0;
                            const anomaly = row ? divide(row.harmonized, medians[month] ?? 0) : null;
                            const selected = focus.year === year && focus.month === month;
                            const tone = row
                              ? paintCell(value, maxCell, anomaly, paint)
                              : { background: "transparent", color: "var(--color-muted)" };
                            return (
                              <td key={label}>
                                <button
                                  type="button"
                                  disabled={!row}
                                  onClick={() => row && setFocus({ year, month })}
                                  aria-pressed={selected}
                                  aria-label={row ? `${label} ${year}, ${count.format(Math.round(value))}` : `${label} ${year}, no data`}
                                  className={
                                    "flex h-11 w-12 items-center justify-center rounded-md text-xs font-medium " +
                                    (selected ? "outline outline-2 outline-offset-1 outline-fg" : "")
                                  }
                                  style={tone}
                                >
                                  {row ? compact(value) : "·"}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <article className="rounded-3xl bg-surface shadow-soft p-4 lg:col-span-2">
                <h2 className="font-display text-3xl font-light tracking-tight">Ratio table</h2>
                <p className="mt-1 text-sm text-muted">
                  Median VIIRS / MODIS by calendar month, from the monthly counts. Overall median{" "}
                  {Number.isFinite(overall) ? ratioFmt.format(overall) : "—"}.
                </p>
                <ol className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {MONTHS.map((label, index) => (
                    <li key={label} className="flex justify-between gap-3 border-b border-line py-1">
                      <span className="text-muted">{label}</span>
                      <span className="font-medium">
                        {Number.isFinite(ratios[index + 1] ?? Number.NaN) ? ratioFmt.format(ratios[index + 1] ?? 0) : "—"}
                      </span>
                    </li>
                  ))}
                </ol>
              </article>
            </section>

            <section className="grid gap-4 lg:grid-cols-5">
              <article className="rounded-3xl bg-surface shadow-soft p-4 lg:col-span-3">
                <h2 className="font-display text-3xl font-light tracking-tight">Season against the record</h2>
                <p className="mb-3 text-sm text-muted">
                  Band is the p10–p90 of the harmonized series. The line is {focus.year}{" "}
                  {mode === "raw" ? "raw VIIRS" : "harmonized"}.
                </p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={season} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="var(--color-line)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: "var(--color-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "var(--color-muted)", fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-raised)",
                          border: "1px solid var(--color-line)",
                          borderRadius: 12,
                          color: "var(--color-fg)",
                        }}
                      />
                      <Area dataKey="p90" stroke="none" fill="var(--color-mist)" fillOpacity={0.18} name="p90" />
                      <Area dataKey="p10" stroke="none" fill="var(--color-surface)" fillOpacity={1} name="p10" />
                      <Line dataKey="median" stroke="var(--color-muted)" strokeDasharray="4 4" dot={false} name="Median" strokeWidth={1.5} />
                      <Line dataKey="selected" stroke="var(--color-ember)" dot={false} name={String(focus.year)} strokeWidth={2.5} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </article>
              <article className="rounded-3xl bg-surface shadow-soft p-4 lg:col-span-2">
                <h2 className="font-display text-3xl font-light tracking-tight">Annual means</h2>
                <p className="mb-3 text-sm text-muted">Mean of yearly sums, 2012–2025. Harmonized should sit near MODIS. Raw VIIRS should not.</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bars} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="var(--color-line)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "var(--color-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "var(--color-muted)", fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-raised)",
                          border: "1px solid var(--color-line)",
                          borderRadius: 12,
                          color: "var(--color-fg)",
                        }}
                      />
                      <Bar dataKey="value" fill="var(--color-ember)" radius={[6, 6, 0, 0]} name="Mean annual count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </section>
          </>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}

type DayCount = { modis: number; viirs: number };

function parseDayFile(text: string): Record<string, Map<string, DayCount>> {
  const out: Record<string, Map<string, DayCount>> = {};
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\n/);
  for (let index = 1; index < lines.length; index += 1) {
    const [region, date, modisText, viirsText] = (lines[index] ?? "").split(",");
    if (!region || !date) continue;
    const table = out[region] ?? new Map<string, DayCount>();
    table.set(date, { modis: Number(modisText) || 0, viirs: Number(viirsText) || 0 });
    out[region] = table;
  }
  return out;
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function harmonizedDay(found: DayCount | undefined, scale: number): number {
  if (!found) return 0;
  if (found.viirs > 0 && Number.isFinite(scale) && scale > 0) return found.viirs / scale;
  return found.modis;
}

function seasonOf(rows: MonthlyRow[], medians: number[], year: number, mode: Mode) {
  return MONTHS.map((label, index) => {
    const month = index + 1;
    const pool = rows.filter((row) => row.month === month).map((row) => row.harmonized);
    const selected = rows.find((row) => row.year === year && row.month === month);
    return {
      label,
      median: medians[month] ?? 0,
      p10: quantile(pool, 0.1) || 0,
      p90: quantile(pool, 0.9) || 0,
      selected: selected ? valueFor(selected, mode) : 0,
    };
  });
}

function annualMeans(rows: MonthlyRow[]) {
  const totals = new Map<number, { modis: number; viirs: number; harmonized: number }>();
  for (const row of rows) {
    const current = totals.get(row.year) ?? { modis: 0, viirs: 0, harmonized: 0 };
    current.modis += row.modis;
    current.viirs += row.viirs;
    current.harmonized += row.harmonized;
    totals.set(row.year, current);
  }
  const years = [...totals.values()];
  const mean = (pick: (row: { modis: number; viirs: number; harmonized: number }) => number) =>
    years.length ? Math.round(years.reduce((sum, row) => sum + pick(row), 0) / years.length) : 0;
  return [
    { name: "MODIS", value: mean((row) => row.modis) },
    { name: "VIIRS raw", value: mean((row) => row.viirs) },
    { name: "Harmonized", value: mean((row) => row.harmonized) },
  ];
}

function topMonths(medians: number[]): number[] {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    .filter((month) => Number.isFinite(medians[month]) && (medians[month] ?? 0) > 0)
    .sort((a, b) => (medians[b] ?? 0) - (medians[a] ?? 0))
    .slice(0, 3)
    .sort((a, b) => a - b);
}

function divide(value: number, baseline: number): number | null {
  if (!Number.isFinite(baseline) || baseline <= 0) return null;
  return value / baseline;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-fg">{value}</dd>
    </div>
  );
}

function Toggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<[T, string]>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap rounded-full bg-raised p-1">
      {options.map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className={
            value === id
              ? "min-h-11 rounded-full bg-surface px-3 text-sm font-medium text-fg shadow-soft"
              : "min-h-11 rounded-full px-3 text-sm font-medium text-muted"
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function paintCell(
  value: number,
  max: number,
  anomaly: number | null,
  paint: Paint,
): { background: string; color: string } {
  if (paint === "anomaly" && anomaly != null) {
    const t = Math.min(1, Math.abs(anomaly - 1) / 1.6);
    const hue = anomaly >= 1 ? "var(--color-ember)" : "var(--color-mist)";
    return {
      background: `color-mix(in srgb, ${hue} ${Math.round(16 + t * 84)}%, var(--color-raised))`,
      color: t > 0.42 ? "var(--color-bg)" : "var(--color-fg)",
    };
  }
  const t = max > 0 ? Math.min(1, value / max) : 0;
  return {
    background: `color-mix(in srgb, var(--color-ember) ${Math.round(t * 100)}%, var(--color-raised))`,
    color: t > 0.45 ? "var(--color-bg)" : "var(--color-fg)",
  };
}

function compact(value: number): string {
  const rounded = Math.round(value);
  if (rounded >= 1000) return `${(rounded / 1000).toFixed(1)}k`;
  return String(rounded);
}

function toCsv(rows: MonthlyRow[]): string {
  const lines = ["year,month,modis,viirs,harmonized"];
  for (const row of rows) {
    lines.push([row.year, row.month, row.modis, row.viirs, row.harmonized].join(","));
  }
  return lines.join("\n");
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
