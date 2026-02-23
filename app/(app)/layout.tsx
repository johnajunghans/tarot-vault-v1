import AppSidebar from "@/app/(app)/_components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ReactNode, ViewTransition } from "react"

export default function AppLayout({
    children
}: { children: ReactNode }) {
    return (
        <SidebarProvider defaultOpen={false}>
            <AppSidebar />
            <SidebarInset className="border border-border !ml-0 z-10">
                <ViewTransition>
                    { children }
                </ViewTransition>
            </SidebarInset>
        </SidebarProvider>
    )
}
