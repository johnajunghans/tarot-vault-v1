import AppSidebar from "@/app/(app)/_components/app-sidebar"
import AppTopbar from "@/app/(app)/_components/app-topbar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { LayoutProvider } from "@/components/providers/layout-provider"
import { cookies } from "next/headers"
import {
    ReactNode,
    ViewTransition
} from "react"

export default async function AppLayout({
    children
}: { children: ReactNode }) {
    const cookieStore = await cookies()
    const layoutMode = cookieStore.get("layout_mode")?.value
    const defaultTopbarVisible = layoutMode !== "no-topbar"

    return (
        <SidebarProvider defaultOpen={false}>
            <LayoutProvider defaultTopbarVisible={defaultTopbarVisible}>
                <AppSidebar />
                <SidebarInset className="z-10 h-screen relative">
                    <AppTopbar />
                    <ViewTransition default="cross-fade">
                        { children }
                    </ViewTransition>
                </SidebarInset>
            </LayoutProvider>
        </SidebarProvider>
    )
}
