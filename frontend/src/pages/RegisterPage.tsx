import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/authApi'
import { useLanguage } from '../context/LanguageContext'

function RegisterPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })

  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      const response = await register(formData)
      setSuccessMessage(response.message)

      setTimeout(() => {
        navigate('/login')
      }, 1000)
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message || 'Sikertelen regisztráció.'

      setErrorMessage(apiMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-aside">
        <div className="auth-aside__intro">
          <span className="page-kicker">{t.auth.registerKicker}</span>
          <h1 className="page-title">{t.auth.registerHeroTitle}</h1>
          <p className="page-subtitle">{t.auth.registerHeroText}</p>
        </div>

        <div className="auth-highlights">
          <div className="auth-highlights__item">
            <strong>{t.auth.registerHighlightsWorkspaceTitle}</strong>
            <span>{t.auth.registerHighlightsWorkspaceText}</span>
          </div>
          <div className="auth-highlights__item">
            <strong>{t.auth.registerHighlightsNavTitle}</strong>
            <span>{t.auth.registerHighlightsNavText}</span>
          </div>
          <div className="auth-highlights__item">
            <strong>{t.auth.registerHighlightsFeedbackTitle}</strong>
            <span>{t.auth.registerHighlightsFeedbackText}</span>
          </div>
        </div>
      </section>

      <section className="auth-page">
        <div className="section-heading section-heading--tight">
          <div>
            <span className="section-heading__eyebrow">{t.auth.createAccess}</span>
            <h2 className="section-heading__title">{t.auth.registerTitle}</h2>
          </div>
          <p className="section-heading__text">{t.auth.registerText}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="name">{t.auth.name}</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder={t.auth.fullNamePlaceholder}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="email">{t.auth.email}</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t.auth.emailPlaceholder}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">{t.auth.password}</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              placeholder={t.auth.minPasswordPlaceholder}
            />
          </div>

          {errorMessage && <p className="form-error">{errorMessage}</p>}
          {successMessage && <p className="form-success">{successMessage}</p>}

          <button
            type="submit"
            className="form-submit form-submit--full"
            disabled={isSubmitting}
          >
            {isSubmitting ? t.auth.registerSubmitting : t.auth.registerSubmit}
          </button>
        </form>

        <p className="auth-page__footer">
          {t.auth.hasAccount} <Link to="/login">{t.auth.loginHere}</Link>
        </p>
      </section>
    </div>
  )
}

export default RegisterPage
