import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/pitch")({
  component: Pitch,
});

const SLIDES = [
  {
    kicker: "NASA Space Apps 2026",
    title: "Harmonia",
    body: "One scale for fire, after MODIS retires.",
    note: "Say the team name and the challenge first. Do not open with the ratio.",
  },
  {
    kicker: "The break",
    title: "The record is split in two.",
    body: "MODIS is leaving service. VIIRS counts more hotspots, and the two numbers are not the same. A bigger count can be a new satellite, not a worse month.",
    note: "MODIS is retiring. VIIRS does not count the same way. The problem is the splice.",
  },
  {
    kicker: "August 2020",
    title: "The national spike is not the local fire.",
    body: "",
    note: "Pause here. Argentina is outside normal. Chilecito, the same month, is not.",
  },
  {
    kicker: "NASA data",
    title: "VIIRS, put back on the MODIS scale.",
    body: "MODIS Collection 6.1 Terra+Aqua and VIIRS S-NPP Collection 2, from FIRMS. Harmonized count is the VIIRS count divided by that calendar month’s median ratio. Overall median 3.507. In-sample error 6.0%, on the same months, so it is not an independent test.",
    note: "If asked about 2001, say the extract starts 20 January 2012. Do not invent those years.",
  },
  {
    kicker: "The tool",
    title: "Pick a place. Then a day.",
    body: "Argentina, La Rioja, or Chilecito. The calendar is the month. The day row is that date in every other year, on the MODIS scale. The map is the whole month, in 0.05° bins.",
    note: "Show the day row. Argentina, La Rioja, or Chilecito. The map is still the whole month.",
  },
  {
    kicker: "Who decides",
    title: "Is this day, in this place, outside the record?",
    body: "That is the question. Harmonia answers it on one scale, so the answer still holds when the sensor changes.",
    note: "One user. One place. One day. Fire managers first.",
  },
  {
    kicker: "Still open",
    title: "The overlap is honest. The long record is not in this file.",
    body: "Not burned area. Not a fire that is burning right now. Not an official provincial boundary. Not 2001–2011. The map is the month, not one day. Those limits stay in the file.",
    note: "Do not claim burned area, a live fire, official borders, or the years before 2012.",
  },
] as const;

function Pitch() {
  const [index, setIndex] = useState(0);
  const [notes, setNotes] = useState(false);
  const slide = SLIDES[index] ?? SLIDES[0];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable) return;
      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        setIndex((value) => Math.min(SLIDES.length - 1, value + 1));
      }
      if (event.key === "ArrowLeft") setIndex((value) => Math.max(0, value - 1));
      if (event.key === "Home") setIndex(0);
      if (event.key === "n" || event.key === "N") setNotes((value) => !value);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="min-h-screen bg-bg text-fg">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between text-xs text-muted">
          <Link to="/" className="inline-flex min-h-11 items-center">
            Harmonia
          </Link>
          <p>
            {index + 1} / {SLIDES.length}
          </p>
        </div>

        <section className="flex flex-1 flex-col justify-center rounded-3xl bg-surface px-6 py-10 shadow-soft sm:px-12 sm:py-14">
          <p className="text-xs tracking-wide text-muted">{slide.kicker}</p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl font-light tracking-tight sm:text-6xl">{slide.title}</h1>

          {index === 0 ? (
            <div className="mt-8 max-w-xl text-sm leading-relaxed text-muted">
              <p>{slide.body}</p>
              <p className="mt-6 text-fg">Allama Ikbar</p>
              <div className="mt-4 flex flex-wrap gap-6">
                <figure>
                  <img
                    src="/team/marjan.jpg"
                    alt="Muhammad Marjan Ahmed"
                    className="size-20 rounded-full object-cover"
                  />
                  <figcaption className="mt-2 text-fg">Muhammad Marjan Ahmed</figcaption>
                  <p>Team lead</p>
                </figure>
                <figure>
                  <img
                    src="/team/sufyan.jpg"
                    alt="Muhammad Sufyan Ahmed"
                    className="size-20 rounded-full object-cover"
                  />
                  <figcaption className="mt-2 text-fg">Muhammad Sufyan Ahmed</figcaption>
                </figure>
              </div>
              <p className="mt-6">Challenge: Harmonization of MODIS and VIIRS Hot Spots</p>
            </div>
          ) : null}

          {index === 2 ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <figure className="rounded-3xl bg-raised p-6">
                <figcaption className="text-xs tracking-wide text-muted">Argentina</figcaption>
                <p className="mt-3 font-display text-5xl font-light tracking-tight">3.23×</p>
                <p className="mt-2 text-sm text-muted">37,479 harmonized. Outside normal.</p>
              </figure>
              <figure className="rounded-3xl bg-raised p-6">
                <figcaption className="text-xs tracking-wide text-muted">Chilecito</figcaption>
                <p className="mt-3 font-display text-5xl font-light tracking-tight">0.60×</p>
                <p className="mt-2 text-sm text-muted">2 harmonized. Inside normal.</p>
              </figure>
            </div>
          ) : null}

          {index !== 0 && index !== 2 && slide.body ? (
            <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{slide.body}</p>
          ) : null}

          {index === 4 ? (
            <img
              src="/pitch-app.png"
              alt="Harmonia, August 2020, with the Argentina calendar and the light map."
              className="mt-8 max-h-64 w-full rounded-3xl object-cover object-top"
            />
          ) : null}
        </section>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIndex((value) => Math.max(0, value - 1))}
              className="min-h-11 rounded-full bg-surface px-4 text-sm shadow-soft"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setIndex((value) => Math.min(SLIDES.length - 1, value + 1))}
              className="min-h-11 rounded-full bg-fg px-4 text-sm text-white"
            >
              Next
            </button>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/Harmonia-Allama-Ikbar.pptx"
              download
              className="inline-flex min-h-11 items-center rounded-full bg-surface px-4 text-sm shadow-soft"
            >
              PowerPoint
            </a>
            <button
              type="button"
              onClick={() => setNotes((value) => !value)}
              className="min-h-11 rounded-full px-4 text-sm text-muted"
            >
              {notes ? "Hide notes" : "Notes"}
            </button>
          </div>
        </div>
        {notes ? <p className="pb-4 text-sm leading-relaxed text-muted">{slide.note}</p> : null}
      </div>
    </main>
  );
}
