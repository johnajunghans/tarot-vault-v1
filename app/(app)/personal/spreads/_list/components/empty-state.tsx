import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusSignIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { routes } from "@/lib/routes"

export default function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-32 px-4 animate-fade-in-scale opacity-0">
            <div className="w-6 h-6 rotate-45 border border-gold/40 mb-8" />
            <h3 className="font-display text-xl font-bold mb-3 tracking-tight">
                Nothing here yet
            </h3>
            <p className="text-muted-foreground text-center max-w-xs mb-8 text-sm leading-relaxed">
                Create a spread to arrange your card positions.
            </p>
            <Button
                variant="outline"
                nativeButton={false}
                render={<Link href={routes.personal.spreads.new.root} />}
                className="border-gold/50 text-gold hover:bg-gold/10 hover:border-gold"
            >
                <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4 mr-1.5" strokeWidth={2} />
                New spread
            </Button>
        </div>
    )
}
