import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import '@fontsource-variable/fraunces'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'

import './styles/theme.css'
import './styles/base.css'
import './styles/boot.css'
import App from './App'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // The client already retries once behind a refresh; a second layer of
      // retries just delays the error the user needs to see.
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

async function start() {
  // Mock backend only until the real API base URL is wired in.
  if (import.meta.env.VITE_USE_MOCK_API !== 'false') {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  )
}

void start()
