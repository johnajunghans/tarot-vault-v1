'use client'

import { useHotkey } from '@tanstack/react-hotkeys'
import type { UseHotkeyOptions } from '@tanstack/react-hotkeys'

export type AppHotkeyOptions = {
    enabled?: boolean
    ignoreInputs?: boolean
    preventDefault?: boolean
    stopPropagation?: boolean
    requireReset?: boolean
    eventType?: 'keydown' | 'keyup'
    target?: UseHotkeyOptions['target']
    conflictBehavior?: UseHotkeyOptions['conflictBehavior']
}

export function useAppHotkey(
    hotkey: string,
    callback: (event: KeyboardEvent) => void,
    options: AppHotkeyOptions = {}
) {
    const {
        enabled = true,
        preventDefault = true,
        stopPropagation = false,
        eventType = 'keydown',
        conflictBehavior = 'warn',
        ...restOptions
    } = options

    useHotkey(hotkey, (event) => {
        callback(event)
    }, {
        enabled,
        preventDefault,
        stopPropagation,
        eventType,
        conflictBehavior,
        ...restOptions,
    })
}
