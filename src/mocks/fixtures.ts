import type { DashboardSummary, User } from '../api/types'

/** Demo accounts. Password for both is `demo1234`. */
export const users: Record<string, { password: string; user: User }> = {
  'ada.okonjo@northwind.example': {
    password: 'demo1234',
    user: {
      id: 'u_1041',
      name: 'Ada Okonjo',
      email: 'ada.okonjo@northwind.example',
      role: 'admin',
      jobTitle: 'Head of People',
      department: 'People Ops',
      avatarInitials: 'AO',
    },
  },
  'sam.reyes@northwind.example': {
    password: 'demo1234',
    user: {
      id: 'u_2277',
      name: 'Sam Reyes',
      email: 'sam.reyes@northwind.example',
      role: 'employee',
      jobTitle: 'Backend Engineer',
      department: 'Engineering',
      avatarInitials: 'SR',
    },
  },
}

export const dashboardSummary: DashboardSummary = {
  metrics: [
    {
      key: 'headcount',
      label: 'Active headcount',
      value: 1284,
      unit: 'count',
      deltaPct: 2.4,
      series: [1180, 1192, 1201, 1198, 1215, 1228, 1233, 1240, 1252, 1261, 1274, 1284],
    },
    {
      key: 'attrition',
      label: 'Rolling attrition',
      value: 7.1,
      unit: 'percent',
      deltaPct: -1.3,
      series: [9.4, 9.1, 8.8, 8.9, 8.4, 8.2, 8.0, 7.8, 7.6, 7.4, 7.2, 7.1],
    },
    {
      key: 'time-to-hire',
      label: 'Median time to hire',
      value: 24,
      unit: 'days',
      deltaPct: -8.6,
      series: [34, 33, 31, 32, 30, 29, 28, 27, 27, 26, 25, 24],
    },
    {
      key: 'enps',
      label: 'eNPS',
      value: 41,
      unit: 'count',
      deltaPct: 5.9,
      series: [28, 30, 29, 32, 33, 35, 34, 36, 38, 39, 40, 41],
    },
  ],
  pendingLeave: [
    {
      id: 'lv_8831',
      employee: 'Priya Raman',
      initials: 'PR',
      type: 'Annual',
      from: '22 Sep',
      to: '3 Oct',
      days: 10,
      status: 'pending',
    },
    {
      id: 'lv_8832',
      employee: 'Tomás Ferreira',
      initials: 'TF',
      type: 'Parental',
      from: '1 Oct',
      to: '26 Dec',
      days: 60,
      status: 'pending',
    },
    {
      id: 'lv_8833',
      employee: 'Grace Whitlock',
      initials: 'GW',
      type: 'Sick',
      from: '9 Sep',
      to: '11 Sep',
      days: 3,
      status: 'pending',
    },
    {
      id: 'lv_8834',
      employee: 'Idris Mensah',
      initials: 'IM',
      type: 'Annual',
      from: '14 Oct',
      to: '18 Oct',
      days: 5,
      status: 'pending',
    },
  ],
  headcount: [
    { department: 'Engineering', count: 486 },
    { department: 'Sales', count: 271 },
    { department: 'Operations', count: 208 },
    { department: 'Customer Success', count: 154 },
    { department: 'Finance', count: 87 },
    { department: 'People Ops', count: 78 },
  ],
  onboarding: [
    { name: 'Lena Fitzgerald', initials: 'LF', startsIn: 2, role: 'Product Designer' },
    { name: 'Mateo Cabrera', initials: 'MC', startsIn: 5, role: 'Account Executive' },
    { name: 'Hana Suzuki', initials: 'HS', startsIn: 12, role: 'Data Analyst' },
  ],
}
