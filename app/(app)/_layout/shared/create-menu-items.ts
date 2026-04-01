import { Cards01Icon, ConstellationIcon, LibraryIcon } from "@hugeicons/core-free-icons"
import { routes } from "@/lib/routes"
import type { IconSvgElement } from "@hugeicons/react"

export type CreateMenuItem = {
  id: string
  label: string
  href: string
  icon: IconSvgElement
  disabled?: boolean
}

export const CREATE_MENU_ITEMS: CreateMenuItem[] = [
  {
    id: "reading",
    label: "Reading",
    href: routes.personal.readings.root,
    icon: LibraryIcon,
    disabled: true,
  },
  {
    id: "spread",
    label: "Spread",
    href: routes.personal.spreads.new.root,
    icon: Cards01Icon,
  },
  {
    id: "interpretation",
    label: "Interpretation",
    href: routes.personal.interpretations.root,
    icon: ConstellationIcon,
    disabled: true,
  },
]
