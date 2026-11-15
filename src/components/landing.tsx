import { Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";

export function Landing() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <p className="text-sm">Harmonia</p>
        <nav className="flex gap-1 text-sm">
          <Link to="/app" className="inline-flex min-h-11 items-center px-3 text-muted">
            Calendar
          </Link>
          <Link to="/pitch" className="inline-flex min-h-11 items-center px-3 text-muted">
            Pitch
          </Link>
        </nav>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-8 sm:px-6">
        <section className="pt-8 sm:pt-16">
          <p className="text-xs tracking-wide text-muted">NASA Space Apps 2026</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl font-light tracking-tight sm:text-7xl">
            One scale for fire, after MODIS retires.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            Two satellites count fires. They do not count the same way. Harmonia puts them on one scale, then shows the
            month on a calendar.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Link
              to="/app"
              className="inline-flex min-h-11 items-center rounded-full bg-fg px-5 text-sm font-medium text-white"
            >
              Open the calendar
            </Link>
            <Link
              to="/pitch"
              className="inline-flex min-h-11 items-center rounded-full bg-surface px-5 text-sm font-medium shadow-soft"
            >
              Seven slides
            </Link>
          </div>
        </section>

        <section className="max-w-3xl">
          <h2 className="font-display text-3xl font-light tracking-tight">The problem</h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-muted">
            <p>
              People who watch emergencies need to know where a fire is burning now, and also whether this time of year
              is unusual. Almost half of those emergencies are fires. Some are forest fires. Some come from farming,
              industry, or clearing land.
            </p>
            <p>
              Satellites mark the hot spots. A calendar of those marks, year after year, shows the busy months, the
              quiet ones, and the years that do not fit the pattern.
            </p>
            <p>
              That calendar is broken in two. MODIS and VIIRS do not see the ground the same way. One is sharper. One
              is more sensitive. They do not pass at the same time. You cannot put their counts in one list and trust
              the jump.
            </p>
            <p>
              MODIS is leaving service. VIIRS takes its place. If the two records cannot be compared, about ten years
              of history drop out. A fire manager then has no calendar that says when and where burning usually
              happens.
            </p>
          </div>
        </section>

        <section className="max-w-3xl">
          <h2 className="font-display text-3xl font-light tracking-tight">The solution</h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-muted">
            <p>
              Harmonia is that calendar for Argentina. It uses NASA FIRMS hotspot counts from MODIS and from VIIRS
              S-NPP, from 20 January 2012 to 31 December 2025. Each VIIRS month is divided by how many more hotspots
              VIIRS usually sees in that same calendar month. The result is one count, on the MODIS scale.
            </p>
            <p>
              You pick a place, then a month, then a day. The page shows how many hotspots that day had in other years,
              on one scale, and whether that day sits outside the usual count. Argentina, La Rioja, and Chilecito are
              the places. The map under them is the month.
            </p>
            <p>
              In August 2020 the whole of Argentina was 3.23 times a normal August. Chilecito, the same month, was
              quiet.{" "}
              <strong className="font-semibold text-fg underline underline-offset-4">
                One calendar, so a new satellite does not erase the history of when burning happens.
              </strong>
            </p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-3xl bg-surface p-6 shadow-soft">
            <p className="text-xs tracking-wide text-muted">Argentina · August 2020</p>
            <p className="mt-3 font-display text-5xl font-light tracking-tight text-ember">3.23×</p>
            <p className="mt-2 text-sm text-muted">37,479 harmonized. Outside normal.</p>
          </article>
          <article className="rounded-3xl bg-surface p-6 shadow-soft">
            <p className="text-xs tracking-wide text-muted">Chilecito · August 2020</p>
            <p className="mt-3 font-display text-5xl font-light tracking-tight">0.60×</p>
            <p className="mt-2 text-sm text-muted">2 harmonized. Inside normal. Same month.</p>
          </article>
        </section>

        <section className="grid gap-8 rounded-3xl bg-surface p-6 shadow-soft sm:grid-cols-3 sm:p-8">
          <div>
            <h2 className="font-display text-2xl font-light">The break</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              MODIS counted fires one way. VIIRS counts more of them. The two numbers are not the same.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl font-light">The scale</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Harmonized is the VIIRS count divided by that calendar month’s median VIIRS/MODIS ratio. Overall median
              3.507. In-sample error 6.0%.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl font-light">The record</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Argentina, La Rioja, and Chilecito. 20 January 2012 to 31 December 2025. Years before 2012 are not in
              this extract.
            </p>
          </div>
        </section>

        <section className="flex flex-wrap items-center gap-8">
          <figure className="flex items-center gap-3">
            <img src="/team/marjan.jpg" alt="" className="size-14 rounded-full object-cover" />
            <figcaption>
              <p className="text-sm">Muhammad Marjan Ahmed</p>
              <p className="text-sm text-muted">Team lead</p>
            </figcaption>
          </figure>
          <figure className="flex items-center gap-3">
            <img src="/team/sufyan.jpg" alt="" className="size-14 rounded-full object-cover" />
            <figcaption>
              <p className="text-sm">Muhammad Sufyan Ahmed</p>
              <p className="text-sm text-muted">Allama Ikbar</p>
            </figcaption>
          </figure>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
