import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from './renderWithProviders'
import App from '../App'

/**
 * Signs in through the real form. Deliberately not a shortcut that pokes a
 * token into the store — going through the UI is what proves the screens are
 * reachable the way a user reaches them.
 */
export async function renderSignedIn(email = 'ada.okonjo@northwind.example') {
  const user = userEvent.setup()
  renderWithProviders(<App />, { route: '/login' })

  await user.type(await screen.findByLabelText('Work email'), email)
  await user.type(screen.getByLabelText('Password'), 'demo1234')
  await user.click(screen.getByRole('button', { name: 'Sign in' }))

  await screen.findByRole('heading', { name: 'Dashboard' })
  return { user }
}
