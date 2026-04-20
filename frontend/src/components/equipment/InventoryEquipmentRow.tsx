import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import type { EquipmentListItem } from '../../types/equipment'
import { formatDate, formatDateTime, getStatusBadgeClass, getStatusLabel } from '../../utils/presentation'
import { ProtectedAssetImage } from '../media/ProtectedAssetImage'
import type { InventoryDueState, InventoryStatusContext } from './InventoryEquipmentCard'

interface InventoryEquipmentRowProps {
  actions: ReactNode
  canSeeDueState: boolean
  dueState: InventoryDueState | null
  equipment: EquipmentListItem
  statusContext: InventoryStatusContext | null
}

export function InventoryEquipmentRow({
  actions,
  canSeeDueState,
  dueState,
  equipment,
  statusContext,
}: InventoryEquipmentRowProps) {
  const { language, t } = useLanguage()

  return (
    <article className="data-list__row">
      <div className="data-list__cell data-list__cell--primary">
        <div className="data-list__asset">
          <div className="data-list__thumb">
            <ProtectedAssetImage
              imageUrl={equipment.imageUrl}
              alt={equipment.name}
              className="data-list__thumb-image"
              placeholderClassName="data-list__thumb-placeholder"
              placeholderText={t.common.noImage}
            />
          </div>

          <div className="data-list__asset-copy">
            <div className="data-list__title-row">
              <Link to={`/equipment/${equipment.id}`} className="context-link">
                <strong className="data-list__primary-text context-link__primary">
                  {equipment.name}
                </strong>
              </Link>
              {dueState?.alertLabel && (
                <span className={dueState.alertClass ?? undefined}>
                  {dueState.alertLabel}
                </span>
              )}
            </div>
            <span className="data-list__secondary-text">{equipment.category}</span>
            <span className="data-list__tertiary-text">
              {equipment.description || t.inventory.listDescriptionFallback}
            </span>
          </div>
        </div>
      </div>

      <div className="data-list__cell data-list__cell--context">
        <span className="data-list__mobile-label">{t.inventory.assignee}</span>
        {statusContext ? (
          <div className="data-list__context-stack">
            <span className="data-list__context-label">{statusContext.label}</span>
            <strong className="data-list__context-name">{statusContext.value}</strong>
            {canSeeDueState && equipment.activeCheckoutDueAt && (
              <span className="data-list__context-value">
                {dueState?.detailLabel}:{' '}
                {formatDateTime(equipment.activeCheckoutDueAt, language)}
              </span>
            )}
          </div>
        ) : (
          <span className="data-list__context-placeholder">-</span>
        )}
      </div>

      <div className="data-list__cell">
        <span className="data-list__mobile-label">{t.inventory.serial}</span>
        <span className="data-list__value">{equipment.serialNumber}</span>
      </div>

      <div className="data-list__cell">
        <span className="data-list__mobile-label">{t.common.status}</span>
        <div className="data-list__status-stack">
          <span className={getStatusBadgeClass(equipment.status)}>
            {getStatusLabel(equipment.status, language)}
          </span>
        </div>
      </div>

      <div className="data-list__cell">
        <span className="data-list__mobile-label">{t.inventory.recordedAt}</span>
        <span className="data-list__value">
          {formatDate(equipment.createdAt, language)}
        </span>
      </div>

      <div className="data-list__cell data-list__cell--actions">
        <div className="data-list__action-row">{actions}</div>
      </div>
    </article>
  )
}
