import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  checkoutEquipment,
  getEquipmentById,
  markEquipmentAvailable,
  markEquipmentMaintenance,
  returnEquipment,
} from '../api/equipmentApi'
import { useAuth } from '../context/AuthContext'
import type { EquipmentDetails } from '../types/equipment'
import {
  formatDate,
  formatDateTime,
  getStatusBadgeClass,
  getStatusLabel,
} from '../utils/presentation'
import { useLanguage } from '../context/LanguageContext'
import { ProtectedAssetImage } from '../components/ProtectedAssetImage'

function formatDateTimeLocal(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}


function EquipmentDetailsPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { language, t } = useLanguage()

  const [equipment, setEquipment] = useState<EquipmentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false)

  const [checkoutForm, setCheckoutForm] = useState({
    dueAt: formatDateTimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    note: '',
  })

  const [returnNote, setReturnNote] = useState('')

  async function loadEquipmentDetails() {
    if (!id) {
      setErrorMessage(t.details.missingId)
      setIsLoading(false)
      return
    }

    try {
      setErrorMessage('')
      const data = await getEquipmentById(Number(id))
      setEquipment(data)
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message || t.details.loadError
      setErrorMessage(apiMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEquipmentDetails()
  }, [id])

  async function handleCheckoutSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!id) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      await checkoutEquipment(Number(id), {
        dueAt: new Date(checkoutForm.dueAt).toISOString(),
        note: checkoutForm.note.trim() || undefined,
      })

      setSuccessMessage(t.details.checkoutSuccess)
      setCheckoutForm({
        dueAt: formatDateTimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000)),
        note: '',
      })

      await loadEquipmentDetails()
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message || t.details.checkoutError
      setErrorMessage(apiMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleReturnSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!id) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      await returnEquipment(Number(id), {
        note: returnNote.trim() || undefined,
      })

      setSuccessMessage(t.details.returnSuccess)
      setReturnNote('')

      await loadEquipmentDetails()
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message || t.details.returnError
      setErrorMessage(apiMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleMarkMaintenance() {
    if (!id) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setIsStatusSubmitting(true)

    try {
      await markEquipmentMaintenance(Number(id))
      setSuccessMessage(t.details.maintenanceSuccess)
      await loadEquipmentDetails()
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message || t.details.maintenanceError
      setErrorMessage(apiMessage)
    } finally {
      setIsStatusSubmitting(false)
    }
  }

  async function handleMarkAvailable() {
    if (!id) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setIsStatusSubmitting(true)

    try {
      await markEquipmentAvailable(Number(id))
      setSuccessMessage(t.details.availableSuccess)
      await loadEquipmentDetails()
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message || t.details.availableError
      setErrorMessage(apiMessage)
    } finally {
      setIsStatusSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="loading-state">{t.details.loading}</div>
  }

  if (errorMessage && !equipment) {
    return <p className="form-error">{errorMessage}</p>
  }

  if (!equipment) {
    return <p className="form-error">{t.details.notFound}</p>
  }

  const isAdminUser = user?.role === 'Admin'
  const canCheckoutNow = equipment.status === 'Available'
  const canReturnNow = equipment.canReturn
  const latestCheckoutEntry = equipment.checkouts[0]
  const activeCheckoutEntry = equipment.checkouts.find((checkout) => !checkout.returnedAt)
  const activeCheckoutUserName =
    activeCheckoutEntry?.userName ?? equipment.activeCheckoutUserName ?? null
  const activeCheckoutDueAt =
    activeCheckoutEntry?.dueAt ?? equipment.activeCheckoutDueAt ?? null
  const lastMovementAt =
    latestCheckoutEntry?.checkedOutAt ?? equipment.lastCheckedOutAt ?? null

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

  return (
    <div className="equipment-details-page">
      <Link to="/" className="back-link">
        {t.details.back}
      </Link>

      {errorMessage && <p className="form-error">{errorMessage}</p>}
      {successMessage && <p className="form-success">{successMessage}</p>}

      <section className="page-hero page-hero--details">
        <div className="page-hero__content">
          <span className="page-kicker">{t.details.heroKicker}</span>
          <h1 className="page-title">{equipment.name}</h1>
          <p className="page-subtitle">{`${equipment.category} - ${t.details.heroText}`}</p>
        </div>

        <div className="page-hero__panel">
          <span className={getStatusBadgeClass(equipment.status)}>
            {getStatusLabel(equipment.status, language)}
          </span>
          <strong className="page-hero__panel-value">{equipment.serialNumber}</strong>
          <p className="page-hero__panel-text">
            {t.details.recorded}: {formatDate(equipment.createdAt, language)}
          </p>
        </div>
      </section>

      <section className="stats-grid stats-grid--three">
        <article className="stat-card">
          <span className="stat-card__label">{t.details.totalCheckouts}</span>
          <strong className="stat-card__value">{equipment.totalCheckoutCount}</strong>
          <span className="stat-card__note">{t.details.totalCheckoutsNote}</span>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">{t.details.activeUser}</span>
          <strong className="stat-card__value">
            {activeCheckoutUserName ? activeCheckoutUserName : t.details.free}
          </strong>
          <span className="stat-card__note">
            {activeCheckoutDueAt
              ? `${t.details.deadlinePrefix}: ${formatDateTime(activeCheckoutDueAt, language)}`
              : t.details.notIssued}
          </span>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">{t.details.lastMovement}</span>
          <strong className="stat-card__value">
            {lastMovementAt
              ? formatDate(lastMovementAt, language)
              : t.details.noHistory}
          </strong>
          <span className="stat-card__note">
            {lastMovementAt ? t.details.latestEvent : t.details.noHistoryNote}
          </span>
        </article>
      </section>

      <div className="details-layout">
        <div className="details-main">
          <section className="section-card">
            <div className="equipment-card__header">
              <div className="equipment-card__title-group">
                <h2 className="equipment-card__title">{t.details.title}</h2>
                <p className="equipment-card__subtitle">{t.details.subtitle}</p>
              </div>

              <span className={getStatusBadgeClass(equipment.status)}>
                {getStatusLabel(equipment.status, language)}
              </span>
            </div>

            <div className="equipment-meta">
              <div className="equipment-meta__item">
                <span className="equipment-meta__label">{t.details.category}</span>
                <span className="equipment-meta__value">{equipment.category}</span>
              </div>

              <div className="equipment-meta__item">
                <span className="equipment-meta__label">{t.details.serial}</span>
                <span className="equipment-meta__value">{equipment.serialNumber}</span>
              </div>

              <div className="equipment-meta__item">
                <span className="equipment-meta__label">{t.details.createdAt}</span>
                <span className="equipment-meta__value">
                  {formatDateTime(equipment.createdAt, language)}
                </span>
              </div>
            </div>

            <div className="asset-image-field">
              <span className="asset-image-field__label">{t.common.image}</span>
              {renderEquipmentMedia(equipment.imageUrl, equipment.name)}
            </div>

            {equipment.description && (
              <div className="equipment-description">
                <span className="equipment-description__label">{t.details.description}</span>
                <p className="equipment-description__text">{equipment.description}</p>
              </div>
            )}

            {isAdminUser && (
              <div className="equipment-card__actions">
                {equipment.status === 'Available' && (
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={handleMarkMaintenance}
                    disabled={isStatusSubmitting}
                  >
                    {isStatusSubmitting ? t.common.saveInProgress : t.details.sendToMaintenance}
                  </button>
                )}

                {equipment.status === 'Maintenance' && (
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={handleMarkAvailable}
                    disabled={isStatusSubmitting}
                  >
                    {isStatusSubmitting ? t.common.saveInProgress : t.details.makeAvailable}
                  </button>
                )}
              </div>
            )}
          </section>

          {canCheckoutNow && (
            <section className="section-card form-section form-section--wide">
              <div className="section-heading section-heading--tight">
                <div>
                  <span className="section-heading__eyebrow">{t.details.checkoutKicker}</span>
                  <h3 className="section-heading__title">{t.details.checkoutTitle}</h3>
                </div>
                <p className="section-heading__text">{t.details.checkoutText}</p>
              </div>

              <form className="auth-form" onSubmit={handleCheckoutSubmit}>
                <div className="form-field">
                  <label htmlFor="dueAt">{t.details.dueAt}</label>
                  <input
                    id="dueAt"
                    type="datetime-local"
                    value={checkoutForm.dueAt}
                    onChange={(event) =>
                      setCheckoutForm((prev) => ({
                        ...prev,
                        dueAt: event.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="checkoutNote">{t.details.note}</label>
                  <textarea
                    id="checkoutNote"
                    value={checkoutForm.note}
                    onChange={(event) =>
                      setCheckoutForm((prev) => ({
                        ...prev,
                        note: event.target.value,
                      }))
                    }
                    placeholder={t.details.notePlaceholder}
                    rows={4}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="form-submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t.common.saveInProgress : t.details.checkoutSubmit}
                  </button>
                </div>
              </form>
            </section>
          )}

          {canReturnNow && (
            <section className="section-card form-section form-section--wide">
              <div className="section-heading section-heading--tight">
                <div>
                  <span className="section-heading__eyebrow">{t.details.returnKicker}</span>
                  <h3 className="section-heading__title">{t.details.returnTitle}</h3>
                </div>
                <p className="section-heading__text">{t.details.returnText}</p>
              </div>

              <form className="auth-form" onSubmit={handleReturnSubmit}>
                <div className="form-field">
                  <label htmlFor="returnNote">{t.details.note}</label>
                  <textarea
                    id="returnNote"
                    value={returnNote}
                    onChange={(event) => setReturnNote(event.target.value)}
                    placeholder={t.details.notePlaceholder}
                    rows={4}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="form-submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t.common.saveInProgress : t.details.returnSubmit}
                  </button>
                </div>
              </form>
            </section>
          )}

          {isAdminUser && (
            <section className="section-card">
              <div className="section-heading section-heading--tight">
                <div>
                  <span className="section-heading__eyebrow">{t.details.historyKicker}</span>
                  <h3 className="section-heading__title">{t.details.historyTitle}</h3>
                </div>
                <p className="section-heading__text">{t.details.historyText}</p>
              </div>

              {equipment.checkouts.length === 0 ? (
                <div className="empty-state empty-state--compact">
                  <h3>{t.details.noHistoryTitle}</h3>
                  <p>{t.details.noHistoryText}</p>
                </div>
              ) : (
                <div className="checkout-history-list">
                  {equipment.checkouts.map((checkout) => (
                    <div key={checkout.id} className="checkout-history-item">
                      <div className="checkout-history-item__header">
                        <div>
                          <h4>{checkout.userName}</h4>
                          <p>{checkout.userEmail}</p>
                        </div>
                        <span className="timeline-pill">
                          {checkout.returnedAt ? t.details.closed : t.details.active}
                        </span>
                      </div>

                      <div className="equipment-meta equipment-meta--dense">
                        <div className="equipment-meta__item">
                          <span className="equipment-meta__label">{t.checkouts.checkedOutAt}</span>
                          <span className="equipment-meta__value">
                            {formatDateTime(checkout.checkedOutAt, language)}
                          </span>
                        </div>
                        <div className="equipment-meta__item">
                          <span className="equipment-meta__label">{t.details.dueAt}</span>
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
                          <span className="equipment-description__label">{t.details.note}</span>
                          <p className="equipment-description__text">{checkout.note}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="details-side">
          <section className="section-card section-card--compact">
            <div className="section-heading section-heading--tight">
              <div>
                <span className="section-heading__eyebrow">{t.details.summaryKicker}</span>
                <h3 className="section-heading__title">{t.details.summaryTitle}</h3>
              </div>
            </div>

            <div className="info-stack">
              <div className="info-stack__item">
                <span className="info-stack__label">{t.details.status}</span>
                <strong>{getStatusLabel(equipment.status, language)}</strong>
              </div>
              <div className="info-stack__item">
                <span className="info-stack__label">{t.details.category}</span>
                <strong>{equipment.category}</strong>
              </div>
              <div className="info-stack__item">
                <span className="info-stack__label">{t.details.activeUserLabel}</span>
                <strong>
                  {activeCheckoutUserName ? activeCheckoutUserName : t.details.unassigned}
                </strong>
              </div>
              <div className="info-stack__item">
                <span className="info-stack__label">{t.details.lastEvent}</span>
                <strong>
                  {lastMovementAt
                    ? formatDateTime(lastMovementAt, language)
                    : t.details.noHistoryNote}
                </strong>
              </div>
            </div>
          </section>

          <section className="section-card section-card--compact">
            <div className="section-heading section-heading--tight">
              <div>
                <span className="section-heading__eyebrow">{t.details.usageKicker}</span>
                <h3 className="section-heading__title">{t.details.usageTitle}</h3>
              </div>
            </div>

            <div className="info-stack">
              <div className="info-stack__item">
                <span className="info-stack__label">{t.details.issueability}</span>
                <strong>
                  {canCheckoutNow ? t.details.issueabilityYes : t.details.issueabilityNo}
                </strong>
              </div>
              <div className="info-stack__item">
                <span className="info-stack__label">{t.details.returnability}</span>
                <strong>
                  {canReturnNow ? t.details.returnabilityYes : t.details.returnabilityNo}
                </strong>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )

}

export default EquipmentDetailsPage
