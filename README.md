# Harmonia

Team **Allama Ikbar**. NASA Space Apps Challenge 2026.

Challenge: **Harmonization of MODIS and VIIRS Hot Spots**.

Harmonia is a web app that puts VIIRS active-fire hotspot counts onto the MODIS scale and shows them as a burning-activity calendar. A fire manager opens a place and a month and sees whether that month is outside the historical record.

- Muhammad Marjan Ahmed, team lead
- Muhammad Sufyan Ahmed

## What it shows

The record of active-fire hotspots is split. MODIS counted fires one way. VIIRS counts more of them. Those two numbers are not the same, so a jump in the VIIRS count can be a new sensor rather than a worse fire season.

Harmonia divides each VIIRS monthly count by that calendar month’s median VIIRS/MODIS ratio. The result is a harmonized count on the MODIS scale. The calendar, the flag, and the season chart use that number. A raw VIIRS view is still available, so the unscaled count is not hidden.

Places in this build:

- **Argentina**, the full extract
- **La Rioja**, a rectangle (27.98°S–31.87°S, 69.67°W–65.45°W), not the provincial boundary
- **Chilecito**, a rectangle (28.85°S–29.55°S, 67.95°W–67.15°W)

## NASA data

Counts come from NASA FIRMS active-fire detections, counted as delivered.

| | |
|---|---|
| MODIS | Collection 6.1, Terra and Aqua |
| VIIRS | S-NPP Collection 2 |
| Dates | 20 January 2012 through 31 December 2025 |
| Confidence | All levels kept. MODIS is 0–100. VIIRS includes low, nominal, and high. |
| Types | All type codes kept |
| Map | 0.05° bins of those detections |

This is not burned area. It is not a 0.01° cell-day index. Years 2001–2011 are not in this extract, so the app does not show them.

The raw FIRMS archives are not in this repository. They are large. What is included is the monthly summary (`src/data/region_months.csv`) and the 0.05° map cells (`public/grid/`).

## Method

For each calendar month, the scale is the median of VIIRS ÷ MODIS across the years in the extract.

```
harmonized = VIIRS monthly count / that month's median ratio
```

On the Argentina series the overall median ratio is **3.507**. The in-sample median absolute error against MODIS is **6.0%**. That fit uses the same months, so it is not an independent test.

The flag marks a month above normal at 1.5× that month’s harmonized median, and outside normal at 2×.

## August 2020

Argentina and Chilecito, the same month:

| Place | Harmonized | Against the August median | Raw VIIRS | Reading |
|---|---|---|---|---|
| Argentina | 37,479 | 3.23× a median of 11,615 | 113,956 (9.81× that median) | Outside normal |
| Chilecito | 2 | 0.60× its August median | 9 | Inside normal |

Argentina MODIS for that month was 32,886. The national spike is not the local fire.

## Run it

Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080).

| Path | Page |
|---|---|
| `/` | Landing page |
| `/app` | Burning calendar, map, and season chart |
| `/pitch` | Seven-slide pitch |

Production build:

```bash
npm run build
```

No login is required. The app does not call FIRMS at runtime. The monthly counts are bundled.

### Load monthly CSV

On the calendar, **Load monthly CSV** replaces the on-screen series with a file from your computer. The file stays in the browser. It needs these columns:

- `month`, such as `2020-08`
- `sensor_family`, `MODIS` or `VIIRS`
- `detections`

The harmonized number is recomputed from that file. The map does not change. It still draws the bundled 0.05° cells. **Monthly CSV** downloads the months currently on screen.

## Pages

The pitch is seven slides, the NASA Space Apps limit, including the first and last. A PowerPoint of the same deck is at `public/Harmonia-Allama-Ikbar.pptx`.
