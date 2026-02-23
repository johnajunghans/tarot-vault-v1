"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { HorseSaddleIcon, PineTreeIcon, SurpriseIcon, Tree01Icon } from "hugeicons-react"
import type React from "react"
import { ReactNode } from "react"

export interface ConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title?: React.ReactNode
    description: React.ReactNode
    cancelLabel?: string
    confirmLabel: string
    onConfirm: () => void | Promise<void>
    confirmVariant?: "default" | "destructive"
    isConfirming?: boolean
    secondaryLabel?: string
    onSecondary?: () => void
    secondaryVariant?: "secondary" | "outline"
}

const zanyTitles: { content: string, icon: ReactNode | undefined }[] = [
    {
        content: "Woah there, buddy ol' pal!",
        icon: <SurpriseIcon className="w-4 h-4" />
    },
    {
        content: "Hold yer horses, partner.",
        icon: <HorseSaddleIcon className="w-4 h-4" />
    },
    {
        content: "Jiminy Christmas!",
        icon: <PineTreeIcon className="w-4 h-4" />
    }
]

export default function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    cancelLabel = "Cancel",
    confirmLabel,
    onConfirm,
    confirmVariant = "destructive",
    isConfirming = false,
    secondaryLabel,
    onSecondary,
    secondaryVariant = "secondary",
}: ConfirmDialogProps) {
    const hasSecondary = Boolean(secondaryLabel && onSecondary)
    const disabled = isConfirming

    const handleConfirm = () => {
        const result = onConfirm()
        if (result instanceof Promise) {
            // Caller closes after async work (e.g. navigation)
        } else {
            // Caller may close in onConfirm; we don't auto-close
        }
    }

    const Title = () => {
        if (title) return title

        const randomIndex = Math.floor(Math.random() * zanyTitles.length)
        const randomZanyTitle = zanyTitles[randomIndex]

        return (
            <div className="flex items-center gap-2">
                { randomZanyTitle.icon }
                <span>{randomZanyTitle.content}</span>
            </div>
           
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-display">
                        <Title />
                    </DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter
                    className={hasSecondary ? "sm:justify-between" : "sm:justify-end"}
                >
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={disabled}
                    >
                        {cancelLabel}
                    </Button>
                    {hasSecondary ? (
                        <div className="flex flex-col-reverse gap-2 sm:flex-row">
                            <Button
                                variant={secondaryVariant}
                                onClick={onSecondary}
                                disabled={disabled}
                            >
                                {secondaryLabel}
                            </Button>
                            <Button
                                variant={confirmVariant}
                                onClick={handleConfirm}
                                disabled={disabled}
                            >
                                {isConfirming && <Spinner />}
                                {confirmLabel}
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant={confirmVariant}
                            onClick={handleConfirm}
                            disabled={disabled}
                        >
                            {isConfirming && <Spinner />}
                            {confirmLabel}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
