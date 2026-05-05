import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import type { EquipmentListItem } from '../../types/equipment'

type InventoryActionKind = 'edit' | 'maintenance' | 'available' | 'delete'

interface InventoryActionsProps {
  deletingEquipmentId: number | null
  equipment: EquipmentListItem
  isAdmin: boolean
  onDelete: (equipmentId: number) => void
  onEdit: (equipment: EquipmentListItem) => void
  onMarkAvailable: (equipmentId: number) => void
  onMarkMaintenance: (equipmentId: number) => void
  options?: { compact?: boolean; shortLabels?: boolean }
  statusChangingEquipmentId: number | null
}

function renderActionIcon(kind: InventoryActionKind) {
  switch (kind) {
    case 'edit':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="m4 20 4.2-.8L19 8.4a1.9 1.9 0 0 0 0-2.7l-.7-.7a1.9 1.9 0 0 0-2.7 0L4.8 15.8 4 20Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="m13.8 6.8 3.4 3.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'maintenance':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M20 6.2a4.1 4.1 0 0 1-5.6 3.8l-7.8 7.8a1.6 1.6 0 0 1-2.3 0l-.1-.1a1.6 1.6 0 0 1 0-2.3l7.8-7.8A4.1 4.1 0 0 1 17.8 4l-2.2 2.2 1.9 1.9L20 6.2Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'available':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="m5 12 4.2 4.2L19 6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'delete':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 7h16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M9.5 4h5L15 7H9l.5-3Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 7l1 12h8l1-12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
  }
}

export function InventoryActions({
  deletingEquipmentId,
  equipment,
  isAdmin,
  onDelete,
  onEdit,
  onMarkAvailable,
  onMarkMaintenance,
  options,
  statusChangingEquipmentId,
}: InventoryActionsProps) {
  const { t } = useLanguage()
  const compact = options?.compact ?? false
  const shortLabels = options?.shortLabels ?? false
  const useShortLabels = compact || shortLabels
  const isCardAction = shortLabels && !compact
  const detailsActionClass = isCardAction
    ? ' button-card-action button-card-action--details'
    : ''
  const editActionClass = isCardAction ? ' button-card-action button-card-action--edit' : ''
  const maintenanceActionClass = isCardAction
    ? ' button-card-action button-card-action--maintenance'
    : ''
  const availableActionClass = isCardAction
    ? ' button-card-action button-card-action--available'
    : ''
  const deleteActionClass = isCardAction
    ? ' button-card-action button-card-action--delete'
    : ''
  const detailsLabel = useShortLabels ? t.inventory.compactDetails : t.inventory.details
  const editLabel = useShortLabels ? t.inventory.compactEdit : t.inventory.edit
  const maintenanceLabel = useShortLabels
    ? t.inventory.compactMaintenance
    : t.inventory.makeMaintenance
  const availableLabel = useShortLabels
    ? t.inventory.compactAvailable
    : t.inventory.makeAvailable
  const deleteLabel = useShortLabels ? t.inventory.compactDelete : t.inventory.delete
  const editContent = compact ? renderActionIcon('edit') : editLabel
  const maintenanceContent = compact ? renderActionIcon('maintenance') : maintenanceLabel
  const availableContent = compact ? renderActionIcon('available') : availableLabel
  const deleteContent = compact ? renderActionIcon('delete') : deleteLabel
  const compactClass = compact ? ' button-icon' : ''

  return (
    <>
      {isAdmin && (
        <Link
          to={`/equipment/${equipment.id}`}
          className={`button-link button-secondary${
            compact ? ' button-compact-label' : detailsActionClass
          }`}
          title={t.inventory.details}
          aria-label={t.inventory.details}
        >
          {detailsLabel}
        </Link>
      )}

      {isAdmin && (
        <button
          type="button"
          className={compact ? 'button-icon' : isCardAction ? editActionClass.trim() : undefined}
          onClick={() => onEdit(equipment)}
          title={t.inventory.edit}
          aria-label={t.inventory.edit}
        >
          {editContent}
        </button>
      )}

      {isAdmin && equipment.status === 'Available' && (
        <button
          type="button"
          className={`button-secondary${
            compact ? `${compactClass} button-icon--maintenance` : maintenanceActionClass
          }`}
          onClick={() => onMarkMaintenance(equipment.id)}
          disabled={statusChangingEquipmentId === equipment.id}
          title={t.inventory.makeMaintenance}
          aria-label={t.inventory.makeMaintenance}
        >
          {statusChangingEquipmentId === equipment.id ? '...' : maintenanceContent}
        </button>
      )}

      {isAdmin && equipment.status === 'Maintenance' && (
        <button
          type="button"
          className={`button-secondary${compact ? compactClass : availableActionClass}`}
          onClick={() => onMarkAvailable(equipment.id)}
          disabled={statusChangingEquipmentId === equipment.id}
          title={t.inventory.makeAvailable}
          aria-label={t.inventory.makeAvailable}
        >
          {statusChangingEquipmentId === equipment.id ? '...' : availableContent}
        </button>
      )}

      {isAdmin && (
        <button
          type="button"
          className={`button-danger${compact ? compactClass : deleteActionClass}`}
          onClick={() => onDelete(equipment.id)}
          disabled={deletingEquipmentId === equipment.id}
          title={t.inventory.delete}
          aria-label={t.inventory.delete}
        >
          {deletingEquipmentId === equipment.id ? '...' : deleteContent}
        </button>
      )}
    </>
  )
}
