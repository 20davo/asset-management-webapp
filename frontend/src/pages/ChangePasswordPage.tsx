import { useState } from 'react'
import { Link } from 'react-router-dom'
import { changePassword } from '../api/authApi'
import { useLanguage } from '../context/LanguageContext'
import { getApiErrorMessage } from '../utils/apiErrors'

function ChangePasswordPage() {
  const { t } = useLanguage()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (newPassword !== confirmNewPassword) {
      setErrorMessage(t.profile.passwordMismatch)
      setSuccessMessage('')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage('')
      const response = await changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      })

      setSuccessMessage(response.message)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, t.profile.passwordChangeError))
      setSuccessMessage('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-shell">
      <Link to="/profile" className="back-link">
        {t.profile.backToProfile}
      </Link>

      <section className="page-hero">
        <div className="page-hero__content">
          <span className="page-kicker">{t.profile.securityKicker}</span>
          <h1 className="page-title">{t.profile.securityTitle}</h1>
          <p className="page-subtitle">{t.profile.securityText}</p>
        </div>

        <div className="page-hero__panel">
          <span className="page-hero__panel-label">{t.profile.securityPanelLabel}</span>
          <strong className="page-hero__panel-value">{t.profile.securityPanelValue}</strong>
          <p className="page-hero__panel-text">{t.profile.securityPanelText}</p>
        </div>
      </section>

      <section className="details-layout">
        <article className="section-card">
          <div className="section-heading section-heading--tight">
            <div>
              <span className="section-heading__eyebrow">{t.profile.securityFormKicker}</span>
              <h2 className="section-heading__title">{t.profile.securityFormTitle}</h2>
              <p className="section-heading__text">{t.profile.securityFormText}</p>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="current-password">{t.profile.currentPasswordLabel}</label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder={t.auth.passwordPlaceholder}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="new-password">{t.profile.newPasswordLabel}</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder={t.auth.minPasswordPlaceholder}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="confirm-new-password">{t.profile.confirmNewPasswordLabel}</label>
                <input
                  id="confirm-new-password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(event) => setConfirmNewPassword(event.target.value)}
                  placeholder={t.auth.minPasswordPlaceholder}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
            </div>

            {errorMessage && <p className="form-error">{errorMessage}</p>}
            {successMessage && <p className="form-success">{successMessage}</p>}

            <div className="form-actions">
              <button type="submit" className="form-submit" disabled={isSubmitting}>
                {isSubmitting ? t.profile.passwordChangeSubmitting : t.profile.passwordChangeSubmit}
              </button>
              <Link to="/profile" className="button-link button-secondary">
                {t.inventory.cancel}
              </Link>
            </div>
          </form>
        </article>

        <aside className="section-card section-card--compact">
          <div className="section-heading section-heading--tight">
            <div>
              <span className="section-heading__eyebrow">{t.profile.securityTipsKicker}</span>
              <h2 className="section-heading__title">{t.profile.securityTipsTitle}</h2>
              <p className="section-heading__text">{t.profile.securityTipsText}</p>
            </div>
          </div>

          <div className="info-stack">
            <div className="info-stack__item">
              <span className="info-stack__label">{t.profile.currentPasswordLabel}</span>
              <strong>{t.profile.securityTipCurrentPassword}</strong>
            </div>
            <div className="info-stack__item">
              <span className="info-stack__label">{t.profile.newPasswordLabel}</span>
              <strong>{t.profile.securityTipNewPassword}</strong>
            </div>
            <div className="info-stack__item">
              <span className="info-stack__label">{t.profile.confirmNewPasswordLabel}</span>
              <strong>{t.profile.securityTipConfirmation}</strong>
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default ChangePasswordPage
