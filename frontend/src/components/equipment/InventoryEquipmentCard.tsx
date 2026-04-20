import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import type { EquipmentListItem } from '../../types/equipment'
import { formatDate, formatDateTime, getStatusBadgeClass, getStatusLabel } from '../../utils/presentation'
import { ProtectedAssetImage } from '../media/ProtectedAssetImage'

export interface InventoryDueState {
  alertClass: string | null
  alertLabel: string | null
  detailLabel: string
}

export interface InventoryStatusContext {
  label: string
  value: string
}

interface InventoryEquipmentCardProps {
  actions: ReactNode
  canSeeDueState: boolean
  dueState: InventoryDueState | null
  equipment: EquipmentListItem
  statusContext: InventoryStatusContext | null
}

export function InventoryEquipmentCard({
  actions,
  canSeeDueState,
  dueState,
  equipment,
  statusContext,
}: InventoryEquipmentCardProps) {
  const { language, t } = useLanguage()

  return (
    <article className="equipment-card">
      <div className="equipment-card__layout equipment-card__layout--media-first">
        <div className="equipment-card__media">
          <ProtectedAssetImage
            imageUrl={equipment.imageUrl}
            alt={equipment.name}
            className="equipment-card__image"
            placeholderClassName="equipment-card__image-placeholder"
            placeholderText={t.common.noImage}
          />
        </div>

        <div className="equipment-card__main">
          <div className="equipment-card__header">
            <div className="equipment-card__title-group">
              <div className="equipment-card__title-row">
                <Link to={`/equipment/${equipment.id}`} className="context-link">
                  <h3 className="equipment-card__title-small context-link__primary">
                    {equipment.name}
                  </h3>
                </Link>
                {dueState?.alertLabel && (
                  <span className={dueState.alertClass ?? undefined}>
                    {dueState.alertLabel}
                  </span>
                )}
              </div>
              <span className="equipment-card__serial">SN {equipment.serialNumber}</span>
              <div className="equipment-card__signal-row">
                <span className="equipment-category-chip">{equipment.category}</span>
              </div>
            </div>
            <span className={getStatusBadgeClass(equipment.status)}>
              {getStatusLabel(equipment.status, language)}
            </span>
          </div>

          {statusContext && (
            <div className="inventory-status-context">
              <span className="inventory-status-context__label">{statusContext.label}</span>
              <strong className="inventory-status-context__value">
                {statusContext.value}
              </strong>
              {canSeeDueState && equipment.activeCheckoutDueAt && (
                <span className="inventory-status-context__meta">
                  {dueState?.detailLabel}:{' '}
                  {formatDateTime(equipment.activeCheckoutDueAt, language)}
                </span>
              )}
            </div>
          )}

          <div className="equipment-meta">
            <div className="equipment-meta__item">
              <span className="equipment-meta__label">{t.inventory.recordedAt}</span>
              <span className="equipment-meta__value">
                {formatDate(equipment.createdAt, language)}
              </span>
            </div>

            {equipment.activeCheckoutDueAt && (
              <div className="equipment-meta__item">
                <span className="equipment-meta__label">{t.details.deadlinePrefix}</span>
                <span className="equipment-meta__value">
                  {formatDateTime(equipment.activeCheckoutDueAt, language)}
                </span>
              </div>
            )}
          </div>

          {equipment.description && (
            <div className="equipment-description">
              <span className="equipment-description__label">{t.inventory.description}</span>
              <p className="equipment-description__text">{equipment.description}</p>
            </div>
          )}

          <div className="equipment-card__actions">{actions}</div>
        </div>
      </div>
    </article>
  )
}
