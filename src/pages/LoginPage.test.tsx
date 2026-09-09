import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'
import { tokenStore } from '../api/tokenStore'
import App from '../App'

describe('login', () => {
  it('shows the form once the session restore comes back empty', async () => {
    renderWithProviders(<App />, { route: '/login' })

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByLabelText('Work email')).toBeRequired()
  })

  it('reports bad credentials without leaking whether the account exists', async () => {
    const user = userEvent.setup()
    renderWithProviders(<App />, { route: '/login' })

    await user.type(await screen.findByLabelText('Work email'), 'nobody@northwind.example')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('That email and password combination did not match.')
    expect(tokenStore.token).toBeNull()
  })

  it('signs a valid user in and lands them on the dashboard', async () => {
    const user = userEvent.setup()
    renderWithProviders(<App />, { route: '/login' })

    await user.type(await screen.findByLabelText('Work email'), 'ada.okonjo@northwind.example')
    await user.type(screen.getByLabelText('Password'), 'demo1234')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Ada Okonjo')).toBeInTheDocument())
  })

  it('sends an unauthenticated visitor from /dashboard to the login screen', async () => {
    renderWithProviders(<App />, { route: '/dashboard' })

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })
})
