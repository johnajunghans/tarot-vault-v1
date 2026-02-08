import AppSidebar from "@/components/app/app-sidebar"
import AppTopbar from "@/components/app/app-topbar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ReactNode } from "react"

export default function AppLayout({
    children
}: { children: ReactNode }) {
    return (
        <SidebarProvider defaultOpen={false}>
            <AppSidebar />
            <SidebarInset>
                <AppTopbar />
                { children }
            </SidebarInset>
        </SidebarProvider>
    )
}