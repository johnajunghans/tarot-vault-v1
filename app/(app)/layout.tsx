import AppSidebar from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ReactNode, ViewTransition } from "react"

export default function AppLayout({
    children
}: { children: ReactNode }) {
    return (
        <SidebarProvider defaultOpen={false}>
            <AppSidebar />
            <SidebarInset>
                <ViewTransition>
                    { children }
                </ViewTransition>
            </SidebarInset>
        </SidebarProvider>
    )
}
