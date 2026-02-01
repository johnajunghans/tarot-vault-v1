import AppSidebar from "@/components/app/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";

export default function AppLayout({
    children
}: { children: ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <main>
                { children }
            </main>
        </SidebarProvider>
    )
}