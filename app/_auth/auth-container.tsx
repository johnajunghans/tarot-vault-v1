"use client"

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { ReactNode } from "react";
import LoadingScreen from "./loading-page";

export default function AuthContainer({
  children,
  authenticated,
}: {
  children: ReactNode;
  authenticated?: ReactNode;
}) {
  return (
    <>
      <AuthLoading>
        <LoadingScreen />
      </AuthLoading>
      <Authenticated>
        {authenticated ?? <LoadingScreen />}
      </Authenticated>
      <Unauthenticated>
        {children}
      </Unauthenticated>
    </>
  )
}