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

interface AssignedAssetCollectionViewProps {
  items: CheckoutItem[]
  emptyTitle: string
  emptyText: string
  searchPlaceholder: string
  heroKicker: string
  heroTitle: string
  heroText: string
  queryKeyPrefix: string
}

function getTimelineState(checkout: CheckoutItem) {
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

export function AssignedAssetCollectionView({
  items,
  emptyTitle,
  emptyText,
  searchPlaceholder,
  heroKicker,
  heroTitle,
  heroText,
  queryKeyPrefix,
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
  const sortBy = getEnumSearchParam(
    searchParams,
    `${queryKeyPrefix}-sort`,
    ['dueSoon', 'dueLate', 'name'] as const,
    'dueSoon',
  )

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    const result = items.filter((checkout) => {
      if (normalizedQuery.length === 0) {
        return true
      }

      return [
        checkout.equipment.name,
        checkout.equipment.category,
        checkout.equipment.serialNumber,
        checkout.note ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    })

    result.sort((left, right) => {
      switch (sortBy) {
        case 'dueLate':
          return new Date(right.dueAt).getTime() - new Date(left.dueAt).getTime()
        case 'name':
          return left.equipment.name.localeCompare(right.equipment.name, language)
        case 'dueSoon':
        default:
          return new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime()
      }
    })

    return result
  }, [items, language, searchQuery, sortBy])

  function resetFilters() {
    setMergedSearchParams(setSearchParams, {
      [`${queryKeyPrefix}-search`]: null,
      [`${queryKeyPrefix}-sort`]: null,
      [`${queryKeyPrefix}-view`]: null,
    })
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

          <div className="form-field">
            <label htmlFor={`${heroTitle}-assets-sort`}>{t.checkouts.sortByLabel}</label>
            <select
              id={`${heroTitle}-assets-sort`}
              value={sortBy}
              onChange={(event) =>
                setMergedSearchParams(setSearchParams, {
                  [`${queryKeyPrefix}-sort`]:
                    event.target.value === 'dueSoon' ? null : event.target.value,
                })
              }
            >
              <option value="dueSoon">{t.checkouts.sortDueSoon}</option>
              <option value="dueLate">{t.checkouts.sortDueLate}</option>
              <option value="name">{t.inventory.sortByName}</option>
            </select>
          </div>
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
            <span className="data-list__heading">{t.common.asset}</span>
            <span className="data-list__heading">{t.inventory.serial}</span>
            <span className="data-list__heading">{t.common.status}</span>
            <span className="data-list__heading">{t.checkouts.checkedOutAt}</span>
            <span className="data-list__heading">{t.checkouts.dueAt}</span>
          </div>

          {filteredItems.map((checkout) => {
            const timelineState = getTimelineState(checkout)

            return (
              <article
                key={checkout.id}
                className={`data-list__row ${
                  timelineState?.pillLabel === 'overdue' ? 'data-list__row--overdue' : ''
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
                      <Link
                        to={`/equipment/${checkout.equipment.id}`}
                        className="context-link"
                      >
                        <strong className="data-list__primary-text context-link__primary">
                          {checkout.equipment.name}
                        </strong>
                      </Link>
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
                  timelineState?.pillLabel === 'overdue' ? 'equipment-card--overdue' : ''
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
