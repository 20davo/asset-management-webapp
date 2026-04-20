import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import type { CheckoutHistoryItem } from '../../types/equipment'
import { formatDateTime } from '../../utils/presentation'

interface EquipmentCheckoutHistoryProps {
  checkouts: CheckoutHistoryItem[]
}

export function EquipmentCheckoutHistory({ checkouts }: EquipmentCheckoutHistoryProps) {
  const { language, t } = useLanguage()

  return (
    <section className="section-card">
      <div className="section-heading section-heading--tight">
        <div>
          <span className="section-heading__eyebrow">{t.details.historyKicker}</span>
          <h3 className="section-heading__title">{t.details.historyTitle}</h3>
        </div>
        <p className="section-heading__text">{t.details.historyText}</p>
      </div>

      {checkouts.length === 0 ? (
        <div className="empty-state empty-state--compact">
          <h3>{t.details.noHistoryTitle}</h3>
          <p>{t.details.noHistoryText}</p>
        </div>
      ) : (
        <div className="checkout-history-list">
          {checkouts.map((checkout) => (
            <div key={checkout.id} className="checkout-history-item">
              <div className="checkout-history-item__header">
                <div>
                  <h4>
                    <Link to={`/users/${checkout.userId}`} className="context-link">
                      <span className="context-link__primary">{checkout.userName}</span>
                    </Link>
                  </h4>
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
  )
}
