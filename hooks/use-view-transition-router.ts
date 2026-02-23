"use client"

import { useRouter } from "next/navigation"

function runWithViewTransition(update: () => void) {
  const startViewTransition = document.startViewTransition?.bind(document)

  if (
    typeof startViewTransition !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    update()
    return
  }

  startViewTransition(() => {
    update()
  })
}

export function useViewTransitionRouter() {
  const router = useRouter()

  function push(...args: Parameters<typeof router.push>) {
    runWithViewTransition(() => {
      router.push(...args)
    })
  }

  function replace(...args: Parameters<typeof router.replace>) {
    runWithViewTransition(() => {
      router.replace(...args)
    })
  }

  return {
    push,
    replace,
    prefetch: router.prefetch,
    refresh: router.refresh,
    back: router.back,
    forward: router.forward,
  }
}
