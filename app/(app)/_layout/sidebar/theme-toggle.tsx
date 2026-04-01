import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { Moon01Icon, Sun02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Skeleton } from "@/components/ui/skeleton"

let mounted = false

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [isThemeTooltipEnabled, setIsThemeTooltipEnabled] = useState(true)
  const themeTransitionTimeoutRef = useRef<number | null>(null)

  useEffect(() => { if (!mounted) mounted = true }, [])

  const activeTheme = resolvedTheme ?? theme
  const isLightTheme = activeTheme === "light"

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

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        type="button"
        tooltip={isThemeTooltipEnabled ? "Toggle theme" : undefined}
        onClick={toggleTheme}
      >
        {mounted ? (
          <div className="relative size-6 shrink-0">
            <span className={`absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-in-out ${isLightTheme ? "scale-100" : "scale-0"}`}>
              <HugeiconsIcon icon={Sun02Icon} strokeWidth={1.25} />
            </span>
            <span className={`absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-in-out ${isLightTheme ? "scale-0" : "scale-100"}`}>
              <HugeiconsIcon icon={Moon01Icon} strokeWidth={1.25} />
            </span>
          </div>
        ) : (
          <Skeleton className="w-6 h-6 rounded-full shrink-0" />
        )}
        <span className="group-data-[collapsible=icon]:scale-0 transition-scale duration-150">
          {mounted ? (resolvedTheme === "light" ? "Light" : "Dark") : null}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
