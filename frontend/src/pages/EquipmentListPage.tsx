import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  getStatusLabel,
  isCheckoutDueSoon,
  isCheckoutOverdue,
} from '../utils/presentation'
import {
  getEnumSearchParam,
  getTextSearchParam,
  setMergedSearchParams,
  toggleSortSearchParams,
} from '../utils/searchParams'
import { useLanguage } from '../context/LanguageContext'
import {
  emptyEquipmentForm,
  EquipmentForm,
  type EquipmentFormState,
} from '../components/equipment/EquipmentForm'
import {
  InventoryEquipmentCard,
  type InventoryDueState,
} from '../components/equipment/InventoryEquipmentCard'
import { InventoryEquipmentRow } from '../components/equipment/InventoryEquipmentRow'
import { InventoryFilters } from '../components/equipment/InventoryFilters'
import { InventoryActions } from '../components/equipment/InventoryActions'

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024
const CATEGORY_DATALIST_ID = 'equipment-category-suggestions'

type WarningFilter = 'all' | 'none' | 'dueSoon' | 'overdue'
type InventorySortField = 'asset' | 'assignee' | 'serial' | 'status' | 'recorded'

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

  const [createForm, setCreateForm] = useState<EquipmentFormState>(emptyEquipmentForm)
  const [editingEquipmentId, setEditingEquipmentId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<EquipmentFormState>(emptyEquipmentForm)

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
  const warningFilter = getEnumSearchParam(
    searchParams,
    'warning',
    ['all', 'none', 'dueSoon', 'overdue'] as const,
    'all',
  )
  const sortField = getEnumSearchParam(
    searchParams,
    'sort',
    ['asset', 'assignee', 'serial', 'status', 'recorded'] as const,
    'asset',
  )
  const sortDirection = getEnumSearchParam(searchParams, 'dir', ['asc', 'desc'] as const, 'asc')

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

  function normalizeCategoryValue(rawCategory: string) {
    const trimmedCategory = rawCategory.trim()

    if (!trimmedCategory) {
      return ''
    }

    const existingCategory = categories.find(
      (category) =>
        category.trim().toLocaleLowerCase(language) ===
        trimmedCategory.toLocaleLowerCase(language),
    )

    return existingCategory ?? trimmedCategory
  }

  function updateCreateCategory(rawCategory: string) {
    setCreateForm((prev) => ({
      ...prev,
      category: rawCategory,
    }))
  }

  function normalizeCreateCategory() {
    setCreateForm((prev) => ({
      ...prev,
      category: normalizeCategoryValue(prev.category),
    }))
  }

  function updateEditCategory(rawCategory: string) {
    setEditForm((prev) => ({
      ...prev,
      category: rawCategory,
    }))
  }

  function normalizeEditCategory() {
    setEditForm((prev) => ({
      ...prev,
      category: normalizeCategoryValue(prev.category),
    }))
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
    setEditForm(emptyEquipmentForm)
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
        category: normalizeCategoryValue(createForm.category),
        description: createForm.description.trim() || undefined,
        image: createForm.image,
        serialNumber: createForm.serialNumber.trim(),
      })

      setSuccessMessage(t.inventory.createSuccess)
      setCreateForm(emptyEquipmentForm)
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
        category: normalizeCategoryValue(editForm.category),
        description: editForm.description.trim() || undefined,
        image: editForm.image,
        removeImage: editForm.removeImage,
        serialNumber: editForm.serialNumber.trim(),
      })

      setSuccessMessage(t.inventory.updateSuccess)
      setEditingEquipmentId(null)
      setEditForm(emptyEquipmentForm)
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
      Array.from(
        equipments.reduce((accumulator, equipment) => {
          const trimmedCategory = equipment.category.trim()

          if (!trimmedCategory) {
            return accumulator
          }

          const normalizedKey = trimmedCategory.toLocaleLowerCase(language)

          if (!accumulator.has(normalizedKey)) {
            accumulator.set(normalizedKey, trimmedCategory)
          }

          return accumulator
        }, new Map<string, string>()).values(),
      ).sort((left, right) => left.localeCompare(right, language)),
    [equipments, language],
  )
  const filteredEquipments = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    const result = equipments.filter((equipment) => {
      const canSeeDueState = canSeeCheckoutDetails(equipment)
      const warningState = canSeeDueState
        ? getWarningState(equipment.activeCheckoutDueAt)
        : 'none'
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
      const matchesWarning =
        warningFilter === 'all' ? true : warningState === warningFilter

      return matchesSearch && matchesStatus && matchesCategory && matchesWarning
    })

    result.sort((left, right) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1

      switch (sortField) {
        case 'assignee': {
          const leftValue = getSortAssigneeValue(left)
          const rightValue = getSortAssigneeValue(right)
          return leftValue.localeCompare(rightValue, language) * multiplier
        }
        case 'serial':
          return (
            left.serialNumber.localeCompare(right.serialNumber, language, { numeric: true }) *
            multiplier
          )
        case 'status':
          return (
            getStatusLabel(left.status, language).localeCompare(
              getStatusLabel(right.status, language),
              language,
            ) * multiplier
          )
        case 'recorded':
          return (
            (new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()) *
            multiplier
          )
        case 'asset':
        default:
          return left.name.localeCompare(right.name, language) * multiplier
      }
    })

    return result
  }, [
    categoryFilter,
    equipments,
    language,
    searchQuery,
    sortDirection,
    sortField,
    statusFilter,
    warningFilter,
  ])

  function resetFilters() {
    setMergedSearchParams(setSearchParams, {
      search: null,
      status: null,
      category: null,
      warning: null,
      sort: null,
      dir: null,
      view: null,
    })
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

  function getSortAssigneeValue(equipment: EquipmentListItem) {
    const context = getStatusContext(equipment)
    return context?.value ?? ''
  }

  function canSeeCheckoutDetails(equipment: EquipmentListItem) {
    if (isAdmin) {
      return true
    }

    if (!user?.name || equipment.status !== 'CheckedOut') {
      return false
    }

    return (
      equipment.activeCheckoutUserName?.trim().toLocaleLowerCase(language) ===
      user.name.trim().toLocaleLowerCase(language)
    )
  }

  function getDueState(dueAt: string | null): InventoryDueState | null {
    if (!dueAt) {
      return null
    }

    if (isCheckoutOverdue(dueAt, null)) {
      return {
        alertClass: 'deadline-flag deadline-flag--danger',
        alertLabel: t.checkouts.overdueBadge,
        detailLabel: t.details.overduePrefix,
      }
    }

    if (isCheckoutDueSoon(dueAt, null)) {
      return {
        alertClass: 'deadline-flag deadline-flag--warning',
        alertLabel: t.checkouts.dueSoonBadge,
        detailLabel: t.details.dueSoonPrefix,
      }
    }

    return {
      alertClass: null,
      alertLabel: null,
      detailLabel: t.details.deadlinePrefix,
    }
  }

  function getWarningState(dueAt: string | null): Exclude<WarningFilter, 'all'> {
    if (!dueAt) {
      return 'none'
    }

    if (isCheckoutOverdue(dueAt, null)) {
      return 'overdue'
    }

    if (isCheckoutDueSoon(dueAt, null)) {
      return 'dueSoon'
    }

    return 'none'
  }

  function renderSortableHeading(field: InventorySortField, label: string) {
    const isActive = sortField === field
    const icon = !isActive ? '↕' : sortDirection === 'asc' ? '↑' : '↓'

    return (
      <button
        type="button"
        className="data-list__sort-button"
        onClick={() => toggleSortSearchParams(setSearchParams, 'sort', 'dir', field)}
      >
        <span>{label}</span>
        <span className="data-list__sort-icon" aria-hidden="true">
          {icon}
        </span>
      </button>
    )
  }

  function renderInventoryActions(
    equipment: EquipmentListItem,
    options?: { compact?: boolean; shortLabels?: boolean },
  ) {
    return (
      <InventoryActions
        deletingEquipmentId={deletingEquipmentId}
        equipment={equipment}
        isAdmin={isAdmin}
        onDelete={handleDelete}
        onEdit={startEdit}
        onMarkAvailable={handleMarkAvailable}
        onMarkMaintenance={handleMarkMaintenance}
        options={options}
        statusChangingEquipmentId={statusChangingEquipmentId}
      />
    )
  }

  function renderEquipmentCard(equipment: EquipmentListItem) {
    const statusContext = getStatusContext(equipment)
    const canSeeDueState = canSeeCheckoutDetails(equipment)
    const dueState = canSeeDueState ? getDueState(equipment.activeCheckoutDueAt) : null

    if (editingEquipmentId === equipment.id) {
      return (
        <article key={equipment.id} className="equipment-card equipment-card--editing">
          <EquipmentForm
            categoryDatalistId={CATEGORY_DATALIST_ID}
            form={editForm}
            idPrefix={`edit-${equipment.id}`}
            isSubmitting={isUpdating}
            mediaFallbackName={equipment.name}
            onCancel={cancelEdit}
            onCategoryBlur={normalizeEditCategory}
            onCategoryChange={updateEditCategory}
            onImageChange={(event) => handleImageChange(event, 'edit')}
            onRemoveImage={() => removeImage('edit')}
            onSubmit={(event) => handleEditSubmit(event, equipment.id)}
            setForm={setEditForm}
            submitLabel={t.inventory.saveChanges}
            submittingLabel={t.inventory.saving}
            titleBlock={{
              kicker: t.inventory.editingKicker,
              title: t.inventory.editingTitle,
              text: t.inventory.editingText,
            }}
          />
        </article>
      )
    }

    return (
      <InventoryEquipmentCard
        key={equipment.id}
        actions={renderInventoryActions(equipment, { shortLabels: true })}
        canSeeDueState={canSeeDueState}
        dueState={dueState}
        equipment={equipment}
        statusContext={statusContext}
      />
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

      <datalist id={CATEGORY_DATALIST_ID}>
        {categories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>

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
            <EquipmentForm
              categoryDatalistId={CATEGORY_DATALIST_ID}
              form={createForm}
              idPrefix="create"
              isSubmitting={isCreating}
              mediaFallbackName={t.inventory.name}
              onCategoryBlur={normalizeCreateCategory}
              onCategoryChange={updateCreateCategory}
              onImageChange={(event) => handleImageChange(event, 'create')}
              onRemoveImage={() => removeImage('create')}
              onSubmit={handleCreateSubmit}
              setForm={setCreateForm}
              submitLabel={t.inventory.saveItem}
              submittingLabel={t.inventory.saving}
            />
          )}
        </section>
      )}

      <InventoryFilters
        categories={categories}
        categoryFilter={categoryFilter}
        equipmentCount={equipments.length}
        filteredCount={filteredEquipments.length}
        onCategoryChange={(value) =>
          setMergedSearchParams(setSearchParams, {
            category: value === 'all' ? null : value,
          })
        }
        onReset={resetFilters}
        onSearchChange={(value) =>
          setMergedSearchParams(setSearchParams, {
            search: value.trim() ? value : null,
          })
        }
        onStatusChange={(value) =>
          setMergedSearchParams(setSearchParams, {
            status: value === 'all' ? null : value,
            warning: value === 'CheckedOut' ? searchParams.get('warning') : null,
          })
        }
        onWarningChange={(value) =>
          setMergedSearchParams(setSearchParams, {
            warning: value === 'all' ? null : value,
          })
        }
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        warningFilter={warningFilter}
      />

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
                <span className="data-list__heading">{renderSortableHeading('asset', t.common.asset)}</span>
                <span className="data-list__heading">{renderSortableHeading('assignee', t.inventory.assignee)}</span>
                <span className="data-list__heading">{renderSortableHeading('serial', t.inventory.serial)}</span>
                <span className="data-list__heading">{renderSortableHeading('status', t.common.status)}</span>
                <span className="data-list__heading">{renderSortableHeading('recorded', t.inventory.recordedAt)}</span>
                <span className="data-list__heading data-list__heading--actions">
                  {t.common.actions}
                </span>
              </div>

              {filteredEquipments.map((equipment) => {
                const statusContext = getStatusContext(equipment)
                const canSeeDueState = canSeeCheckoutDetails(equipment)
                const dueState = canSeeDueState
                  ? getDueState(equipment.activeCheckoutDueAt)
                  : null

                return editingEquipmentId === equipment.id ? (
                  renderEquipmentCard(equipment)
                ) : (
                  <InventoryEquipmentRow
                    key={equipment.id}
                    actions={renderInventoryActions(equipment, { compact: true })}
                    canSeeDueState={canSeeDueState}
                    dueState={dueState}
                    equipment={equipment}
                    statusContext={statusContext}
                  />
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
