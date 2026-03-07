"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  if (!title) return null

  if (title.variant === "tabs") {
    return (
      <Tabs
        value={title.value}
        onValueChange={(value) => {
          if (title.action.type === "callback") {
            title.action.onValueChange(value)
            return
          }

          const params = new URLSearchParams(searchParams.toString())

          if (value === (title.action.defaultValue ?? "")) {
            params.delete(title.action.param)
          } else {
            params.set(title.action.param, value)
          }

          const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
          router.replace(nextUrl)
        }}
        className="items-center"
      >
        <TabsList variant="default">
          {title.tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="px-3 text-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    )
  }

  if (title.variant === "page") {
    const Icon = title.icon ? TITLE_ICONS[title.icon] : null
    return (
      <div className="flex items-center gap-3">
        {Icon && <Icon strokeWidth={1.25} className="w-5 h-5 text-gold" />}
        <h1 className="font-display text-xl font-bold tracking-tight">
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
