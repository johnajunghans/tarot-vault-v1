import { auth } from "@clerk/nextjs/server";
import { Diamond01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";
import AuthContainer from "./_auth/auth-container";
import HeroCard from "./_landing/hero-card";
import LandingSignInButton from "./_auth/landing-sign-in-button";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect(routes.personal.root);
  }

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
          <HugeiconsIcon icon={Diamond01Icon} size={24} color="var(--gold)" />
          <span className="font-display font-bold tracking-tight text-xl text-foreground/70">
            Tarot Vault
          </span>
        </div>
        <LandingSignInButton />
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
