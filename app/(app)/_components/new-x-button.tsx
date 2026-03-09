"use client"

import { buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { routes } from "@/lib/routes";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Cards01Icon, ConstellationIcon, LibraryIcon, PlusSignIcon } from "hugeicons-react";
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
    return (
        <DropdownMenu open={open} onOpenChange={onOpenChange}> 
            { children }  
            <DropdownMenuContent align="end" sideOffset={8} className="w-auto">
                <DropdownMenuItem
                    render={<Link href={routes.personal.readings.root} />}
                    className="justify-between gap-8"
                    disabled // no route here yet 
                >
                    <span>Reading</span>
                    <LibraryIcon strokeWidth={1.25} className="w-4 h-4 text-muted-foreground" />
                </DropdownMenuItem>
                <DropdownMenuItem
                    render={<Link href={routes.personal.spreads.new.root} />}
                    className="justify-between gap-8"
                >
                    <span>Spread</span>
                    <Cards01Icon strokeWidth={1.25} className="w-4 h-4 text-muted-foreground" />
                </DropdownMenuItem>
                <DropdownMenuItem
                    render={<Link href={routes.personal.interpretations.root} />}
                    className="justify-between gap-8"
                    disabled // no route here yet
                >
                    <span>Interpretation</span>
                    <ConstellationIcon strokeWidth={1.25} className="w-4 h-4 text-muted-foreground" />
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
                className={cn(buttonVariants({ variant: "default", size: compact ? "icon" : "default" }), "")}
            >
                <PlusSignIcon strokeWidth={2} className="w-4 h-4" />
                {!compact && <span className="text-sm md:text-base font-normal">Create</span>}
            </DropdownMenuTrigger>
        </NewXDropdown>
    )
}