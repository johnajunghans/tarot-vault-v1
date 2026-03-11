"use client"

import { buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { routes } from "@/lib/routes";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowDown01Icon, Cards01Icon, ConstellationIcon, LibraryIcon } from "hugeicons-react";
import { ReactNode } from "react";

interface NewXButtonProps {
    compact?: boolean; // mainly for use in sidebar when topbarVisible is false
}

interface NewXDropdownProps {
    children: ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
} 

export function NewXDropdown({ 
    children,
    open,
    onOpenChange 
}: NewXDropdownProps) {
    const itemClassName = "min-h-11 justify-between gap-4 px-3 py-2 text-base sm:min-h-0 sm:gap-8 sm:px-1.5 sm:py-1 sm:text-sm";
    const iconClassName = "h-5 w-5 text-muted-foreground sm:h-4 sm:w-4";

    return (
        <DropdownMenu open={open} onOpenChange={onOpenChange}> 
            { children }  
            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-[min(18rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] sm:w-auto"
            >
                <DropdownMenuItem
                    render={<Link href={routes.personal.readings.root} />}
                    className={itemClassName}
                    disabled // no route here yet 
                >
                    <span>Reading</span>
                    <LibraryIcon strokeWidth={1.25} className={iconClassName} />
                </DropdownMenuItem>
                <DropdownMenuItem
                    render={<Link href={routes.personal.spreads.new.root} />}
                    className={itemClassName}
                >
                    <span>Spread</span>
                    <Cards01Icon strokeWidth={1.25} className={iconClassName} />
                </DropdownMenuItem>
                <DropdownMenuItem
                    render={<Link href={routes.personal.interpretations.root} />}
                    className={itemClassName}
                    disabled // no route here yet
                >
                    <span>Interpretation</span>
                    <ConstellationIcon strokeWidth={1.25} className={iconClassName} />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default function NewXButton({
    compact = false
}: NewXButtonProps) {
    return (
        <NewXDropdown>
            <DropdownMenuTrigger
                type="button"
                className={cn(
                    buttonVariants({ variant: "default", size: compact ? "icon" : "default" }),
                    compact ? "max-sm:size-11" : "max-sm:h-11 max-sm:px-3",
                    "data-[popup-open]:[&_svg]:rotate-180"
                )}
            >
                {!compact && <span className="text-base font-normal md:text-base">New</span>}
                <ArrowDown01Icon strokeWidth={2} className="h-5 w-5 duration-100 sm:h-4 sm:w-4" />
            </DropdownMenuTrigger>
        </NewXDropdown>
    )
}
