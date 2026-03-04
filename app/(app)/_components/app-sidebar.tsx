"use client"

import {
  Cards01Icon,
  ConstellationIcon,
  Layout01Icon,
  LayoutLeftIcon,
  LibraryIcon,
  Settings01Icon,
  Menu01Icon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon
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
import { Skeleton } from "../../../components/ui/skeleton"
import { routes } from "@/lib/routes"
import ThemeToggle from "./theme-toggle"
import { useIsMobile } from "@/hooks/use-mobile"
import { Diamond01Icon } from "hugeicons-react"
import { useLayoutMode } from "@/components/providers/layout-mode-provider"
import { useLayoutActions } from "@/components/providers/layout-actions-provider"
import { SidebarActions } from "./sidebar-action-item"
import { NewXDropdown } from "./new-x-button"
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PlusSignIcon } from "hugeicons-react"
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

interface SidebarMenuItemProps {
  href?: string
  onClick?: () => void
  tooltip: string
  isActive?: boolean
  icon: IconSvgElement
  label: string
}

function SidebarMenuItemComponent({
  href,
  onClick,
  tooltip,
  isActive,
  icon,
  label,
}: SidebarMenuItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        type={href ? undefined : "button"}
        render={href ? <Link href={href} /> : undefined}
        tooltip={!isActive ? tooltip : undefined}
        suppressTooltipOnPress={!!href}
        onClick={onClick}
        isActive={isActive}
        className={`${isActive ? "!bg-gold/15 text-foreground" : "hover:bg-gold/15 text-foreground-muted hover:text-foreground"}`}
      >
        <HugeiconsIcon icon={icon} strokeWidth={1.5} />
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

export default function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
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
      <SidebarHeader className="h-[57px] justify-center border-b border-border/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-start gap-2.5 pl-0 text-left group/brand">
            {/* Diamond icon — swaps to panel open icon on sidebar hover when collapsed + no topbar */}
            <div className="shrink-0 relative group-data-[collapsible=icon]:translate-x-2.5 duration-150">
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
              <SidebarMenuItemComponent
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
          <ThemeToggle />
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
          <SidebarMenuButton
            render={<DropdownMenuTrigger />}
            tooltip={{
              children: "Create",
              side: "right",
              align: "center",
              hidden: state !== "collapsed" || isMobile,
            }}
            className="hover:bg-gold/10 [&_svg]:text-gold"
          >
            <PlusSignIcon size={24} strokeWidth={2} />
            <span className="group-data-[collapsible=icon]:scale-0 duration-150">Create</span>
          </SidebarMenuButton>
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
