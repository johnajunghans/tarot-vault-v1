"use client"

import {
  Cards01Icon,
  ConstellationIcon,
  Diamond01Icon,
  LibraryIcon,
  Settings01Icon,
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
} from "../../../components/ui/sidebar"
import { UserButton, useUser } from "@clerk/clerk-react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Skeleton } from "../../../components/ui/skeleton"
import { routes } from "@/lib/routes"
import { useViewTransitionRouter } from "@/hooks/use-view-transition-router"
import { useHydrated } from "@/hooks/use-hydrated"
import ThemeToggle from "./theme-toggle"
import { useIsMobile } from "@/hooks/use-mobile"

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
  icon: React.ComponentType<{ strokeWidth: number, color: string }>
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
        <Icon strokeWidth={1.25} color={isActive ? "var(--gold)" : "var(--foreground)"} />
        <span className="group-data-[collapsible=icon]:scale-0 transition-scale duration-150">
          {label}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export default function AppSidebar() {
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
    <Sidebar collapsible="icon" className="bg-transparent">
      {/* Header — brand */}
      <SidebarHeader className="mt-[6px]">
        <button
          type="button"
          onClick={() => router.push("/")}
          className={`flex items-center justify-start gap-2.5 pl-0 text-left group`}
        >
          <Diamond01Icon
            color="var(--gold)"
            fill="var(--gold)"
            className="shrink-0 drop-shadow-[0_0_4px_var(--gold-muted)] transition-all duration-300 group-hover:scale-125 group-hover:drop-shadow-[0_0_8px_var(--gold)] group-data-[collapsible=icon]:translate-x-2.5 rotate-0"
            style={{ borderRadius: 4 }}
          />
          <span className="text-nowrap group-data-[collapsible=icon]:scale-0 group-data-[collapsible=icon]:pointer-events-none transition-scale duration-150 font-display font-bold tracking-tight">
            Tarot Vault
          </span>
        </button>
      </SidebarHeader>

      {/* Content — navigation */}
      <SidebarContent className="overflow-hidden bg-transparent">
        {/* Personal workspace */}
        <SidebarGroup className="pl-3">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:pointer-events-none text-muted-foreground/50 text-[10px] tracking-[0.15em] uppercase font-semibold">
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
          <SidebarMenu className="gap-1.5">
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
          <SidebarGroupLabel className="group-data-[collapsible=icon]:pointer-events-none text-muted-foreground/30 text-[10px] tracking-[0.15em] uppercase font-semibold">
            Collective
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <span className="group-data-[collapsible=icon]:opacity-0 opacity-40 pl-3 transition-opacity duration-150 text-xs italic text-muted-foreground">
                Coming soon...
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
        <ClerkUserButton />
      </SidebarFooter>
    </Sidebar>
  )
}

function ClerkUserButton() {
  const { isLoaded } = useUser()
  const { open } = useSidebar()
  const [showName, setShowName] = useState(open)
  const isMobile = useIsMobile()

  useEffect(() => {
    console.log(open)
    if (!open) {
      setTimeout(() => setShowName(false), 200)
    } else {
      setShowName(true)
    }
  }, [open])

  return (
    <div className="translate-x-[10px]">
      {isLoaded ? (
        <UserButton
          showName={isMobile || showName}
          appearance={{
            elements: {
              userButtonBox: {
                flexDirection: "row-reverse",
                gap: "2px"

              },
              userButtonOuterIdentifier: {
                scale: isMobile ? "1" : (open ? "1" : "0"),
                transitionDuration: "150ms",
                textWrap: "nowrap",
                color: "var(--foreground)",
                zIndex: "-1"
              }
            },
          }}
        />
      ) : (
        <Skeleton className="w-7 h-7 rounded-full" />
      )}
    </div>
  )
}
