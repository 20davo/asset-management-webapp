import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { getAllCheckouts } from '../api/checkoutApi'
import { getUsers } from '../api/userApi'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import type { CheckoutItem } from '../types/checkout'
import type { ManagedUser } from '../types/user'
import { isCheckoutOverdue } from '../utils/presentation'

interface UserSummaryCard extends ManagedUser {
  totalCheckouts: number
  activeCheckouts: number
  overdueCheckouts: number
  closedCheckouts: number
}

function UsersPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [users, setUsers] = useState<UserSummaryCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'activity'>('name')

  useEffect(() => {
    async function loadUsers() {
      try {
        setErrorMessage('')
        const [allUsers, allCheckouts] = await Promise.all([getUsers(), getAllCheckouts()])

        const regularUsers = allUsers.filter((candidate) => candidate.role === 'User')
        const userCards = regularUsers.map((candidate) =>
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
      if (normalizedQuery.length === 0) {
        return true
      }

      return [candidate.name, candidate.email].join(' ').toLowerCase().includes(normalizedQuery)
    })

    result.sort((left, right) => {
      if (sortBy === 'activity') {
        return right.activeCheckouts - left.activeCheckouts || left.name.localeCompare(right.name)
      }

      return left.name.localeCompare(right.name)
    })

    return result
  }, [searchQuery, sortBy, users])

  const totalCheckouts = users.reduce((sum, candidate) => sum + candidate.totalCheckouts, 0)
  const activeCheckouts = users.reduce((sum, candidate) => sum + candidate.activeCheckouts, 0)
  const overdueCheckouts = users.reduce((sum, candidate) => sum + candidate.overdueCheckouts, 0)

  function resetFilters() {
    setSearchQuery('')
    setSortBy('name')
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
          <span className="stat-card__label">{t.users.totalTracked}</span>
          <strong className="stat-card__value">{totalCheckouts}</strong>
          <span className="stat-card__note">{t.users.totalTrackedNote}</span>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">{t.users.activeTracked}</span>
          <strong className="stat-card__value">{activeCheckouts}</strong>
          <span className="stat-card__note">{t.users.activeTrackedNote}</span>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">{t.users.overdueTracked}</span>
          <strong className="stat-card__value">{overdueCheckouts}</strong>
          <span className="stat-card__note">{t.users.overdueTrackedNote}</span>
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
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t.users.searchPlaceholder}
            />
          </div>

          <div className="form-field">
            <label htmlFor="users-sort">{t.users.sortLabel}</label>
            <select
              id="users-sort"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as 'name' | 'activity')}
            >
              <option value="name">{t.users.sortByName}</option>
              <option value="activity">{t.users.sortByActivity}</option>
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
              <span className="data-list__heading">{t.common.user}</span>
              <span className="data-list__heading">{t.users.activeCheckoutsLabel}</span>
              <span className="data-list__heading">{t.users.overdueCheckoutsLabel}</span>
              <span className="data-list__heading">{t.users.totalCheckoutsLabel}</span>
              <span className="data-list__heading">{t.users.closedCheckoutsLabel}</span>
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
