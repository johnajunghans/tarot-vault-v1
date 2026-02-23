"use client"

import AppTopbar from "@/app/(app)/_components/app-topbar"
import { useViewTransitionRouter } from "@/hooks/use-view-transition-router"
import { routes } from "@/lib/routes"
import { useUser } from "@clerk/clerk-react"

export default function Personal() {

    const user = useUser()
    const router = useViewTransitionRouter()

    if (!user.isSignedIn) {
        router.push(routes.root)
    }

    return (
        <>
            <AppTopbar />
            <div></div>
        </>
    )
}