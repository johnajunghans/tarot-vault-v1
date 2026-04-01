"use client"

import { Menu01Icon, PanelLeftCloseIcon, PanelLeftOpenIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useSidebar } from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
