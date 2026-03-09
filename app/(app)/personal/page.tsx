"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { routes } from "@/lib/routes"
import { useUser } from "@clerk/clerk-react"
import { useLayoutDispatch } from "@/components/providers/layout-provider"

export default function Personal() {

    const user = useUser()
    const router = useRouter()
    const { setActions, reset } = useLayoutDispatch()

    useEffect(() => {
        setActions(null)
    }, [setActions])

    useEffect(() => {
        return () => reset()
    }, [reset])

    if (!user.isSignedIn) {
        router.push(routes.root)
    }

    return (
        <div></div>
    )
}
