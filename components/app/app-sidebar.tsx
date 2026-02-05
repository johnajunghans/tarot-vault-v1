"use client"

import {
  Cards01Icon,
  ConstellationIcon,
  LibraryIcon,
  MoneySafeIcon,
  Moon01Icon,
  NeuralNetworkIcon,
  Prism01Icon,
  Settings01Icon,
  Sun01Icon,
} from "hugeicons-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "../ui/sidebar"
import { UserButton, useUser } from "@clerk/clerk-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Skeleton } from "../ui/skeleton"

const routes = {
    personal: [
        {
            name: "Readings",
            url: "/app/personal/readings",
            icon: LibraryIcon,
        },
        {
            name: "Spreads",
            url: "/app/personal/spreads",
            icon: Cards01Icon,
        },
        {
            name: "Interpretations",
            url: "/app/personal/interpretations",
            icon: ConstellationIcon,
        },
    ],
    // collectiveRoutes: []
}

export default function AppSidebar() {
    const { open } = useSidebar()
    const { isLoaded } = useUser()
    const router = useRouter()
    const { theme, resolvedTheme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const activeTheme = resolvedTheme ?? theme
    const isLightTheme = activeTheme === "light"

    function toggleTheme() {
        const nextTheme = isLightTheme ? "dark" : "light"
        setTheme(nextTheme)
    }  

  return (
    <Sidebar collapsible="icon">

      {/* Header */}
      <SidebarHeader className="mt-[6px]">
        <button
          type="button"
          onClick={() => router.push("/app")}
          className="flex items-center justify-start gap-2 pl-2 text-left"
        >
          <MoneySafeIcon size={32} strokeWidth={1.5} className="shrink-0 text-violet-600" />
          <span
            className={`text-nowrap ${open ? "scale-100" : "scale-0"} duration-150 font-bold text-violet-600`}
          >
            Tarot Vault
          </span>
        </button>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>

        {/* Personal */}
        <SidebarGroup className="pl-3">
          <SidebarGroupLabel className="hover:underline group-data-[collapsible=icon]:pointer-events-none">
            <a href="/app/personal">Personal</a>
          </SidebarGroupLabel>
          <SidebarMenu>
            {routes.personal.map((route) => (
              <SidebarMenuItem key={route.name}>
                <SidebarMenuButton
                  type="button"
                  tooltip={route.name}
                  onClick={() => router.push(route.url)}
                >
                  <route.icon strokeWidth={1.25} />
                  <span className={`${open ? "scale-100" : "scale-0"} duration-150`}>{route.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Collective */}
        <SidebarGroup className="pl-3">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:pointer-events-none">Collective (coming soon)</SidebarGroupLabel>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="">
        <SidebarMenu className="translate-x-1">
          <SidebarMenuItem>
            <SidebarMenuButton type="button" tooltip="Settings">
              <Settings01Icon strokeWidth={1.25} />
              <span className={`${open ? "scale-100" : "scale-0"} duration-150`}>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
                type="button" 
                tooltip="Theme"
                onClick={toggleTheme}
            >
                {mounted ? (isLightTheme ? <Sun01Icon /> : <Moon01Icon />) : <Skeleton className="w-6 h-6 rounded-full" />}
                <span className={`${open ? "scale-100" : "scale-0"} duration-150`}>Theme</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="translate-x-[10px]">
            {isLoaded ? <UserButton 
                showName={open}
                appearance={{
                    elements: {
                        userButtonBox: {
                            flexDirection: 'row-reverse',
                            gap: '2px'
                        },
                        userButtonOuterIdentifier: {
                            scale: open ? "1" : "0",
                            transitionDuration: "150ms",
                            textWrap: "nowrap",
                            color: "var(--foreground)"
                        }
                    },
                }}
            /> : <Skeleton className="w-6 h-6 rounded-full" />}
        </div>
      </SidebarFooter>
      {/* <SidebarRail /> */}
    </Sidebar>
  )
}