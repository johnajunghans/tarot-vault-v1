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
import { HorseSaddleIcon, PineTreeIcon, SurpriseIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import type React from "react"
import { ReactNode, type MouseEventHandler, useId } from "react"

export interface ConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title?: React.ReactNode
    description: React.ReactNode
    cancelLabel?: string
    confirmLabel: string
    onConfirm: () => void | Promise<void>
    confirmHref?: string
    confirmVariant?: "default" | "destructive"
    isConfirming?: boolean
    secondaryLabel?: string
    onSecondary?: () => void
    secondaryHref?: string
    secondaryVariant?: "secondary" | "outline"
}

const zanyTitles: { content: string, icon: ReactNode | undefined }[] = [
    {
        content: "Woah there, buddy ol' pal!",
        icon: <HugeiconsIcon icon={SurpriseIcon} className="w-4 h-4" />
    },
    {
        content: "Hold yer horses, partner.",
        icon: <HugeiconsIcon icon={HorseSaddleIcon} className="w-4 h-4" />
    },
    {
        content: "Jiminy Christmas!",
        icon: <HugeiconsIcon icon={PineTreeIcon} className="w-4 h-4" />
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
    confirmHref,
    confirmVariant = "destructive",
    isConfirming = false,
    secondaryLabel,
    onSecondary,
    secondaryHref,
    secondaryVariant = "secondary",
}: ConfirmDialogProps) {
    const hasSecondary = Boolean(secondaryLabel && (onSecondary || secondaryHref))
    const disabled = isConfirming
    const titleId = useId()

    const handleConfirm = () => {
        const result = onConfirm()
        if (result instanceof Promise) {
            // Caller closes after async work (e.g. navigation)
        } else {
            // Caller may close in onConfirm; we don't auto-close
        }
    }

    const titleContent = (() => {
        if (title) return title

        const titleIndex = Array.from(titleId).reduce((sum, char) => sum + char.charCodeAt(0), 0) % zanyTitles.length
        const fallbackTitle = zanyTitles[titleIndex]

        return (
            <div className="flex items-center gap-2">
                { fallbackTitle.icon }
                <span>{fallbackTitle.content}</span>
            </div>
           
        )
    })()

    const handleLinkedAction = (
        event: Parameters<MouseEventHandler<HTMLElement>>[0],
        action?: () => void | Promise<void>,
    ) => {
        if (disabled) {
            event.preventDefault()
            return
        }
        action?.()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-display">
                        {titleContent}
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
                            {secondaryHref ? (
                                <Button
                                    variant={secondaryVariant}
                                    nativeButton={false}
                                    render={<Link href={secondaryHref} />}
                                    onClick={(event) => handleLinkedAction(event, onSecondary)}
                                    disabled={undefined}
                                    className={disabled ? "pointer-events-none opacity-50" : undefined}
                                >
                                    {secondaryLabel}
                                </Button>
                            ) : (
                                <Button
                                    variant={secondaryVariant}
                                    onClick={onSecondary}
                                    disabled={disabled}
                                >
                                    {secondaryLabel}
                                </Button>
                            )}
                            {confirmHref ? (
                                <Button
                                    variant={confirmVariant}
                                    nativeButton={false}
                                    render={<Link href={confirmHref} />}
                                    onClick={(event) => handleLinkedAction(event, onConfirm)}
                                    disabled={undefined}
                                    className={disabled ? "pointer-events-none opacity-50" : undefined}
                                >
                                    {isConfirming && <Spinner />}
                                    {confirmLabel}
                                </Button>
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
                        </div>
                    ) : (
                        confirmHref ? (
                            <Button
                                variant={confirmVariant}
                                nativeButton={false}
                                render={<Link href={confirmHref} />}
                                onClick={(event) => handleLinkedAction(event, onConfirm)}
                                disabled={undefined}
                                className={disabled ? "pointer-events-none opacity-50" : undefined}
                            >
                                {isConfirming && <Spinner />}
                                {confirmLabel}
                            </Button>
                        ) : (
                            <Button
                                variant={confirmVariant}
                                onClick={handleConfirm}
                                disabled={disabled}
                            >
                                {isConfirming && <Spinner />}
                                {confirmLabel}
                            </Button>
                        )
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
