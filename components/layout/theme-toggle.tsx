import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"
import { SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar"
import { Moon01Icon, Sun02Icon } from "hugeicons-react"
import { Skeleton } from "../ui/skeleton"

export default function ThemeToggle({
    mounted
  }: {
    mounted: boolean
  }) {
    const { theme, resolvedTheme, setTheme } = useTheme()
    const [isThemeTooltipEnabled, setIsThemeTooltipEnabled] = useState(true)
    const themeTransitionTimeoutRef = useRef<number | null>(null)
  
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
            isLightTheme ? (
              <Sun02Icon strokeWidth={1.25} />
            ) : (
              <Moon01Icon strokeWidth={1.25} />
            )
          ) : (
            <Skeleton className="w-5 h-5 rounded-full" />
          )}
          <span className="group-data-[collapsible=icon]:scale-0 transition-scale duration-150">
            Theme
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }