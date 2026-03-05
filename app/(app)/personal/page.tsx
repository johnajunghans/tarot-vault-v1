"use client"

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
        <div></div>
    )
}
