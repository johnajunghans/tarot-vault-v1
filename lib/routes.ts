import { Id } from "@/convex/_generated/dataModel";

export const routes = {
    personal: {
        root: '/personal',
        readings: {
            root: '/personal/readings'
        },
        spreads: {
            root: '/personal/spreads',
            new: {
                root: '/personal/spreads/new',
                draft: (timestamp: number) => `/personal/spreads/new?draft=${timestamp}`
            },
            id: (id: Id<"spreads">, mode: 'view' | "edit") => `/personal/spreads/${id}?mode=${mode}`,
        },
        interpretations: {
            root: '/personal/interpretations'
        }
    }
  }