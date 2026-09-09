export type Role = 'admin' | 'manager' | 'employee'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  jobTitle: string
  department: string
  avatarInitials: string
}

export interface Credentials {
  email: string
  password: string
}

export interface Session {
  user: User
  accessToken: string
  /** Seconds until the access token expires. */
  expiresIn: number
}

export interface Metric {
  key: string
  label: string
  value: number
  unit?: 'count' | 'percent' | 'days'
  deltaPct: number
  /** 12 points, oldest first. Used for the inline trend line. */
  series: number[]
}

export interface LeaveRequest {
  id: string
  employee: string
  initials: string
  type: 'Annual' | 'Sick' | 'Parental' | 'Unpaid'
  from: string
  to: string
  days: number
  status: 'pending' | 'approved' | 'declined'
}

export interface HeadcountSlice {
  department: string
  count: number
}

export interface DashboardSummary {
  metrics: Metric[]
  pendingLeave: LeaveRequest[]
  headcount: HeadcountSlice[]
  onboarding: { name: string; initials: string; startsIn: number; role: string }[]
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}
