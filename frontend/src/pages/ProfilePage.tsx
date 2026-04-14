import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { getRoleLabel } from '../utils/presentation'

function ProfilePage() {
  const { user } = useAuth()
  const { language, t } = useLanguage()

  if (!user) {
    return null
  }

  const primaryRoute = user.role === 'Admin' ? '/users' : '/my-items'
  const primaryLabel =
    user.role === 'Admin' ? t.profile.primaryAdminAction : t.profile.primaryUserAction

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="page-hero__content">
          <span className="page-kicker">{t.profile.heroKicker}</span>
          <h1 className="page-title">{user.name}</h1>
          <p className="page-subtitle">{t.profile.heroText}</p>
        </div>

        <div className="page-hero__panel">
          <span className="page-hero__panel-label">{t.profile.panelLabel}</span>
          <strong className="page-hero__panel-value">
            {getRoleLabel(user.role, language)}
          </strong>
          <p className="page-hero__panel-text">{user.email}</p>
        </div>
      </section>

      <section className="stats-grid stats-grid--three">
        <article className="stat-card">
          <span className="stat-card__label">{t.profile.nameLabel}</span>
          <strong className="stat-card__value stat-card__value--compact">
            {user.name}
          </strong>
          <span className="stat-card__note">{t.profile.nameHint}</span>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">{t.profile.emailLabel}</span>
          <strong className="stat-card__value stat-card__value--compact">
            {user.email}
          </strong>
          <span className="stat-card__note">{t.profile.emailHint}</span>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">{t.profile.roleLabel}</span>
          <strong className="stat-card__value stat-card__value--compact">
            {getRoleLabel(user.role, language)}
          </strong>
          <span className="stat-card__note">{t.profile.roleHint}</span>
        </article>
      </section>

      <section className="details-layout">
        <article className="section-card">
          <div className="section-heading section-heading--tight">
            <div>
              <span className="section-heading__eyebrow">{t.profile.accountKicker}</span>
              <h2 className="section-heading__title">{t.profile.accountTitle}</h2>
              <p className="section-heading__text">{t.profile.accountText}</p>
            </div>
          </div>

          <div className="info-stack">
            <div className="info-stack__item">
              <span className="info-stack__label">{t.profile.nameLabel}</span>
              <strong>{user.name}</strong>
            </div>
            <div className="info-stack__item">
              <span className="info-stack__label">{t.profile.emailLabel}</span>
              <strong>{user.email}</strong>
            </div>
            <div className="info-stack__item">
              <span className="info-stack__label">{t.profile.roleLabel}</span>
              <strong>{getRoleLabel(user.role, language)}</strong>
            </div>
          </div>
        </article>

        <aside className="section-card section-card--compact">
          <div className="section-heading section-heading--tight">
            <div>
              <span className="section-heading__eyebrow">{t.profile.quickLinksKicker}</span>
              <h2 className="section-heading__title">{t.profile.quickLinksTitle}</h2>
              <p className="section-heading__text">{t.profile.quickLinksText}</p>
            </div>
          </div>

          <div className="profile-actions">
            <Link to={primaryRoute} className="button-link button-secondary">
              {primaryLabel}
            </Link>
            <Link to="/settings" className="button-link button-secondary">
              {t.profile.settingsAction}
            </Link>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default ProfilePage
