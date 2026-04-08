import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/authApi'
import { useLanguage } from '../context/LanguageContext'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

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
    const normalizedEmail = formData.email.trim().toLowerCase()

    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage(t.auth.invalidEmail)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await register({
        ...formData,
        email: normalizedEmail,
      })
      setSuccessMessage(response.message)

      setTimeout(() => {
        navigate('/login')
      }, 1000)
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message ||
          Object.values(error?.response?.data?.errors ?? {}).flat()[0] ||
          t.auth.registerError,
      )
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
            <div className="password-input">
              <input
                id="password"
                name="password"
                type={isPasswordVisible ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder={t.auth.minPasswordPlaceholder}
              />
              <button
                type="button"
                className="password-input__toggle"
                onClick={() => setIsPasswordVisible((prev) => !prev)}
                aria-label={
                  isPasswordVisible ? t.auth.hidePassword : t.auth.showPassword
                }
                title={isPasswordVisible ? t.auth.hidePassword : t.auth.showPassword}
              >
                {isPasswordVisible ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M8 10V7.8a4 4 0 1 1 8 0V10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7.5 10h9a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 16.5 19h-9A1.5 1.5 0 0 1 6 17.5v-6A1.5 1.5 0 0 1 7.5 10Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M13.2 13.8 18.8 8.2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="m16.7 7.5 2.1-.2-.2 2.1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M8 10V7.8a4 4 0 1 1 8 0V10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7.5 10h9a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 16.5 19h-9A1.5 1.5 0 0 1 6 17.5v-6A1.5 1.5 0 0 1 7.5 10Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <circle cx="12" cy="14.5" r="1.2" fill="currentColor" />
                  </svg>
                )}
              </button>
            </div>
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
