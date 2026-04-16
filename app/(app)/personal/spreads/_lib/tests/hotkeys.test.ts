/** @vitest-environment jsdom */

import { describe, expect, it } from 'vitest'
import {
    isEditableHotkeyTarget,
    shouldFocusSpreadsSearchHotkey,
} from '../hotkeys'

describe('spreads hotkey helpers', () => {
    it('treats form controls and contenteditable elements as editable targets', () => {
        const input = document.createElement('input')
        const textarea = document.createElement('textarea')
        const select = document.createElement('select')
        const editable = document.createElement('div')
        editable.contentEditable = 'true'

        expect(isEditableHotkeyTarget(input)).toBe(true)
        expect(isEditableHotkeyTarget(textarea)).toBe(true)
        expect(isEditableHotkeyTarget(select)).toBe(true)
        expect(isEditableHotkeyTarget(editable)).toBe(true)
        expect(isEditableHotkeyTarget(document.createElement('div'))).toBe(false)
    })

    it('only allows the spreads search shortcut to fire from the search input among editable targets', () => {
        const searchInput = document.createElement('input')
        const otherInput = document.createElement('input')
        const editable = document.createElement('div')
        editable.contentEditable = 'true'

        expect(shouldFocusSpreadsSearchHotkey(document.body, searchInput)).toBe(true)
        expect(shouldFocusSpreadsSearchHotkey(searchInput, searchInput)).toBe(true)
        expect(shouldFocusSpreadsSearchHotkey(otherInput, searchInput)).toBe(false)
        expect(shouldFocusSpreadsSearchHotkey(editable, searchInput)).toBe(false)
    })
})
