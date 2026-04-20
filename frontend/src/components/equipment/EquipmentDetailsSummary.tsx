import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import type { CheckoutHistoryItem, EquipmentDetails } from '../../types/equipment'
import { formatDateTime } from '../../utils/presentation'

interface EquipmentDetailsSummaryProps {
  activeCheckoutDueAt: string | null
  activeCheckoutDueSoon: boolean
  activeCheckoutEntry: CheckoutHistoryItem | undefined
  activeCheckoutOverdue: boolean
  activeCheckoutUserName: string | null
  canCheckoutNow: boolean
  canReturnNow: boolean
  canSeeActiveCheckoutDetails: boolean
  equipment: EquipmentDetails
  isAdminUser: boolean
  lastMovementAt: string | null
}

export function EquipmentDetailsSummary({
  activeCheckoutDueAt,
  activeCheckoutDueSoon,
  activeCheckoutEntry,
  activeCheckoutOverdue,
  activeCheckoutUserName,
  canCheckoutNow,
  canReturnNow,
  canSeeActiveCheckoutDetails,
  equipment,
  isAdminUser,
  lastMovementAt,
}: EquipmentDetailsSummaryProps) {
  const { language, t } = useLanguage()

  return (
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
            <span className="info-stack__label">{t.details.totalCheckouts}</span>
            <strong>{equipment.totalCheckoutCount}</strong>
          </div>
          <div className="info-stack__item">
            <span className="info-stack__label">{t.details.issueability}</span>
            <strong>
              {canCheckoutNow ? t.details.issueabilityYes : t.details.issueabilityNo}
            </strong>
          </div>
          <div className="info-stack__item">
            <span className="info-stack__label">{t.details.activeUserLabel}</span>
            <strong>
              {activeCheckoutUserName ? activeCheckoutUserName : t.details.unassigned}
            </strong>
            {isAdminUser && activeCheckoutEntry?.userId && (
              <Link to={`/users/${activeCheckoutEntry.userId}`} className="context-link">
                {t.details.openUserHistory}
              </Link>
            )}
          </div>
          <div className="info-stack__item">
            <span className="info-stack__label">{t.details.returnability}</span>
            <strong>
              {canReturnNow ? t.details.returnabilityYes : t.details.returnabilityNo}
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
          {canSeeActiveCheckoutDetails && activeCheckoutDueAt && (
            <div className="info-stack__item">
              <span className="info-stack__label">
                {activeCheckoutOverdue
                  ? t.details.overduePrefix
                  : activeCheckoutDueSoon
                    ? t.details.dueSoonPrefix
                    : t.details.deadlinePrefix}
              </span>
              <strong>{formatDateTime(activeCheckoutDueAt, language)}</strong>
            </div>
          )}
        </div>
      </section>
    </aside>
  )
}
