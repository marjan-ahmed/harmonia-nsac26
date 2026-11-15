import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

const CARTO_KEY = "cb1_58v4_1_540fee576bbd06386e97f42f";

type Bounds = { west: number; south: number; east: number; north: number };

type Cell = [number, number, number];

export function FireMap({ year, month, bounds }: { year: number; month: number; bounds: Bounds }) {
  const node = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const [ready, setReady] = useState(0);
  const [caption, setCaption] = useState("Loading 0.05° cells…");

  useEffect(() => {
    let cancelled = false;
    const host = node.current;
    if (!host) return;
    void (async () => {
      const leaflet = await import("leaflet");
      if (cancelled || !node.current || mapRef.current) return;
      const L = leaflet.default ?? leaflet;
      const map = L.map(node.current, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false,
        preferCanvas: true,
      });
      L.tileLayer(`https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`, {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attribution/">CARTO</a>',
        subdomains: "abcd",
        maxNativeZoom: 18,
        maxZoom: 19,
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      map.fitBounds(
        [
          [bounds.south, bounds.west],
          [bounds.north, bounds.east],
        ],
        { padding: [12, 12] },
      );
      mapRef.current = map;
      setReady((value) => value + 1);
      window.setTimeout(() => map.invalidateSize(), 80);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer || ready === 0) return;
    let cancelled = false;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    setCaption(`Loading ${key}…`);
    void (async () => {
      const response = await fetch(`/grid/${key}.json`);
      if (!response.ok) {
        if (!cancelled) setCaption(`No grid for ${key}.`);
        return;
      }
      const data = (await response.json()) as { MODIS?: Cell[]; VIIRS?: Cell[] };
      const inside = (lat: number, lon: number) =>
        lat >= bounds.south && lat <= bounds.north && lon >= bounds.west && lon <= bounds.east;
      const modis = (data.MODIS ?? []).filter(([lat, lon]) => inside(lat, lon));
      const viirs = (data.VIIRS ?? []).filter(([lat, lon]) => inside(lat, lon));
      const leaflet = await import("leaflet");
      if (cancelled || !layerRef.current || !mapRef.current) return;
      const L = leaflet.default ?? leaflet;
      layer.clearLayers();
      const groups: Array<[Cell[], string]> = [
        [viirs, "#6a93a6"],
        [modis, "#c45c26"],
      ];
      let drawn = 0;
      for (const [cells, color] of groups) {
        for (const [lat, lon, detections] of cells) {
          L.circleMarker([lat, lon], {
            radius: detections <= 1 ? 2 : Math.min(8, 2 + Math.sqrt(detections)),
            stroke: false,
            fillColor: color,
            fillOpacity: 0.72,
          }).addTo(layer);
          drawn += 1;
        }
      }
      map.fitBounds(
        [
          [bounds.south, bounds.west],
          [bounds.north, bounds.east],
        ],
        { padding: [16, 16] },
      );
      if (!cancelled) {
        setCaption(
          `${key} · ${modis.length.toLocaleString("en-US")} MODIS cells · ${viirs.length.toLocaleString("en-US")} VIIRS cells · ${drawn.toLocaleString("en-US")} drawn`,
        );
      }
      map.invalidateSize();
    })();
    return () => {
      cancelled = true;
    };
  }, [year, month, ready, bounds.south, bounds.north, bounds.west, bounds.east]);

  return (
    <div>
      <div ref={node} className="z-0 h-80 w-full overflow-hidden rounded-2xl sm:h-96" />
      <p className="mt-2 text-xs text-muted">{caption}</p>
    </div>
  );
}
