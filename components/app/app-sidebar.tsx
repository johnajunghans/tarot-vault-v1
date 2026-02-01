"use client"

import { AdventureIcon, Cards01Icon, LibraryIcon } from "hugeicons-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, useSidebar } from "../ui/sidebar";

export default function AppSidebar() {

    const { open } = useSidebar()

    const personalRoutes = [
        {
            name: "Readings",
            url: "/personal/readings",
            icon: <LibraryIcon />
        },
        {
            name: "Spreads",
            url: "/personal/spreads",
            icon: <Cards01Icon />
        }
    ]

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <div className="flex items-center justify-start gap-2">
                    <AdventureIcon />
                    <span className={`text-nowrap ${open ? "scale-100" : "scale-0"} duration-150`}>Tarot Vault</span>
                </div>
               
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Personal</SidebarGroupLabel>
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