import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import type { CheckoutItem } from '../../types/checkout'
import {
  formatDateTime,
  getStatusBadgeClass,
  getStatusLabel,
  isCheckoutDueSoon,
  isCheckoutOverdue,
} from '../../utils/presentation'
import {
  getEnumSearchParam,
  getTextSearchParam,
  setMergedSearchParams,
  toggleSortSearchParams,
} from '../../utils/searchParams'
import { ProtectedAssetImage } from '../media/ProtectedAssetImage'

interface AssignedAssetCollectionViewProps {
  items: CheckoutItem[]
  emptyTitle: string
  emptyText: string
  searchPlaceholder: string
  heroKicker: string
  heroTitle: string
  heroText: string
  queryKeyPrefix: string
  enableWarningFilter?: boolean
}

type AssignedAssetSortField = 'asset' | 'serial' | 'status' | 'checkedOutAt' | 'dueAt'

function getTimelineState(checkout: CheckoutItem) {
  if (isCheckoutOverdue(checkout.dueAt, checkout.returnedAt)) {
    return {
      alertClass: 'deadline-flag deadline-flag--danger',
      alertLabel: 'overdue',
    } as const
  }

  if (isCheckoutDueSoon(checkout.dueAt, checkout.returnedAt)) {
    return {
      alertClass: 'deadline-flag deadline-flag--warning',
      alertLabel: 'dueSoon',
    } as const
  }

  return null
}

export function AssignedAssetCollectionView({
  items,
  emptyTitle,
  emptyText,
  searchPlaceholder,
  heroKicker,
  heroTitle,
  heroText,
  queryKeyPrefix,
  enableWarningFilter = false,
}: AssignedAssetCollectionViewProps) {
  const { language, t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const assetView = getEnumSearchParam(
    searchParams,
    `${queryKeyPrefix}-view`,
    ['cards', 'list'] as const,
    'list',
  )
  const searchQuery = getTextSearchParam(searchParams, `${queryKeyPrefix}-search`)
  const sortField = getEnumSearchParam(
    searchParams,
    `${queryKeyPrefix}-sort`,
    ['asset', 'serial', 'status', 'checkedOutAt', 'dueAt'] as const,
    'dueAt',
  )
  const sortDirection = getEnumSearchParam(
    searchParams,
    `${queryKeyPrefix}-dir`,
    ['asc', 'desc'] as const,
    'asc',
  )
  const warningFilter = getEnumSearchParam(
    searchParams,
    `${queryKeyPrefix}-warning`,
    ['all', 'none', 'dueSoon', 'overdue'] as const,
    'all',
  )

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    const result = items.filter((checkout) => {
      const warningState = getTimelineState(checkout)?.alertLabel ?? 'none'
      if (normalizedQuery.length === 0) {
        return enableWarningFilter ? warningFilter === 'all' || warningState === warningFilter : true
      }

      const matchesSearch = [
        checkout.equipment.name,
        checkout.equipment.category,
        checkout.equipment.serialNumber,
        checkout.note ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)

      const matchesWarning =
        !enableWarningFilter || warningFilter === 'all' || warningState === warningFilter

      return matchesSearch && matchesWarning
    })

    result.sort((left, right) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1

      switch (sortField) {
        case 'asset':
          return left.equipment.name.localeCompare(right.equipment.name, language) * multiplier
        case 'serial':
          return (
            left.equipment.serialNumber.localeCompare(right.equipment.serialNumber, language, {
              numeric: true,
            }) * multiplier
          )
        case 'status':
          return (
            getStatusLabel(left.equipment.status, language).localeCompare(
              getStatusLabel(right.equipment.status, language),
              language,
            ) * multiplier
          )
        case 'checkedOutAt':
          return (
            (new Date(left.checkedOutAt).getTime() - new Date(right.checkedOutAt).getTime()) *
            multiplier
          )
        case 'dueAt':
        default:
          return (new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime()) * multiplier
      }
    })

    return result
  }, [enableWarningFilter, items, language, searchQuery, sortDirection, sortField, warningFilter])

  function resetFilters() {
    setMergedSearchParams(setSearchParams, {
      [`${queryKeyPrefix}-search`]: null,
      [`${queryKeyPrefix}-sort`]: null,
      [`${queryKeyPrefix}-dir`]: null,
      [`${queryKeyPrefix}-warning`]: null,
      [`${queryKeyPrefix}-view`]: null,
    })
  }

  function renderSortableHeading(field: AssignedAssetSortField, label: string) {
    const isActive = sortField === field
    const icon = !isActive ? '↕' : sortDirection === 'asc' ? '↑' : '↓'

    return (
      <button
        type="button"
        className="data-list__sort-button"
        onClick={() =>
          toggleSortSearchParams(
            setSearchParams,
            `${queryKeyPrefix}-sort`,
            `${queryKeyPrefix}-dir`,
            field,
            field === 'dueAt' ? 'asc' : field === 'checkedOutAt' ? 'desc' : 'asc',
          )
        }
      >
        <span>{label}</span>
        <span className="data-list__sort-icon" aria-hidden="true">
          {icon}
        </span>
      </button>
    )
  }

  function renderViewSwitch() {
    return (
      <div className="view-switch" role="group" aria-label={t.common.view}>
        <button
          type="button"
          className={`view-switch__button ${
            assetView === 'cards' ? 'view-switch__button--active' : ''
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
            assetView === 'list' ? 'view-switch__button--active' : ''
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

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h3>{emptyTitle}</h3>
        <p>{emptyText}</p>
      </div>
    )
  }

  return (
    <section className="inventory-stack">
      <div className="section-heading section-heading--toolbar">
        <div>
          <span className="section-heading__eyebrow">{heroKicker}</span>
          <h2 className="section-heading__title">{heroTitle}</h2>
        </div>
        <div className="section-heading__aside">
          <p className="section-heading__text">{heroText}</p>
          {renderViewSwitch()}
        </div>
      </div>

      <section className="section-card section-card--compact filter-panel">
        <div className="filter-panel__grid filter-panel__grid--checkout">
          <div className="form-field">
            <label htmlFor={`${heroTitle}-assets-search`}>{t.common.search}</label>
            <input
              id={`${heroTitle}-assets-search`}
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

          {enableWarningFilter && (
            <div className="form-field">
              <label htmlFor={`${heroTitle}-assets-warning`}>{t.common.warningFilterLabel}</label>
              <select
                id={`${heroTitle}-assets-warning`}
                value={warningFilter}
                onChange={(event) =>
                  setMergedSearchParams(setSearchParams, {
                    [`${queryKeyPrefix}-warning`]:
                      event.target.value === 'all' ? null : event.target.value,
                  })
                }
              >
                <option value="all">{t.common.allWarnings}</option>
                <option value="none">{t.common.noWarning}</option>
                <option value="dueSoon">{t.common.warningDueSoon}</option>
                <option value="overdue">{t.common.warningOverdue}</option>
              </select>
            </div>
          )}
        </div>

        <div className="filter-panel__footer">
          <p className="filter-panel__summary">
            {filteredItems.length} / {items.length}
          </p>
          <button type="button" className="button-secondary" onClick={resetFilters}>
            {t.common.clearFilters}
          </button>
        </div>
      </section>

      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <h3>{t.checkouts.noResultsTitle}</h3>
          <p>{t.checkouts.noResultsText}</p>
        </div>
      ) : assetView === 'list' ? (
        <div className="data-list data-list--assigned-assets">
          <div className="data-list__header">
            <span className="data-list__heading">{renderSortableHeading('asset', t.common.asset)}</span>
            <span className="data-list__heading">{renderSortableHeading('serial', t.inventory.serial)}</span>
            <span className="data-list__heading">{renderSortableHeading('status', t.common.status)}</span>
            <span className="data-list__heading">{renderSortableHeading('checkedOutAt', t.checkouts.checkedOutAt)}</span>
            <span className="data-list__heading">{renderSortableHeading('dueAt', t.checkouts.dueAt)}</span>
          </div>

          {filteredItems.map((checkout) => {
            const timelineState = getTimelineState(checkout)

            return (
                <article
                  key={checkout.id}
                  className={`data-list__row ${
                  timelineState?.alertLabel === 'overdue' ? 'data-list__row--overdue' : ''
                }`}
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
                        {checkout.equipment.category}
                      </span>
                      <span className="data-list__tertiary-text">
                        {checkout.note || t.checkouts.noNote}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="data-list__cell">
                  <span className="data-list__mobile-label">{t.inventory.serial}</span>
                  <span className="data-list__value">{checkout.equipment.serialNumber}</span>
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
              </article>
            )
          })}
        </div>
      ) : (
        <div className="equipment-list">
          {filteredItems.map((checkout) => {
            const timelineState = getTimelineState(checkout)

            return (
                <article
                  key={checkout.id}
                  className={`equipment-card ${
                    timelineState?.alertLabel === 'overdue' ? 'equipment-card--overdue' : ''
                  }`}
              >
                <div className="equipment-card__layout equipment-card__layout--media-first">
                  <div className="equipment-card__media">
                    <ProtectedAssetImage
                      imageUrl={checkout.equipment.imageUrl}
                      alt={checkout.equipment.name}
                      className="equipment-card__image"
                      placeholderClassName="equipment-card__image-placeholder"
                      placeholderText={t.common.noImage}
                    />
                  </div>

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
                        <span className={getStatusBadgeClass(checkout.equipment.status)}>
                          {getStatusLabel(checkout.equipment.status, language)}
                        </span>
                      </div>

                      {timelineState && (
                        <div className="inventory-status-context">
                          <span className="inventory-status-context__meta">
                            {t.checkouts.dueAt}: {formatDateTime(checkout.dueAt, language)}
                          </span>
                        </div>
                      )}

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
                    </div>

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
  )
}
