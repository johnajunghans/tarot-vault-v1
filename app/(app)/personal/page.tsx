"use client"

import { useEffect } from "react"
import { useLayoutDispatch } from "@/components/providers/layout-provider"

export default function Personal() {

    const { setActions, reset } = useLayoutDispatch()

    useEffect(() => {
        setActions(null)
    }, [setActions])

    useEffect(() => {
        return () => reset()
    }, [reset])

    return (
        <div></div>
    )
}
