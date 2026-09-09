import { api } from './config'
import { request } from './client'
import type { DashboardSummary } from './types'

export function fetchDashboardSummary(): Promise<DashboardSummary> {
  return request<DashboardSummary>(api.endpoints.dashboardSummary)
}
