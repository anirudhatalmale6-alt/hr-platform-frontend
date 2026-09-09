import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderSignedIn } from '../test/signIn'

describe('dashboard', () => {
  it('renders the metric row from the API response', async () => {
    await renderSignedIn()

    const metrics = await screen.findByRole('region', { name: 'Key metrics' })
    expect(within(metrics).getByText('1,284')).toBeInTheDocument()
    expect(within(metrics).getByText('7.1%')).toBeInTheDocument()
    expect(within(metrics).getByText('24d')).toBeInTheDocument()
  })

  it('colours a fall in attrition as an improvement, not a decline', async () => {
    await renderSignedIn()

    const attrition = (await screen.findByText('Rolling attrition')).closest('article')!
    expect(within(attrition).getByText(/-1\.3%/)).toHaveClass('delta--good')
  })

  it('lists the leave requests waiting on this approver', async () => {
    await renderSignedIn()

    const table = await screen.findByRole('table')
    expect(within(table).getAllByRole('row')).toHaveLength(5) // header + 4
    expect(within(table).getByRole('rowheader', { name: /Priya Raman/ })).toBeInTheDocument()
  })

  it('shows an employee only their own slice, not company-wide figures', async () => {
    await renderSignedIn('sam.reyes@northwind.example')

    const metrics = await screen.findByRole('region', { name: 'Key metrics' })
    expect(within(metrics).getByText('eNPS')).toBeInTheDocument()
    expect(within(metrics).queryByText('Active headcount')).not.toBeInTheDocument()
    expect(screen.getByText('Nothing waiting on you right now.')).toBeInTheDocument()
  })
})
