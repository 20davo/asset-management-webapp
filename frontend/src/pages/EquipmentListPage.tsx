import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createEquipment,
  deleteEquipment,
  getEquipments,
  markEquipmentAvailable,
  markEquipmentMaintenance,
  updateEquipment,
} from '../api/EquipmentApi'
import { useAuth } from '../context/AuthContext'
import type { EquipmentListItem } from '../types/equipment'
import {
  formatDate,
  getStatusBadgeClass,
  getStatusLabel,
} from '../utils/presentation'
import { useLanguage } from '../context/LanguageContext'

interface EquipmentFormState {
  name: string
  category: string
  description: string
  serialNumber: string
}

const emptyForm: EquipmentFormState = {
  name: '',
  category: '',
  description: '',
  serialNumber: '',
}

function getStatusBadgeClassLegacy(status: string) {
  switch (status) {
    case 'Available':
      return 'status-badge status-badge--available'
    case 'CheckedOut':
      return 'status-badge status-badge--checkedout'
    case 'Maintenance':
      return 'status-badge status-badge--maintenance'
    default:
      return 'status-badge'
  }
}

function getStatusLabelLegacy(status: string) {
  switch (status) {
    case 'Available':
      return 'Elérhető'
    case 'CheckedOut':
      return 'Kikérve'
    case 'Maintenance':
      return 'Karbantartás'
    default:
      return status
  }
}

void getStatusBadgeClassLegacy
void getStatusLabelLegacy

function EquipmentListPage() {
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const isAdmin = user?.role === 'Admin'

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
      serialNumber: equipment.serialNumber,
    })
  }

  function cancelEdit() {
    setEditingEquipmentId(null)
    setEditForm(emptyForm)
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
        serialNumber: createForm.serialNumber.trim(),
      })

      setSuccessMessage(t.inventory.createSuccess)
      setCreateForm(emptyForm)
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
              ? `${t.inventory.latestRecorded}: ${newestEquipment.name} • ${formatDate(newestEquipment.createdAt, language)}`
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

      <div className={`dashboard-grid ${isAdmin ? '' : 'dashboard-grid--single'}`}>
        {isAdmin && (
          <section className="section-card form-section section-card--sticky">
            <div className="section-heading section-heading--tight">
              <div>
                <span className="section-heading__eyebrow">{t.inventory.adminKicker}</span>
                <h2 className="section-heading__title">{t.inventory.adminTitle}</h2>
              </div>
              <p className="section-heading__text">{t.inventory.adminText}</p>
            </div>

            <form className="auth-form" onSubmit={handleCreateSubmit}>
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
                  rows={4}
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="form-submit form-submit--full"
                  disabled={isCreating}
                >
                  {isCreating ? t.inventory.saving : t.inventory.saveItem}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="inventory-stack">
          <div className="section-heading">
            <div>
              <span className="section-heading__eyebrow">{t.inventory.liveKicker}</span>
              <h2 className="section-heading__title">{t.inventory.liveTitle}</h2>
            </div>
            <p className="section-heading__text">{t.inventory.liveText}</p>
          </div>

          {equipments.length === 0 ? (
            <div className="empty-state">
              <h3>{t.inventory.emptyTitle}</h3>
              <p>{t.inventory.emptyText}</p>
            </div>
          ) : (
            <div className="equipment-list">
              {equipments.map((equipment) => (
                <article key={equipment.id} className="equipment-card">
                  {editingEquipmentId === equipment.id ? (
                    <form
                      className="auth-form"
                      onSubmit={(event) => handleEditSubmit(event, equipment.id)}
                    >
                      <div className="section-heading section-heading--tight">
                        <div>
                          <span className="section-heading__eyebrow">
                            {t.inventory.editingKicker}
                          </span>
                          <h3 className="section-heading__title">
                            {t.inventory.editingTitle}
                          </h3>
                        </div>
                        <p className="section-heading__text">{t.inventory.editingText}</p>
                      </div>

                      <div className="form-row">
                        <div className="form-field">
                          <label htmlFor={`edit-name-${equipment.id}`}>
                            {t.inventory.name}
                          </label>
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
                        <label htmlFor={`edit-serial-${equipment.id}`}>
                          {t.inventory.serial}
                        </label>
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
                          rows={4}
                        />
                      </div>

                      <div className="form-actions">
                        <button type="submit" disabled={isUpdating}>
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
                    </form>
                  ) : (
                    <>
                      <div className="equipment-card__eyebrow">
                        <span className="equipment-card__serial">
                          SN {equipment.serialNumber}
                        </span>
                        <span className={getStatusBadgeClass(equipment.status)}>
                          {getStatusLabel(equipment.status, language)}
                        </span>
                      </div>

                      <div className="equipment-card__header">
                        <div className="equipment-card__title-group">
                          <h3 className="equipment-card__title-small">{equipment.name}</h3>
                          <p className="equipment-card__subtitle">{equipment.category}</p>
                        </div>
                      </div>

                      <div className="equipment-meta">
                        <div className="equipment-meta__item">
                          <span className="equipment-meta__label">{t.inventory.category}</span>
                          <span className="equipment-meta__value">{equipment.category}</span>
                        </div>

                        <div className="equipment-meta__item">
                          <span className="equipment-meta__label">{t.inventory.recordedAt}</span>
                          <span className="equipment-meta__value">
                            {formatDate(equipment.createdAt, language)}
                          </span>
                        </div>
                      </div>

                      {equipment.description && (
                        <div className="equipment-description">
                          <span className="equipment-description__label">
                            {t.inventory.description}
                          </span>
                          <p className="equipment-description__text">
                            {equipment.description}
                          </p>
                        </div>
                      )}

                      <div className="equipment-card__actions">
                        <Link
                          to={`/equipment/${equipment.id}`}
                          className="button-link button-secondary"
                        >
                          {t.inventory.details}
                        </Link>

                        {isAdmin && (
                          <button type="button" onClick={() => startEdit(equipment)}>
                            {t.inventory.edit}
                          </button>
                        )}

                        {isAdmin && equipment.status === 'Available' && (
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={() => handleMarkMaintenance(equipment.id)}
                            disabled={statusChangingEquipmentId === equipment.id}
                          >
                            {statusChangingEquipmentId === equipment.id
                              ? t.inventory.saving
                              : t.inventory.makeMaintenance}
                          </button>
                        )}

                        {isAdmin && equipment.status === 'Maintenance' && (
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={() => handleMarkAvailable(equipment.id)}
                            disabled={statusChangingEquipmentId === equipment.id}
                          >
                            {statusChangingEquipmentId === equipment.id
                              ? t.inventory.saving
                              : t.inventory.makeAvailable}
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            type="button"
                            className="button-danger"
                            onClick={() => handleDelete(equipment.id)}
                            disabled={deletingEquipmentId === equipment.id}
                          >
                            {deletingEquipmentId === equipment.id
                              ? t.inventory.deleting
                              : t.inventory.delete}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )

  /*

  if (isLoading) {
    return <p>Eszközök betöltése...</p>
  }

  if (errorMessage && equipments.length === 0) {
    return <p className="form-error">{errorMessage}</p>
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h2 className="page-title">Eszközök</h2>
          <p className="page-subtitle">A rendszerben lévő eszközök áttekintése.</p>
        </div>
      </div>

      {errorMessage && <p className="form-error">{errorMessage}</p>}
      {successMessage && <p className="form-success">{successMessage}</p>}

      {isAdmin && (
        <div className="section-card form-section">
          <h3>Új eszköz létrehozása</h3>

          <form className="auth-form" onSubmit={handleCreateSubmit}>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="create-name">Név</label>
                <input
                  id="create-name"
                  type="text"
                  value={createForm.name}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="create-category">Kategória</label>
                <input
                  id="create-category"
                  type="text"
                  value={createForm.category}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, category: event.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="create-serial">Gyári szám</label>
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
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="create-description">Leírás</label>
                <input
                  id="create-description"
                  type="text"
                  value={createForm.description}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="form-submit"
                disabled={isCreating}
              >
                {isCreating ? 'Mentés...' : 'Eszköz létrehozása'}
              </button>
            </div>
          </form>
        </div>
      )}

      {equipments.length === 0 ? (
        <p>Nincs még eszköz a rendszerben.</p>
      ) : (
        <div className="equipment-list">
          {equipments.map((equipment) => (
            <div key={equipment.id} className="equipment-card">
              {editingEquipmentId === equipment.id ? (
                <form
                  className="auth-form"
                  onSubmit={(event) => handleEditSubmit(event, equipment.id)}
                >
                  <h3>Eszköz szerkesztése</h3>

                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor={`edit-name-${equipment.id}`}>Név</label>
                      <input
                        id={`edit-name-${equipment.id}`}
                        type="text"
                        value={editForm.name}
                        onChange={(event) =>
                          setEditForm((prev) => ({ ...prev, name: event.target.value }))
                        }
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor={`edit-category-${equipment.id}`}>Kategória</label>
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

                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor={`edit-serial-${equipment.id}`}>Gyári szám</label>
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
                      <label htmlFor={`edit-description-${equipment.id}`}>Leírás</label>
                      <input
                        id={`edit-description-${equipment.id}`}
                        type="text"
                        value={editForm.description}
                        onChange={(event) =>
                          setEditForm((prev) => ({
                            ...prev,
                            description: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" disabled={isUpdating}>
                      {isUpdating ? 'Mentés...' : 'Mentés'}
                    </button>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={cancelEdit}
                      disabled={isUpdating}
                    >
                      Mégse
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <Link
                    to={`/equipment/${equipment.id}`}
                    className="equipment-card__content"
                  >
                    <div className="equipment-card__header">
                      <div className="equipment-card__title-group">
                        <h3 className="equipment-card__title-small">{equipment.name}</h3>
                        <p className="equipment-card__subtitle">
                          {equipment.category}
                        </p>
                      </div>

                      <span className={getStatusBadgeClass(equipment.status)}>
                        {getStatusLabel(equipment.status)}
                      </span>
                    </div>

                    <div className="equipment-meta">
                      <div className="equipment-meta__item">
                        <span className="equipment-meta__label">Kategória</span>
                        <span className="equipment-meta__value">{equipment.category}</span>
                      </div>

                      <div className="equipment-meta__item">
                        <span className="equipment-meta__label">Gyári szám</span>
                        <span className="equipment-meta__value">
                          {equipment.serialNumber}
                        </span>
                      </div>
                    </div>

                    {equipment.description && (
                      <div className="equipment-description">
                        <span className="equipment-description__label">Leírás</span>
                        <p className="equipment-description__text">
                          {equipment.description}
                        </p>
                      </div>
                    )}
                  </Link>

                  {isAdmin && (
                    <div className="equipment-card__actions">
                      <button type="button" onClick={() => startEdit(equipment)}>
                        Szerkesztés
                      </button>

                      {equipment.status === 'Available' && (
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={() => handleMarkMaintenance(equipment.id)}
                          disabled={statusChangingEquipmentId === equipment.id}
                        >
                          {statusChangingEquipmentId === equipment.id
                            ? 'Mentés...'
                            : 'Karbantartás'}
                        </button>
                      )}

                      {equipment.status === 'Maintenance' && (
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={() => handleMarkAvailable(equipment.id)}
                          disabled={statusChangingEquipmentId === equipment.id}
                        >
                          {statusChangingEquipmentId === equipment.id
                            ? 'Mentés...'
                            : 'Elérhetővé tesz'}
                        </button>
                      )}

                      <button
                        type="button"
                        className="button-danger"
                        onClick={() => handleDelete(equipment.id)}
                        disabled={deletingEquipmentId === equipment.id}
                      >
                        {deletingEquipmentId === equipment.id
                          ? 'Törlés...'
                          : 'Törlés'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
  */
}

export default EquipmentListPage
