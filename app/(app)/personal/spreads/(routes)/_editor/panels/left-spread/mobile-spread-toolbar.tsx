"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PlusSignIcon, Settings02Icon } from "hugeicons-react"

interface MobileSpreadToolbarProps {
    onOpenSpreadSettings: () => void
    onAddCard?: () => void
    canAddCard?: boolean
}

export default function MobileSpreadToolbar({
    onOpenSpreadSettings,
    onAddCard,
    canAddCard = false,
}: MobileSpreadToolbarProps) {
    return (
        <Card className="absolute top-2 left-2 z-10 py-0 items-center shadow-md border-border/50 bg-background/90 backdrop-blur-sm pointer-events-auto">
            <CardContent className="px-1">
                <div className="flex h-8.5 items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onOpenSpreadSettings}
                    >
                        <Settings02Icon />
                    </Button>
                    {onAddCard && (
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={onAddCard}
                            disabled={!canAddCard}
                        >
                            <PlusSignIcon />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
