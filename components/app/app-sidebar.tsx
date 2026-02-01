"use client"

import { AdventureIcon, Cards01Icon, LibraryIcon, MoneySafeIcon } from "hugeicons-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, useSidebar } from "../ui/sidebar";

export default function AppSidebar() {

    const { open } = useSidebar()

    const personalRoutes = [
        {
            name: "Readings",
            url: "app/personal/readings",
            icon: <LibraryIcon size={20} />
        },
        {
            name: "Spreads",
            url: "app/personal/spreads",
            icon: <Cards01Icon />
        }
    ]

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <div className="flex items-center justify-start gap-2 pl-[11px]">
                    <MoneySafeIcon strokeWidth={2} className="shrink-0 text-violet-600" />
                    <span className={`text-nowrap ${open ? "scale-100" : "scale-0"} duration-150 font-bold text-violet-600`}>Tarot Vault</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup className="pl-[13px]">
                    <SidebarGroupLabel className="hover:underline"><a href="/app/personal">Personal</a></SidebarGroupLabel>
                    <SidebarMenu>
                        {personalRoutes.map(route => (
                            <SidebarMenuItem key={route.name}>
                                <SidebarMenuButton render={
                                    <a href={route.url}>
                                        {route.icon}
                                        <span>{route.name}</span>
                                    </a>
                                } />
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupLabel>Collective (coming soon)</SidebarGroupLabel>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>

            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}