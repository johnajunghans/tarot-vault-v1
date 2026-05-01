"use client"

import { useTheme } from "next-themes"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Moon01Icon, Sun02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Skeleton } from "@/components/ui/skeleton"

type ThemeToggleProps = {
  asIconButton?: boolean
}

function useHasMounted() {
  const hasMountedRef = useRef(false)

  const subscribe = useCallback((onStoreChange: () => void) => {
    hasMountedRef.current = true
    onStoreChange()

    return () => {
      hasMountedRef.current = false
    }
  }, [])

  const getSnapshot = useCallback(() => hasMountedRef.current, [])
  const getServerSnapshot = useCallback(() => false, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export default function ThemeToggle({
  asIconButton = false,
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const isMounted = useHasMounted()
  const [isThemeTooltipEnabled, setIsThemeTooltipEnabled] = useState(true)
  const themeTransitionTimeoutRef = useRef<number | null>(null)

  const activeTheme = resolvedTheme ?? theme
  const isLightTheme = activeTheme === "light"
  const themeName = isMounted
    ? resolvedTheme === "light"
      ? "Light"
      : "Dark"
    : null

  function toggleTheme() {
    const body = document.body
    const shouldAnimate =
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches

    setIsThemeTooltipEnabled(false)

    if (themeTransitionTimeoutRef.current !== null) {
      window.clearTimeout(themeTransitionTimeoutRef.current)
      themeTransitionTimeoutRef.current = null
      body.classList.remove("theme-transitioning")
    }

    if (shouldAnimate) {
      body.classList.add("theme-transitioning")

      themeTransitionTimeoutRef.current = window.setTimeout(() => {
        body.classList.remove("theme-transitioning")
        themeTransitionTimeoutRef.current = null
        setIsThemeTooltipEnabled(true)
      }, 260)
    } else {
      setIsThemeTooltipEnabled(true)
    }

    const nextTheme = isLightTheme ? "dark" : "light"
    setTheme(nextTheme)
  }

  useEffect(() => {
    return () => {
      if (themeTransitionTimeoutRef.current !== null) {
        window.clearTimeout(themeTransitionTimeoutRef.current)
        themeTransitionTimeoutRef.current = null
      }

      document.body.classList.remove("theme-transitioning")
    }
  }, [])

  const themeIcon = isMounted ? (
    <div className="relative size-6 shrink-0">
      <span
        className={`absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-in-out ${isLightTheme ? "scale-100" : "scale-0"}`}
      >
        <HugeiconsIcon
          icon={Sun02Icon}
          strokeWidth={1.25}
          className="size-6"
        />
      </span>
      <span
        className={`absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-in-out ${isLightTheme ? "scale-0" : "scale-100"}`}
      >
        <HugeiconsIcon
          icon={Moon01Icon}
          strokeWidth={1.25}
          className="size-6"
        />
      </span>
    </div>
  ) : (
    <Skeleton className="w-6 h-6 rounded-full shrink-0" />
  )

  if (asIconButton) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        aria-label="Toggle theme"
        // aria-pressed={isMounted ? activeTheme === "dark" : undefined}
        onClick={toggleTheme}
      >
        {themeIcon}
      </Button>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        type="button"
        tooltip={isThemeTooltipEnabled ? "Toggle theme" : undefined}
        onClick={toggleTheme}
      >
        {themeIcon}
        <span className="group-data-[collapsible=icon]:scale-0 transition-scale duration-150">
          {themeName}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
