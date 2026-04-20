import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { getAllCheckouts } from '../api/checkoutApi'
import { getUsers } from '../api/userApi'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import type { CheckoutItem } from '../types/checkout'
import type { ManagedUser } from '../types/user'
import { getRoleLabel, isCheckoutOverdue } from '../utils/presentation'
import {
  getEnumSearchParam,
  getTextSearchParam,
  setMergedSearchParams,
  toggleSortSearchParams,
} from '../utils/searchParams'

interface UserSummaryCard extends ManagedUser {
  totalCheckouts: number
  activeCheckouts: number
  overdueCheckouts: number
  closedCheckouts: number
}

type UserSortField =
  | 'name'
  | 'role'
  | 'activeCheckouts'
  | 'overdueCheckouts'
  | 'totalCheckouts'
  | 'closedCheckouts'

function UsersPage() {
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const [users, setUsers] = useState<UserSummaryCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const searchQuery = getTextSearchParam(searchParams, 'search')
  const roleFilter = getEnumSearchParam(
    searchParams,
    'role',
    ['all', 'Admin', 'User'] as const,
    'all',
  )
  const sortField = getEnumSearchParam(
    searchParams,
    'sort',
    ['name', 'role', 'activeCheckouts', 'overdueCheckouts', 'totalCheckouts', 'closedCheckouts'] as const,
    'name',
  )
  const sortDirection = getEnumSearchParam(searchParams, 'dir', ['asc', 'desc'] as const, 'asc')

  useEffect(() => {
    async function loadUsers() {
      try {
        setErrorMessage('')
        const [allUsers, allCheckouts] = await Promise.all([getUsers(), getAllCheckouts()])

        const userCards = allUsers.map((candidate) =>
          buildUserSummary(candidate, allCheckouts),
        )

        setUsers(userCards)
      } catch (error: any) {
        const apiMessage = error?.response?.data?.message || t.users.loadError
        setErrorMessage(apiMessage)
      } finally {
        setIsLoading(false)
      }
    }

    void loadUsers()
  }, [t.users.loadError])

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    const result = users.filter((candidate) => {
      const matchesRole = roleFilter === 'all' ? true : candidate.role === roleFilter

      if (normalizedQuery.length === 0) {
        return matchesRole
      }

      return (
        matchesRole &&
        [candidate.name, candidate.email].join(' ').toLowerCase().includes(normalizedQuery)
      )
    })

    result.sort((left, right) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1

      switch (sortField) {
        case 'role':
          return (
            getRoleLabel(left.role, language).localeCompare(getRoleLabel(right.role, language)) *
            multiplier
          )
        case 'activeCheckouts':
          return (
            (left.activeCheckouts - right.activeCheckouts) * multiplier ||
            left.name.localeCompare(right.name, language)
          )
        case 'overdueCheckouts':
          return (
            (left.overdueCheckouts - right.overdueCheckouts) * multiplier ||
            left.name.localeCompare(right.name, language)
          )
        case 'totalCheckouts':
          return (
            (left.totalCheckouts - right.totalCheckouts) * multiplier ||
            left.name.localeCompare(right.name, language)
          )
        case 'closedCheckouts':
          return (
            (left.closedCheckouts - right.closedCheckouts) * multiplier ||
            left.name.localeCompare(right.name, language)
          )
        case 'name':
        default:
          return left.name.localeCompare(right.name, language) * multiplier
      }
    })

    return result
  }, [language, roleFilter, searchQuery, sortDirection, sortField, users])

  const adminCount = users.filter((candidate) => candidate.role === 'Admin').length
  const activeCheckouts = users.reduce((sum, candidate) => sum + candidate.activeCheckouts, 0)
  function resetFilters() {
    setMergedSearchParams(setSearchParams, {
      search: null,
      role: null,
      sort: null,
      dir: null,
    })
  }

  function renderSortableHeading(field: UserSortField, label: string) {
    const isActive = sortField === field
    const icon = !isActive ? '↕' : sortDirection === 'asc' ? '↑' : '↓'

    return (
      <button
        type="button"
        className="data-list__sort-button"
        onClick={() => toggleSortSearchParams(setSearchParams, 'sort', 'dir', field)}
      >
        <span>{label}</span>
        <span className="data-list__sort-icon" aria-hidden="true">
          {icon}
        </span>
      </button>
    )
  }

  if (user?.role !== 'Admin') {
    return <Navigate to="/?reason=forbidden" replace />
  }

  if (isLoading) {
    return <div className="loading-state">{t.users.loading}</div>
  }

  if (errorMessage) {
    return <p className="form-error">{errorMessage}</p>
  }

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="page-hero__content">
          <span className="page-kicker">{t.users.heroKicker}</span>
          <h1 className="page-title">{t.users.heroTitle}</h1>
          <p className="page-subtitle">{t.users.heroText}</p>
        </div>

        <div className="page-hero__panel">
          <span className="page-hero__panel-label">{t.users.panelLabel}</span>
          <strong className="page-hero__panel-value">
            {users.length} {t.users.panelValue}
          </strong>
          <p className="page-hero__panel-text">{t.users.panelText}</p>
        </div>
      </section>

      <section className="stats-grid stats-grid--three">
        <article className="stat-card">
          <span className="stat-card__label">{t.users.totalUsersLabel}</span>
          <strong className="stat-card__value">{users.length}</strong>
          <span className="stat-card__note">{t.users.totalUsersNote}</span>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">{t.users.adminUsersLabel}</span>
          <strong className="stat-card__value">{adminCount}</strong>
          <span className="stat-card__note">{t.users.adminUsersNote}</span>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">{t.users.activeTracked}</span>
          <strong className="stat-card__value">{activeCheckouts}</strong>
          <span className="stat-card__note">{t.users.activeTrackedNote}</span>
        </article>
      </section>

      <section className="section-card section-card--compact filter-panel">
        <div className="filter-panel__grid filter-panel__grid--users">
          <div className="form-field">
            <label htmlFor="users-search">{t.common.search}</label>
            <input
              id="users-search"
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setMergedSearchParams(setSearchParams, {
                  search: event.target.value.trim() ? event.target.value : null,
                })
              }
              placeholder={t.users.searchPlaceholder}
            />
          </div>

          <div className="form-field">
            <label htmlFor="users-role-filter">{t.common.roleFilterLabel}</label>
            <select
              id="users-role-filter"
              value={roleFilter}
              onChange={(event) =>
                setMergedSearchParams(setSearchParams, {
                  role: event.target.value === 'all' ? null : event.target.value,
                })
              }
            >
              <option value="all">{t.common.allRoles}</option>
              <option value="Admin">{getRoleLabel('Admin', language)}</option>
              <option value="User">{getRoleLabel('User', language)}</option>
            </select>
          </div>
        </div>

        <div className="filter-panel__footer">
          <p className="filter-panel__summary">
            {filteredUsers.length} / {users.length}
          </p>
          <button type="button" className="button-secondary" onClick={resetFilters}>
            {t.common.clearFilters}
          </button>
        </div>
      </section>

      {users.length === 0 ? (
        <div className="empty-state">
          <h3>{t.users.emptyTitle}</h3>
          <p>{t.users.emptyText}</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <h3>{t.users.noResultsTitle}</h3>
          <p>{t.users.noResultsText}</p>
        </div>
      ) : (
        <section className="inventory-stack">
          <div className="section-heading section-heading--toolbar">
            <div>
              <span className="section-heading__eyebrow">{t.users.heroKicker}</span>
              <h2 className="section-heading__title">{t.users.heroTitle}</h2>
            </div>
            <div className="section-heading__aside">
              <p className="section-heading__text">{t.users.heroText}</p>
            </div>
          </div>

          <div className="data-list data-list--users">
            <div className="data-list__header">
              <span className="data-list__heading">{renderSortableHeading('name', t.common.user)}</span>
              <span className="data-list__heading">{renderSortableHeading('role', t.profile.roleLabel)}</span>
              <span className="data-list__heading">{renderSortableHeading('activeCheckouts', t.users.activeCheckoutsLabel)}</span>
              <span className="data-list__heading">{renderSortableHeading('overdueCheckouts', t.users.overdueCheckoutsLabel)}</span>
              <span className="data-list__heading">{renderSortableHeading('totalCheckouts', t.users.totalCheckoutsLabel)}</span>
              <span className="data-list__heading">{renderSortableHeading('closedCheckouts', t.users.closedCheckoutsLabel)}</span>
            </div>

            {filteredUsers.map((candidate) => (
              <article key={candidate.id} className="data-list__row">
                <div className="data-list__cell data-list__cell--primary">
                  <div className="data-list__context-stack">
                    <Link
                      to={`/users/${candidate.id}`}
                      className="context-link context-link--stack"
                    >
                      <strong className="data-list__context-name context-link__primary">
                        {candidate.name}
                      </strong>
                    </Link>
                    <span className="data-list__context-value">{candidate.email}</span>
                  </div>
                </div>

                <div className="data-list__cell">
                  <span className="data-list__mobile-label">{t.profile.roleLabel}</span>
                  <span className="data-list__value">{getRoleLabel(candidate.role, language)}</span>
                </div>

                <div className="data-list__cell">
                  <span className="data-list__mobile-label">
                    {t.users.activeCheckoutsLabel}
                  </span>
                  <span className="data-list__value">{candidate.activeCheckouts}</span>
                </div>

                <div className="data-list__cell">
                  <span className="data-list__mobile-label">
                    {t.users.overdueCheckoutsLabel}
                  </span>
                  <span className="data-list__value">{candidate.overdueCheckouts}</span>
                </div>

                <div className="data-list__cell">
                  <span className="data-list__mobile-label">
                    {t.users.totalCheckoutsLabel}
                  </span>
                  <span className="data-list__value">{candidate.totalCheckouts}</span>
                </div>

                <div className="data-list__cell">
                  <span className="data-list__mobile-label">
                    {t.users.closedCheckoutsLabel}
                  </span>
                  <span className="data-list__value">{candidate.closedCheckouts}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function buildUserSummary(user: ManagedUser, allCheckouts: CheckoutItem[]): UserSummaryCard {
  const userCheckouts = allCheckouts.filter((checkout) => checkout.user.id === user.id)
  const activeCheckouts = userCheckouts.filter((checkout) => !checkout.returnedAt).length
  const overdueCheckouts = userCheckouts.filter((checkout) =>
    isCheckoutOverdue(checkout.dueAt, checkout.returnedAt),
  ).length
  const closedCheckouts = userCheckouts.filter((checkout) => !!checkout.returnedAt).length

  return {
    ...user,
    totalCheckouts: userCheckouts.length,
    activeCheckouts,
    overdueCheckouts,
    closedCheckouts,
  }
}

export default UsersPage
