"use client"

import {
  Cards01Icon,
  ConstellationIcon,
  Layout01Icon,
  LayoutLeftIcon,
  LibraryIcon,
  Menu01Icon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react"
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
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { UserButton, useUser } from "@clerk/clerk-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { routes } from "@/lib/routes"
import ThemeToggle from "./theme-toggle"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLayoutMode, useLayoutContent } from "@/components/providers/layout-provider"
import { SidebarActions, SidebarActionsSkeleton, DefaultSidebarActions } from "./sidebar-actions"
import { SidebarLogo } from "./sidebar-logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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

// ─── Nav item (link) ──────────────────────────────────────────────────────────

interface SidebarNavItemProps {
  href: string
  tooltip: string
  isActive?: boolean
  icon: IconSvgElement
  label: string
}

function SidebarNavItem({ href, tooltip, isActive, icon, label }: SidebarNavItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={href} />}
        tooltip={!isActive ? tooltip : undefined}
        suppressTooltipOnPress
        isActive={isActive}
        className={isActive
          ? "!bg-gold/15 text-foreground"
          : "hover:bg-gold/15 text-foreground-muted hover:text-foreground"
        }
      >
        <HugeiconsIcon icon={icon} strokeWidth={1.5} />
        <span className="group-data-[collapsible=icon]:scale-0 transition-scale duration-150">
          {label}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

// ─── Button item (action) ─────────────────────────────────────────────────────

interface SidebarButtonItemProps {
  onClick?: () => void
  tooltip: string
  icon: IconSvgElement
  label: string
  className?: string
}

function SidebarButtonItem({ onClick, tooltip, icon, label, className }: SidebarButtonItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        type="button"
        tooltip={tooltip}
        onClick={onClick}
        className={cn("hover:bg-gold/15 text-foreground-muted hover:text-foreground", className)}
      >
        <HugeiconsIcon icon={icon} strokeWidth={1.5} />
        <span className="group-data-[collapsible=icon]:scale-0 transition-scale duration-150">
          {label}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

// ─── Layout toggle item (animated icon swap) ──────────────────────────────────

function LayoutToggleItem() {
  const { topbarVisible, toggleTopbar } = useLayoutMode()

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        type="button"
        tooltip="Toggle layout"
        onClick={toggleTopbar}
        className="hover:bg-gold/15 text-foreground-muted hover:text-foreground"
      >
        <div className="relative size-6 shrink-0">
          <span className={`absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-in-out ${topbarVisible ? "scale-100" : "scale-0"}`}>
            <HugeiconsIcon icon={Layout01Icon} strokeWidth={1.5} />
          </span>
          <span className={`absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-in-out ${topbarVisible ? "scale-0" : "scale-100"}`}>
            <HugeiconsIcon icon={LayoutLeftIcon} strokeWidth={1.5} />
          </span>
        </div>
        <span className="group-data-[collapsible=icon]:scale-0 transition-scale duration-150">
          {topbarVisible ? "Default" : "Headless"}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

// ─── Sidebar toggle button ────────────────────────────────────────────────────

export function SidebarToggle({ className }: { className?: string }) {
  const isMobile = useIsMobile()
  const { open, toggleSidebar } = useSidebar()

  const icon = isMobile ? Menu01Icon : open ? PanelLeftOpenIcon : PanelLeftCloseIcon

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={toggleSidebar}
      aria-label="Toggle sidebar"
      className={cn("text-muted-foreground hover:text-foreground shrink-0", className)}
    >
      <HugeiconsIcon icon={icon} strokeWidth={1.5} />
    </Button>
  )
}

// ─── App Sidebar ──────────────────────────────────────────────────────────────

export default function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const { open } = useSidebar()
  const { topbarVisible } = useLayoutMode()
  const { actions } = useLayoutContent()

  const [sidebarHovered, setSidebarHovered] = useState(false)

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

  const showSidebarToggle = !topbarVisible && !isMobile

  return (
    <Sidebar
      collapsible="icon"
      className="bg-transparent"
      onMouseEnter={() => !topbarVisible && setSidebarHovered(true)}
      onMouseLeave={() => !topbarVisible && setSidebarHovered(false)}
    >
      {/* Header — brand */}
      <SidebarHeader className="h-[57px] justify-center border-b border-border/80">
        <div className="flex items-center justify-between">
          <div className={cn("relative shrink-0 duration-150", !isMobile && "translate-x-3.5")}>
            <div
              className={cn(
                "transition-all duration-300",
                showSidebarToggle && !open && sidebarHovered && "opacity-0 scale-75",
              )}
            >
              <SidebarLogo mobile={isMobile} />
            </div>
            {showSidebarToggle && !open && (
              <SidebarToggle
                className={cn(
                  "absolute inset-0  transition-all duration-300 -translate-1 hover:bg-sidebar-accent",
                  sidebarHovered ? "scale-100" : "scale-0",
                )}
              />
            )}
          </div>

          {/* Panel close icon — shown when expanded + no topbar */}
          {showSidebarToggle && open && (
            <SidebarToggle className="hover:bg-sidebar-accent" />
          )}
        </div>
      </SidebarHeader>

      {/* Content — navigation */}
      <SidebarContent className="overflow-hidden bg-transparent">
        {/* Personal workspace */}
        <SidebarGroup className="pl-3">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:pointer-events-none text-muted-foreground/50 text-[10px] tracking-[0.15em] uppercase font-semibold">
            <Link
              href={routes.personal.root}
              className="hover:text-muted-foreground transition-colors"
              onMouseEnter={() => router.prefetch(routes.personal.root)}
            >
              Personal
            </Link>
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1.5">
            {sidebarRoutes.personal.map((route) => (
              <SidebarNavItem
                key={route.name}
                tooltip={route.name}
                href={route.url}
                isActive={isActive(route.url)}
                icon={route.icon}
                label={route.name}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Collective (future) */}
        {/* <SidebarGroup className="pl-3">
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
        </SidebarGroup> */}

        {/* Action buttons — shown when topbar is hidden */}
        {!topbarVisible && !isMobile && (
          <>
            <SidebarSeparator className="ml-0" />
            <SidebarGroup className="pl-3">
              <SidebarGroupLabel className="group-data-[collapsible=icon]:pointer-events-none text-muted-foreground/50 text-[10px] tracking-[0.15em] uppercase font-semibold">
                Actions
              </SidebarGroupLabel>
              <div className="animate-fade-in-scale">
                {actions === undefined ? (
                  <SidebarActionsSkeleton />
                ) : actions === null ? (
                  <DefaultSidebarActions />
                ) : (
                  <SidebarActions actions={actions} />
                )}
              </div>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* Footer — utilities & user */}
      <SidebarFooter>
        <SidebarMenu className="translate-x-1">
          <SidebarButtonItem
            tooltip="Settings"
            icon={Settings01Icon}
            label="Settings"
          />
          {!isMobile && <LayoutToggleItem />}
          <ThemeToggle />
        </SidebarMenu>
        <ClerkUserButton />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

// ─── Clerk user button ────────────────────────────────────────────────────────

function ClerkUserButton() {
  const { isLoaded } = useUser()
  const { open } = useSidebar()
  const isMobile = useIsMobile()

  return (
    <div className="translate-x-[10px]">
      {isLoaded ? (
        <UserButton
          showName={isMobile || open}
          appearance={{
            elements: {
              userButtonBox: {
                flexDirection: "row-reverse",
                gap: "2px",
              },
              userButtonOuterIdentifier: {
                scale: isMobile ? "1" : (open ? "1" : "0"),
                transitionDuration: "150ms",
                textWrap: "nowrap",
                color: "var(--foreground)",
                zIndex: "-1",
              },
            },
          }}
        />
      ) : (
        <Skeleton className="w-7 h-7 rounded-full" />
      )}
    </div>
  )
}
