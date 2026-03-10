"use client"

import { Fragment } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ArrowRight01Icon } from "hugeicons-react"
import type { BreadcrumbConfig, BreadcrumbDescriptor } from "@/types/layout"

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatSegment(segment: string) {
  if (isOpaqueRouteSegment(segment)) return ""

  return segment
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ")
}

function isOpaqueRouteSegment(segment: string) {
  return (
    /^[0-9a-f]{24}$/i.test(segment) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(segment) ||
    /^[A-Za-z0-9]{16,}$/.test(segment)
  )
}

function generateFromPathname(pathname: string): BreadcrumbDescriptor[] {
  const rawSegments = pathname.split("/").filter(Boolean)
  const appIndex = rawSegments.indexOf("app")
  const segments = appIndex === -1 ? rawSegments : rawSegments.slice(appIndex + 1)

  return segments
    .map((segment, index) => ({
      href: `/${segments.slice(0, index + 1).join("/")}`,
      label: formatSegment(decodeURIComponent(segment)),
    }))
    .filter((crumb) => crumb.label.length > 0)
}

// ─── Component ─────────────────────────────────────────────────────────────

interface TopbarBreadcrumbsProps {
  config: BreadcrumbConfig
}

export default function TopbarBreadcrumbs({ config }: TopbarBreadcrumbsProps) {
  const pathname = usePathname()

  const items = config.mode === "auto"
    ? generateFromPathname(pathname)
    : config.items

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1

          return (
            <Fragment key={crumb.href + crumb.label}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href={crumb.href}
                    render={<Link href={crumb.href} />}
                  >
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && (
                <BreadcrumbSeparator>
                  <ArrowRight01Icon strokeWidth={2} />
                </BreadcrumbSeparator>
              )}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
