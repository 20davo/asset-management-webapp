import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useLanguage()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [errorMessage, setErrorMessage] = useState('')
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
    setIsSubmitting(true)

    try {
      await login(formData)
      navigate('/')
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message || 'Sikertelen bejelentkezés.'

      setErrorMessage(apiMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-aside">
        <div className="auth-aside__intro">
          <span className="page-kicker">{t.auth.loginKicker}</span>
          <h1 className="page-title">{t.auth.loginHeroTitle}</h1>
          <p className="page-subtitle">{t.auth.loginHeroText}</p>
        </div>

        <div className="auth-highlights">
          <div className="auth-highlights__item">
            <strong>{t.auth.highlightsInventoryTitle}</strong>
            <span>{t.auth.highlightsInventoryText}</span>
          </div>
          <div className="auth-highlights__item">
            <strong>{t.auth.highlightsAdminTitle}</strong>
            <span>{t.auth.highlightsAdminText}</span>
          </div>
          <div className="auth-highlights__item">
            <strong>{t.auth.highlightsTrackingTitle}</strong>
            <span>{t.auth.highlightsTrackingText}</span>
          </div>
        </div>
      </section>

      <section className="auth-page">
        <div className="section-heading section-heading--tight">
          <div>
            <span className="section-heading__eyebrow">{t.auth.welcomeBack}</span>
            <h2 className="section-heading__title">{t.auth.loginTitle}</h2>
          </div>
          <p className="section-heading__text">{t.auth.loginText}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
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
              placeholder={t.auth.passwordPlaceholder}
              required
            />
          </div>

          {errorMessage && <p className="form-error">{errorMessage}</p>}

          <button
            type="submit"
            className="form-submit form-submit--full"
            disabled={isSubmitting}
          >
            {isSubmitting ? t.auth.loginSubmitting : t.auth.loginSubmit}
          </button>
        </form>

        <p className="auth-page__footer">
          {t.auth.noAccount} <Link to="/register">{t.auth.registerHere}</Link>
        </p>
      </section>
    </div>
  )
}

export default LoginPage
