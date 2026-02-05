"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Login01Icon, UserAdd01Icon, Wrench01Icon } from "hugeicons-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 bg-background p-4 border-b-2 border-slate-200 dark:border-slate-800 flex items-center">
        <div className="flex items-center justify-between w-full gap-3">
          <h1 className="text-lg font-bold tracking-tight">
            Tarot Vault
          </h1>
          <Unauthenticated>
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <Button variant="outline">
                  <Login01Icon />
                  Sign in
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button>
                  <UserAdd01Icon />
                  Sign up
                </Button>
              </SignUpButton>
            </div>
          </Unauthenticated>
          <Authenticated>
            <UserButton />
          </Authenticated>
        </div>
      </header>
      <main className="p-8 flex flex-col gap-8">
        <Authenticated>
          <RedirectToApp />
        </Authenticated>
        <Unauthenticated>
          <LandingContent />
        </Unauthenticated>
      </main>
    </>
  );
}

function RedirectToApp() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/app");
  }, [router]);

  return null;
}

function LandingContent() {
  return (
    <div className="flex flex-col items-center gap-4 max-w-lg mx-auto text-center">
       <p className="text-sm text-muted-foreground">
        Sign in or create an account to continue.
      </p>
      {/* <h1 className="text-4xl font-bold">Tarot Vault</h1> */}
      {/* <div
          className="size-2 rounded-full bg-foreground/60 motion-safe:animate-pulse"
          aria-hidden="true"
        /> */}
      <Wrench01Icon  
        className="motion-safe:animate-pulse"
        aria-hidden="true"
      />
      <p className="text-sm text-muted-foreground">
        Site under construction.
      </p>
    </div>
  );
}
