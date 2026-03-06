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
  return segment
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ")
}

function generateFromPathname(pathname: string): BreadcrumbDescriptor[] {
  const rawSegments = pathname.split("/").filter(Boolean)
  const appIndex = rawSegments.indexOf("app")
  const segments = appIndex === -1 ? rawSegments : rawSegments.slice(appIndex + 1)

  return segments.map((segment, index) => ({
    href: `/${segments.slice(0, index + 1).join("/")}`,
    label: formatSegment(decodeURIComponent(segment)),
  }))
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
