"use client"

import AppTopbar from "@/app/(app)/_components/app-topbar"
import { useRouter } from "next/navigation"
import { routes } from "@/lib/routes"
import { useUser } from "@clerk/clerk-react"

export default function Personal() {

    const user = useUser()
    const router = useRouter()

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