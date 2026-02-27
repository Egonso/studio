import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { landingPageContent } from "./content";

export const metadata: Metadata = {
  title: "AI Governance Register | Register-First Landingpage",
  description:
    "Schatten-KI sichtbar machen: Das AI Governance Register als offener, dauerhaft kostenloser Standard für KI-Dokumentation.",
};

function ctaClass(style: "primary" | "secondary") {
  if (style === "primary") {
    return "inline-flex items-center justify-center rounded-md border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800";
  }

  return "inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50";
}

export default function RegisterFirstLandingPage() {
  const { hero, problem, solution, free, extension, closing } = landingPageContent;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f2f5f8_0%,#ffffff_42%,#ffffff_100%)] text-slate-900">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15,23,42,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.05) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 55%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <Image
              src="/register-logo.png"
              alt="AI Governance Register"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {hero.eyebrow}
              </p>
              <p className="text-sm text-slate-700">Offener Dokumentationsstandard</p>
            </div>
          </div>
          <Link
            href="/login"
            className="text-sm text-slate-600 underline-offset-4 transition-colors hover:text-slate-900 hover:underline"
          >
            Anmelden
          </Link>
        </header>

        <main className="space-y-20 pt-14">
          <section className="max-w-4xl space-y-7">
            <h1 className="font-headline text-4xl leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
              {hero.headline}
            </h1>
            <p className="max-w-3xl text-lg leading-relaxed text-slate-700">{hero.subline}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={hero.primaryCta.href} className={ctaClass(hero.primaryCta.style)}>
                {hero.primaryCta.label}
              </Link>
              <Link href={hero.secondaryCta.href} className={ctaClass(hero.secondaryCta.style)}>
                {hero.secondaryCta.label}
              </Link>
            </div>
          </section>

          <section className="space-y-7">
            <h2 className="font-headline text-3xl text-slate-950 sm:text-4xl">{problem.title}</h2>
            <p className="max-w-4xl text-base leading-relaxed text-slate-700">{problem.intro}</p>

            <div className="grid gap-4 md:grid-cols-3">
              {problem.scenarios.map((scenario) => (
                <article
                  key={scenario.area}
                  className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {scenario.area}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">
                    {scenario.description}
                  </p>
                </article>
              ))}
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 bg-white/85 p-6">
              <p className="text-sm font-semibold text-slate-800">{problem.consequenceLabel}</p>
              <ul className="space-y-2 text-sm text-slate-700">
                {problem.consequences.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-slate-700" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-7">
            <h2 className="font-headline text-3xl text-slate-950 sm:text-4xl">{solution.title}</h2>
            <p className="max-w-4xl text-base leading-relaxed text-slate-700">{solution.intro}</p>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <ul className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                {solution.outcomes.map((outcome) => (
                  <li key={outcome} className="flex items-start gap-3">
                    <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-slate-700" />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-5 border-y border-slate-200 py-12">
            <h2 className="font-headline text-3xl text-slate-950 sm:text-4xl">{free.title}</h2>
            <p className="max-w-4xl text-base leading-relaxed text-slate-700">{free.copy}</p>
          </section>

          <section className="space-y-5 rounded-xl border border-slate-200 bg-slate-50/70 p-8">
            <h2 className="font-headline text-3xl text-slate-950 sm:text-4xl">{extension.title}</h2>
            <p className="max-w-4xl text-base leading-relaxed text-slate-700">{extension.copy}</p>
          </section>

          <section className="space-y-6 border-t border-slate-200 pt-12">
            <h2 className="font-headline text-3xl text-slate-950 sm:text-4xl">{closing.title}</h2>
            <p className="max-w-3xl text-base leading-relaxed text-slate-700">{closing.copy}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={closing.primaryCta.href}
                className={ctaClass(closing.primaryCta.style)}
              >
                {closing.primaryCta.label}
              </Link>
              <p className="text-sm text-slate-600">{closing.supportLine}</p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
