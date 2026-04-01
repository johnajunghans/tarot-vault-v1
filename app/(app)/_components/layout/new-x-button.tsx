"use client"

import { buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { routes } from "@/lib/routes";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowDown01Icon, Cards01Icon, ConstellationIcon, LibraryIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { ReactNode } from "react";

type NewMenuItem = {
    id: string;
    label: string;
    href: string;
    icon: IconSvgElement;
    disabled?: boolean;
};

const NEW_MENU_ITEMS: NewMenuItem[] = [
    {
        id: "reading",
        label: "Reading",
        href: routes.personal.readings.root,
        icon: LibraryIcon,
        disabled: true, // no route here yet
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
        disabled: true, // no route here yet
    },
];

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
                {NEW_MENU_ITEMS.map((item) => (
                    <DropdownMenuItem
                        key={item.id}
                        render={<Link href={item.href} />}
                        className={itemClassName}
                        disabled={item.disabled}
                    >
                        <span>{item.label}</span>
                        <HugeiconsIcon icon={item.icon} strokeWidth={1.25} className={iconClassName} />
                    </DropdownMenuItem>
                ))}
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
                <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="h-5 w-5 duration-100 sm:h-4 sm:w-4" />
            </DropdownMenuTrigger>
        </NewXDropdown>
    )
}
