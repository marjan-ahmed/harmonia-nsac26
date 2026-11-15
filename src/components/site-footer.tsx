import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm text-muted sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-fg">Harmonia</p>
          <p className="mt-2">Allama Ikbar</p>
          <p className="mt-3">Muhammad Marjan Ahmed, team lead</p>
          <p>Muhammad Sufyan Ahmed</p>
        </div>
        <div>
          <p className="text-fg">NASA Space Apps Challenge 2026</p>
          <p className="mt-2">Harmonization of MODIS and VIIRS Hot Spots</p>
          <p className="mt-3">NASA FIRMS · MODIS Collection 6.1 Terra+Aqua · VIIRS S-NPP Collection 2</p>
          <p className="mt-2">
            <a
              className="underline"
              href="https://www.earthdata.nasa.gov/data/tools/firms/active-fire-data-attributes-modis-viirs"
            >
              Active-fire attributes
            </a>
            {" · "}
            <a className="underline" href="https://firms.modaps.eosdis.nasa.gov/map/">
              FIRMS map
            </a>
          </p>
          <p className="mt-2">Argentina, 20 January 2012 – 31 December 2025. Not burned area. Not 2001–2011.</p>
        </div>
        <div className="flex flex-col items-start gap-1">
          <Link to="/" className="min-h-11 inline-flex items-center text-fg">
            Home
          </Link>
          <Link to="/app" className="min-h-11 inline-flex items-center text-fg">
            Calendar
          </Link>
          <Link to="/pitch" className="min-h-11 inline-flex items-center text-fg">
            Pitch
          </Link>
          <a href="/Harmonia-Allama-Ikbar.pptx" download className="min-h-11 inline-flex items-center text-fg">
            PowerPoint
          </a>
        </div>
      </div>
    </footer>
  );
}
