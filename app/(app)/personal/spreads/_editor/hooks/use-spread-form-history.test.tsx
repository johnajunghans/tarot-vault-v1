/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { SpreadForm } from '@/types/spreads'
import { useSpreadFormHistory } from './use-spread-form-history'

const defaultValues: SpreadForm = {
    name: 'Three Cards',
    description: '',
    positions: [
        {
            name: 'Past',
            description: '',
            allowReverse: true,
            x: 10,
            y: 20,
            r: 0,
            z: 1,
        },
    ],
}

afterEach(() => {
    cleanup()
})

function HistoryHarness() {
    const form = useForm<SpreadForm>({ defaultValues })
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(0)
    const history = useSpreadFormHistory({
        form,
        enabled: true,
        selectedCardIndex,
        setSelectedCardIndex,
    })
    const values = useWatch({ control: form.control })
    const nameField = form.register('name')

    return (
        <div>
            <input
                aria-label="Spread name"
                {...nameField}
                onFocus={history.beginTextEdit}
                onBlur={(event) => {
                    nameField.onBlur(event)
                    history.commitTextEdit()
                }}
            />
            <div data-testid="name">{values.name}</div>
            <div data-testid="x">{values.positions?.[0]?.x}</div>
            <div data-testid="count">{values.positions?.length ?? 0}</div>
            <div data-testid="selected">{String(selectedCardIndex)}</div>
            <div data-testid="can-undo">{String(history.canUndo)}</div>
            <button
                type="button"
                onClick={() => {
                    history.pushSnapshot()
                    form.setValue('positions.0.x', 45, { shouldDirty: true })
                }}
            >
                Move card
            </button>
            <button
                type="button"
                onClick={() => {
                    history.pushSnapshot()
                    form.setValue('positions', [], { shouldDirty: true })
                    setSelectedCardIndex(null)
                }}
            >
                Remove card
            </button>
            <button type="button" onClick={history.undo}>
                Undo
            </button>
            <button type="button" onClick={history.redo}>
                Redo
            </button>
        </div>
    )
}

describe('useSpreadFormHistory', () => {
    it('records non-text form changes immediately', () => {
        render(<HistoryHarness />)

        fireEvent.click(screen.getByText('Move card'))
        expect(screen.getByTestId('x').textContent).toBe('45')
        expect(screen.getByTestId('can-undo').textContent).toBe('true')

        fireEvent.click(screen.getByText('Undo'))
        expect(screen.getByTestId('x').textContent).toBe('10')

        fireEvent.click(screen.getByText('Redo'))
        expect(screen.getByTestId('x').textContent).toBe('45')
    })

    it('records text edits only when the field blurs', () => {
        render(<HistoryHarness />)
        const input = screen.getByLabelText('Spread name')

        fireEvent.focus(input)
        fireEvent.change(input, { target: { value: 'Daily Reading' } })
        expect(screen.getByTestId('name').textContent).toBe('Daily Reading')
        expect(screen.getByTestId('can-undo').textContent).toBe('false')

        fireEvent.blur(input)
        expect(screen.getByTestId('can-undo').textContent).toBe('true')

        fireEvent.click(screen.getByText('Undo'))
        expect(screen.getByTestId('name').textContent).toBe('Three Cards')
    })

    it('restores whole-form snapshots including removed positions', () => {
        render(<HistoryHarness />)

        fireEvent.click(screen.getByText('Remove card'))
        expect(screen.getByTestId('count').textContent).toBe('0')
        expect(screen.getByTestId('selected').textContent).toBe('null')

        fireEvent.click(screen.getByText('Undo'))
        expect(screen.getByTestId('count').textContent).toBe('1')
        expect(screen.getByTestId('x').textContent).toBe('10')
        expect(screen.getByTestId('selected').textContent).toBe('0')
    })
})
