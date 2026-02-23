"use client"

import { buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useViewTransitionRouter } from "@/hooks/use-view-transition-router";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Cards01Icon, ConstellationIcon, LibraryIcon, PlusSignIcon } from "hugeicons-react";

export default function NewXButton() {

    const router = useViewTransitionRouter()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                type="button"
                className={cn(buttonVariants({ variant: "default", size: "default" }))}
            >
                <PlusSignIcon strokeWidth={2} className="w-4 h-4" />
                <span className="text-base font-normal">New</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-auto">
                <DropdownMenuItem className="justify-between gap-8">
                    <span>Reading</span>
                    <LibraryIcon strokeWidth={1.25} className="w-4 h-4 text-muted-foreground" />
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="justify-between gap-8"
                    onClick={() => router.push(routes.personal.spreads.new.root)}
                    >
                    <span>Spread</span>
                    <Cards01Icon strokeWidth={1.25} className="w-4 h-4 text-muted-foreground" />
                </DropdownMenuItem>
                    <DropdownMenuItem className="justify-between gap-8">
                    <span>Interpretation</span>
                    <ConstellationIcon strokeWidth={1.25} className="w-4 h-4 text-muted-foreground" />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}