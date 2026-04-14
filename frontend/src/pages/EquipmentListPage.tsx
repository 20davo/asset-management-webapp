import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  createEquipment,
  deleteEquipment,
  getEquipments,
  markEquipmentAvailable,
  markEquipmentMaintenance,
  updateEquipment,
} from '../api/equipmentApi'
import { useAuth } from '../context/AuthContext'
import type { EquipmentListItem } from '../types/equipment'
import {
  formatDate,
  formatDateTime,
  getStatusBadgeClass,
  getStatusLabel,
  isCheckoutDueSoon,
  isCheckoutOverdue,
} from '../utils/presentation'
import {
  getEnumSearchParam,
  getTextSearchParam,
  setMergedSearchParams,
} from '../utils/searchParams'
import { useLanguage } from '../context/LanguageContext'
import { ProtectedAssetImage } from '../components/ProtectedAssetImage'

interface EquipmentFormState {
  name: string
  category: string
  description: string
  image: File | null
  imagePreviewUrl: string
  removeImage: boolean
  serialNumber: string
}

const emptyForm: EquipmentFormState = {
  name: '',
  category: '',
  description: '',
  image: null,
  imagePreviewUrl: '',
  removeImage: false,
  serialNumber: '',
}

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024

type InventoryActionKind = 'edit' | 'maintenance' | 'available' | 'delete'

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('Invalid file result.'))
    }

    reader.onerror = () => reject(reader.error ?? new Error('File read failed.'))
    reader.readAsDataURL(file)
  })
}

function EquipmentListPage() {
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const isAdmin = user?.role === 'Admin'
  const [searchParams, setSearchParams] = useSearchParams()

  const [equipments, setEquipments] = useState<EquipmentListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [createForm, setCreateForm] = useState<EquipmentFormState>(emptyForm)
  const [editingEquipmentId, setEditingEquipmentId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<EquipmentFormState>(emptyForm)

  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [deletingEquipmentId, setDeletingEquipmentId] = useState<number | null>(null)
  const [statusChangingEquipmentId, setStatusChangingEquipmentId] = useState<number | null>(null)
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false)
  const inventoryView = getEnumSearchParam(
    searchParams,
    'view',
    ['cards', 'list'] as const,
    'list',
  )
  const searchQuery = getTextSearchParam(searchParams, 'search')
  const statusFilter = searchParams.get('status') ?? 'all'
  const categoryFilter = searchParams.get('category') ?? 'all'
  const sortBy = getEnumSearchParam(
    searchParams,
    'sort',
    ['name', 'newest', 'oldest'] as const,
    'name',
  )

  async function loadEquipments() {
    try {
      setErrorMessage('')
      const data = await getEquipments()
      setEquipments(data)
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message || t.inventory.loadError
      setErrorMessage(apiMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEquipments()
  }, [])

  function clearMessages() {
    setErrorMessage('')
    setSuccessMessage('')
  }

  function startEdit(equipment: EquipmentListItem) {
    clearMessages()
    setEditingEquipmentId(equipment.id)
    setEditForm({
      name: equipment.name,
      category: equipment.category,
      description: equipment.description ?? '',
      image: null,
      imagePreviewUrl: equipment.imageUrl ?? '',
      removeImage: false,
      serialNumber: equipment.serialNumber,
    })
  }

  function cancelEdit() {
    setEditingEquipmentId(null)
    setEditForm(emptyForm)
  }

  async function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>,
    target: 'create' | 'edit',
  ) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    clearMessages()

    if (!file.type.startsWith('image/')) {
      setErrorMessage(t.inventory.imageInvalidType)
      event.target.value = ''
      return
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setErrorMessage(t.inventory.imageTooLarge)
      event.target.value = ''
      return
    }

    try {
      const imageUrl = await readFileAsDataUrl(file)

      if (target === 'create') {
        setCreateForm((prev) => ({
          ...prev,
          image: file,
          imagePreviewUrl: imageUrl,
          removeImage: false,
        }))
      } else {
        setEditForm((prev) => ({
          ...prev,
          image: file,
          imagePreviewUrl: imageUrl,
          removeImage: false,
        }))
      }
    } catch {
      setErrorMessage(t.inventory.imageInvalidType)
    } finally {
      event.target.value = ''
    }
  }

  function removeImage(target: 'create' | 'edit') {
    clearMessages()

    if (target === 'create') {
      setCreateForm((prev) => ({
        ...prev,
        image: null,
        imagePreviewUrl: '',
        removeImage: false,
      }))
      return
    }

    setEditForm((prev) => ({
      ...prev,
      image: null,
      imagePreviewUrl: '',
      removeImage: true,
    }))
  }

  async function handleCreateSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearMessages()
    setIsCreating(true)

    try {
      await createEquipment({
        name: createForm.name.trim(),
        category: createForm.category.trim(),
        description: createForm.description.trim() || undefined,
        image: createForm.image,
        serialNumber: createForm.serialNumber.trim(),
      })

      setSuccessMessage(t.inventory.createSuccess)
      setCreateForm(emptyForm)
      setIsCreatePanelOpen(false)
      await loadEquipments()
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message || t.inventory.createError
      setErrorMessage(apiMessage)
    } finally {
      setIsCreating(false)
    }
  }

  async function handleEditSubmit(
    event: React.FormEvent<HTMLFormElement>,
    equipmentId: number,
  ) {
    event.preventDefault()
    clearMessages()
    setIsUpdating(true)

    try {
      await updateEquipment(equipmentId, {
        name: editForm.name.trim(),
        category: editForm.category.trim(),
        description: editForm.description.trim() || undefined,
        image: editForm.image,
        removeImage: editForm.removeImage,
        serialNumber: editForm.serialNumber.trim(),
      })

      setSuccessMessage(t.inventory.updateSuccess)
      setEditingEquipmentId(null)
      setEditForm(emptyForm)
      await loadEquipments()
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message || t.inventory.updateError
      setErrorMessage(apiMessage)
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleDelete(equipmentId: number) {
    const confirmed = window.confirm(t.inventory.deleteConfirm)

    if (!confirmed) {
      return
    }

    clearMessages()
    setDeletingEquipmentId(equipmentId)

    try {
      await deleteEquipment(equipmentId)
      setSuccessMessage(t.inventory.deleteSuccess)

      if (editingEquipmentId === equipmentId) {
        cancelEdit()
      }

      await loadEquipments()
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message || t.inventory.deleteError
      setErrorMessage(apiMessage)
    } finally {
      setDeletingEquipmentId(null)
    }
  }

  async function handleMarkMaintenance(equipmentId: number) {
    clearMessages()
    setStatusChangingEquipmentId(equipmentId)

    try {
      await markEquipmentMaintenance(equipmentId)
      setSuccessMessage(t.inventory.maintenanceSuccess)
      await loadEquipments()
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message || t.inventory.maintenanceError
      setErrorMessage(apiMessage)
    } finally {
      setStatusChangingEquipmentId(null)
    }
  }

  async function handleMarkAvailable(equipmentId: number) {
    clearMessages()
    setStatusChangingEquipmentId(equipmentId)

    try {
      await markEquipmentAvailable(equipmentId)
      setSuccessMessage(t.inventory.availableSuccess)
      await loadEquipments()
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message || t.inventory.availableError
      setErrorMessage(apiMessage)
    } finally {
      setStatusChangingEquipmentId(null)
    }
  }

  const availableCount = equipments.filter(
    (equipment) => equipment.status === 'Available',
  ).length
  const checkedOutCount = equipments.filter(
    (equipment) => equipment.status === 'CheckedOut',
  ).length
  const maintenanceCount = equipments.filter(
    (equipment) => equipment.status === 'Maintenance',
  ).length
  const newestEquipment = [...equipments].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  )[0]
  const categories = useMemo(
    () =>
      [...new Set(equipments.map((equipment) => equipment.category))]
        .filter((category) => category.trim().length > 0)
        .sort((left, right) => left.localeCompare(right, language)),
    [equipments, language],
  )
  const filteredEquipments = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    const result = equipments.filter((equipment) => {
      const matchesSearch =
        normalizedQuery.length === 0
          ? true
          : [
              equipment.name,
              equipment.category,
              equipment.serialNumber,
              equipment.description ?? '',
              equipment.activeCheckoutUserName ?? '',
              equipment.maintenanceByUserName ?? '',
            ]
              .join(' ')
              .toLowerCase()
              .includes(normalizedQuery)

      const matchesStatus =
        statusFilter === 'all' ? true : equipment.status === statusFilter
      const matchesCategory =
        categoryFilter === 'all' ? true : equipment.category === categoryFilter

      return matchesSearch && matchesStatus && matchesCategory
    })

    result.sort((left, right) => {
      switch (sortBy) {
        case 'newest':
          return (
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
          )
        case 'oldest':
          return (
            new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
          )
        case 'name':
        default:
          return left.name.localeCompare(right.name, language)
      }
    })

    return result
  }, [categoryFilter, equipments, language, searchQuery, sortBy, statusFilter])

  function resetFilters() {
    setMergedSearchParams(setSearchParams, {
      search: null,
      status: null,
      category: null,
      sort: null,
      view: null,
    })
  }

  function renderEquipmentMedia(imageUrl: string | null | undefined, name: string) {
    return (
      <div className="equipment-card__media">
        <ProtectedAssetImage
          imageUrl={imageUrl}
          alt={name}
          className="equipment-card__image"
          placeholderClassName="equipment-card__image-placeholder"
          placeholderText={t.common.noImage}
        />
      </div>
    )
  }

  function getStatusContext(equipment: EquipmentListItem) {
    const isCurrentUserAssignee =
      !!user?.name &&
      equipment.activeCheckoutUserName?.trim().toLocaleLowerCase(language) ===
        user.name.trim().toLocaleLowerCase(language)

    if (equipment.status === 'CheckedOut') {
      return {
        label: t.inventory.checkedOutBy,
        value: isCurrentUserAssignee
          ? t.common.me
          : equipment.activeCheckoutUserName || t.inventory.actorUnknown,
      }
    }

    if (isAdmin && equipment.status === 'Maintenance') {
      return {
        label: t.inventory.maintenanceBy,
        value: equipment.maintenanceByUserName || t.inventory.actorUnknown,
      }
    }

    return null
  }

  function getDueState(dueAt: string | null) {
    if (!dueAt) {
      return null
    }

    if (isCheckoutOverdue(dueAt, null)) {
      return {
        pillClass: 'timeline-pill timeline-pill--danger',
        pillLabel: t.checkouts.overdueBadge,
        detailLabel: t.details.overduePrefix,
      }
    }

    if (isCheckoutDueSoon(dueAt, null)) {
      return {
        pillClass: 'timeline-pill timeline-pill--warning',
        pillLabel: t.checkouts.dueSoonBadge,
        detailLabel: t.details.dueSoonPrefix,
      }
    }

    return {
      pillClass: 'timeline-pill',
      pillLabel: t.details.deadlinePrefix,
      detailLabel: t.details.deadlinePrefix,
    }
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

  function renderInventoryActions(
    equipment: EquipmentListItem,
    options?: { compact?: boolean; shortLabels?: boolean },
  ) {
    const compact = options?.compact ?? false
    const shortLabels = options?.shortLabels ?? false
    const useShortLabels = compact || shortLabels
    const cardActionClass =
      shortLabels && !compact ? ' button-card-action button-card-action--card' : ''
    const detailsLabel = useShortLabels
      ? t.inventory.compactDetails
      : t.inventory.details
    const editLabel = useShortLabels ? t.inventory.compactEdit : t.inventory.edit
    const maintenanceLabel = useShortLabels
      ? t.inventory.compactMaintenance
      : t.inventory.makeMaintenance
    const availableLabel = useShortLabels
      ? t.inventory.compactAvailable
      : t.inventory.makeAvailable
    const deleteLabel = useShortLabels ? t.inventory.compactDelete : t.inventory.delete
    const editContent = compact ? renderActionIcon('edit') : editLabel
    const maintenanceContent = compact
      ? renderActionIcon('maintenance')
      : maintenanceLabel
    const availableContent = compact
      ? renderActionIcon('available')
      : availableLabel
    const deleteContent = compact ? renderActionIcon('delete') : deleteLabel
    const compactClass = compact ? ' button-icon' : ''

    return (
      <>
        <Link
          to={`/equipment/${equipment.id}`}
          className={`button-link button-secondary${
            compact ? ' button-compact-label' : cardActionClass
          }`}
          title={t.inventory.details}
          aria-label={t.inventory.details}
        >
          {detailsLabel}
        </Link>

        {isAdmin && (
          <button
            type="button"
            className={compact ? 'button-icon' : shortLabels ? cardActionClass.trim() : undefined}
            onClick={() => startEdit(equipment)}
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
              compact
                ? `${compactClass} button-icon--maintenance`
                : cardActionClass
            }`}
            onClick={() => handleMarkMaintenance(equipment.id)}
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
            className={`button-secondary${compact ? compactClass : cardActionClass}`}
            onClick={() => handleMarkAvailable(equipment.id)}
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
            className={`button-danger${compact ? compactClass : cardActionClass}`}
            onClick={() => handleDelete(equipment.id)}
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

  function renderEquipmentCard(equipment: EquipmentListItem) {
    const statusContext = getStatusContext(equipment)
    const dueState = getDueState(equipment.activeCheckoutDueAt)

    return (
      <article key={equipment.id} className="equipment-card">
        {editingEquipmentId === equipment.id ? (
          <form
            className="auth-form admin-form"
            onSubmit={(event) => handleEditSubmit(event, equipment.id)}
          >
            <div className="admin-form__fields">
              <div className="section-heading section-heading--tight">
                <div>
                  <span className="section-heading__eyebrow">
                    {t.inventory.editingKicker}
                  </span>
                  <h3 className="section-heading__title">{t.inventory.editingTitle}</h3>
                </div>
                <p className="section-heading__text">{t.inventory.editingText}</p>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor={`edit-name-${equipment.id}`}>{t.inventory.name}</label>
                  <input
                    id={`edit-name-${equipment.id}`}
                    type="text"
                    value={editForm.name}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor={`edit-category-${equipment.id}`}>
                    {t.inventory.category}
                  </label>
                  <input
                    id={`edit-category-${equipment.id}`}
                    type="text"
                    value={editForm.category}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        category: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor={`edit-serial-${equipment.id}`}>{t.inventory.serial}</label>
                <input
                  id={`edit-serial-${equipment.id}`}
                  type="text"
                  value={editForm.serialNumber}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      serialNumber: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor={`edit-description-${equipment.id}`}>
                  {t.inventory.description}
                </label>
                <textarea
                  id={`edit-description-${equipment.id}`}
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  rows={5}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="form-submit" disabled={isUpdating}>
                  {isUpdating ? t.inventory.saving : t.inventory.saveChanges}
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={cancelEdit}
                  disabled={isUpdating}
                >
                  {t.inventory.cancel}
                </button>
              </div>
            </div>

            <aside className="admin-form__aside">
              <div className="form-field">
                <span>{t.inventory.image}</span>
                <div className="upload-control">
                  <input
                    id={`edit-image-${equipment.id}`}
                    className="upload-control__input"
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleImageChange(event, 'edit')}
                  />
                  <label htmlFor={`edit-image-${equipment.id}`} className="upload-control__button">
                    {editForm.imagePreviewUrl ? t.inventory.imageReplace : t.inventory.imageSelect}
                  </label>
                  <span className="form-field__hint">{t.inventory.imageHint}</span>
                </div>
              </div>

              <div className="asset-image-field">
                <span className="asset-image-field__label">{t.inventory.imagePreview}</span>
                {renderEquipmentMedia(editForm.imagePreviewUrl, editForm.name || equipment.name)}
                {editForm.imagePreviewUrl && (
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => removeImage('edit')}
                  >
                    {t.inventory.imageRemove}
                  </button>
                )}
              </div>
            </aside>
          </form>
        ) : (
          <div className="equipment-card__layout equipment-card__layout--media-first">
            {renderEquipmentMedia(equipment.imageUrl, equipment.name)}

            <div className="equipment-card__main">
              <div className="equipment-card__eyebrow">
                <span className="equipment-card__serial">SN {equipment.serialNumber}</span>
                <span className={getStatusBadgeClass(equipment.status)}>
                  {getStatusLabel(equipment.status, language)}
                </span>
              </div>

              <div className="equipment-card__header">
                <div className="equipment-card__title-group">
                  <h3 className="equipment-card__title-small">{equipment.name}</h3>
                  <div className="equipment-card__signal-row">
                    <span className="equipment-category-chip">{equipment.category}</span>
                  </div>
                </div>
              </div>

              {statusContext && (
                <div className="inventory-status-context">
                  <span className="inventory-status-context__label">
                    {statusContext.label}
                  </span>
                  <strong className="inventory-status-context__value">
                    {statusContext.value}
                  </strong>
                  {dueState && (
                    <span className={dueState.pillClass}>{dueState.pillLabel}</span>
                  )}
                  {equipment.activeCheckoutDueAt && (
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
                  <span className="equipment-description__label">
                    {t.inventory.description}
                  </span>
                  <p className="equipment-description__text">{equipment.description}</p>
                </div>
              )}

              <div className="equipment-card__actions">
                {renderInventoryActions(equipment, { shortLabels: true })}
              </div>
            </div>
          </div>
        )}
      </article>
    )
  }

  if (isLoading) {
    return <div className="loading-state">{t.inventory.loading}</div>
  }

  if (errorMessage && equipments.length === 0) {
    return <p className="form-error">{errorMessage}</p>
  }

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="page-hero__content">
          <span className="page-kicker">{t.inventory.heroKicker}</span>
          <h1 className="page-title">{t.inventory.heroTitle}</h1>
          <p className="page-subtitle">{t.inventory.heroText}</p>
        </div>

        <div className="page-hero__panel">
          <span className="page-hero__panel-label">{t.inventory.signal}</span>
          <strong className="page-hero__panel-value">
            {equipments.length} {language === 'en' ? 'assets' : 'eszköz'}
          </strong>
          <p className="page-hero__panel-text">
            {newestEquipment
              ? `${t.inventory.latestRecorded}: ${newestEquipment.name} ${formatDate(newestEquipment.createdAt, language)}`
              : t.inventory.noRecorded}
          </p>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span className="stat-card__label">{t.inventory.total}</span>
          <strong className="stat-card__value">{equipments.length}</strong>
          <span className="stat-card__note">{t.inventory.totalNote}</span>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">{t.inventory.available}</span>
          <strong className="stat-card__value">{availableCount}</strong>
          <span className="stat-card__note">{t.inventory.availableNote}</span>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">{t.inventory.checkedOut}</span>
          <strong className="stat-card__value">{checkedOutCount}</strong>
          <span className="stat-card__note">{t.inventory.checkedOutNote}</span>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">{t.inventory.maintenance}</span>
          <strong className="stat-card__value">{maintenanceCount}</strong>
          <span className="stat-card__note">{t.inventory.maintenanceNote}</span>
        </article>
      </section>

      {errorMessage && <p className="form-error">{errorMessage}</p>}
      {successMessage && <p className="form-success">{successMessage}</p>}

      {isAdmin && (
        <section className="section-card section-card--compact admin-panel">
          <div className="admin-panel__header">
            <div className="section-heading section-heading--tight">
              <div>
                <span className="section-heading__eyebrow">{t.inventory.adminKicker}</span>
                {isCreatePanelOpen && (
                  <h2 className="section-heading__title">{t.inventory.adminTitle}</h2>
                )}
              </div>
              <p className="section-heading__text">{t.inventory.adminText}</p>
            </div>

            <button
              type="button"
              className="admin-panel__toggle"
              onClick={() => setIsCreatePanelOpen((prev) => !prev)}
              aria-expanded={isCreatePanelOpen}
            >
              <span className="admin-panel__toggle-icon">
                {isCreatePanelOpen ? '-' : '+'}
              </span>
              <span>{t.inventory.adminTitle}</span>
            </button>
          </div>

          {isCreatePanelOpen && (
            <form className="auth-form admin-form" onSubmit={handleCreateSubmit}>
              <div className="admin-form__fields">
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="create-name">{t.inventory.name}</label>
                    <input
                      id="create-name"
                      type="text"
                      value={createForm.name}
                      onChange={(event) =>
                        setCreateForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                      placeholder={t.inventory.createNamePlaceholder}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="create-category">{t.inventory.category}</label>
                    <input
                      id="create-category"
                      type="text"
                      value={createForm.category}
                      onChange={(event) =>
                        setCreateForm((prev) => ({ ...prev, category: event.target.value }))
                      }
                      placeholder={t.inventory.createCategoryPlaceholder}
                      required
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="create-serial">{t.inventory.serial}</label>
                  <input
                    id="create-serial"
                    type="text"
                    value={createForm.serialNumber}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        serialNumber: event.target.value,
                      }))
                    }
                    placeholder={t.inventory.createSerialPlaceholder}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="create-description">{t.inventory.description}</label>
                  <textarea
                    id="create-description"
                    value={createForm.description}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    placeholder={t.inventory.createDescriptionPlaceholder}
                    rows={5}
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="form-submit" disabled={isCreating}>
                    {isCreating ? t.inventory.saving : t.inventory.saveItem}
                  </button>
                </div>
              </div>

              <aside className="admin-form__aside">
                <div className="form-field">
                  <span>{t.inventory.image}</span>
                  <div className="upload-control">
                    <input
                      id="create-image"
                      className="upload-control__input"
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleImageChange(event, 'create')}
                    />
                    <label htmlFor="create-image" className="upload-control__button">
                      {createForm.imagePreviewUrl
                        ? t.inventory.imageReplace
                        : t.inventory.imageSelect}
                    </label>
                    <span className="form-field__hint">{t.inventory.imageHint}</span>
                  </div>
                </div>

                <div className="asset-image-field">
                  <span className="asset-image-field__label">{t.inventory.imagePreview}</span>
                  {renderEquipmentMedia(
                    createForm.imagePreviewUrl,
                    createForm.name || t.inventory.name,
                  )}
                  {createForm.imagePreviewUrl && (
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => removeImage('create')}
                    >
                      {t.inventory.imageRemove}
                    </button>
                  )}
                </div>
              </aside>
            </form>
          )}
        </section>
      )}

      <section className="section-card section-card--compact filter-panel">
        <div className="filter-panel__grid">
          <div className="form-field">
            <label htmlFor="inventory-search">{t.common.search}</label>
            <input
              id="inventory-search"
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setMergedSearchParams(setSearchParams, {
                  search: event.target.value.trim() ? event.target.value : null,
                })
              }
              placeholder={t.inventory.searchPlaceholder}
            />
          </div>

          <div className="form-field">
            <label htmlFor="inventory-status-filter">{t.inventory.statusFilterLabel}</label>
            <select
              id="inventory-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setMergedSearchParams(setSearchParams, {
                  status: event.target.value === 'all' ? null : event.target.value,
                })
              }
            >
              <option value="all">{t.inventory.allStatuses}</option>
              <option value="Available">{t.inventory.available}</option>
              <option value="CheckedOut">{t.inventory.checkedOut}</option>
              <option value="Maintenance">{t.inventory.maintenance}</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="inventory-category-filter">{t.inventory.categoryFilterLabel}</label>
            <select
              id="inventory-category-filter"
              value={categoryFilter}
              onChange={(event) =>
                setMergedSearchParams(setSearchParams, {
                  category: event.target.value === 'all' ? null : event.target.value,
                })
              }
            >
              <option value="all">{t.inventory.allCategories}</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="inventory-sort">{t.inventory.sortByLabel}</label>
            <select
              id="inventory-sort"
              value={sortBy}
              onChange={(event) =>
                setMergedSearchParams(setSearchParams, {
                  sort: event.target.value === 'name' ? null : event.target.value,
                })
              }
            >
              <option value="name">{t.inventory.sortByName}</option>
              <option value="newest">{t.inventory.sortByNewest}</option>
              <option value="oldest">{t.inventory.sortByOldest}</option>
            </select>
          </div>
        </div>

        <div className="filter-panel__footer">
          <p className="filter-panel__summary">
            {filteredEquipments.length} / {equipments.length}
          </p>
          <button type="button" className="button-secondary" onClick={resetFilters}>
            {t.common.clearFilters}
          </button>
        </div>
      </section>

      <section className="inventory-stack">
          <div className="section-heading section-heading--toolbar">
            <div>
              <span className="section-heading__eyebrow">{t.inventory.liveKicker}</span>
              <h2 className="section-heading__title">{t.inventory.liveTitle}</h2>
            </div>
            <div className="section-heading__aside">
              <p className="section-heading__text">{t.inventory.liveText}</p>
              <div className="view-switch" role="group" aria-label={t.common.view}>
                <button
                  type="button"
                  className={`view-switch__button ${
                    inventoryView === 'cards' ? 'view-switch__button--active' : ''
                  }`}
                  onClick={() =>
                    setMergedSearchParams(setSearchParams, {
                      view: 'cards',
                    })
                  }
                >
                  {t.common.cardsView}
                </button>
                <button
                  type="button"
                  className={`view-switch__button ${
                    inventoryView === 'list' ? 'view-switch__button--active' : ''
                  }`}
                  onClick={() =>
                    setMergedSearchParams(setSearchParams, {
                      view: null,
                    })
                  }
                >
                  {t.common.listView}
                </button>
              </div>
            </div>
          </div>

          {equipments.length === 0 ? (
            <div className="empty-state">
              <h3>{t.inventory.emptyTitle}</h3>
              <p>{t.inventory.emptyText}</p>
            </div>
          ) : filteredEquipments.length === 0 ? (
            <div className="empty-state">
              <h3>{t.inventory.noResultsTitle}</h3>
              <p>{t.inventory.noResultsText}</p>
            </div>
          ) : inventoryView === 'list' ? (
            <div
              className={`data-list data-list--inventory${
                isAdmin ? ' data-list--inventory-admin' : ' data-list--inventory-user'
              }`}
            >
              <div className="data-list__header">
                <span className="data-list__heading">{t.common.asset}</span>
                <span className="data-list__heading">{t.inventory.assignee}</span>
                <span className="data-list__heading">{t.inventory.serial}</span>
                <span className="data-list__heading">{t.common.status}</span>
                <span className="data-list__heading">{t.inventory.recordedAt}</span>
                <span className="data-list__heading data-list__heading--actions">
                  {t.common.actions}
                </span>
              </div>

              {filteredEquipments.map((equipment) => {
                const dueState = getDueState(equipment.activeCheckoutDueAt)

                return editingEquipmentId === equipment.id ? (
                  renderEquipmentCard(equipment)
                ) : (
                  <article key={equipment.id} className="data-list__row">
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
                          <strong className="data-list__primary-text">{equipment.name}</strong>
                          <span className="data-list__secondary-text">
                            {equipment.category}
                          </span>
                          <span className="data-list__tertiary-text">
                            {equipment.description || t.inventory.listDescriptionFallback}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="data-list__cell data-list__cell--context">
                      <span className="data-list__mobile-label">{t.inventory.assignee}</span>
                      {getStatusContext(equipment) ? (
                        <div className="data-list__context-stack">
                          <span className="data-list__context-label">
                            {getStatusContext(equipment)?.label}
                          </span>
                          <strong className="data-list__context-name">
                            {getStatusContext(equipment)?.value}
                          </strong>
                          {equipment.activeCheckoutDueAt && (
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
                        {equipment.activeCheckoutDueAt && (
                          <span className={dueState?.pillClass}>{dueState?.pillLabel}</span>
                        )}
                      </div>
                    </div>

                    <div className="data-list__cell">
                      <span className="data-list__mobile-label">{t.inventory.recordedAt}</span>
                      <span className="data-list__value">
                        {formatDate(equipment.createdAt, language)}
                      </span>
                    </div>

                    <div className="data-list__cell data-list__cell--actions">
                      <div className="data-list__action-row">
                        {renderInventoryActions(equipment, { compact: true })}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="equipment-list">{filteredEquipments.map(renderEquipmentCard)}</div>
          )}
      </section>
    </div>
  )

}

export default EquipmentListPage
