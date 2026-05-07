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
  const secondaryTitle =
    user.role === 'Admin' ? t.profile.managementTitle : t.profile.quickLinksTitle
  const secondaryText =
    user.role === 'Admin' ? t.profile.managementText : t.profile.quickLinksText
  const secondaryKicker =
    user.role === 'Admin' ? t.profile.managementKicker : t.profile.quickLinksKicker

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
          <p className="page-hero__panel-text profile-page__email">{user.email}</p>
        </div>
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

          <div className="profile-summary-grid">
            <div className="profile-summary-column profile-summary-column--main">
              <article className="profile-summary-item">
                <span className="profile-summary-item__label">{t.profile.nameLabel}</span>
                <strong className="profile-summary-item__value">{user.name}</strong>
              </article>

              <article className="profile-summary-item">
                <span className="profile-summary-item__label">{t.profile.emailLabel}</span>
                <strong className="profile-summary-item__value profile-page__email">
                  {user.email}
                </strong>
              </article>
            </div>

            <div className="profile-summary-column profile-summary-column--role">
              <article className="profile-summary-item">
                <span className="profile-summary-item__label">{t.profile.roleLabel}</span>
                <strong className="profile-summary-item__value">
                  {getRoleLabel(user.role, language)}
                </strong>
              </article>
            </div>
          </div>
        </article>

        <aside className="section-card section-card--compact">
          <div className="section-heading section-heading--tight">
            <div>
              <span className="section-heading__eyebrow">{secondaryKicker}</span>
              <h2 className="section-heading__title">{secondaryTitle}</h2>
              <p className="section-heading__text">{secondaryText}</p>
            </div>
          </div>

          <div className="profile-actions">
            <Link to={primaryRoute} className="button-link button-secondary">
              {primaryLabel}
            </Link>
            <Link to="/profile/security" className="button-link button-secondary">
              {t.profile.securityAction}
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
