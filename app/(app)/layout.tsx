import AppSidebar from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ReactNode } from "react"

export default function AppLayout({
    children
}: { children: ReactNode }) {
    return (
        <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <SidebarInset>
                { children }
            </SidebarInset>
        </SidebarProvider>
    )
}
