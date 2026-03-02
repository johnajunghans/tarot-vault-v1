import AppSidebar from "@/app/(app)/_components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { LayoutModeProvider } from "@/components/providers/layout-mode-provider"
import { LayoutActionsProvider } from "@/components/providers/layout-actions-provider"
import { cookies } from "next/headers"
import { ReactNode, ViewTransition } from "react"

export default async function AppLayout({
    children
}: { children: ReactNode }) {
    const cookieStore = await cookies()
    const layoutMode = cookieStore.get("layout_mode")?.value
    const defaultTopbarVisible = layoutMode !== "no-topbar"

    return (
        <ViewTransition>
            <SidebarProvider defaultOpen={false}>
                <LayoutModeProvider defaultTopbarVisible={defaultTopbarVisible}>
                    <LayoutActionsProvider>
                        <AppSidebar />
                        <SidebarInset className="z-10 h-screen relative">
                            { children }
                        </SidebarInset>
                    </LayoutActionsProvider>
                </LayoutModeProvider>
            </SidebarProvider>
        </ViewTransition>
    )
}
