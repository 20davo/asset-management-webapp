import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { getUserCheckouts } from '../api/checkoutApi'
import { deleteUser, getUser, updateUser as updateUserRequest } from '../api/userApi'
import { AssignedAssetCollectionView } from '../components/shared/AssignedAssetCollectionView'
import { CheckoutCollectionView } from '../components/shared/CheckoutCollectionView'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import type { CheckoutItem } from '../types/checkout'
import type { ManagedUser } from '../types/user'
import { getRoleLabel, isCheckoutOverdue } from '../utils/presentation'

interface UserFormState {
  name: string
  email: string
  role: 'Admin' | 'User'
}

function UserDetailsPage() {
  const { user, updateUser } = useAuth()
  const { userId } = useParams()
  const navigate = useNavigate()
  const { language, t } = useLanguage()
  const [checkouts, setCheckouts] = useState<CheckoutItem[]>([])
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null)
  const [formState, setFormState] = useState<UserFormState>({
    name: '',
    email: '',
    role: 'User',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    async function loadData() {
      if (!userId) {
        setErrorMessage(t.checkouts.userMissing)
        setIsLoading(false)
        return
      }

      try {
        setErrorMessage('')
        const numericUserId = Number(userId)
        const [targetUser, userCheckouts] = await Promise.all([
          getUser(numericUserId),
          getUserCheckouts(numericUserId),
        ])

        setSelectedUser(targetUser)
        setFormState({
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
        })
        setCheckouts(userCheckouts)
      } catch (error: any) {
        const apiMessage = error?.response?.data?.message || t.checkouts.userLoadError
        setErrorMessage(apiMessage)
      } finally {
        setIsLoading(false)
      }
    }

    void loadData()
  }, [t.checkouts.userLoadError, t.checkouts.userMissing, userId])

  const activeItems = useMemo(
    () => checkouts.filter((checkout) => !checkout.returnedAt),
    [checkouts],
  )
  const historyItems = useMemo(
    () => checkouts.filter((checkout) => !!checkout.returnedAt),
    [checkouts],
  )
  const overdueCount = activeItems.filter((checkout) =>
    isCheckoutOverdue(checkout.dueAt, checkout.returnedAt),
  ).length
  const isSelf = !!selectedUser && !!user && selectedUser.id === user.id
  const isSelfRoleLocked = isSelf && selectedUser?.role === 'Admin'
  const deleteBlocked = isSelf

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedUser) {
      return
    }

    try {
      setIsSaving(true)
      setErrorMessage('')
      setSuccessMessage('')

      const updatedUser = await updateUserRequest(selectedUser.id, formState)
      setSelectedUser(updatedUser)
      setFormState({
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      })

      if (user && updatedUser.id === user.id) {
        updateUser({
          ...user,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        })
      }

      setSuccessMessage(t.users.updateSuccess)
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message || t.users.updateError
      setErrorMessage(apiMessage)
      setSuccessMessage('')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedUser) {
      return
    }

    const confirmed = window.confirm(t.users.deleteConfirm(selectedUser.name))

    if (!confirmed) {
      return
    }

    try {
      setIsDeleting(true)
      setErrorMessage('')
      await deleteUser(selectedUser.id)
      navigate('/users', { replace: true })
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message || t.users.deleteError
      setErrorMessage(apiMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  if (user?.role !== 'Admin') {
    return <Navigate to="/?reason=forbidden" replace />
  }

  if (isLoading) {
    return <div className="loading-state">{t.users.loading}</div>
  }

  if (errorMessage && !selectedUser) {
    return <p className="form-error">{errorMessage}</p>
  }

  if (!selectedUser) {
    return <p className="form-error">{t.checkouts.userNotFound}</p>
  }

  return (
    <div className="page-shell">
      <Link to="/users" className="back-link">
        {t.users.backToUsers}
      </Link>

      {errorMessage && <p className="form-error">{errorMessage}</p>}
      {successMessage && <p className="form-success">{successMessage}</p>}

      <section className="page-hero">
        <div className="page-hero__content">
          <span className="page-kicker">{t.users.detailHeroKicker}</span>
          <h1 className="page-title">{selectedUser.name}</h1>
          <p className="page-subtitle">{t.users.detailHeroText(selectedUser.email)}</p>
        </div>

        <div className="page-hero__panel">
          <span className="page-hero__panel-label">{t.users.panelLabel}</span>
          <strong className="page-hero__panel-value">
            {getRoleLabel(selectedUser.role, language)}
          </strong>
          <p className="page-hero__panel-text user-details__email">{selectedUser.email}</p>
        </div>
      </section>

      <section className="stats-grid stats-grid--three">
        <article className="stat-card">
          <span className="stat-card__label">{t.users.activeCheckoutsLabel}</span>
          <strong className="stat-card__value">{activeItems.length}</strong>
          <span className="stat-card__note">{t.users.activeTrackedNote}</span>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">{t.users.overdueCheckoutsLabel}</span>
          <strong className="stat-card__value">{overdueCount}</strong>
          <span className="stat-card__note">{t.users.overdueTrackedNote}</span>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">{t.users.totalCheckoutsLabel}</span>
          <strong className="stat-card__value">{checkouts.length}</strong>
          <span className="stat-card__note">{t.users.totalTrackedNote}</span>
        </article>
      </section>

      <section className="details-layout">
        <article className="section-card">
          <div className="section-heading section-heading--tight">
            <div>
              <span className="section-heading__eyebrow">{t.users.manageKicker}</span>
              <h2 className="section-heading__title">{t.users.manageTitle}</h2>
              <p className="section-heading__text">{t.users.manageText}</p>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSave}>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="managed-user-name">{t.profile.nameLabel}</label>
                <input
                  id="managed-user-name"
                  type="text"
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="managed-user-email">{t.profile.emailLabel}</label>
                <input
                  id="managed-user-email"
                  type="email"
                  value={formState.email}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, email: event.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="managed-user-role">{t.profile.roleLabel}</label>
              <select
                id="managed-user-role"
                value={formState.role}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    role: event.target.value as UserFormState['role'],
                  }))
                }
                disabled={isSelfRoleLocked}
              >
                <option value="User">{getRoleLabel('User', language)}</option>
                <option value="Admin">{getRoleLabel('Admin', language)}</option>
              </select>
            </div>

            {isSelfRoleLocked && (
              <p className="form-success">{t.users.selfRoleLockNotice}</p>
            )}

            <div className="form-actions">
              <button type="submit" className="form-submit" disabled={isSaving}>
                {isSaving ? t.common.saveInProgress : t.inventory.saveChanges}
              </button>
            </div>
          </form>
        </article>

        <aside className="section-card section-card--compact">
          <div className="section-heading section-heading--tight">
            <div>
              <span className="section-heading__eyebrow">{t.users.accessKicker}</span>
              <h2 className="section-heading__title">{t.users.accessTitle}</h2>
              <p className="section-heading__text">{t.users.accessText}</p>
            </div>
          </div>

          <div className="info-stack">
            <div className="info-stack__item">
              <span className="info-stack__label">{t.profile.roleLabel}</span>
              <strong>{getRoleLabel(selectedUser.role, language)}</strong>
            </div>
            <div className="info-stack__item">
              <span className="info-stack__label">{t.users.deleteUserLabel}</span>
              <strong>{deleteBlocked ? t.users.selfDeleteBlocked : t.users.deleteUserText}</strong>
            </div>
          </div>

          <div className="profile-actions profile-actions--compact">
            <button
              type="button"
              className="button-danger"
              onClick={handleDelete}
              disabled={isDeleting || deleteBlocked}
            >
              {isDeleting ? t.users.deletingUser : t.users.deleteUserAction}
            </button>
          </div>
        </aside>
      </section>

      <AssignedAssetCollectionView
        items={activeItems}
        emptyTitle={t.users.currentEmptyTitle}
        emptyText={t.users.currentEmptyText}
        searchPlaceholder={t.users.currentSearchPlaceholder}
        heroKicker={t.users.currentItemsKicker}
        heroTitle={t.users.currentItemsTitle}
        heroText={t.users.currentItemsText}
        queryKeyPrefix="assigned"
        enableWarningFilter
      />

      <CheckoutCollectionView
        items={historyItems}
        emptyTitle={t.users.historyEmptyTitle}
        emptyText={t.users.historyEmptyText}
        searchPlaceholder={t.users.historySearchPlaceholder}
        heroKicker={t.users.historyKicker}
        heroTitle={t.users.historyTitle}
        heroText={t.users.historyText}
        compact
        linkAssetNameOnly
        queryKeyPrefix="history"
        filterMode="equipment"
      />
    </div>
  )
}

export default UserDetailsPage
