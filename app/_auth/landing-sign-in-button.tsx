"use client"

import { SignInButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";

export default function LandingSignInButton() {
  return (
    <SignInButton mode="modal" forceRedirectUrl={routes.personal.root}>
      <Button variant="text" className="text-lg">
        Sign in
      </Button>
    </SignInButton>
  );
}
