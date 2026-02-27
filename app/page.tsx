import { SignInButton } from "@clerk/nextjs";
import HeroCard from "./_components/hero-card";
import AuthContainer from "./_components/auth-container";
import { Diamond01Icon } from "hugeicons-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <AuthContainer>
      <LandingPage />
    </AuthContainer>
  );
}

function LandingPage() {
  return (
    <div className="h-screen bg-background text-foreground overflow-hidden relative flex flex-col">
      {/* ── Ghost header ── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Diamond01Icon size={24} color="var(--gold)" fill="var(--gold)" />
          <span className="font-display font-bold tracking-tight text-xl text-foreground/70">
            Tarot Vault
          </span>
        </div>
        <SignInButton mode="modal">
          <Button variant="text" className="text-lg">
            Sign in
          </Button>
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
