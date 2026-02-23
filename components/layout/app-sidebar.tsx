"use client"

import {
  Cards01Icon,
  ConstellationIcon,
  LibraryIcon,
  Moon01Icon,
  Settings01Icon,
  Sun02Icon,
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
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"
import { Skeleton } from "../ui/skeleton"
import { routes } from "@/lib/routes"
import { useViewTransitionRouter } from "@/hooks/use-view-transition-router"
import { useHydrated } from "@/hooks/use-hydrated"
import ThemeToggle from "./theme-toggle"

const sidebarRoutes = {
  personal: [
    {
      name: "Readings",
      url: routes.personal.readings.root,
      icon: LibraryIcon,
    },
    {
      name: "Spreads",
      url: routes.personal.spreads.root,
      icon: Cards01Icon,
    },
    {
      name: "Interpretations",
      url: routes.personal.interpretations.root,
      icon: ConstellationIcon,
    },
  ],
}

interface SidebarMenuItemProps {
  onClick?: () => void
  tooltip: string
  isActive?: boolean
  icon: React.ComponentType<{ strokeWidth: number }>
  label: string
}

function SidebarMenuItemComponent({
  onClick,
  tooltip,
  isActive,
  icon: Icon,
  label,
}: SidebarMenuItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        type="button"
        tooltip={tooltip}
        onClick={onClick}
        isActive={isActive}
      >
        <Icon strokeWidth={1} />
        <span className="group-data-[collapsible=icon]:scale-0 transition-scale duration-150">
          {label}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export default function AppSidebar() {
  const { open } = useSidebar()
  const { isLoaded } = useUser()
  const router = useViewTransitionRouter()
  const pathname = usePathname()
  const isHydrated = useHydrated()

  useEffect(() => {
    router.prefetch("/")
    router.prefetch(routes.personal.root)

    for (const route of sidebarRoutes.personal) {
      router.prefetch(route.url)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function isActive(url: string) {
    return pathname === url || pathname.startsWith(url + "/")
  }

  return (
    <Sidebar collapsible="icon">
      {/* Header — brand */}
      <SidebarHeader className="mt-[6px]">
        <button
          type="button"
          onClick={() => router.push("/")}
          className={`flex items-center justify-start gap-2.5 pl-2 text-left group`}
        >
          <div className="w-2 h-2 rotate-45 bg-primary shrink-0 transition-transform duration-200 group-hover:scale-125 group-data-[collapsible=icon]:translate-x-2.5" />
          <span className="text-nowrap group-data-[collapsible=icon]:scale-0 group-data-[collapsible=icon]:pointer-events-none transition-scale duration-150 font-bold tracking-tight">
            Tarot Vault
          </span>
        </button>
      </SidebarHeader>

      {/* Content — navigation */}
      <SidebarContent className="overflow-hidden">
        {/* Personal workspace */}
        <SidebarGroup className="pl-3">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:pointer-events-none text-muted-foreground/60 text-[11px] tracking-[0.1em] uppercase">
            <a
              href={routes.personal.root}
              className="hover:text-muted-foreground transition-colors"
              onClick={(event) => {
                event.preventDefault()
                router.push(routes.personal.root)
              }}
              onMouseEnter={() => router.prefetch(routes.personal.root)}
            >
              Personal
            </a>
          </SidebarGroupLabel>
          <SidebarMenu>
            {sidebarRoutes.personal.map((route) => (
              <SidebarMenuItemComponent
                key={route.name}
                tooltip={route.name}
                onClick={() => router.push(route.url)}
                isActive={isActive(route.url)}
                icon={route.icon}
                label={route.name}
              />
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
              <span className="group-data-[collapsible=icon]:opacity-0 opacity-50 pl-3 transition-opacity duration-150 text-xs italic text-muted-foreground">
                Coming soon
              </span>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — utilities & user */}
      <SidebarFooter>
        <SidebarMenu className="translate-x-1">
          <SidebarMenuItemComponent
            tooltip="Settings"
            icon={Settings01Icon}
            label="Settings"
          />
          <ThemeToggle
            mounted={isHydrated}
          />
        </SidebarMenu>
        <div className="translate-x-[10px]">
          {isLoaded ? (
            <UserButton
              showName
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
