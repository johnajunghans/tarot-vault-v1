"use client"

import { useViewTransitionRouter } from "@/hooks/use-view-transition-router";
import { routes } from "@/lib/routes";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { ReactNode, useEffect } from "react";
import LoadingScreen from "./loading-page";
import { useUser } from "@clerk/clerk-react";

export default function AuthContainer({ children }: { children: ReactNode }) {

  const router = useViewTransitionRouter();
  const user = useUser()
  
  function RedirectToApp() {
    useEffect(() => {
      router.replace(routes.personal.root);
    }, [router]);
    return null;
  }

  if (user.isSignedIn) {
    router.push(routes.personal.root)
  }

  return (
    <>
      <AuthLoading>
        <LoadingScreen />
      </AuthLoading>
      <Authenticated>
        <RedirectToApp />
      </Authenticated>
      <Unauthenticated>
        { children }
      </Unauthenticated>
    </>
  )
}