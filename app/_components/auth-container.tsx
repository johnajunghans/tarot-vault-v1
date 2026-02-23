"use client"

import { useViewTransitionRouter } from "@/hooks/use-view-transition-router";
import { routes } from "@/lib/routes";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { ReactNode, useEffect } from "react";
import LoadingScreen from "./loading-page";

export default function AuthContainer({ children }: { children: ReactNode }) {
  
  function RedirectToApp() {
    const router = useViewTransitionRouter();
    useEffect(() => {
      router.replace(routes.personal.root);
    }, [router]);
    return null;
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