import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import HeroCard from "./_components/hero-card";
import RedirectToApp from "./_components/auth-container";
import AuthContainer from "./_components/auth-container";

export default function Home() {
  return (
    <AuthContainer>
      <LandingPage />
    </AuthContainer>
  );
}

function LandingPage() {
  return (
    <div className="h-screen bg-background text-foreground overflow-hidden relative stone-surface flex flex-col">
      {/* ── Ghost header ── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rotate-45 bg-gold" aria-hidden="true" />
          <span className="font-display font-bold tracking-tight text-lg text-foreground/70">
            Tarot Vault
          </span>
        </div>
        <SignInButton mode="modal">
          <button className="text-sm text-muted-foreground/50 hover:text-foreground/80 transition-colors duration-300 cursor-pointer">
            Sign in
          </button>
        </SignInButton>
      </header>

      {/* ── Hero: The Card ── */}
      <main className="flex-1 flex items-center justify-center">
        <div className="animate-fade-in-scale opacity-0" style={{ animationDelay: "0.15s" }}>
          <HeroCard />
        </div>
      </main>
    </div>
  );
}
