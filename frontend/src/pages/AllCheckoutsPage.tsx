import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { getAllCheckouts } from '../api/checkoutApi'
import { CheckoutLogFilters } from '../components/checkout/CheckoutLogFilters'
import { ProtectedAssetImage } from '../components/media/ProtectedAssetImage'
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
import { getApiErrorMessage } from '../utils/apiErrors'
import {
  getEnumSearchParam,
  getTextSearchParam,
  setMergedSearchParams,
  toggleSortSearchParams,
} from '../utils/searchParams'

type CheckoutFilter = 'all' | 'active' | 'closed'
type WarningFilter = 'all' | 'none' | 'dueSoon' | 'overdue'
type CheckoutSortField =
  | 'asset'
  | 'user'
  | 'status'
  | 'checkedOutAt'
  | 'dueAt'
  | 'returnedAt'

function getCheckoutState(checkout: CheckoutItem): Exclude<CheckoutFilter, 'all'> {
  if (checkout.returnedAt) {
    return 'closed'
  }

  return 'active'
}

function getCheckoutTimelineState(checkout: CheckoutItem) {
  if (isCheckoutOverdue(checkout.dueAt, checkout.returnedAt)) {
    return {
      alertClass: 'deadline-flag deadline-flag--danger',
      alertLabel: 'overdue',
    }
  }

  if (isCheckoutDueSoon(checkout.dueAt, checkout.returnedAt)) {
    return {
      alertClass: 'deadline-flag deadline-flag--warning',
      alertLabel: 'dueSoon',
    }
  }

  return null
}

function getCheckoutWarningState(checkout: CheckoutItem): Exclude<WarningFilter, 'all'> {
  if (isCheckoutOverdue(checkout.dueAt, checkout.returnedAt)) {
    return 'overdue'
  }

  if (isCheckoutDueSoon(checkout.dueAt, checkout.returnedAt)) {
    return 'dueSoon'
  }

  return 'none'
}

function AllCheckoutsPage() {
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()

  const [checkouts, setCheckouts] = useState<CheckoutItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const checkoutView = getEnumSearchParam(
    searchParams,
    'view',
    ['cards', 'list'] as const,
    'list',
  )
  const searchQuery = getTextSearchParam(searchParams, 'search')
  const statusFilter = getEnumSearchParam(
    searchParams,
    'state',
    ['all', 'active', 'closed'] as const,
    'all',
  )
  const warningFilter = getEnumSearchParam(
    searchParams,
    'warning',
    ['all', 'none', 'dueSoon', 'overdue'] as const,
    'all',
  )
  const sortField = getEnumSearchParam(
    searchParams,
    'sort',
    ['asset', 'user', 'status', 'checkedOutAt', 'dueAt', 'returnedAt'] as const,
    'checkedOutAt',
  )
  const sortDirection = getEnumSearchParam(searchParams, 'dir', ['asc', 'desc'] as const, 'desc')

  useEffect(() => {
    async function loadCheckouts() {
      try {
        setErrorMessage('')
        const data = await getAllCheckouts()
        setCheckouts(data)
      } catch (error: unknown) {
        setErrorMessage(getApiErrorMessage(error, t.checkouts.loadError, language))
      } finally {
        setIsLoading(false)
      }
    }

    void loadCheckouts()
  }, [language, t.checkouts.loadError])

  const activeCount = checkouts.filter((checkout) => !checkout.returnedAt).length
  const overdueCount = checkouts.filter((checkout) =>
    isCheckoutOverdue(checkout.dueAt, checkout.returnedAt),
  ).length
  const returnedCount = checkouts.filter((checkout) => !!checkout.returnedAt).length

  const filteredCheckouts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

      const result = checkouts.filter((checkout) => {
        const checkoutState = getCheckoutState(checkout)
        const warningState = getCheckoutWarningState(checkout)
      const matchesStatus =
        statusFilter === 'all' ? true : checkoutState === statusFilter
      const matchesWarning =
        statusFilter !== 'active' || warningFilter === 'all'
          ? true
          : warningState === warningFilter

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

      return matchesStatus && matchesSearch && matchesWarning
    })

    result.sort((left, right) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1

      switch (sortField) {
        case 'asset':
          return left.equipment.name.localeCompare(right.equipment.name, language) * multiplier
        case 'user':
          return left.user.name.localeCompare(right.user.name, language) * multiplier
        case 'status':
          return (
            getStatusLabel(left.equipment.status, language).localeCompare(
              getStatusLabel(right.equipment.status, language),
              language,
            ) * multiplier
          )
        case 'dueAt':
          return (new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime()) * multiplier
        case 'returnedAt': {
          const leftTime = left.returnedAt ? new Date(left.returnedAt).getTime() : Number.NEGATIVE_INFINITY
          const rightTime = right.returnedAt ? new Date(right.returnedAt).getTime() : Number.NEGATIVE_INFINITY
          return (leftTime - rightTime) * multiplier
        }
        case 'checkedOutAt':
        default:
          return (
            (new Date(left.checkedOutAt).getTime() - new Date(right.checkedOutAt).getTime()) *
            multiplier
          )
      }
    })

    return result
  }, [checkouts, language, searchQuery, sortDirection, sortField, statusFilter, warningFilter])

  function resetFilters() {
    setMergedSearchParams(setSearchParams, {
      search: null,
      state: null,
      warning: null,
      sort: null,
      dir: null,
      view: null,
    })
  }

  function renderSortableHeading(field: CheckoutSortField, label: string) {
    const isActive = sortField === field
    const icon = !isActive ? '↕' : sortDirection === 'asc' ? '↑' : '↓'

    return (
      <button
        type="button"
        className="data-list__sort-button"
        onClick={() => toggleSortSearchParams(setSearchParams, 'sort', 'dir', field, field === 'checkedOutAt' ? 'desc' : 'asc')}
      >
        <span>{label}</span>
        <span className="data-list__sort-icon" aria-hidden="true">
          {icon}
        </span>
      </button>
    )
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
          onClick={() =>
            setMergedSearchParams(setSearchParams, {
              view: 'cards',
            })
          }
        >
          {t.common.cardsView}
        </button>
        <button
          type="button"
          className={`view-switch__button ${
            checkoutView === 'list' ? 'view-switch__button--active' : ''
          }`}
          onClick={() =>
            setMergedSearchParams(setSearchParams, {
              view: null,
            })
          }
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

      <CheckoutLogFilters
        checkoutCount={checkouts.length}
        filteredCount={filteredCheckouts.length}
        onReset={resetFilters}
        onSearchChange={(value) =>
          setMergedSearchParams(setSearchParams, {
            search: value.trim() ? value : null,
          })
        }
        onStateChange={(value) =>
          setMergedSearchParams(setSearchParams, {
            state: value === 'all' ? null : value,
            warning: value === 'active' ? searchParams.get('warning') : null,
          })
        }
        onWarningChange={(value) =>
          setMergedSearchParams(setSearchParams, {
            warning: value === 'all' ? null : value,
          })
        }
        searchQuery={searchQuery}
        stateFilter={statusFilter}
        warningFilter={warningFilter}
      />

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
              <span className="data-list__heading">{renderSortableHeading('asset', t.common.asset)}</span>
              <span className="data-list__heading">{renderSortableHeading('user', t.common.user)}</span>
              <span className="data-list__heading">{renderSortableHeading('status', t.common.status)}</span>
              <span className="data-list__heading">{renderSortableHeading('checkedOutAt', t.checkouts.checkedOutAt)}</span>
              <span className="data-list__heading">{renderSortableHeading('dueAt', t.checkouts.dueAt)}</span>
              <span className="data-list__heading">{renderSortableHeading('returnedAt', t.checkouts.returnedAt)}</span>
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
                        <div className="data-list__title-row">
                          <Link
                            to={`/equipment/${checkout.equipment.id}`}
                            className="context-link"
                          >
                            <strong className="data-list__primary-text context-link__primary">
                              {checkout.equipment.name}
                            </strong>
                          </Link>
                          {timelineState && (
                            <span className={timelineState.alertClass}>
                              {timelineState.alertLabel === 'overdue'
                                ? t.checkouts.overdueBadge
                                : t.checkouts.dueSoonBadge}
                            </span>
                          )}
                        </div>
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
                      <div className="equipment-card__header">
                        <div className="equipment-card__title-group">
                          <div className="equipment-card__title-row">
                            <Link
                              to={`/equipment/${checkout.equipment.id}`}
                              className="context-link"
                            >
                              <h3 className="equipment-card__title-small context-link__primary">
                                {checkout.equipment.name}
                              </h3>
                            </Link>
                            {timelineState && (
                              <span className={timelineState.alertClass}>
                                {timelineState.alertLabel === 'overdue'
                                  ? t.checkouts.overdueBadge
                                  : t.checkouts.dueSoonBadge}
                              </span>
                            )}
                          </div>
                          <span className="equipment-card__serial">
                            SN {checkout.equipment.serialNumber}
                          </span>
                          <div className="equipment-card__signal-row">
                            <span className="equipment-category-chip">
                              {checkout.equipment.category}
                            </span>
                          </div>
                        </div>
                        <div className="equipment-card__status-stack">
                          <span className={getStatusBadgeClass(checkout.equipment.status)}>
                            {getStatusLabel(checkout.equipment.status, language)}
                          </span>
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
