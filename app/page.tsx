"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import {
  LibraryIcon,
  Cards01Icon,
  ConstellationIcon,
  ArrowRight01Icon,
} from "hugeicons-react";
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

/* ─── Loading screen while auth resolves ─── */
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-2 h-2 rotate-45 bg-gold animate-pulse-glow" />
    </div>
  );
}

/* ─── Redirect authenticated users ─── */
function RedirectToApp() {
  const router = useViewTransitionRouter();
  useEffect(() => {
    router.replace(routes.personal.root);
  }, [router]);
  return null;
}

/* ─── Sacred-geometry star (hero background) ─── */
function GeometricStar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      {/* Concentric circles */}
      <circle cx="200" cy="200" r="190" strokeWidth="0.5" opacity="0.25" />
      <circle cx="200" cy="200" r="140" strokeWidth="0.5" opacity="0.35" />
      <circle cx="200" cy="200" r="90" strokeWidth="0.5" opacity="0.45" />
      <circle cx="200" cy="200" r="40" strokeWidth="0.5" opacity="0.55" />
      {/* Cardinal axes */}
      <line x1="200" y1="10" x2="200" y2="390" strokeWidth="0.5" opacity="0.2" />
      <line x1="10" y1="200" x2="390" y2="200" strokeWidth="0.5" opacity="0.2" />
      {/* Diagonals */}
      <line x1="66" y1="66" x2="334" y2="334" strokeWidth="0.5" opacity="0.15" />
      <line x1="334" y1="66" x2="66" y2="334" strokeWidth="0.5" opacity="0.15" />
      {/* Outer diamond */}
      <polygon
        points="200,10 390,200 200,390 10,200"
        strokeWidth="0.5"
        opacity="0.2"
      />
      {/* Inner diamond */}
      <polygon
        points="200,60 340,200 200,340 60,200"
        strokeWidth="0.5"
        opacity="0.15"
      />
      {/* 8-point star tips */}
      <line x1="200" y1="10" x2="260" y2="140" strokeWidth="0.3" opacity="0.12" />
      <line x1="200" y1="10" x2="140" y2="140" strokeWidth="0.3" opacity="0.12" />
      <line x1="390" y1="200" x2="260" y2="140" strokeWidth="0.3" opacity="0.12" />
      <line x1="390" y1="200" x2="260" y2="260" strokeWidth="0.3" opacity="0.12" />
      <line x1="200" y1="390" x2="260" y2="260" strokeWidth="0.3" opacity="0.12" />
      <line x1="200" y1="390" x2="140" y2="260" strokeWidth="0.3" opacity="0.12" />
      <line x1="10" y1="200" x2="140" y2="260" strokeWidth="0.3" opacity="0.12" />
      <line x1="10" y1="200" x2="140" y2="140" strokeWidth="0.3" opacity="0.12" />
    </svg>
  );
}

/* ─── Diamond section divider ─── */
function Divider() {
  return (
    <div className="flex items-center gap-4 w-full max-w-xs mx-auto py-4">
      <div className="flex-1 h-px bg-border" />
      <div className="w-1.5 h-1.5 rotate-45 border border-gold/40" />
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

/* ─── Feature card ─── */
function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative p-8 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-gold/30 hover:bg-card">
      <div className="mb-5 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gold/10 text-gold">
        <Icon strokeWidth={1.25} className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-[15px]">
        {description}
      </p>
    </div>
  );
}

/* ─── Step indicator ─── */
function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gold/30 text-gold text-sm font-bold mb-4">
        {number}
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground text-[15px] leading-relaxed max-w-xs mx-auto">
        {description}
      </p>
    </div>
  );
}

/* ─── Full landing page ─── */
function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rotate-45 bg-gold" aria-hidden="true" />
            <span className="font-bold tracking-tight text-lg">
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
                className="bg-gold hover:bg-gold/90 text-background font-bold"
              >
                Get started
              </Button>
            </SignUpButton>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Ambient glow */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          <div className="w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full bg-gold/[0.06] blur-[100px] md:blur-[140px]" />
        </div>

        {/* Geometric star */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          <GeometricStar className="w-[420px] h-[420px] md:w-[580px] md:h-[580px] text-gold animate-rotate-slow" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p
            className="text-[11px] md:text-xs tracking-[0.35em] uppercase text-gold/80 mb-8 animate-fade-up opacity-0"
            style={{ animationDelay: "0.1s" }}
          >
            Tarot Vault
          </p>
          <h1
            className="text-[2.5rem] sm:text-5xl md:text-[4.25rem] lg:text-7xl font-bold tracking-tight leading-[1.08] animate-fade-up opacity-0"
            style={{ animationDelay: "0.3s" }}
          >
            Turn readings into
            <br />
            <span className="text-gold">revelations</span>
          </h1>
          <p
            className="mt-6 md:mt-8 text-base md:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed animate-fade-up opacity-0"
            style={{ animationDelay: "0.5s" }}
          >
            A digital sanctuary for the cultivation of insight through tarot.
          </p>
          <div
            className="mt-10 md:mt-12 flex flex-col sm:flex-row gap-4 justify-center animate-fade-up opacity-0"
            style={{ animationDelay: "0.7s" }}
          >
            <SignUpButton mode="modal">
              <Button
                size="lg"
                className="bg-gold hover:bg-gold/90 text-background font-bold px-8"
              >
                Begin your practice
                <ArrowRight01Icon className="ml-2 w-4 h-4" strokeWidth={2} />
              </Button>
            </SignUpButton>
            <Button
              variant="outline"
              size="lg"
              className="border-border hover:border-gold/40 px-8"
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Learn more
            </Button>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/40 animate-fade-in opacity-0"
          style={{ animationDelay: "1.4s" }}
          aria-hidden="true"
        >
          <div className="w-px h-8 bg-current" />
          <div className="w-1.5 h-1.5 rotate-45 border-b border-r border-current" />
        </div>
      </section>

      <Divider />

      {/* ── Features ── */}
      <section id="features" className="py-20 md:py-28 px-6 scroll-mt-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <p className="text-[11px] tracking-[0.35em] uppercase text-gold/80 mb-4">
              Features
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Everything you need, nothing you don&apos;t
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <FeatureCard
              icon={LibraryIcon}
              title="Your Readings, Preserved"
              description="Record every draw, every question, every insight. Your complete tarot practice, organized and searchable."
            />
            <FeatureCard
              icon={Cards01Icon}
              title="Custom Spreads"
              description="Design spread layouts that match your unique practice. From simple three-card pulls to complex Celtic Crosses and beyond."
            />
            <FeatureCard
              icon={ConstellationIcon}
              title="Deeper Understanding"
              description="Layer your own interpretations with AI-assisted analysis. Build a personal knowledge base that grows with your practice."
            />
          </div>
        </div>
      </section>

      <Divider />

      {/* ── How It Works ── */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <p className="text-[11px] tracking-[0.35em] uppercase text-gold/80 mb-4">
              How It Works
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              A practice in three parts
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            <Step
              number="1"
              title="Record"
              description="Log your readings as you draw them, capturing the cards, positions, and your initial thoughts."
            />
            <Step
              number="2"
              title="Reflect"
              description="Add interpretations over time. Revisit past readings with fresh eyes and new understanding."
            />
            <Step
              number="3"
              title="Reveal"
              description="Discover patterns across readings. Let your practice teach you what the cards have been saying all along."
            />
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Final CTA ── */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
            Your practice deserves a home
          </h2>
          <p className="text-muted-foreground text-base md:text-lg mb-10 leading-relaxed">
            Join Tarot Vault and begin building your personal archive of
            insight.
          </p>
          <SignUpButton mode="modal">
            <Button
              size="lg"
              className="bg-gold hover:bg-gold/90 text-background font-bold px-8"
            >
              Create free account
              <ArrowRight01Icon className="ml-2 w-4 h-4" strokeWidth={2} />
            </Button>
          </SignUpButton>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rotate-45 bg-gold/50"
              aria-hidden="true"
            />
            <span className="text-sm text-muted-foreground">Tarot Vault</span>
          </div>
          <p className="text-xs text-muted-foreground/60">
            &copy; {new Date().getFullYear()} Tarot Vault
          </p>
        </div>
      </footer>
    </div>
  );
}
