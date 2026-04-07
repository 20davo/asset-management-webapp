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

function getStatusBadgeClassLegacy(status: string) {
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

function getStatusLabelLegacy(status: string) {
  switch (status) {
    case 'Available':
      return 'Elérhető'
    case 'CheckedOut':
      return 'Kikérve'
    case 'Maintenance':
      return 'Karbantartás'
    default:
      return status
  }
}

function isOverdueLegacy(dueAt: string, returnedAt: string | null) {
  if (returnedAt) {
    return false
  }

  return new Date(dueAt).getTime() < Date.now()
}

void getStatusBadgeClassLegacy
void getStatusLabelLegacy
void isOverdueLegacy

function MyCheckoutsPage() {
  const { language, t } = useLanguage()
  const [checkouts, setCheckouts] = useState<CheckoutItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

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
      ) : (
        <div className="equipment-list">
          {checkouts.map((checkout) => {
            const overdue = isCheckoutOverdue(checkout.dueAt, checkout.returnedAt)

            return (
              <article
                key={checkout.id}
                className={`equipment-card ${overdue ? 'equipment-card--overdue' : ''}`}
              >
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

                {overdue && (
                  <p className="form-error">
                    {t.checkouts.overdueAlert}
                  </p>
                )}

                {checkout.note && (
                  <div className="equipment-description">
                    <span className="equipment-description__label">{t.checkouts.note}</span>
                    <p className="equipment-description__text">{checkout.note}</p>
                  </div>
                )}

                <div className="equipment-card__actions">
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
      )}
    </div>
  )

  /*

  if (isLoading) {
    return <p>Kikérések betöltése...</p>
  }

  if (errorMessage) {
    return <p className="form-error">{errorMessage}</p>
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>My Checkouts</h2>
          <p className="page-subtitle">A saját kikéréseid és határidejeik.</p>
        </div>
      </div>

      {checkouts.length === 0 ? (
        <p>Még nincs kikérésed.</p>
      ) : (
        <div className="equipment-list">
          {checkouts.map((checkout) => {
            const overdue = isOverdue(checkout.dueAt, checkout.returnedAt)

            return (
              <div
                key={checkout.id}
                className={`equipment-card ${overdue ? 'equipment-card--overdue' : ''}`}
              >
                <div className="equipment-card__header">
                  <h3>{checkout.equipment.name}</h3>
                  <span className={getStatusBadgeClass(checkout.equipment.status)}>
                    {getStatusLabel(checkout.equipment.status)}
                  </span>
                </div>

                <div className="equipment-meta">
                  <p>
                    <strong>Category:</strong> {checkout.equipment.category}
                  </p>

                  <p>
                    <strong>Serial number:</strong> {checkout.equipment.serialNumber}
                  </p>
                </div>

                <p>
                  <strong>Checked out at:</strong>{' '}
                  {new Date(checkout.checkedOutAt).toLocaleString()}
                </p>

                <p>
                  <strong>Due at:</strong> {new Date(checkout.dueAt).toLocaleString()}
                </p>

                <p>
                  <strong>Returned at:</strong>{' '}
                  {checkout.returnedAt
                    ? new Date(checkout.returnedAt).toLocaleString()
                    : 'Még nincs visszahozva'}
                </p>

                {overdue && (
                  <p className="form-error">
                    Ez a kikérés lejárt, az eszközt vissza kell hozni.
                  </p>
                )}

                {checkout.note && (
                  <p className="equipment-description">
                    <strong>Note:</strong> {checkout.note}
                  </p>
                )}

                <div className="equipment-card__actions">
                  <Link
                    to={`/equipment/${checkout.equipment.id}`}
                    className="button-link"
                  >
                    Eszköz adatlap
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
  */
}

export default MyCheckoutsPage
