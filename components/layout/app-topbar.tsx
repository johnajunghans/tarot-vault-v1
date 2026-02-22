"use client"

import { Fragment, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"
import { routes } from "@/lib/routes"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSidebar } from "@/components/ui/sidebar"
import {
  Cards01Icon,
  LibraryIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  ArrowRight01Icon,
  ConstellationIcon,
  PlusSignIcon,
  Menu01Icon,
} from "hugeicons-react"

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
  const router = useRouter()

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

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border/40 bg-background px-3 lg:px-4 py-3">
      {/* Left Section */}
      <div className="flex items-center gap-1.5 lg:gap-3 min-w-0">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="shadow-none text-muted-foreground hover:text-foreground shrink-0"
        >
          {isMobile ? <Menu01Icon strokeWidth={1.5} /> :
            isOpen ? (
              <PanelLeftOpenIcon strokeWidth={1.5} />
            ) : (
              <PanelLeftCloseIcon strokeWidth={1.5} />
            )
          }
        </Button>

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
                      <BreadcrumbLink href={crumb.href}>
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
          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className={cn(buttonVariants({ variant: "default", size: "default" }))}
            >
              <PlusSignIcon strokeWidth={2} className="w-4 h-4" />
              <span className="text-base font-normal">New</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-auto">
              <DropdownMenuItem className="justify-between gap-8">
                <span>Reading</span>
                <LibraryIcon strokeWidth={1.25} className="w-4 h-4 text-muted-foreground" />
              </DropdownMenuItem>
              <DropdownMenuItem
                className="justify-between gap-8"
                onClick={() => router.push(routes.personal.spreads.new.root)}
              >
                <span>Spread</span>
                <Cards01Icon strokeWidth={1.25} className="w-4 h-4 text-muted-foreground" />
              </DropdownMenuItem>
              <DropdownMenuItem className="justify-between gap-8">
                <span>Interpretation</span>
                <ConstellationIcon strokeWidth={1.25} className="w-4 h-4 text-muted-foreground" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
