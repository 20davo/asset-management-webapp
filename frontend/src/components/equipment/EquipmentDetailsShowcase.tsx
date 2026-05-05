import { useLanguage } from '../../context/LanguageContext'
import type { EquipmentDetails } from '../../types/equipment'
import { formatDateTime, getStatusBadgeClass, getStatusLabel } from '../../utils/presentation'
import { ProtectedAssetImage } from '../media/ProtectedAssetImage'

interface EquipmentDetailsShowcaseProps {
  activeCheckoutDueAt: string | null
  activeCheckoutDueSoon: boolean
  activeCheckoutOverdue: boolean
  canSeeActiveCheckoutDetails: boolean
  equipment: EquipmentDetails
  isAdminUser: boolean
  isStatusSubmitting: boolean
  onMarkAvailable: () => void
  onMarkMaintenance: () => void
}

export function EquipmentDetailsShowcase({
  activeCheckoutDueAt,
  activeCheckoutDueSoon,
  activeCheckoutOverdue,
  canSeeActiveCheckoutDetails,
  equipment,
  isAdminUser,
  isStatusSubmitting,
  onMarkAvailable,
  onMarkMaintenance,
}: EquipmentDetailsShowcaseProps) {
  const { language, t } = useLanguage()
  const hasDescription = !!equipment.description

  const recordMeta = (
    <div className="equipment-meta equipment-meta--record">
      <div className="equipment-meta__item">
        <span className="equipment-meta__label">{t.details.recorded}</span>
        <span className="equipment-meta__value">
          {formatDateTime(equipment.createdAt, language)}
        </span>
      </div>

      {canSeeActiveCheckoutDetails && activeCheckoutDueAt && (
        <div className="equipment-meta__item">
          <span className="equipment-meta__label">
            {activeCheckoutOverdue
              ? t.details.overduePrefix
              : activeCheckoutDueSoon
                ? t.details.dueSoonPrefix
                : t.details.deadlinePrefix}
          </span>
          <span className="equipment-meta__value">
            {formatDateTime(activeCheckoutDueAt, language)}
          </span>
        </div>
      )}
    </div>
  )

  return (
    <section className="section-card">
      <div className="equipment-card__header">
        <div className="equipment-card__title-group">
          <h2 className="equipment-card__title">{t.details.title}</h2>
          <p className="equipment-card__subtitle">{t.details.subtitle}</p>
        </div>
      </div>

      <div className="details-showcase">
        <div className="equipment-card__media">
          <ProtectedAssetImage
            imageUrl={equipment.imageUrl}
            alt={equipment.name}
            className="equipment-card__image"
            placeholderClassName="equipment-card__image-placeholder"
            placeholderText={t.common.noImage}
          />
        </div>

        <div className="details-showcase__content">
          <div className="equipment-card__header equipment-card__header--details">
            <div className="equipment-card__title-group">
              <div className="equipment-card__title-row">
                <h3 className="equipment-card__title-small">{equipment.name}</h3>
                {canSeeActiveCheckoutDetails && activeCheckoutOverdue && (
                  <span className="deadline-flag deadline-flag--danger">
                    {t.checkouts.overdueBadge}
                  </span>
                )}
                {canSeeActiveCheckoutDetails && activeCheckoutDueSoon && (
                  <span className="deadline-flag deadline-flag--warning">
                    {t.checkouts.dueSoonBadge}
                  </span>
                )}
              </div>
              <span className="equipment-card__serial">SN {equipment.serialNumber}</span>
              <div className="equipment-card__signal-row">
                <span className="equipment-category-chip">{equipment.category}</span>
              </div>
              {recordMeta}
              {hasDescription && (
                <p className="equipment-card__subtitle equipment-card__subtitle--record-description">
                  {equipment.description}
                </p>
              )}
            </div>
            <span className={getStatusBadgeClass(equipment.status)}>
              {getStatusLabel(equipment.status, language)}
            </span>
          </div>
        </div>
      </div>

      {isAdminUser &&
        (equipment.status === 'Available' || equipment.status === 'Maintenance') && (
          <div className="details-admin-action">
            <div className="details-admin-action__copy">
              <span className="details-admin-action__eyebrow">
                {t.details.stateActionKicker}
              </span>
              <h3 className="details-admin-action__title">
                {equipment.status === 'Available'
                  ? t.details.stateActionMaintenanceTitle
                  : t.details.stateActionAvailableTitle}
              </h3>
              <p className="details-admin-action__text">
                {equipment.status === 'Available'
                  ? t.details.stateActionMaintenanceText
                  : t.details.stateActionAvailableText}
              </p>
            </div>

            <div className="details-admin-action__controls">
              {equipment.status === 'Available' && (
                <button
                  type="button"
                  className="details-admin-action__button details-admin-action__button--maintenance"
                  onClick={onMarkMaintenance}
                  disabled={isStatusSubmitting}
                >
                  {isStatusSubmitting
                    ? t.common.saveInProgress
                    : t.details.sendToMaintenance}
                </button>
              )}

              {equipment.status === 'Maintenance' && (
                <button
                  type="button"
                  className="details-admin-action__button details-admin-action__button--available"
                  onClick={onMarkAvailable}
                  disabled={isStatusSubmitting}
                >
                  {isStatusSubmitting ? t.common.saveInProgress : t.details.makeAvailable}
                </button>
              )}
            </div>
          </div>
        )}
    </section>
  )
}
