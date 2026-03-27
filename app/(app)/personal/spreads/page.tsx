"use client"

import { useEffect, useRef } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { routes } from "@/lib/routes"
import { useLayoutDispatch } from "@/components/providers/layout-provider"
import { useAppHotkey } from "@/hooks/use-app-hotkey"
import { shouldFocusSpreadsSearchHotkey } from "./lib/hotkeys"
import SpreadsList from "./_list"

export default function Spreads() {
    const spreads = useQuery(api.spreads.list)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const { setTitle, setActions, reset } = useLayoutDispatch()

    useEffect(() => {
        return () => reset()
    }, [reset])

    useEffect(() => {
        setTitle({ variant: "page", label: "Your Spreads", icon: "spreads" })
    }, [setTitle])

    useEffect(() => {
        setActions([{
            type: "new",
            label: "New Spread",
            href: routes.personal.spreads.new.root
        }])
    }, [setActions])

    useAppHotkey("Mod+K", (event) => {
        if (!shouldFocusSpreadsSearchHotkey(event.target, searchInputRef.current)) {
            return
        }

        searchInputRef.current?.focus()
        searchInputRef.current?.select()
    }, {
        ignoreInputs: false,
    })

    return <SpreadsList spreads={spreads} searchInputRef={searchInputRef} />
}
