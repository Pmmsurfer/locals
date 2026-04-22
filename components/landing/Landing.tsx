import { WaitlistForm } from "./WaitlistForm";

const activityCards = [
  {
    badge: "Running",
    badgeClass: "bg-[#E8FFF0] text-[#16A34A]",
    title: "Find your morning crew",
  },
  {
    badge: "Cycling",
    badgeClass: "bg-[#FFF4E8] text-[#D97706]",
    title: "Dawn patrol to century rides",
  },
  {
    badge: "Surfing",
    badgeClass: "bg-[#E8EEFF] text-accent",
    title: "Find a partner who shows up",
  },
  {
    badge: "Swimming",
    badgeClass: "bg-[#E0F7FF] text-[#0099CC]",
    title: "Find your lane partner",
  },
  {
    badge: "Social",
    badgeClass: "bg-[#FFF3E0] text-[#FF6B6B]",
    title: "Meet people, do things",
  },
  {
    badge: "Hiking",
    badgeClass: "bg-[#F0FFF4] text-[#15803D]",
    title: "Trail buddies near you",
  },
  {
    badge: "Yoga",
    badgeClass: "bg-[#FDF4FF] text-[#9333EA]",
    title: "Practice together, stay consistent",
  },
  {
    badge: "Climbing",
    badgeClass: "bg-[#FFF7ED] text-[#EA580C]",
    title: "Find a belay partner",
  },
  {
    badge: "Tennis/Pickleball",
    badgeClass: "bg-[#FFF0F0] text-[#DC2626]",
    title: "Find a rally partner",
  },
] as const;

const steps = [
  {
    n: "01",
    title: "Post a session",
    desc: "Share what you're doing, when, where, and who you're looking for.",
  },
  {
    n: "02",
    title: "Find your people",
    desc: "Find people nearby at your pace and schedule. No algorithm — just real people.",
  },
  {
    n: "03",
    title: "Show up",
    desc: "Someone's counting on you. That's the whole product.",
  },
] as const;

export function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between px-6 py-4">
          <span className="font-sans text-[22px] font-extrabold text-accent">
            LOCALS
          </span>
          <a
            href="#waitlist"
            className="inline-flex items-center justify-center rounded-button bg-accent px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
          >
            Join waitlist
          </a>
        </div>
      </nav>

      <main className="mx-auto max-w-[900px] px-6 pb-20 pt-12 md:pt-16">
        <section className="text-center md:text-left">
          <p className="text-[13px] font-medium tracking-[2px] text-muted">
            RUNNING · CYCLING · SURFING · SWIMMING · SOCIAL · HIKING · YOGA ·
            CLIMBING
          </p>
          <h1 className="mt-4 font-sans text-[38px] font-extrabold leading-tight text-foreground md:text-[56px] md:leading-[1.1]">
            Your favorite activities, with a crew.
          </h1>
          <p className="mx-auto mt-5 max-w-[520px] text-base text-muted md:mx-0">
            Find people near you who show up.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start">
            <a
              href="#waitlist"
              className="inline-flex min-h-[48px] items-center justify-center rounded-button bg-accent px-6 py-3 text-center text-sm font-bold text-white transition hover:opacity-90"
            >
              Join the waitlist
            </a>
            <a
              href="#how"
              className="inline-flex min-h-[48px] items-center justify-center rounded-button border border-foreground bg-surface px-6 py-3 text-center text-sm font-bold text-foreground transition hover:bg-background"
            >
              See how it works
            </a>
          </div>
          <p className="mt-6 text-[13px] text-muted">
            Free · Launching this summer
          </p>
        </section>

        <section className="mt-20 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {activityCards.map((card) => (
            <article
              key={card.badge}
              className="rounded-card border border-card-border bg-surface p-5"
            >
              <span
                className={`inline-block rounded-lg px-2.5 py-1 text-xs font-semibold ${card.badgeClass}`}
              >
                {card.badge}
              </span>
              <h2 className="mt-3 font-sans text-lg font-extrabold leading-snug text-foreground">
                {card.title}
              </h2>
            </article>
          ))}
        </section>

        <section id="how" className="mt-24 scroll-mt-24">
          <h2 className="text-center font-sans text-[36px] font-extrabold leading-tight text-foreground">
            How it works
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((step) => (
              <div key={step.n} className="text-center md:text-left">
                <span className="inline-flex min-h-[5.5rem] min-w-[5.5rem] items-center justify-center rounded-lg bg-[#E8EEFF] font-sans text-5xl font-extrabold leading-none text-accent md:min-h-[6rem] md:min-w-[6rem] md:text-6xl">
                  {step.n}
                </span>
                <h3 className="mt-4 font-sans text-lg font-extrabold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <section className="w-full bg-accent px-6 py-8 text-center">
        <p className="mx-auto max-w-[900px] font-sans text-lg font-bold leading-snug text-white">
          Your crew is out there. Go find them.
        </p>
      </section>

      <div className="mx-auto max-w-[900px] px-6 py-20">
        <section
          id="waitlist"
          className="mx-auto max-w-[520px] scroll-mt-24 rounded-2xl border border-card-border bg-surface p-10"
        >
          <h2 className="text-center font-sans text-[32px] font-extrabold leading-tight text-foreground">
            Be a founding Local
          </h2>
          <p className="mt-2 text-center text-sm text-muted">
            Early access · Your city first
          </p>
          <div className="mt-8">
            <WaitlistForm />
          </div>
        </section>
      </div>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-[900px] flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <span className="font-sans text-[20px] font-extrabold text-accent">
            LOCALS
          </span>
          <span className="text-[13px] text-muted">2026</span>
        </div>
      </footer>
    </div>
  );
}
