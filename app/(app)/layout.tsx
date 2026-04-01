import AppSidebar from "@/app/(app)/_layout/sidebar"
import AppTopbar from "@/app/(app)/_layout/topbar"
import AuthContainer from "@/app/_auth/auth-container"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { LayoutProvider } from "@/components/providers/layout-provider"
import { cookies } from "next/headers"
import {
    ReactNode,
    // ViewTransition
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
                <SidebarInset className="relative z-10 h-dvh flex-col overflow-hidden">
                    <AppTopbar />
                    <div className="min-h-0 flex-1 overflow-hidden">
                        {/* <ViewTransition default="cross-fade"> */}
                            <AuthContainer authenticated={children}>
                                {children}
                            </AuthContainer>
                        {/* </ViewTransition> */}
                    </div>
                </SidebarInset>
            </LayoutProvider>
        </SidebarProvider>
    )
}
