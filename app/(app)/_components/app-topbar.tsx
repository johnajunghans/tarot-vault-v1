"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSidebar } from "@/components/ui/sidebar"
import { useLayoutMode, useLayoutContent } from "@/components/providers/layout-provider"
import { SidebarToggle } from "./app-sidebar"
import TopbarTitle from "./topbar-titles"
import TopbarButtons from "./topbar-actions"
import TopbarBreadcrumbs from "./topbar-breadcrumbs"
import { routes } from "@/lib/routes"

export default function AppTopbar() {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const { topbarVisible } = useLayoutMode()
  const { actions, title, breadcrumbs } = useLayoutContent()

  useEffect(() => {
    router.prefetch(routes.personal.spreads.new.root)
  }, [router])

  // On mobile, topbar is always visible regardless of layout mode
  const isVisible = isMobile || topbarVisible

  return (
    <div
      className={`shrink-0 transition-[max-height,opacity] duration-200 ease-in-out ${
        isVisible ? "max-h-[57px] opacity-100 pointer-events-auto" : "max-h-0 opacity-0 pointer-events-none"
      }`}
    >
      <header
        className={`flex max-h-[57px] items-center justify-between gap-4 overflow-hidden border-b border-border/60 bg-background px-3 py-4 lg:px-4 ${
          isMobile ? "sticky top-0 z-20 bg-background/80 backdrop-blur-sm" : ""
        }`}
      >
        {/* Left Section */}
        <div className="flex items-center gap-1.5 lg:gap-3 min-w-0">
          <SidebarToggle />

          {isMobile ? (
            <div className="flex min-h-8 min-w-0 flex-1 items-center justify-center gap-3">
              <TopbarTitle title={title} isMobile={isMobile} />
            </div>
          ) : (
            <TopbarBreadcrumbs config={breadcrumbs} />
          )}
        </div>

        {/* Center Section */}
        {!isMobile && (
          <div className="flex min-h-8 min-w-0 flex-1 items-center justify-center gap-1.5 lg:gap-3">
            <TopbarTitle title={title} isMobile={isMobile} />
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-1 lg:gap-2 shrink-0">
          <TopbarButtons actions={actions} isMobile={isMobile} />
        </div>
      </header>
    </div>
  )
}
