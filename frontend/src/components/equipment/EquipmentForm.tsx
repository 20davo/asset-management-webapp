import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { ProtectedAssetImage } from '../media/ProtectedAssetImage'

export interface EquipmentFormState {
  name: string
  category: string
  description: string
  image: File | null
  imagePreviewUrl: string
  removeImage: boolean
  serialNumber: string
}

interface EquipmentFormProps {
  categoryDatalistId: string
  form: EquipmentFormState
  idPrefix: string
  isSubmitting: boolean
  mediaFallbackName: string
  onCancel?: () => void
  onCategoryBlur: () => void
  onCategoryChange: (value: string) => void
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  setForm: Dispatch<SetStateAction<EquipmentFormState>>
  submitLabel: string
  submittingLabel: string
  titleBlock?: {
    kicker: string
    title: string
    text: string
  }
}

export const emptyEquipmentForm: EquipmentFormState = {
  name: '',
  category: '',
  description: '',
  image: null,
  imagePreviewUrl: '',
  removeImage: false,
  serialNumber: '',
}

export function EquipmentForm({
  categoryDatalistId,
  form,
  idPrefix,
  isSubmitting,
  mediaFallbackName,
  onCancel,
  onCategoryBlur,
  onCategoryChange,
  onImageChange,
  onRemoveImage,
  onSubmit,
  setForm,
  submitLabel,
  submittingLabel,
  titleBlock,
}: EquipmentFormProps) {
  const { t } = useLanguage()

  return (
    <form className="auth-form admin-form" onSubmit={onSubmit}>
      <div className="admin-form__fields">
        {titleBlock && (
          <div className="section-heading section-heading--tight">
            <div>
              <span className="section-heading__eyebrow">{titleBlock.kicker}</span>
              <h3 className="section-heading__title">{titleBlock.title}</h3>
            </div>
            <p className="section-heading__text">{titleBlock.text}</p>
          </div>
        )}

        <div className="form-row">
          <div className="form-field">
            <label htmlFor={`${idPrefix}-name`}>{t.inventory.name}</label>
            <input
              id={`${idPrefix}-name`}
              type="text"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder={idPrefix === 'create' ? t.inventory.createNamePlaceholder : undefined}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor={`${idPrefix}-category`}>{t.inventory.category}</label>
            <input
              id={`${idPrefix}-category`}
              type="text"
              list={categoryDatalistId}
              value={form.category}
              onChange={(event) => onCategoryChange(event.target.value)}
              onBlur={onCategoryBlur}
              placeholder={
                idPrefix === 'create' ? t.inventory.createCategoryPlaceholder : undefined
              }
              autoComplete="off"
              required
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor={`${idPrefix}-serial`}>{t.inventory.serial}</label>
          <input
            id={`${idPrefix}-serial`}
            type="text"
            value={form.serialNumber}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, serialNumber: event.target.value }))
            }
            placeholder={idPrefix === 'create' ? t.inventory.createSerialPlaceholder : undefined}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor={`${idPrefix}-description`}>{t.inventory.description}</label>
          <textarea
            id={`${idPrefix}-description`}
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
            placeholder={
              idPrefix === 'create'
                ? t.inventory.createDescriptionPlaceholder
                : undefined
            }
            rows={5}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="form-submit" disabled={isSubmitting}>
            {isSubmitting ? submittingLabel : submitLabel}
          </button>
          {onCancel && (
            <button
              type="button"
              className="button-secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {t.inventory.cancel}
            </button>
          )}
        </div>
      </div>

      <aside className="admin-form__aside">
        <div className="form-field">
          <span>{t.inventory.image}</span>
          <div className="upload-control">
            <input
              id={`${idPrefix}-image`}
              className="upload-control__input"
              type="file"
              accept="image/*"
              onChange={onImageChange}
            />
            <label htmlFor={`${idPrefix}-image`} className="upload-control__button">
              {form.imagePreviewUrl ? t.inventory.imageReplace : t.inventory.imageSelect}
            </label>
            <span className="form-field__hint">{t.inventory.imageHint}</span>
          </div>
        </div>

        <div className="asset-image-field">
          <span className="asset-image-field__label">{t.inventory.imagePreview}</span>
          <div className="equipment-card__media">
            <ProtectedAssetImage
              imageUrl={form.imagePreviewUrl}
              alt={form.name || mediaFallbackName}
              className="equipment-card__image"
              placeholderClassName="equipment-card__image-placeholder"
              placeholderText={t.common.noImage}
            />
          </div>
          {form.imagePreviewUrl && (
            <button type="button" className="button-secondary" onClick={onRemoveImage}>
              {t.inventory.imageRemove}
            </button>
          )}
        </div>
      </aside>
    </form>
  )
}
