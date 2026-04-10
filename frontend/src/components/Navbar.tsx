import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { REGISTRATION_ENABLED } from '../config/runtime'
import { useLanguage } from '../context/LanguageContext'
import { getRoleLabel } from '../utils/presentation'

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const { language, setLanguage, t } = useLanguage()

  return (
    <header className="navbar-wrap">
      <nav className="navbar">
        <NavLink to={isAuthenticated ? '/' : '/login'} className="navbar__brand">
          <span className="navbar__brand-mark">AM</span>
          <span className="navbar__brand-copy">
            <span className="navbar__brand-title">Asset Management</span>
            <span className="navbar__brand-subtitle">{t.brandSubtitle}</span>
          </span>
        </NavLink>

        <div className="navbar__cluster">
          <div className="navbar__links">
            {isAuthenticated && (
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `navbar__link ${isActive ? 'navbar__link--active' : ''}`
                }
              >
                {t.nav.inventory}
              </NavLink>
            )}

            {isAuthenticated && (
              <NavLink
                to="/my-checkouts"
                className={({ isActive }) =>
                  `navbar__link ${isActive ? 'navbar__link--active' : ''}`
                }
              >
                {t.nav.myCheckouts}
              </NavLink>
            )}

            {!isAuthenticated && REGISTRATION_ENABLED && (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `navbar__link ${isActive ? 'navbar__link--active' : ''}`
                }
              >
                {t.nav.login}
              </NavLink>
            )}

            {!isAuthenticated && REGISTRATION_ENABLED && (
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `navbar__link ${isActive ? 'navbar__link--active' : ''}`
                }
              >
                {t.nav.register}
              </NavLink>
            )}
          </div>

          <div className="language-switcher" aria-label={t.nav.language}>
            <button
              type="button"
              className={`language-switcher__button ${
                language === 'hu' ? 'language-switcher__button--active' : ''
              }`}
              onClick={() => setLanguage('hu')}
            >
              HU
            </button>
            <button
              type="button"
              className={`language-switcher__button ${
                language === 'en' ? 'language-switcher__button--active' : ''
              }`}
              onClick={() => setLanguage('en')}
            >
              EN
            </button>
          </div>

          {isAuthenticated && (
            <div className="navbar__session">
              <div className="navbar__user-card">
                <span className="navbar__user-name">
                  {user?.name ?? t.nav.activeSession}
                </span>
                <span className="navbar__user-role">
                  {user ? getRoleLabel(user.role, language) : t.nav.loggedIn}
                </span>
              </div>

              <button className="navbar__logout-button" onClick={logout}>
                {t.nav.logout}
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Navbar
