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

function TarotCardIllustration({ className, delay = "0s" }: { className?: string; delay?: string }) {
  return (
    <div
      className={`animate-card-deal opacity-0 ${className}`}
      style={{ animationDelay: delay }}
    >
      <div className="relative w-[100px] h-[160px] sm:w-[120px] sm:h-[192px] rounded-xl border border-gold/30 bg-gradient-to-b from-gold/10 to-gold/5 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-2 rounded-lg border border-gold/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rotate-45 border border-gold/40" />
        </div>
        <div className="absolute top-3 left-3 w-1 h-1 rotate-45 bg-gold/50" />
        <div className="absolute bottom-3 right-3 w-1 h-1 rotate-45 bg-gold/50" />
      </div>
    </div>
  );
}

function FloatingOrb({ className }: { className?: string }) {
  return (
    <div className={`absolute rounded-full pointer-events-none ${className}`} aria-hidden="true" />
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  index: number;
}) {
  return (
    <div
      className="group relative p-8 rounded-2xl border border-border/50 bg-surface/50 backdrop-blur-sm transition-all duration-500 hover:border-gold/30 hover:bg-surface animate-fade-up opacity-0"
      style={{ animationDelay: `${0.2 + index * 0.15}s` }}
    >
      <div className="mb-5 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gold/10 text-gold transition-transform duration-300 group-hover:scale-110">
        <Icon strokeWidth={1.25} className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold mb-3 tracking-tight">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
  index,
}: {
  number: string;
  title: string;
  description: string;
  index: number;
}) {
  return (
    <div
      className="text-center animate-fade-up opacity-0"
      style={{ animationDelay: `${0.15 + index * 0.15}s` }}
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-gold/30 text-gold font-bold mb-5 text-lg transition-all duration-300 hover:border-gold/60 hover:bg-gold/5">
        {number}
      </div>
      <h3 className="text-xl font-bold mb-3 tracking-tight">{title}</h3>
      <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
        {description}
      </p>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative grain">
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
                className="bg-gold hover:bg-gold/90 text-background font-semibold rounded-lg"
              >
                Get started
              </Button>
            </SignUpButton>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Ambient orbs */}
        <FloatingOrb className="w-[600px] h-[600px] md:w-[800px] md:h-[800px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gold/[0.04] blur-[120px]" />
        <FloatingOrb className="w-[300px] h-[300px] -top-20 -right-20 bg-amethyst/[0.04] blur-[80px]" />
        <FloatingOrb className="w-[250px] h-[250px] -bottom-10 -left-20 bg-gold/[0.03] blur-[60px]" />

        {/* Floating card illustrations */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <div className="relative w-full max-w-4xl h-full">
            <div className="absolute top-[15%] left-[5%] sm:left-[8%] animate-float" style={{ animationDelay: "0s" }}>
              <TarotCardIllustration delay="0.8s" className="-rotate-12" />
            </div>
            <div className="absolute top-[20%] right-[5%] sm:right-[8%] animate-float" style={{ animationDelay: "1.5s" }}>
              <TarotCardIllustration delay="1.0s" className="rotate-6" />
            </div>
            <div className="absolute bottom-[18%] left-[12%] sm:left-[15%] animate-float hidden sm:block" style={{ animationDelay: "0.8s" }}>
              <TarotCardIllustration delay="1.2s" className="rotate-[-6deg]" />
            </div>
            <div className="absolute bottom-[22%] right-[10%] sm:right-[14%] animate-float hidden md:block" style={{ animationDelay: "2s" }}>
              <TarotCardIllustration delay="1.4s" className="rotate-12" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p
            className="text-[11px] md:text-xs tracking-[0.4em] uppercase text-gold/70 mb-8 animate-fade-up opacity-0 font-medium"
            style={{ animationDelay: "0.1s" }}
          >
            Your digital tarot sanctuary
          </p>
          <h1
            className="font-display text-[2.75rem] sm:text-5xl md:text-[4.5rem] lg:text-7xl font-bold tracking-tight leading-[1.06] animate-fade-up opacity-0"
            style={{ animationDelay: "0.3s" }}
          >
            Record. Reflect.
            <br />
            <span className="text-gold-gradient">Reveal.</span>
          </h1>
          <p
            className="mt-7 md:mt-8 text-base md:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed animate-fade-up opacity-0"
            style={{ animationDelay: "0.5s" }}
          >
            Build a living archive of your tarot practice.
            Every reading preserved, every insight deepened.
          </p>
          <div
            className="mt-10 md:mt-12 flex flex-col sm:flex-row gap-4 justify-center animate-fade-up opacity-0"
            style={{ animationDelay: "0.7s" }}
          >
            <SignUpButton mode="modal">
              <Button
                size="lg"
                className="bg-gold hover:bg-gold/90 text-background font-semibold px-8 rounded-lg shadow-lg shadow-gold/10 transition-all duration-300 hover:shadow-xl hover:shadow-gold/20"
              >
                Begin your practice
                <ArrowRight01Icon className="ml-2 w-4 h-4" strokeWidth={2} />
              </Button>
            </SignUpButton>
            <Button
              variant="outline"
              size="lg"
              className="border-border/60 hover:border-gold/30 px-8 rounded-lg"
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
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/30 animate-fade-in opacity-0 animate-gentle-pulse"
          style={{ animationDelay: "1.8s" }}
          aria-hidden="true"
        >
          <div className="w-px h-8 bg-current" />
          <div className="w-1.5 h-1.5 rotate-45 border-b border-r border-current" />
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 md:py-32 px-6 scroll-mt-16 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <p className="text-[11px] tracking-[0.4em] uppercase text-gold/60 mb-4 font-medium animate-fade-up opacity-0">
              Features
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight animate-fade-up opacity-0" style={{ animationDelay: "0.1s" }}>
              Everything you need,
              <br className="hidden sm:block" />
              nothing you don&apos;t
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <FeatureCard
              icon={LibraryIcon}
              title="Readings, Preserved"
              description="Record every draw, every question, every flash of insight. Your complete practice — organized, searchable, always at hand."
              index={0}
            />
            <FeatureCard
              icon={Cards01Icon}
              title="Custom Spreads"
              description="Design layouts that match your unique style. From a quick three-card pull to an intricate Celtic Cross — your way."
              index={1}
            />
            <FeatureCard
              icon={ConstellationIcon}
              title="Deeper Understanding"
              description="Layer personal reflections with AI-assisted analysis. Watch patterns emerge as your knowledge base grows with every session."
              index={2}
            />
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 md:py-32 px-6 relative">
        <div className="absolute inset-0 bg-surface/30" aria-hidden="true" />
        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-16 md:mb-20">
            <p className="text-[11px] tracking-[0.4em] uppercase text-gold/60 mb-4 font-medium animate-fade-up opacity-0">
              How it works
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight animate-fade-up opacity-0" style={{ animationDelay: "0.1s" }}>
              Three steps to clarity
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            <Step
              number="1"
              title="Record"
              description="Capture your readings as they happen — the cards, positions, and your first impressions, all in one place."
              index={0}
            />
            <Step
              number="2"
              title="Reflect"
              description="Return to past readings with fresh eyes. Add layers of meaning as your understanding deepens over time."
              index={1}
            />
            <Step
              number="3"
              title="Reveal"
              description="Discover patterns across your practice. Let the cards teach you what they've been whispering all along."
              index={2}
            />
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 md:py-32 px-6 relative">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6 animate-fade-up opacity-0">
            Your practice deserves
            <br />a home
          </h2>
          <p className="text-muted-foreground text-base md:text-lg mb-10 leading-relaxed animate-fade-up opacity-0" style={{ animationDelay: "0.15s" }}>
            Free to use. No ads. Just a quiet space for your tarot journey.
          </p>
          <div className="animate-fade-up opacity-0" style={{ animationDelay: "0.3s" }}>
            <SignUpButton mode="modal">
              <Button
                size="lg"
                className="bg-gold hover:bg-gold/90 text-background font-semibold px-10 rounded-lg shadow-lg shadow-gold/10 transition-all duration-300 hover:shadow-xl hover:shadow-gold/20"
              >
                Create free account
                <ArrowRight01Icon className="ml-2 w-4 h-4" strokeWidth={2} />
              </Button>
            </SignUpButton>
          </div>
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
            &copy; {new Date().getFullYear()} Tarot Vault
          </p>
        </div>
      </footer>
    </div>
  );
}
