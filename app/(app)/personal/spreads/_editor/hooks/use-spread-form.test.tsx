/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useWatch } from 'react-hook-form'
import { useSpreadForm } from './use-spread-form'

afterEach(() => {
    cleanup()
})

function SpreadFormHarness() {
    const spreadForm = useSpreadForm()
    const values = useWatch({ control: spreadForm.form.control })
    const layers = values.positions?.map((position) => position?.z).join(',') ?? ''

    return (
        <div>
            <div data-testid="layers">{layers}</div>
            <button type="button" onClick={spreadForm.addCard}>
                Add card
            </button>
            <button type="button" onClick={() => spreadForm.remove(1)}>
                Remove middle
            </button>
        </div>
    )
}

describe('useSpreadForm layering', () => {
    it('adds new cards at the highest layer', () => {
        render(<SpreadFormHarness />)

        fireEvent.click(screen.getByText('Add card'))
        expect(screen.getByTestId('layers').textContent).toBe('1')

        fireEvent.click(screen.getByText('Add card'))
        fireEvent.click(screen.getByText('Add card'))
        expect(screen.getByTestId('layers').textContent).toBe('1,2,3')
    })

    it('renormalizes layers after removing a card', () => {
        render(<SpreadFormHarness />)

        fireEvent.click(screen.getByText('Add card'))
        fireEvent.click(screen.getByText('Add card'))
        fireEvent.click(screen.getByText('Add card'))
        fireEvent.click(screen.getByText('Remove middle'))

        expect(screen.getByTestId('layers').textContent).toBe('1,2')
    })
})
