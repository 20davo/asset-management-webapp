import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ProtectedAssetImage } from './ProtectedAssetImage'
import { useLanguage } from '../context/LanguageContext'
import type { CheckoutItem } from '../types/checkout'
import {
  formatDateTime,
  getStatusBadgeClass,
  getStatusLabel,
  isCheckoutDueSoon,
  isCheckoutOverdue,
} from '../utils/presentation'
import {
  getEnumSearchParam,
  getTextSearchParam,
  setMergedSearchParams,
} from '../utils/searchParams'

type CheckoutFilter = 'all' | 'active' | 'overdue' | 'closed'
type FilterMode = 'checkout' | 'equipment' | 'none'

interface CheckoutCollectionViewProps {
  items: CheckoutItem[]
  emptyTitle: string
  emptyText: string
  searchPlaceholder: string
  heroKicker: string
  heroTitle: string
  heroText: string
  showUserColumn?: boolean
  getUserLink?: (checkout: CheckoutItem) => string
  linkAssetNameOnly?: boolean
  compact?: boolean
  queryKeyPrefix: string
  filterMode?: FilterMode
}

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
    } as const
  }

  if (isCheckoutDueSoon(checkout.dueAt, checkout.returnedAt)) {
    return {
      pillClass: 'timeline-pill timeline-pill--warning',
      pillLabel: 'dueSoon',
    } as const
  }

  return null
}

export function CheckoutCollectionView({
  items,
  emptyTitle,
  emptyText,
  searchPlaceholder,
  heroKicker,
  heroTitle,
  heroText,
  showUserColumn = false,
  getUserLink,
  linkAssetNameOnly = false,
  compact = false,
  queryKeyPrefix,
  filterMode = 'checkout',
}: CheckoutCollectionViewProps) {
  const { language, t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const checkoutView = getEnumSearchParam(
    searchParams,
    `${queryKeyPrefix}-view`,
    ['cards', 'list'] as const,
    'list',
  )
  const searchQuery = getTextSearchParam(searchParams, `${queryKeyPrefix}-search`)
  const checkoutStateFilter = getEnumSearchParam(
    searchParams,
    `${queryKeyPrefix}-state`,
    ['all', 'active', 'overdue', 'closed'] as const,
    'all',
  )
  const equipmentStatusFilter = getEnumSearchParam(
    searchParams,
    `${queryKeyPrefix}-status`,
    ['all', 'Available', 'CheckedOut', 'Maintenance'] as const,
    'all',
  )
  const sortBy = getEnumSearchParam(
    searchParams,
    `${queryKeyPrefix}-sort`,
    ['recent', 'dueSoon', 'dueLate'] as const,
    'recent',
  )

  const activeCount = items.filter((checkout) => !checkout.returnedAt).length
  const overdueCount = items.filter((checkout) =>
    isCheckoutOverdue(checkout.dueAt, checkout.returnedAt),
  ).length
  const returnedCount = items.filter((checkout) => !!checkout.returnedAt).length

  const filteredCheckouts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    const result = items.filter((checkout) => {
      const checkoutState = getCheckoutState(checkout)
      const matchesFilter =
        filterMode === 'checkout'
          ? checkoutStateFilter === 'all'
            ? true
            : checkoutState === checkoutStateFilter
          : filterMode === 'equipment'
            ? equipmentStatusFilter === 'all'
              ? true
              : checkout.equipment.status === equipmentStatusFilter
            : true

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

      return matchesFilter && matchesSearch
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
  }, [checkoutStateFilter, equipmentStatusFilter, filterMode, items, searchQuery, sortBy])

  function resetFilters() {
    setMergedSearchParams(setSearchParams, {
      [`${queryKeyPrefix}-search`]: null,
      [`${queryKeyPrefix}-state`]: null,
      [`${queryKeyPrefix}-status`]: null,
      [`${queryKeyPrefix}-sort`]: null,
      [`${queryKeyPrefix}-view`]: null,
    })
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
              [`${queryKeyPrefix}-view`]: 'cards',
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
              [`${queryKeyPrefix}-view`]: null,
            })
          }
        >
          {t.common.listView}
        </button>
      </div>
    )
  }

  function renderUserBlock(checkout: CheckoutItem) {
    const userLink = getUserLink?.(checkout)
    const content = (
      <>
        <strong className="data-list__context-name context-link__primary">
          {checkout.user.name}
        </strong>
        <span className="data-list__context-label">{checkout.user.email}</span>
      </>
    )

    if (userLink) {
      return (
        <Link to={userLink} className="context-link context-link--stack">
          {content}
        </Link>
      )
    }

    return <div className="data-list__context-stack">{content}</div>
  }

  return (
    <>
      {!compact && (
        <>
          <section className="page-hero">
            <div className="page-hero__content">
              <span className="page-kicker">{heroKicker}</span>
              <h1 className="page-title">{heroTitle}</h1>
              <p className="page-subtitle">{heroText}</p>
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
        </>
      )}

      {items.length === 0 ? (
        <div className="empty-state">
          <h3>{emptyTitle}</h3>
          <p>{emptyText}</p>
        </div>
      ) : (
        <section className="inventory-stack">
          <div className="section-heading section-heading--toolbar">
            <div>
              <span className="section-heading__eyebrow">{heroKicker}</span>
              <h2 className="section-heading__title">{heroTitle}</h2>
            </div>
            <div className="section-heading__aside">
              <p className="section-heading__text">{heroText}</p>
              {renderCheckoutViewSwitch()}
            </div>
          </div>

          <section className="section-card section-card--compact filter-panel">
            <div className="filter-panel__grid filter-panel__grid--checkout">
              <div className="form-field">
                <label htmlFor={`${heroTitle}-search`}>{t.common.search}</label>
                <input
                  id={`${heroTitle}-search`}
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setMergedSearchParams(setSearchParams, {
                      [`${queryKeyPrefix}-search`]: event.target.value.trim()
                        ? event.target.value
                        : null,
                    })
                  }
                  placeholder={searchPlaceholder}
                />
              </div>

              {filterMode !== 'none' && (
                <div className="form-field">
                  <label htmlFor={`${heroTitle}-status-filter`}>
                    {filterMode === 'equipment'
                      ? t.common.status
                      : t.checkouts.statusFilterLabel}
                  </label>
                  <select
                    id={`${heroTitle}-status-filter`}
                    value={
                      filterMode === 'equipment'
                        ? equipmentStatusFilter
                        : checkoutStateFilter
                    }
                    onChange={(event) =>
                      setMergedSearchParams(setSearchParams, {
                        [`${queryKeyPrefix}-state`]:
                          filterMode === 'checkout' && event.target.value !== 'all'
                            ? event.target.value
                            : null,
                        [`${queryKeyPrefix}-status`]:
                          filterMode === 'equipment' && event.target.value !== 'all'
                            ? event.target.value
                            : null,
                      })
                    }
                  >
                    {filterMode === 'checkout' ? (
                      <>
                        <option value="all">{t.checkouts.filterAll}</option>
                        <option value="active">{t.checkouts.filterActive}</option>
                        <option value="overdue">{t.checkouts.filterOverdue}</option>
                        <option value="closed">{t.checkouts.filterClosed}</option>
                      </>
                    ) : (
                      <>
                        <option value="all">{t.inventory.allStatuses}</option>
                        <option value="Available">{t.inventory.available}</option>
                        <option value="CheckedOut">{t.inventory.checkedOut}</option>
                        <option value="Maintenance">{t.inventory.maintenance}</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              <div className="form-field">
                <label htmlFor={`${heroTitle}-sort`}>{t.checkouts.sortByLabel}</label>
                <select
                  id={`${heroTitle}-sort`}
                  value={sortBy}
                  onChange={(event) =>
                    setMergedSearchParams(setSearchParams, {
                      [`${queryKeyPrefix}-sort`]:
                        event.target.value === 'recent' ? null : event.target.value,
                    })
                  }
                >
                  <option value="recent">{t.checkouts.sortRecent}</option>
                  <option value="dueSoon">{t.checkouts.sortDueSoon}</option>
                  <option value="dueLate">{t.checkouts.sortDueLate}</option>
                </select>
              </div>
            </div>

            <div className="filter-panel__footer">
              <p className="filter-panel__summary">
                {filteredCheckouts.length} / {items.length}
              </p>
              <button type="button" className="button-secondary" onClick={resetFilters}>
                {t.common.clearFilters}
              </button>
            </div>
          </section>

          {filteredCheckouts.length === 0 ? (
            <div className="empty-state">
              <h3>{t.checkouts.noResultsTitle}</h3>
              <p>{t.checkouts.noResultsText}</p>
            </div>
          ) : checkoutView === 'list' ? (

          <div
            className={`data-list ${
              showUserColumn
                ? linkAssetNameOnly
                  ? 'data-list--checkouts-with-user-name-link'
                  : 'data-list--checkouts-with-user'
                : linkAssetNameOnly
                  ? 'data-list--checkouts-name-link'
                  : 'data-list--checkouts'
            }`}
          >
            <div className="data-list__header">
              <span className="data-list__heading">{t.common.asset}</span>
              {showUserColumn && <span className="data-list__heading">{t.common.user}</span>}
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

                  {showUserColumn && (
                    <div className="data-list__cell">
                      <span className="data-list__mobile-label">{t.common.user}</span>
                      {renderUserBlock(checkout)}
                    </div>
                  )}

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
                    <span className="data-list__mobile-label">{t.checkouts.checkedOutAt}</span>
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
          ) : (
          <div className="equipment-list">
            {filteredCheckouts.map((checkout) => {
              const overdue = isCheckoutOverdue(checkout.dueAt, checkout.returnedAt)
              const timelineState = getCheckoutTimelineState(checkout)
              const userLink = getUserLink?.(checkout)

              return (
                <article
                  key={checkout.id}
                  className={`equipment-card ${overdue ? 'equipment-card--overdue' : ''}`}
                >
                  <div className="equipment-card__layout equipment-card__layout--media-first">
                    {renderEquipmentMedia(checkout.equipment.imageUrl, checkout.equipment.name)}

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

                      {showUserColumn && (
                        <div className="inventory-status-context">
                          <span className="inventory-status-context__label">{t.common.user}</span>
                          {userLink ? (
                            <Link to={userLink} className="context-link context-link--stack">
                              <strong className="inventory-status-context__value">
                                {checkout.user.name}
                              </strong>
                              <span className="inventory-status-context__meta">
                                {checkout.user.email}
                              </span>
                            </Link>
                          ) : (
                            <>
                              <strong className="inventory-status-context__value">
                                {checkout.user.name}
                              </strong>
                              <span className="inventory-status-context__meta">
                                {checkout.user.email}
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      <div className="equipment-meta">
                        <div className="equipment-meta__item">
                          <span className="equipment-meta__label">{t.checkouts.checkedOutAt}</span>
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
                          <span className="equipment-description__label">{t.checkouts.note}</span>
                          <p className="equipment-description__text">{checkout.note}</p>
                        </div>
                      )}

                    </div>
                  </div>
                </article>
              )
            })}
          </div>
          )}
        </section>
      )}
    </>
  )
}
