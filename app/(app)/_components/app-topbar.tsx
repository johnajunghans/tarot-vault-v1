"use client"

import { Fragment, useEffect, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { routes } from "@/lib/routes"
import { Button} from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import {
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  ArrowRight01Icon,
  Menu01Icon,
} from "hugeicons-react"
import { useViewTransitionRouter } from "@/hooks/use-view-transition-router"
import NewXButton from "./new-x-button"
import { useLayoutMode } from "@/components/providers/layout-mode-provider"
import { SidebarToggle } from "./app-sidebar"

function formatSegment(segment: string) {
  return segment
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ")
}

interface AppTopbarProps {
  centerTitle?: ReactNode
  rightButtonGroup?: ReactNode
  breadcrumbs?: { href: string; label: string; isLast: boolean }[]
}


export default function AppTopbar({ centerTitle, rightButtonGroup, breadcrumbs }: AppTopbarProps) {
  const pathname = usePathname()
  const { toggleSidebar, open, openMobile, isMobile } = useSidebar()
  const isOpen = isMobile ? openMobile : open
  const router = useViewTransitionRouter()
  const { topbarVisible } = useLayoutMode()

  useEffect(() => {
    router.prefetch(routes.personal.spreads.new.root)
  }, [router])

  const rawSegments = pathname.split("/").filter(Boolean)
  const appIndex = rawSegments.indexOf("app")
  const segments = appIndex === -1 ? rawSegments : rawSegments.slice(appIndex + 1)

  const autoBreadcrumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`
    return {
      href,
      label: formatSegment(decodeURIComponent(segment)),
      isLast: index === segments.length - 1,
    }
  })

  const resolvedBreadcrumbs = breadcrumbs ?? autoBreadcrumbs

  // On mobile, topbar is always visible regardless of layout mode
  const isVisible = isMobile || topbarVisible

  return (
    <div
      className={`transition-[max-height,opacity] duration-200 ease-in-out overflow-hidden ${
        isVisible ? "max-h-[57px] opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <header className="flex items-center justify-between gap-4 bg-background px-3 lg:px-4 py-4 border-b border-border/60 overflow-hidden max-h-[57px]">
        {/* Left Section */}
        <div className="flex items-center gap-1.5 lg:gap-3 min-w-0">
          <SidebarToggle />

          { isMobile ?
            <div className="flex min-h-8 min-w-0 flex-1 items-center justify-center gap-3">
              {centerTitle}
            </div> :
            <Breadcrumb>
              <BreadcrumbList>
                {resolvedBreadcrumbs.map((crumb) => (
                  <Fragment key={crumb.href}>
                    <BreadcrumbItem>
                      {crumb.isLast ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          href={crumb.href}
                          onClick={(event) => {
                            event.preventDefault()
                            router.push(crumb.href)
                          }}
                          onMouseEnter={() => router.prefetch(crumb.href)}
                        >
                          {crumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!crumb.isLast && (
                      <BreadcrumbSeparator>
                        <ArrowRight01Icon strokeWidth={2} />
                      </BreadcrumbSeparator>
                    )}
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          }
        </div>

        {/* Center Section */}
        {!isMobile && <div className="flex min-h-8 min-w-0 flex-1 items-center justify-center gap-1.5 lg:gap-3">
          {centerTitle}
        </div>}

        {/* Right Section */}
        <div className="flex items-center gap-1 lg:gap-2 shrink-0">
          {rightButtonGroup ?? (
            <NewXButton />
          )}
        </div>
      </header>
    </div>
  )
}
