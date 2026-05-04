import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getMyCheckouts } from '../api/checkoutApi'
import { AssignedAssetCollectionView } from '../components/shared/AssignedAssetCollectionView'
import { CheckoutCollectionView } from '../components/shared/CheckoutCollectionView'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import type { CheckoutItem } from '../types/checkout'
import { getApiErrorMessage } from '../utils/apiErrors'
import { isCheckoutOverdue } from '../utils/presentation'

function MyItemsPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [checkouts, setCheckouts] = useState<CheckoutItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadCheckouts() {
      try {
        setErrorMessage('')
        const data = await getMyCheckouts()
        setCheckouts(data)
      } catch (error: unknown) {
        setErrorMessage(getApiErrorMessage(error, t.checkouts.loadError))
      } finally {
        setIsLoading(false)
      }
    }

    void loadCheckouts()
  }, [t.checkouts.loadError])

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

  if (user?.role === 'Admin') {
    return <Navigate to="/users" replace />
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
          <span className="page-kicker">{t.myItems.heroKicker}</span>
          <h1 className="page-title">{t.myItems.heroTitle}</h1>
          <p className="page-subtitle">{t.myItems.heroText}</p>
        </div>

        <div className="page-hero__panel">
          <span className="page-hero__panel-label">{t.myItems.panelLabel}</span>
          <strong className="page-hero__panel-value">
            {activeItems.length} {t.myItems.panelValue}
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
          <span className="stat-card__label">{t.myItems.activeLabel}</span>
          <strong className="stat-card__value">{activeItems.length}</strong>
          <span className="stat-card__note">{t.myItems.activeNote}</span>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">{t.checkouts.overdue}</span>
          <strong className="stat-card__value">{overdueCount}</strong>
          <span className="stat-card__note">{t.checkouts.overdueNote}</span>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">{t.myItems.historyLabel}</span>
          <strong className="stat-card__value">{historyItems.length}</strong>
          <span className="stat-card__note">{t.myItems.historyNote}</span>
        </article>
      </section>

      <AssignedAssetCollectionView
        items={activeItems}
        emptyTitle={t.myItems.currentEmptyTitle}
        emptyText={t.myItems.currentEmptyText}
        searchPlaceholder={t.myItems.currentSearchPlaceholder}
        heroKicker={t.myItems.currentKicker}
        heroTitle={t.myItems.currentTitle}
        heroText={t.myItems.currentText}
        queryKeyPrefix="current"
        enableWarningFilter
      />

      <CheckoutCollectionView
        items={historyItems}
        emptyTitle={t.myItems.historyEmptyTitle}
        emptyText={t.myItems.historyEmptyText}
        searchPlaceholder={t.myItems.historySearchPlaceholder}
        heroKicker={t.myItems.historyKicker}
        heroTitle={t.myItems.historyTitle}
        heroText={t.myItems.historyText}
        compact
        linkAssetNameOnly
        queryKeyPrefix="history"
        filterMode="equipment"
      />
    </div>
  )
}

export default MyItemsPage
