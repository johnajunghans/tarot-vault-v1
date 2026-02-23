"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { ArrowRight01Icon } from "hugeicons-react";
import { routes } from "@/lib/routes";
import { useViewTransitionRouter } from "@/hooks/use-view-transition-router";

export default function Home() {
  return (
    <>
      <AuthLoading>
        <LoadingScreen />
      </AuthLoading>
      <Authenticated>
        <RedirectToApp />
      </Authenticated>
      <Unauthenticated>
        <LandingPage />
      </Unauthenticated>
    </>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rotate-45 bg-gold animate-pulse-glow" />
        <div className="w-2 h-2 rotate-45 bg-gold animate-pulse-glow delay-200" />
        <div className="w-2 h-2 rotate-45 bg-gold animate-pulse-glow delay-500" />
      </div>
    </div>
  );
}

function RedirectToApp() {
  const router = useViewTransitionRouter();
  useEffect(() => {
    router.replace(routes.personal.root);
  }, [router]);
  return null;
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative stone-surface">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rotate-45 bg-gold" aria-hidden="true" />
            <span className="font-display font-bold tracking-tight text-lg">
              Tarot Vault
            </span>
          </div>
          <div className="flex items-center gap-3">
            <SignInButton mode="modal">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button
                size="sm"
                className="border border-gold/50 bg-transparent text-gold hover:bg-gold/10 hover:border-gold font-semibold rounded-lg"
              >
                Enter
              </Button>
            </SignUpButton>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Diagonal gold vein behind content */}
        <div
          className="absolute inset-0 pointer-events-none animate-vein-shimmer"
          aria-hidden="true"
        >
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 1000">
            <line
              x1="150" y1="0"
              x2="850" y2="1000"
              stroke="var(--gold)"
              strokeWidth="1.5"
              strokeOpacity="0.15"
            />
            <line
              x1="155" y1="0"
              x2="855" y2="1000"
              stroke="var(--gold)"
              strokeWidth="0.5"
              strokeOpacity="0.08"
            />
            {/* Secondary thinner vein */}
            <line
              x1="700" y1="0"
              x2="300" y2="800"
              stroke="var(--gold)"
              strokeWidth="0.75"
              strokeOpacity="0.06"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
          {/* Diamond mark */}
          <div
            className="w-4 h-4 rotate-45 border border-gold/40 mx-auto mb-10 animate-fade-in opacity-0"
            style={{ animationDelay: "0.1s" }}
            aria-hidden="true"
          />

          <h1
            className="font-display text-[2.25rem] sm:text-5xl md:text-[3.75rem] font-bold tracking-tight leading-[1.12] animate-fade-up opacity-0"
            style={{ animationDelay: "0.3s" }}
          >
            There is{" "}
            <span className="text-gold-gradient">gold</span>
            {" "}to be mined
            <br />
            within your mind.
          </h1>

          <p
            className="mt-8 text-base md:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed animate-fade-up opacity-0"
            style={{ animationDelay: "0.55s" }}
          >
            This is a tarot app. You do your readings.
            <br className="hidden sm:block" />
            It keeps track of them. That&apos;s basically it.
          </p>

          <div
            className="mt-10 animate-fade-up opacity-0"
            style={{ animationDelay: "0.75s" }}
          >
            <SignUpButton mode="modal">
              <Button
                size="lg"
                className="border border-gold/50 bg-transparent text-gold hover:bg-gold/10 hover:border-gold font-semibold px-10 rounded-lg transition-all duration-300"
              >
                Enter
                <ArrowRight01Icon className="ml-2 w-4 h-4" strokeWidth={2} />
              </Button>
            </SignUpButton>
          </div>

          <p
            className="mt-6 text-xs text-muted-foreground/50 animate-fade-in opacity-0"
            style={{ animationDelay: "1.2s" }}
          >
            Free. No ads. No newsletters. No &ldquo;unlocking your potential.&rdquo;
          </p>
        </div>
      </section>

      {/* ── What It Is ── */}
      <section className="py-20 md:py-28 px-6 relative">
        <div className="max-w-xl mx-auto space-y-10">
          {[
            {
              title: "Record readings",
              body: "Write down what you drew, what you asked, what you thought. It saves.",
            },
            {
              title: "Design spreads",
              body: "Arrange card positions however you want. Celtic Cross, three-card pull, something you made up at 2am.",
            },
            {
              title: "Revisit later",
              body: "Your past readings don\u2019t disappear. They\u2019re here when you\u2019re ready to look again.",
            },
          ].map((item, i) => (
            <div
              key={item.title}
              className="border-l-2 border-gold/25 pl-6 animate-fade-up opacity-0"
              style={{ animationDelay: `${0.15 + i * 0.15}s` }}
            >
              <h3 className="font-display text-lg font-bold tracking-tight mb-1.5">
                {item.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/30 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rotate-45 bg-gold/40" aria-hidden="true" />
            <span className="text-sm text-muted-foreground font-display">Tarot Vault</span>
          </div>
          <p className="text-xs text-muted-foreground/50">
            &copy; {new Date().getFullYear()} &mdash; Not affiliated with any higher power.
          </p>
        </div>
      </footer>
    </div>
  );
}
