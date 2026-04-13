import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { getUserCheckouts } from '../api/checkoutApi'
import { AssignedAssetCollectionView } from '../components/AssignedAssetCollectionView'
import { CheckoutCollectionView } from '../components/CheckoutCollectionView'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { getUsers } from '../api/userApi'
import type { CheckoutItem } from '../types/checkout'
import type { ManagedUser } from '../types/user'
import { isCheckoutOverdue } from '../utils/presentation'

function UserDetailsPage() {
  const { user } = useAuth()
  const { userId } = useParams()
  const { t } = useLanguage()
  const [checkouts, setCheckouts] = useState<CheckoutItem[]>([])
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

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
        const [users, userCheckouts] = await Promise.all([
          getUsers(),
          getUserCheckouts(numericUserId),
        ])

        const targetUser = users.find((candidate) => candidate.id === numericUserId) ?? null

        if (!targetUser) {
          setErrorMessage(t.checkouts.userNotFound)
          return
        }

        setSelectedUser(targetUser)
        setCheckouts(userCheckouts)
      } catch (error: any) {
        const apiMessage = error?.response?.data?.message || t.checkouts.userLoadError
        setErrorMessage(apiMessage)
      } finally {
        setIsLoading(false)
      }
    }

    void loadData()
  }, [t.checkouts.userLoadError, t.checkouts.userMissing, t.checkouts.userNotFound, userId])

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

      <section className="page-hero">
        <div className="page-hero__content">
          <span className="page-kicker">{t.users.detailHeroKicker}</span>
          <h1 className="page-title">{selectedUser.name}</h1>
          <p className="page-subtitle">{t.users.detailHeroText(selectedUser.email)}</p>
        </div>

        <div className="page-hero__panel">
          <span className="page-hero__panel-label">{t.users.panelLabel}</span>
          <strong className="page-hero__panel-value">
            {activeItems.length} {t.users.detailPanelValue}
          </strong>
          <p className="page-hero__panel-text">{t.users.detailPanelText}</p>
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

      <AssignedAssetCollectionView
        items={activeItems}
        emptyTitle={t.users.currentEmptyTitle}
        emptyText={t.users.currentEmptyText}
        searchPlaceholder={t.users.currentSearchPlaceholder}
        heroKicker={t.users.currentItemsKicker}
        heroTitle={t.users.currentItemsTitle}
        heroText={t.users.currentItemsText}
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
      />
    </div>
  )
}

export default UserDetailsPage
