import AppSidebar from "@/components/app/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ReactNode } from "react"

export default function AppLayout({
    children
}: { children: ReactNode }) {
    return (
        <SidebarProvider defaultOpen={false}>
            <AppSidebar />
            <SidebarInset>
                { children }
            </SidebarInset>
        </SidebarProvider>
    )
}