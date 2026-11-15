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
    note: "Say Allama Ikbar and the challenge first. Do not open with the ratio.",
  },
  {
    kicker: "The problem",
    title: "The fire calendar breaks when the satellite changes.",
    body: "People who watch emergencies use hotspot history to see a normal month. MODIS and VIIRS do not count the same way. MODIS is leaving service. Without one scale, that history drops out.",
    note: "This is the challenge Marina Compagnucci set. The problem is the splice, not that fires are bad.",
  },
  {
    kicker: "The solution",
    title: "One calendar. The sensor no longer matters.",
    body: "Harmonia puts each VIIRS count back on the MODIS scale. A manager picks Argentina, La Rioja, or Chilecito, then a day, and sees that date in every other year.",
    note: "Say the solution in one sentence. Then say they can open the app and pick a place and a day.",
  },
  {
    kicker: "August 2020",
    title: "The national spike is not the local fire.",
    body: "",
    note: "Pause here. Argentina is outside normal. Chilecito, the same month, is not.",
  },
  {
    kicker: "How it works",
    title: "NASA FIRMS, on one scale.",
    body: "MODIS Collection 6.1 Terra+Aqua and VIIRS S-NPP Collection 2, 20 January 2012 to 31 December 2025. Harmonized is the VIIRS count divided by that month’s median ratio. Overall median 3.507. In-sample error 6.0%.",
    note: "If asked about 2001, say the extract starts 20 January 2012. Do not invent those years.",
  },
  {
    kicker: "Who it helps",
    title: "Is this day, in this place, outside the record?",
    body: "That is the question a fire manager asks. Harmonia answers it on one scale, so the answer still holds when the sensor changes.",
    note: "One user. One place. One day. Fire managers first, then scientists and land managers.",
  },
  {
    kicker: "Why it matters",
    title: "The calendar survives the satellite.",
    body: "When MODIS is gone, a manager in Chilecito can still tell a national spike from a quiet local month. The history of when burning happens stays on one page.",
    note: "End on the person, not on the limits. If asked: not burned area, not a live fire, not official borders, and the map is the month.",
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

          {index === 3 ? (
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

          {index !== 0 && index !== 3 && slide.body ? (
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
