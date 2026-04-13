import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { getAllCheckouts } from '../api/checkoutApi'
import { ProtectedAssetImage } from '../components/ProtectedAssetImage'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import type { CheckoutItem } from '../types/checkout'
import {
  formatDateTime,
  getStatusBadgeClass,
  getStatusLabel,
  isCheckoutDueSoon,
  isCheckoutOverdue,
} from '../utils/presentation'

type CheckoutFilter = 'all' | 'active' | 'overdue' | 'closed'
type CheckoutSort = 'recent' | 'dueSoon' | 'dueLate'

function getCheckoutState(checkout: CheckoutItem): Exclude<CheckoutFilter, 'all'> {
  if (checkout.returnedAt) {
    return 'closed'
  }

  if (isCheckoutOverdue(checkout.dueAt, checkout.returnedAt)) {
    return 'overdue'
  }

  return 'active'
}

function getCheckoutTimelineState(checkout: CheckoutItem) {
  if (isCheckoutOverdue(checkout.dueAt, checkout.returnedAt)) {
    return {
      pillClass: 'timeline-pill timeline-pill--danger',
      pillLabel: 'overdue',
    }
  }

  if (isCheckoutDueSoon(checkout.dueAt, checkout.returnedAt)) {
    return {
      pillClass: 'timeline-pill timeline-pill--warning',
      pillLabel: 'dueSoon',
    }
  }

  return null
}

function AllCheckoutsPage() {
  const { user } = useAuth()
  const { language, t } = useLanguage()

  const [checkouts, setCheckouts] = useState<CheckoutItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [checkoutView, setCheckoutView] = useState<'cards' | 'list'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<CheckoutFilter>('all')
  const [sortBy, setSortBy] = useState<CheckoutSort>('recent')

  useEffect(() => {
    async function loadCheckouts() {
      try {
        setErrorMessage('')
        const data = await getAllCheckouts()
        setCheckouts(data)
      } catch (error: any) {
        const apiMessage = error?.response?.data?.message || t.checkouts.loadError
        setErrorMessage(apiMessage)
      } finally {
        setIsLoading(false)
      }
    }

    void loadCheckouts()
  }, [t.checkouts.loadError])

  const activeCount = checkouts.filter((checkout) => !checkout.returnedAt).length
  const overdueCount = checkouts.filter((checkout) =>
    isCheckoutOverdue(checkout.dueAt, checkout.returnedAt),
  ).length
  const returnedCount = checkouts.filter((checkout) => !!checkout.returnedAt).length

  const filteredCheckouts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    const result = checkouts.filter((checkout) => {
      const checkoutState = getCheckoutState(checkout)
      const matchesStatus =
        statusFilter === 'all' ? true : checkoutState === statusFilter

      const matchesSearch =
        normalizedQuery.length === 0
          ? true
          : [
              checkout.equipment.name,
              checkout.equipment.category,
              checkout.equipment.serialNumber,
              checkout.user.name,
              checkout.user.email,
              checkout.note ?? '',
            ]
              .join(' ')
              .toLowerCase()
              .includes(normalizedQuery)

      return matchesStatus && matchesSearch
    })

    result.sort((left, right) => {
      switch (sortBy) {
        case 'dueSoon':
          return new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime()
        case 'dueLate':
          return new Date(right.dueAt).getTime() - new Date(left.dueAt).getTime()
        case 'recent':
        default:
          return (
            new Date(right.checkedOutAt).getTime() - new Date(left.checkedOutAt).getTime()
          )
      }
    })

    return result
  }, [checkouts, searchQuery, sortBy, statusFilter])

  function resetFilters() {
    setSearchQuery('')
    setStatusFilter('all')
    setSortBy('recent')
  }

  function renderEquipmentMedia(imageUrl: string | null | undefined, name: string) {
    return (
      <div className="equipment-card__media">
        <ProtectedAssetImage
          imageUrl={imageUrl}
          alt={name}
          className="equipment-card__image"
          placeholderClassName="equipment-card__image-placeholder"
          placeholderText={t.common.noImage}
        />
      </div>
    )
  }

  function renderCheckoutViewSwitch() {
    return (
      <div className="view-switch" role="group" aria-label={t.common.view}>
        <button
          type="button"
          className={`view-switch__button ${
            checkoutView === 'cards' ? 'view-switch__button--active' : ''
          }`}
          onClick={() => setCheckoutView('cards')}
        >
          {t.common.cardsView}
        </button>
        <button
          type="button"
          className={`view-switch__button ${
            checkoutView === 'list' ? 'view-switch__button--active' : ''
          }`}
          onClick={() => setCheckoutView('list')}
        >
          {t.common.listView}
        </button>
      </div>
    )
  }

  if (user?.role !== 'Admin') {
    return <Navigate to="/?reason=forbidden" replace />
  }

  if (isLoading) {
    return <div className="loading-state">{t.checkouts.loading}</div>
  }

  if (errorMessage) {
    return <p className="form-error">{errorMessage}</p>
  }

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="page-hero__content">
          <span className="page-kicker">{t.checkouts.allHeroKicker}</span>
          <h1 className="page-title">{t.checkouts.allHeroTitle}</h1>
          <p className="page-subtitle">{t.checkouts.allHeroText}</p>
        </div>

        <div className="page-hero__panel">
          <span className="page-hero__panel-label">{t.checkouts.activeState}</span>
          <strong className="page-hero__panel-value">
            {activeCount} {t.checkouts.openCount}
          </strong>
          <p className="page-hero__panel-text">
            {overdueCount > 0
              ? overdueCount === 1
                ? t.checkouts.overdueSummarySingle
                : t.checkouts.overdueSummary(overdueCount)
              : t.checkouts.noOverdue}
          </p>
        </div>
      </section>

      <section className="stats-grid stats-grid--three">
        <article className="stat-card">
          <span className="stat-card__label">{t.checkouts.active}</span>
          <strong className="stat-card__value">{activeCount}</strong>
          <span className="stat-card__note">{t.checkouts.activeNote}</span>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">{t.checkouts.overdue}</span>
          <strong className="stat-card__value">{overdueCount}</strong>
          <span className="stat-card__note">{t.checkouts.overdueNote}</span>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">{t.checkouts.closed}</span>
          <strong className="stat-card__value">{returnedCount}</strong>
          <span className="stat-card__note">{t.checkouts.closedNote}</span>
        </article>
      </section>

      <section className="section-card section-card--compact filter-panel">
        <div className="filter-panel__grid">
          <div className="form-field">
            <label htmlFor="all-checkouts-search">{t.common.search}</label>
            <input
              id="all-checkouts-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t.checkouts.allSearchPlaceholder}
            />
          </div>

          <div className="form-field">
            <label htmlFor="all-checkouts-status-filter">
              {t.checkouts.statusFilterLabel}
            </label>
            <select
              id="all-checkouts-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as CheckoutFilter)}
            >
              <option value="all">{t.checkouts.filterAll}</option>
              <option value="active">{t.checkouts.filterActive}</option>
              <option value="overdue">{t.checkouts.filterOverdue}</option>
              <option value="closed">{t.checkouts.filterClosed}</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="all-checkouts-sort">{t.checkouts.sortByLabel}</label>
            <select
              id="all-checkouts-sort"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as CheckoutSort)}
            >
              <option value="recent">{t.checkouts.sortRecent}</option>
              <option value="dueSoon">{t.checkouts.sortDueSoon}</option>
              <option value="dueLate">{t.checkouts.sortDueLate}</option>
            </select>
          </div>
        </div>

        <div className="filter-panel__footer">
          <p className="filter-panel__summary">
            {filteredCheckouts.length} / {checkouts.length}
          </p>
          <button type="button" className="button-secondary" onClick={resetFilters}>
            {t.common.clearFilters}
          </button>
        </div>
      </section>

      {checkouts.length === 0 ? (
        <div className="empty-state">
          <h3>{t.checkouts.allEmptyTitle}</h3>
          <p>{t.checkouts.allEmptyText}</p>
        </div>
      ) : filteredCheckouts.length === 0 ? (
        <div className="empty-state">
          <h3>{t.checkouts.noResultsTitle}</h3>
          <p>{t.checkouts.noResultsText}</p>
        </div>
      ) : checkoutView === 'list' ? (
        <section className="inventory-stack">
          <div className="section-heading section-heading--toolbar">
            <div>
              <span className="section-heading__eyebrow">{t.checkouts.allHeroKicker}</span>
              <h2 className="section-heading__title">{t.checkouts.allHeroTitle}</h2>
            </div>
            <div className="section-heading__aside">
              <p className="section-heading__text">{t.checkouts.allHeroText}</p>
              {renderCheckoutViewSwitch()}
            </div>
          </div>

          <div className="data-list data-list--checkouts">
            <div className="data-list__header">
              <span className="data-list__heading">{t.common.asset}</span>
              <span className="data-list__heading">{t.common.user}</span>
              <span className="data-list__heading">{t.common.status}</span>
              <span className="data-list__heading">{t.checkouts.checkedOutAt}</span>
              <span className="data-list__heading">{t.checkouts.dueAt}</span>
              <span className="data-list__heading">{t.checkouts.returnedAt}</span>
            </div>

            {filteredCheckouts.map((checkout) => {
              const overdue = isCheckoutOverdue(checkout.dueAt, checkout.returnedAt)
              const timelineState = getCheckoutTimelineState(checkout)

              return (
                <article
                  key={checkout.id}
                  className={`data-list__row ${overdue ? 'data-list__row--overdue' : ''}`}
                >
                  <div className="data-list__cell data-list__cell--primary">
                    <div className="data-list__asset">
                      <div className="data-list__thumb">
                        <ProtectedAssetImage
                          imageUrl={checkout.equipment.imageUrl}
                          alt={checkout.equipment.name}
                          className="data-list__thumb-image"
                          placeholderClassName="data-list__thumb-placeholder"
                          placeholderText={t.common.noImage}
                        />
                      </div>

                      <div className="data-list__asset-copy">
                        <Link
                          to={`/equipment/${checkout.equipment.id}`}
                          className="context-link"
                        >
                          <strong className="data-list__primary-text context-link__primary">
                            {checkout.equipment.name}
                          </strong>
                        </Link>
                        <span className="data-list__secondary-text">
                          {checkout.equipment.category} SN {checkout.equipment.serialNumber}
                        </span>
                        <span className="data-list__tertiary-text">
                          {checkout.note || t.checkouts.noNote}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="data-list__cell">
                    <span className="data-list__mobile-label">{t.common.user}</span>
                    <Link
                      to={`/users/${checkout.user.id}`}
                      className="context-link context-link--stack"
                    >
                      <strong className="data-list__context-name context-link__primary">
                        {checkout.user.name}
                      </strong>
                    </Link>
                    <span className="data-list__context-value">{checkout.user.email}</span>
                  </div>

                    <div className="data-list__cell">
                      <span className="data-list__mobile-label">{t.common.status}</span>
                      <div className="data-list__status-stack">
                        <span className={getStatusBadgeClass(checkout.equipment.status)}>
                          {getStatusLabel(checkout.equipment.status, language)}
                        </span>
                        {timelineState && (
                          <span className={timelineState.pillClass}>
                            {timelineState.pillLabel === 'overdue'
                              ? t.checkouts.overdueBadge
                              : t.checkouts.dueSoonBadge}
                          </span>
                        )}
                      </div>
                    </div>

                  <div className="data-list__cell">
                    <span className="data-list__mobile-label">
                      {t.checkouts.checkedOutAt}
                    </span>
                    <span className="data-list__value">
                      {formatDateTime(checkout.checkedOutAt, language)}
                    </span>
                  </div>

                  <div className="data-list__cell">
                    <span className="data-list__mobile-label">{t.checkouts.dueAt}</span>
                    <span className="data-list__value">
                      {formatDateTime(checkout.dueAt, language)}
                    </span>
                  </div>

                  <div className="data-list__cell">
                    <span className="data-list__mobile-label">{t.checkouts.returnedAt}</span>
                    <span className="data-list__value">
                      {checkout.returnedAt
                        ? formatDateTime(checkout.returnedAt, language)
                        : t.checkouts.notClosed}
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : (
        <section className="inventory-stack">
          <div className="section-heading section-heading--toolbar">
            <div>
              <span className="section-heading__eyebrow">{t.checkouts.allHeroKicker}</span>
              <h2 className="section-heading__title">{t.checkouts.allHeroTitle}</h2>
            </div>
            <div className="section-heading__aside">
              <p className="section-heading__text">{t.checkouts.allHeroText}</p>
              {renderCheckoutViewSwitch()}
            </div>
          </div>

          <div className="equipment-list">
            {filteredCheckouts.map((checkout) => {
              const overdue = isCheckoutOverdue(checkout.dueAt, checkout.returnedAt)
              const timelineState = getCheckoutTimelineState(checkout)

              return (
                <article
                  key={checkout.id}
                  className={`equipment-card ${overdue ? 'equipment-card--overdue' : ''}`}
                >
                  <div className="equipment-card__layout equipment-card__layout--media-first">
                    {renderEquipmentMedia(
                      checkout.equipment.imageUrl,
                      checkout.equipment.name,
                    )}

                    <div className="equipment-card__main">
                      <div className="equipment-card__eyebrow">
                        <span className="equipment-card__serial">
                          SN {checkout.equipment.serialNumber}
                        </span>
                        <span className={getStatusBadgeClass(checkout.equipment.status)}>
                          {getStatusLabel(checkout.equipment.status, language)}
                        </span>
                      </div>

                      <div className="equipment-card__header">
                        <div className="equipment-card__title-group">
                          <Link
                            to={`/equipment/${checkout.equipment.id}`}
                            className="context-link"
                          >
                            <h3 className="equipment-card__title-small context-link__primary">
                              {checkout.equipment.name}
                            </h3>
                          </Link>
                          <div className="equipment-card__signal-row">
                            <span className="timeline-pill">{checkout.equipment.category}</span>
                            {timelineState && (
                              <span className={timelineState.pillClass}>
                                {timelineState.pillLabel === 'overdue'
                                  ? t.checkouts.overdueBadge
                                  : t.checkouts.dueSoonBadge}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="inventory-status-context">
                        <span className="inventory-status-context__label">
                          {t.common.user}
                        </span>
                        <Link to={`/users/${checkout.user.id}`} className="context-link">
                          <strong className="inventory-status-context__value context-link__primary">
                            {checkout.user.name}
                          </strong>
                        </Link>
                        <span className="inventory-status-context__meta">
                          {checkout.user.email}
                        </span>
                      </div>

                      <div className="equipment-meta">
                        <div className="equipment-meta__item">
                          <span className="equipment-meta__label">
                            {t.checkouts.checkedOutAt}
                          </span>
                          <span className="equipment-meta__value">
                            {formatDateTime(checkout.checkedOutAt, language)}
                          </span>
                        </div>

                        <div className="equipment-meta__item">
                          <span className="equipment-meta__label">{t.checkouts.dueAt}</span>
                          <span className="equipment-meta__value">
                            {formatDateTime(checkout.dueAt, language)}
                          </span>
                        </div>

                        <div className="equipment-meta__item">
                          <span className="equipment-meta__label">{t.checkouts.returnedAt}</span>
                          <span className="equipment-meta__value">
                            {checkout.returnedAt
                              ? formatDateTime(checkout.returnedAt, language)
                              : t.checkouts.notClosed}
                          </span>
                        </div>
                      </div>

                      {timelineState?.pillLabel === 'overdue' && (
                        <p className="form-error">{t.checkouts.overdueAlert}</p>
                      )}

                      {timelineState?.pillLabel === 'dueSoon' && (
                        <p className="timeline-note timeline-note--warning">
                          {t.checkouts.dueSoonAlert}
                        </p>
                      )}

                      {checkout.note && (
                        <div className="equipment-description">
                          <span className="equipment-description__label">
                            {t.checkouts.note}
                          </span>
                          <p className="equipment-description__text">{checkout.note}</p>
                        </div>
                      )}

                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

export default AllCheckoutsPage
