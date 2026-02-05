"use client"

import { Fragment } from "react"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
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
  ArrowDown01Icon
} from "hugeicons-react"

function formatSegment(segment: string) {
  return segment
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ")
}

export default function AppTopbar() {
  const pathname = usePathname()
  const { toggleSidebar, open, openMobile, isMobile } = useSidebar()
  const isOpen = isMobile ? openMobile : open

  const rawSegments = pathname.split("/").filter(Boolean)
  const appIndex = rawSegments.indexOf("app")
  const segments = appIndex === -1 ? rawSegments : rawSegments.slice(appIndex + 1)

  const breadcrumbs = segments.map((segment, index) => {
    const href = `/app/${segments.slice(0, index + 1).join("/")}`
    return {
      href,
      label: formatSegment(decodeURIComponent(segment)),
      isLast: index === segments.length - 1,
    }
  })

  return (
    <header className="flex items-center justify-between gap-4 border-b bg-background px-4 py-3">

      {/* Left Section */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="shadow-none"
        >
          {isOpen ? (
            <PanelLeftOpenIcon strokeWidth={1.5} />
          ) : (
            <PanelLeftCloseIcon strokeWidth={1.5} />
          )}
        </Button>
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb) => (
              <Fragment key={crumb.href}>
                <BreadcrumbItem>
                  {crumb.isLast ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
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
      </div>

      {/* Middle Section */}
      <div className="flex min-h-8 flex-1 items-center justify-center" />

      {/* Right Section */}
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger
            type="button"
            className={buttonVariants({ variant: "default" })}
          >
            <span>New</span>
            <ArrowDown01Icon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="justify-between">
              <span>Reading</span>
              <LibraryIcon strokeWidth={1.25} className="ml-auto" />
            </DropdownMenuItem>
            <DropdownMenuItem className="justify-between">
              <span>Spread</span>
              <Cards01Icon strokeWidth={1.25} className="ml-auto" />
            </DropdownMenuItem>
            <DropdownMenuItem className="justify-between">
              <span>Interpretation</span>
              <ConstellationIcon strokeWidth={1.25} className="ml-auto" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
