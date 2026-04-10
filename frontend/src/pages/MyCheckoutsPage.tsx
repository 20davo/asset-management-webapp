import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyCheckouts } from '../api/checkoutApi'
import { useLanguage } from '../context/LanguageContext'
import type { CheckoutItem } from '../types/checkout'
import {
  formatDateTime,
  getStatusBadgeClass,
  getStatusLabel,
  isCheckoutOverdue,
} from '../utils/presentation'
import { ProtectedAssetImage } from '../components/ProtectedAssetImage'

function MyCheckoutsPage() {
  const { language, t } = useLanguage()
  const [checkouts, setCheckouts] = useState<CheckoutItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [checkoutView, setCheckoutView] = useState<'cards' | 'list'>('list')

  useEffect(() => {
    async function loadCheckouts() {
      try {
        setErrorMessage('')
        const data = await getMyCheckouts()
        setCheckouts(data)
      } catch (error: any) {
        const apiMessage = error?.response?.data?.message || t.checkouts.loadError
        setErrorMessage(apiMessage)
      } finally {
        setIsLoading(false)
      }
    }

    loadCheckouts()
  }, [])

  const isOverdue = isCheckoutOverdue
  const activeCount = checkouts.filter((checkout) => !checkout.returnedAt).length
  const overdueCount = checkouts.filter((checkout) =>
    isCheckoutOverdue(checkout.dueAt, checkout.returnedAt),
  ).length
  const returnedCount = checkouts.filter((checkout) => !!checkout.returnedAt).length

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

  void isOverdue

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
          <span className="page-kicker">{t.checkouts.heroKicker}</span>
          <h1 className="page-title">{t.checkouts.heroTitle}</h1>
          <p className="page-subtitle">{t.checkouts.heroText}</p>
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

      {checkouts.length === 0 ? (
        <div className="empty-state">
          <h3>{t.checkouts.emptyTitle}</h3>
          <p>{t.checkouts.emptyText}</p>
        </div>
      ) : checkoutView === 'list' ? (
        <section className="inventory-stack">
          <div className="section-heading section-heading--toolbar">
            <div>
              <span className="section-heading__eyebrow">{t.checkouts.heroKicker}</span>
              <h2 className="section-heading__title">{t.checkouts.heroTitle}</h2>
            </div>
            <div className="section-heading__aside">
              <p className="section-heading__text">{t.checkouts.heroText}</p>
              {renderCheckoutViewSwitch()}
            </div>
          </div>

          <div className="data-list data-list--checkouts">
            <div className="data-list__header">
              <span className="data-list__heading">{t.common.asset}</span>
              <span className="data-list__heading">{t.common.status}</span>
              <span className="data-list__heading">{t.checkouts.checkedOutAt}</span>
              <span className="data-list__heading">{t.checkouts.dueAt}</span>
              <span className="data-list__heading">{t.checkouts.returnedAt}</span>
              <span className="data-list__heading data-list__heading--actions">
                {t.common.actions}
              </span>
            </div>

            {checkouts.map((checkout) => {
              const overdue = isCheckoutOverdue(checkout.dueAt, checkout.returnedAt)

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
                        <strong className="data-list__primary-text">
                          {checkout.equipment.name}
                        </strong>
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
                    <span className="data-list__mobile-label">{t.common.status}</span>
                    <div className="data-list__status-stack">
                      <span className={getStatusBadgeClass(checkout.equipment.status)}>
                        {getStatusLabel(checkout.equipment.status, language)}
                      </span>
                      {overdue && (
                        <span className="timeline-pill timeline-pill--danger">
                          {t.checkouts.overdueBadge}
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

                  <div className="data-list__cell data-list__cell--actions">
                    <Link
                      to={`/equipment/${checkout.equipment.id}`}
                      className="button-link button-secondary"
                    >
                      {t.checkouts.equipmentPage}
                    </Link>
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
              <span className="section-heading__eyebrow">{t.checkouts.heroKicker}</span>
              <h2 className="section-heading__title">{t.checkouts.heroTitle}</h2>
            </div>
            <div className="section-heading__aside">
              <p className="section-heading__text">{t.checkouts.heroText}</p>
              {renderCheckoutViewSwitch()}
            </div>
          </div>

          <div className="equipment-list">
            {checkouts.map((checkout) => {
              const overdue = isCheckoutOverdue(checkout.dueAt, checkout.returnedAt)

              return (
                <article
                  key={checkout.id}
                  className={`equipment-card ${overdue ? 'equipment-card--overdue' : ''}`}
                >
                  <div className="equipment-card__layout">
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
                          <h3 className="equipment-card__title-small">
                            {checkout.equipment.name}
                          </h3>
                          <p className="equipment-card__subtitle">
                            {checkout.equipment.category}
                          </p>
                        </div>

                        {overdue && (
                          <span className="timeline-pill timeline-pill--danger">
                            {t.checkouts.overdueBadge}
                          </span>
                        )}
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
                          <span className="equipment-meta__label">
                            {t.checkouts.returnedAt}
                          </span>
                          <span className="equipment-meta__value">
                            {checkout.returnedAt
                              ? formatDateTime(checkout.returnedAt, language)
                              : t.checkouts.notClosed}
                          </span>
                        </div>
                      </div>

                      {overdue && <p className="form-error">{t.checkouts.overdueAlert}</p>}

                      {checkout.note && (
                        <div className="equipment-description">
                          <span className="equipment-description__label">
                            {t.checkouts.note}
                          </span>
                          <p className="equipment-description__text">{checkout.note}</p>
                        </div>
                      )}

                      <div className="equipment-card__actions">
                        <Link
                          to={`/equipment/${checkout.equipment.id}`}
                          className="button-link button-secondary button-checkout-action button-checkout-action--list"
                        >
                          {t.checkouts.equipmentPage}
                        </Link>
                      </div>
                    </div>

                    {renderEquipmentMedia(
                      checkout.equipment.imageUrl,
                      checkout.equipment.name,
                    )}
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

export default MyCheckoutsPage
