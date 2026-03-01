"use client"

import {
  Cards01Icon,
  ConstellationIcon,
  Layout01Icon,
  LayoutLeftIcon,
  LibraryIcon,
  Settings01Icon
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
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Skeleton } from "../../../components/ui/skeleton"
import { routes } from "@/lib/routes"
import { useViewTransitionRouter } from "@/hooks/use-view-transition-router"
import { useHydrated } from "@/hooks/use-hydrated"
import ThemeToggle from "./theme-toggle"
import { useIsMobile } from "@/hooks/use-mobile"
import { Cards01Icon as Cards01ReactIcon, ConstellationIcon as ConstellationReactIcon, Diamond01Icon, LibraryIcon as LibraryReactIcon, Menu01Icon, PanelLeftCloseIcon, PanelLeftOpenIcon } from "hugeicons-react"
import { useLayoutMode } from "@/components/providers/layout-mode-provider"
import { useLayoutActions } from "@/components/providers/layout-actions-provider"
import { SidebarActions } from "./sidebar-action-item"
import { NewXDropdown } from "./new-x-button"
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PlusSignIcon } from "hugeicons-react"
import { Button, buttonVariants } from "@/components/ui/button"
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

interface SidebarMenuItemProps {
  onClick?: () => void
  tooltip: string
  isActive?: boolean
  icon: IconSvgElement
  label: string
}

function SidebarMenuItemComponent({
  onClick,
  tooltip,
  isActive,
  icon,
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
        {/* <Icon strokeWidth={2} color={isActive ? "var(--gold)" : "var(--foreground)"} /> */}
        <HugeiconsIcon icon={icon} color={isActive ? "var(--gold)" : "var(--foreground)"} />
        <span className="group-data-[collapsible=icon]:scale-0 transition-scale duration-150">
          {label}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function SidebarToggle({ className }: { className?: string }) {
  const isMobile = useIsMobile()
  const { open, toggleSidebar } = useSidebar()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={toggleSidebar}
      aria-label="Toggle sidebar"
      className={cn("text-muted-foreground hover:text-foreground shrink-0", className)}
    >
      {isMobile ? <Menu01Icon strokeWidth={1.5} /> :
        open ? (
          <PanelLeftOpenIcon strokeWidth={1.5} />
        ) : (
          <PanelLeftCloseIcon strokeWidth={1.5} />
        )
      }
    </Button>
  )
}

export default function AppSidebar() {
  const router = useViewTransitionRouter()
  const pathname = usePathname()
  const isHydrated = useHydrated()
  const isMobile = useIsMobile()
  const { open } = useSidebar()
  const { topbarVisible, toggleTopbar } = useLayoutMode()
  const actions = useLayoutActions()

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
      <SidebarHeader className="mt-[6px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-start gap-2.5 pl-0 text-left group/brand">
            {/* Diamond icon — swaps to panel open icon on sidebar hover when collapsed + no topbar */}
            <div className="shrink-0 relative group-data-[collapsible=icon]:translate-x-2.5">
              <Diamond01Icon
                color="var(--gold)"
                fill="var(--gold)"
                className={`drop-shadow-[0_0_4px_var(--gold-muted)] transition-all duration-300 group-hover/brand:scale-125 group-hover/brand:drop-shadow-[0_0_8px_var(--gold)] ${
                  showSidebarToggle && !open && sidebarHovered ? "opacity-0 scale-75" : ""
                }`}
                style={{ borderRadius: 4 }}
              />
              {showSidebarToggle && !open && (
                <SidebarToggle 
                  className={`absolute inset-0 -translate-x-[1px] transition-all duration-300 hover:bg-sidebar-accent ${
                      sidebarHovered ? "scale-100" : "scale-0"
                    }`} 
                />
              )}
            </div>
            <span className="text-nowrap group-data-[collapsible=icon]:scale-0 group-data-[collapsible=icon]:pointer-events-none transition-scale duration-150 font-display font-bold tracking-tight">
              Tarot Vault
            </span>
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

        {/* Action buttons — shown when topbar is hidden, centered vertically */}
        {!topbarVisible && !isMobile && (
          <>
          <SidebarSeparator className="ml-0" />
          <SidebarGroup className="pl-3">
            <SidebarGroupLabel className="group-data-[collapsible=icon]:pointer-events-none text-muted-foreground/50 text-[10px] tracking-[0.15em] uppercase font-semibold">
              Actions
            </SidebarGroupLabel>
            <div className="animate-fade-in-scale">
              {actions ? (
                <SidebarActions actions={actions} />
              ) : (
                <DefaultNewActions />
              )}
            </div>
          </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* Footer — utilities & user */}
      <SidebarFooter>
        <SidebarMenu className="translate-x-1">
          <SidebarMenuItemComponent
            tooltip="Settings"
            icon={Settings01Icon}
            label="Settings"
          />
          {!isMobile && (
            <SidebarMenuItemComponent
              tooltip="Toggle layout"
              icon={topbarVisible ? Layout01Icon : LayoutLeftIcon}
              label={topbarVisible ? "Default" : "Headless"}
              onClick={toggleTopbar}
              // isActive={!topbarVisible}
            />
          )}
          <ThemeToggle
            mounted={isHydrated}
          />
        </SidebarMenu>
        <ClerkUserButton />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function DefaultNewActions() {
  const { state, isMobile } = useSidebar()

  return (
    <NewXDropdown>
      <SidebarMenu className="gap-1">
        <SidebarMenuItem>
          {/*
           * Chained render props (all Base UI useRender-compatible):
           *   SidebarMenuButton → renders as TooltipTrigger → renders as DropdownMenuTrigger
           * Result: one DOM button with sidebar layout, tooltip, and dropdown trigger — no nesting.
           * We handle tooltip manually (not via SidebarMenuButton's `tooltip` prop) because
           * that prop replaces `render` internally, which would cut the chain.
           */}
          <Tooltip>
            <SidebarMenuButton
              render={<TooltipTrigger render={<DropdownMenuTrigger />} />}
              className="hover:bg-gold/10 [&_svg]:text-gold"
            >
              <PlusSignIcon size={24} strokeWidth={2} />
              <span className="group-data-[collapsible=icon]:scale-0 duration-150">Create</span>
            </SidebarMenuButton>
            <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile}>
              Create
            </TooltipContent>
          </Tooltip>
        </SidebarMenuItem>
      </SidebarMenu>
    </NewXDropdown>
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
