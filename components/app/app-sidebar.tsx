"use client"

import {
  Cards01Icon,
  ConstellationIcon,
  LibraryIcon,
  Moon01Icon,
  Settings01Icon,
  Sun01Icon,
} from "hugeicons-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar"
import { UserButton, useUser } from "@clerk/clerk-react"
import { useRouter, usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Skeleton } from "../ui/skeleton"

const routes = {
  personal: [
    {
      name: "Readings",
      url: "/app/personal/readings",
      icon: LibraryIcon,
    },
    {
      name: "Spreads",
      url: "/app/personal/spreads",
      icon: Cards01Icon,
    },
    {
      name: "Interpretations",
      url: "/app/personal/interpretations",
      icon: ConstellationIcon,
    },
  ],
}

export default function AppSidebar() {
  const { open } = useSidebar()
  const { isLoaded } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const activeTheme = resolvedTheme ?? theme
  const isLightTheme = activeTheme === "light"

  function toggleTheme() {
    const nextTheme = isLightTheme ? "dark" : "light"
    setTheme(nextTheme)
  }

  function isActive(url: string) {
    return pathname === url || pathname.startsWith(url + "/")
  }

  return (
    <Sidebar collapsible="icon">
      {/* Header — brand */}
      <SidebarHeader className="mt-[6px]">
        <button
          type="button"
          onClick={() => router.push("/app")}
          className="flex items-center justify-start gap-2.5 pl-2 text-left group"
        >
          <div className="w-2 h-2 rotate-45 bg-primary shrink-0 transition-transform duration-200 group-hover:scale-125" />
          <span
            className={`text-nowrap ${open ? "opacity-100" : "opacity-0 w-0"} transition-opacity duration-150 font-bold tracking-tight`}
          >
            Tarot Vault
          </span>
        </button>
      </SidebarHeader>

      {/* Content — navigation */}
      <SidebarContent>
        {/* Personal workspace */}
        <SidebarGroup className="pl-3">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:pointer-events-none text-muted-foreground/60 text-[11px] tracking-[0.1em] uppercase">
            <a
              href="/app/personal"
              className="hover:text-muted-foreground transition-colors"
            >
              Personal
            </a>
          </SidebarGroupLabel>
          <SidebarMenu>
            {routes.personal.map((route) => (
              <SidebarMenuItem key={route.name}>
                <SidebarMenuButton
                  type="button"
                  tooltip={route.name}
                  onClick={() => router.push(route.url)}
                  isActive={isActive(route.url)}
                >
                  <route.icon strokeWidth={1.25} />
                  <span
                    className={`${open ? "opacity-100" : "opacity-0"} transition-opacity duration-150`}
                  >
                    {route.name}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Collective (future) */}
        <SidebarGroup className="pl-3">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:pointer-events-none text-muted-foreground/40 text-[11px] tracking-[0.1em] uppercase">
            Collective
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <span
                className={`${open ? "opacity-50 pl-3" : "opacity-0"} transition-opacity duration-150 text-xs italic text-muted-foreground`}
              >
                Coming soon
              </span>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — utilities & user */}
      <SidebarFooter>
        <SidebarMenu className="translate-x-1">
          <SidebarMenuItem>
            <SidebarMenuButton type="button" tooltip="Settings">
              <Settings01Icon strokeWidth={1.25} />
              <span
                className={`${open ? "opacity-100" : "opacity-0"} transition-opacity duration-150`}
              >
                Settings
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              tooltip="Toggle theme"
              onClick={toggleTheme}
            >
              {mounted ? (
                isLightTheme ? (
                  <Sun01Icon strokeWidth={1.25} />
                ) : (
                  <Moon01Icon strokeWidth={1.25} />
                )
              ) : (
                <Skeleton className="w-5 h-5 rounded-full" />
              )}
              <span
                className={`${open ? "opacity-100" : "opacity-0"} transition-opacity duration-150`}
              >
                Theme
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="translate-x-[10px]">
          {isLoaded ? (
            <UserButton
              showName={open}
              appearance={{
                elements: {
                  userButtonBox: {
                    flexDirection: "row-reverse",
                    gap: "2px",
                  },
                  userButtonOuterIdentifier: {
                    scale: open ? "1" : "0",
                    transitionDuration: "150ms",
                    textWrap: "nowrap",
                    color: "var(--foreground)",
                  },
                },
              }}
            />
          ) : (
            <Skeleton className="w-7 h-7 rounded-full" />
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
