/** @vitest-environment jsdom */

import { useRef } from 'react'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAppHotkey } from '../use-app-hotkey'
import { shouldFocusSpreadsSearchHotkey } from '@/app/(app)/personal/spreads/_lib/hotkeys'

afterEach(() => {
    cleanup()
})

function dispatchModKey(target: Document | HTMLElement, key: string, options?: Partial<KeyboardEventInit>) {
    const event = new KeyboardEvent('keydown', {
        key,
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
        ...options,
    })

    target.dispatchEvent(event)
    return event
}

describe('useAppHotkey', () => {
    it('invokes the latest callback after rerenders', () => {
        const calls: number[] = []

        function TestComponent({ count }: { count: number }) {
            useAppHotkey('Mod+K', () => {
                calls.push(count)
            })

            return null
        }

        const view = render(<TestComponent count={1} />)
        view.rerender(<TestComponent count={2} />)

        dispatchModKey(document, 'k')

        expect(calls).toEqual([2])
    })

    it('does not fire while disabled', () => {
        const callback = vi.fn()

        function TestComponent() {
            useAppHotkey('Mod+K', callback, {
                enabled: false,
            })

            return null
        }

        render(<TestComponent />)
        dispatchModKey(document, 'k')

        expect(callback).not.toHaveBeenCalled()
    })

    it('ignores shortcuts from editable inputs when requested', () => {
        const callback = vi.fn()

        function TestComponent() {
            useAppHotkey('Mod+K', callback, {
                ignoreInputs: true,
            })

            return <input aria-label="Name" />
        }

        const { getByLabelText } = render(<TestComponent />)
        const input = getByLabelText('Name')

        input.focus()
        fireEvent.keyDown(input, {
            key: 'k',
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
        })

        expect(callback).not.toHaveBeenCalled()
    })

    it('preserves the spreads search-input exception while blocking other editables', () => {
        function TestComponent() {
            const searchInputRef = useRef<HTMLInputElement>(null)

            useAppHotkey('Mod+K', (event) => {
                if (!shouldFocusSpreadsSearchHotkey(event.target, searchInputRef.current)) {
                    return
                }

                searchInputRef.current?.focus()
                searchInputRef.current?.select()
            }, {
                ignoreInputs: false,
            })

            return (
                <div>
                    <input
                        aria-label="Search spreads"
                        defaultValue="cards"
                        ref={searchInputRef}
                    />
                    <input aria-label="Other input" defaultValue="other" />
                </div>
            )
        }

        const { getByLabelText } = render(<TestComponent />)
        const searchInput = getByLabelText('Search spreads') as HTMLInputElement
        const otherInput = getByLabelText('Other input')

        dispatchModKey(document.body, 'k')
        expect(document.activeElement).toBe(searchInput)
        expect(searchInput.selectionStart).toBe(0)
        expect(searchInput.selectionEnd).toBe(searchInput.value.length)

        otherInput.focus()
        fireEvent.keyDown(otherInput, {
            key: 'k',
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
        })
        expect(document.activeElement).toBe(otherInput)

        searchInput.focus()
        fireEvent.keyDown(searchInput, {
            key: 'k',
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
        })
        expect(document.activeElement).toBe(searchInput)
        expect(searchInput.selectionStart).toBe(0)
        expect(searchInput.selectionEnd).toBe(searchInput.value.length)
    })
})
