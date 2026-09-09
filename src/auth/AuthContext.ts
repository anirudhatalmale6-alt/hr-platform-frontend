import { createContext } from 'react'
import type { Credentials, User } from '../api/types'

export type AuthStatus = 'restoring' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  status: AuthStatus
  user: User | null
  signIn: (credentials: Credentials) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
