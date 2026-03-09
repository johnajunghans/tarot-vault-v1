"use client"

import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import type { TitleDescriptor } from "@/types/layout"
import {
  Cards01Icon,
  ConstellationIcon,
  LibraryIcon,
} from "hugeicons-react"

const TITLE_ICONS: Record<string, typeof Cards01Icon> = {
  spreads: Cards01Icon,
  readings: LibraryIcon,
  interpretations: ConstellationIcon,
}

interface TopbarTitleProps {
  title: TitleDescriptor | null
  isMobile: boolean
}

export default function TopbarTitle({ title, isMobile }: TopbarTitleProps) {
  if (!title) return null

  if (title.variant === "page") {
    const Icon = title.icon ? TITLE_ICONS[title.icon] : null
    return (
      <div className="flex items-center gap-1.5 md:gap-3">
        {Icon && <Icon strokeWidth={1.25} className="size-4 md:size-5 text-gold" />}
        <h1 className="font-display text-base md:text-lg lg:text-xl font-bold tracking-tight">
          {title.label}
        </h1>
      </div>
    )
  }

  if (title.variant === "spread") {
    const unit = title.countUnit ?? "card"
    const countLabel = `${title.count} ${title.count !== 1 ? `${unit}s` : unit}`

    return (
      <>
        <span className="font-display font-bold text-foreground text-sm lg:text-base truncate max-w-[120px] sm:max-w-[280px] md:max-w-[160px] lg:max-w-[280px]">
          {title.name}
        </span>
        {!isMobile && (
          <>
            <Separator orientation="vertical" />
            <span className="text-muted-foreground text-xs lg:text-sm text-nowrap">
              {countLabel}
            </span>
          </>
        )}
        {title.badge && (
          <Badge variant="secondary" className="text-[10px] font-medium">
            {title.badge}
          </Badge>
        )}
      </>
    )
  }

  return null
}
