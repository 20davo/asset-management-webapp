import type { Language } from '../context/LanguageContext'
import type { UserRole } from '../types/auth'

function getLocale(language: Language) {
  return language === 'en' ? 'en-US' : 'hu-HU'
}

export function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'Available':
      return 'status-badge status-badge--available'
    case 'CheckedOut':
      return 'status-badge status-badge--checkedout'
    case 'Maintenance':
      return 'status-badge status-badge--maintenance'
    default:
      return 'status-badge'
  }
}

export function getStatusLabel(status: string, language: Language = 'hu') {
  const labels = {
    hu: {
      Available: 'Elérhető',
      CheckedOut: 'Kikérve',
      Maintenance: 'Karbantartás',
    },
    en: {
      Available: 'Available',
      CheckedOut: 'Checked out',
      Maintenance: 'Maintenance',
    },
  } as const

  return labels[language][status as keyof (typeof labels)[Language]] ?? status
}

export function getRoleLabel(role: UserRole | string, language: Language = 'hu') {
  const labels = {
    hu: {
      Admin: 'Adminisztrátor',
      User: 'Felhasználó',
    },
    en: {
      Admin: 'Administrator',
      User: 'User',
    },
  } as const

  return labels[language][role as keyof (typeof labels)[Language]] ?? role
}

export function formatDate(value: string, language: Language = 'hu') {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return language === 'en' ? 'Unknown date' : 'Ismeretlen dátum'
  }

  return new Intl.DateTimeFormat(getLocale(language), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatDateTime(value: string, language: Language = 'hu') {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return language === 'en' ? 'Unknown timestamp' : 'Ismeretlen időpont'
  }

  return new Intl.DateTimeFormat(getLocale(language), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function isCheckoutOverdue(dueAt: string, returnedAt: string | null) {
  if (returnedAt) {
    return false
  }

  return new Date(dueAt).getTime() < Date.now()
}

export function isCheckoutDueSoon(
  dueAt: string,
  returnedAt: string | null,
  warningWindowHours = 48,
) {
  if (returnedAt) {
    return false
  }

  const dueTime = new Date(dueAt).getTime()

  if (Number.isNaN(dueTime) || dueTime < Date.now()) {
    return false
  }

  const warningWindowMs = warningWindowHours * 60 * 60 * 1000
  return dueTime - Date.now() <= warningWindowMs
}
