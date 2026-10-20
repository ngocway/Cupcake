export type FrequencyTag = "DAILY" | "WEEKLY" | "AT_RISK" | "DORMANT" | "NEW"

export interface EnhancedAdminUser {
  id: string
  name: string | null
  email: string
  role: string | null
  createdAt: Date
  isBlocked: boolean
  activeDays30: number
  frequencyTag: FrequencyTag
  lastActiveAt: Date | null
  streak: number
  recent7Days: {
    dayLabel: string
    dateStr: string
    active: boolean
  }[]
  totalSubmissions: number
}
