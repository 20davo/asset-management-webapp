import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  checkoutEquipment,
  getEquipmentById,
  markEquipmentAvailable,
  markEquipmentMaintenance,
  returnEquipment,
} from '../api/equipmentApi'
import { getUsers } from '../api/userApi'
import { useAuth } from '../context/AuthContext'
import type { EquipmentDetails } from '../types/equipment'
import type { ManagedUser } from '../types/user'
import {
  formatDateTime,
  getStatusLabel,
  isCheckoutDueSoon,
  isCheckoutOverdue,
} from '../utils/presentation'
import { useLanguage } from '../context/LanguageContext'
import { EquipmentCheckoutHistory } from '../components/equipment/EquipmentCheckoutHistory'
import { EquipmentDetailsShowcase } from '../components/equipment/EquipmentDetailsShowcase'
import { EquipmentDetailsSummary } from '../components/equipment/EquipmentDetailsSummary'

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
  const isAdminUser = user?.role === 'Admin'

  const [equipment, setEquipment] = useState<EquipmentDetails | null>(null)
  const [assignableUsers, setAssignableUsers] = useState<ManagedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false)

  const [checkoutForm, setCheckoutForm] = useState({
    assignedUserId: '',
    dueAt: formatDateTimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    note: '',
  })
  const [minimumDueAt, setMinimumDueAt] = useState(formatDateTimeLocal(new Date()))

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

  useEffect(() => {
    if (!isAdminUser) {
      setAssignableUsers([])
      return
    }

    async function loadAssignableUsers() {
      try {
        const users = await getUsers()
        const eligibleUsers = users.filter(
          (candidate) => candidate.role === 'User' && candidate.id !== user?.id,
        )

        setAssignableUsers(eligibleUsers)
        setCheckoutForm((prev) => ({
          ...prev,
          assignedUserId: eligibleUsers[0]?.id ? String(eligibleUsers[0].id) : '',
        }))
      } catch {
        setAssignableUsers([])
      }
    }

    void loadAssignableUsers()
  }, [isAdminUser, user?.id])

  async function handleCheckoutSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!id) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)
    setMinimumDueAt(formatDateTimeLocal(new Date()))

    try {
      const assignedUserId = isAdminUser ? Number(checkoutForm.assignedUserId) : undefined

      await checkoutEquipment(Number(id), {
        assignedUserId: isAdminUser ? assignedUserId : undefined,
        dueAt: new Date(checkoutForm.dueAt).toISOString(),
        note: checkoutForm.note.trim() || undefined,
      })

      setSuccessMessage(
        isAdminUser ? t.details.assignSuccess : t.details.checkoutSuccess,
      )
      setCheckoutForm({
        assignedUserId: assignableUsers[0]?.id ? String(assignableUsers[0].id) : '',
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

  const canCheckoutNow = equipment.status === 'Available'
  const canReturnNow = equipment.canReturn
  const latestCheckoutEntry = equipment.checkouts[0]
  const activeCheckoutEntry = equipment.checkouts.find((checkout) => !checkout.returnedAt)
  const hasActiveAssignment =
    !!activeCheckoutEntry || equipment.status === 'CheckedOut' || !!equipment.activeCheckoutUserName
  const activeCheckoutUserName =
    activeCheckoutEntry?.userName ?? equipment.activeCheckoutUserName ?? null
  const activeCheckoutDueAt =
    activeCheckoutEntry?.dueAt ?? equipment.activeCheckoutDueAt ?? null
  const lastMovementAt =
    latestCheckoutEntry?.checkedOutAt ?? equipment.lastCheckedOutAt ?? null
  const activeCheckoutOverdue = activeCheckoutDueAt
    ? isCheckoutOverdue(activeCheckoutDueAt, null)
    : false
  const activeCheckoutDueSoon =
    activeCheckoutDueAt && !activeCheckoutOverdue
      ? isCheckoutDueSoon(activeCheckoutDueAt, null)
      : false
  const canSeeActiveCheckoutDetails =
    isAdminUser || equipment.isCheckedOutByCurrentUser

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
          <p className="page-subtitle">{t.details.heroText}</p>
        </div>

        <div className="page-hero__panel">
          <span className="page-hero__panel-label">{t.details.activeUserLabel}</span>
          <strong className="page-hero__panel-value">
            {activeCheckoutUserName ? activeCheckoutUserName : t.details.unassigned}
          </strong>
          <p className="page-hero__panel-text">
            {activeCheckoutDueAt && canSeeActiveCheckoutDetails
              ? `${activeCheckoutOverdue
                  ? t.details.overduePrefix
                  : activeCheckoutDueSoon
                    ? t.details.dueSoonPrefix
                    : t.details.deadlinePrefix}: ${formatDateTime(activeCheckoutDueAt, language)}`
              : activeCheckoutUserName
                ? t.details.assignedRestrictedNote
              : t.details.notIssued}
          </p>
          <div className="page-hero__panel-meta">
            <div className="page-hero__panel-meta-item">
              <span className="page-hero__panel-label">{t.details.status}</span>
              <strong>{getStatusLabel(equipment.status, language)}</strong>
            </div>
            <div className="page-hero__panel-meta-item">
              <span className="page-hero__panel-label">{t.details.lastEvent}</span>
              <strong>
                {lastMovementAt
                  ? formatDateTime(lastMovementAt, language)
                  : t.details.noHistoryNote}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <div className="details-layout">
        <div className="details-main">
          <EquipmentDetailsShowcase
            activeCheckoutDueAt={activeCheckoutDueAt}
            activeCheckoutDueSoon={activeCheckoutDueSoon}
            activeCheckoutOverdue={activeCheckoutOverdue}
            canSeeActiveCheckoutDetails={canSeeActiveCheckoutDetails}
            equipment={equipment}
            isAdminUser={isAdminUser}
            isStatusSubmitting={isStatusSubmitting}
            onMarkAvailable={handleMarkAvailable}
            onMarkMaintenance={handleMarkMaintenance}
          />

          {canCheckoutNow && (
            <section className="section-card form-section form-section--wide">
              <div className="section-heading section-heading--tight">
                <div>
                  <span className="section-heading__eyebrow">{t.details.checkoutKicker}</span>
                  <h3 className="section-heading__title">
                    {isAdminUser ? t.details.assignTitle : t.details.checkoutTitle}
                  </h3>
                </div>
                <p className="section-heading__text">
                  {isAdminUser ? t.details.assignText : t.details.checkoutText}
                </p>
              </div>

              <form className="auth-form" onSubmit={handleCheckoutSubmit}>
                {isAdminUser && (
                  <div className="form-field">
                    <label htmlFor="assignedUserId">{t.details.assignUserLabel}</label>
                    <select
                      id="assignedUserId"
                      value={checkoutForm.assignedUserId}
                      onChange={(event) =>
                        setCheckoutForm((prev) => ({
                          ...prev,
                          assignedUserId: event.target.value,
                        }))
                      }
                      required
                      disabled={assignableUsers.length === 0}
                    >
                      {assignableUsers.length === 0 ? (
                        <option value="">{t.details.noAssignableUsers}</option>
                      ) : (
                        assignableUsers.map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.name} ({candidate.email})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                )}

                <div className="form-field">
                  <label htmlFor="dueAt">{t.details.dueAt}</label>
                  <input
                    id="dueAt"
                    type="datetime-local"
                    value={checkoutForm.dueAt}
                    min={minimumDueAt}
                    onFocus={() => setMinimumDueAt(formatDateTimeLocal(new Date()))}
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
                    disabled={isSubmitting || (isAdminUser && assignableUsers.length === 0)}
                  >
                    {isSubmitting
                      ? t.common.saveInProgress
                      : isAdminUser
                        ? t.details.assignSubmit
                        : t.details.checkoutSubmit}
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

          {isAdminUser && <EquipmentCheckoutHistory checkouts={equipment.checkouts} />}
        </div>

        <EquipmentDetailsSummary
          activeCheckoutDueAt={activeCheckoutDueAt}
          activeCheckoutDueSoon={activeCheckoutDueSoon}
          activeCheckoutEntry={activeCheckoutEntry}
          activeCheckoutOverdue={activeCheckoutOverdue}
          activeCheckoutUserName={activeCheckoutUserName}
          hasActiveAssignment={hasActiveAssignment}
          canCheckoutNow={canCheckoutNow}
          canReturnNow={canReturnNow}
          canSeeActiveCheckoutDetails={canSeeActiveCheckoutDetails}
          equipment={equipment}
          isAdminUser={isAdminUser}
          lastMovementAt={lastMovementAt}
        />
      </div>
    </div>
  )

}

export default EquipmentDetailsPage
