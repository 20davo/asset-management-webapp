import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { REGISTRATION_ENABLED } from '../../config/runtime'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { getRoleLabel } from '../../utils/presentation'

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const { language, t } = useLanguage()
  const [isUserMenuPinned, setIsUserMenuPinned] = useState(false)
  const [isUserMenuHovered, setIsUserMenuHovered] = useState(false)
  const [isUserMenuHoverSuppressed, setIsUserMenuHoverSuppressed] = useState(false)
  const [shouldRenderUserMenu, setShouldRenderUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const isUserMenuOpen =
    isUserMenuPinned || (isUserMenuHovered && !isUserMenuHoverSuppressed)

  useEffect(() => {
    if (!isUserMenuPinned) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuPinned(false)
        setIsUserMenuHoverSuppressed(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsUserMenuPinned(false)
        setIsUserMenuHoverSuppressed(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isUserMenuPinned])

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    if (isUserMenuOpen) {
      setShouldRenderUserMenu(true)
      return
    }

    timeoutId = setTimeout(() => {
      setShouldRenderUserMenu(false)
    }, 180)

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isUserMenuOpen])

  useEffect(() => {
    setIsUserMenuPinned(false)
    setIsUserMenuHovered(false)
    setIsUserMenuHoverSuppressed(false)
    setShouldRenderUserMenu(false)
  }, [isAuthenticated, user?.role])

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

            {isAuthenticated && user?.role === 'Admin' && (
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `navbar__link ${isActive ? 'navbar__link--active' : ''}`
                }
              >
                {t.nav.users}
              </NavLink>
            )}

            {isAuthenticated && user?.role === 'Admin' && (
              <NavLink
                to="/all-checkouts"
                className={({ isActive }) =>
                  `navbar__link ${isActive ? 'navbar__link--active' : ''}`
                }
              >
                {t.nav.allCheckouts}
              </NavLink>
            )}

            {isAuthenticated && user?.role !== 'Admin' && (
              <NavLink
                to="/my-items"
                className={({ isActive }) =>
                  `navbar__link ${isActive ? 'navbar__link--active' : ''}`
                }
              >
                {t.nav.myItems}
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

          {isAuthenticated && (
            <div className="navbar__session">
              <div
                className="navbar__user-menu"
                ref={userMenuRef}
                onMouseEnter={() => {
                  if (!isUserMenuHoverSuppressed) {
                    setIsUserMenuHovered(true)
                  }
                }}
                onMouseLeave={() => {
                  setIsUserMenuHovered(false)
                  setIsUserMenuHoverSuppressed(false)
                }}
              >
                <button
                  type="button"
                  className={`navbar__user-trigger ${
                    isUserMenuOpen ? 'navbar__user-trigger--open' : ''
                  }`}
                  onClick={() => {
                    if (isUserMenuPinned) {
                      setIsUserMenuPinned(false)
                      setIsUserMenuHovered(false)
                      setIsUserMenuHoverSuppressed(true)
                      return
                    }

                    setIsUserMenuPinned(true)
                    setIsUserMenuHovered(true)
                    setIsUserMenuHoverSuppressed(true)
                  }}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                  aria-label={
                    isUserMenuOpen ? t.nav.closeUserMenu : t.nav.openUserMenu
                  }
                >
                  <div className="navbar__user-card">
                    <span className="navbar__user-avatar" aria-hidden="true">
                      {user?.name?.trim().charAt(0).toUpperCase() || 'A'}
                    </span>
                    <span className="navbar__user-name">
                      {user?.name ?? t.nav.activeSession}
                    </span>
                    <span className="navbar__user-role">
                      {user ? getRoleLabel(user.role, language) : t.nav.loggedIn}
                    </span>
                  </div>
                </button>

                {shouldRenderUserMenu && (
                  <div
                    className={`navbar__dropdown ${
                      isUserMenuOpen ? 'navbar__dropdown--open' : 'navbar__dropdown--closing'
                    }`}
                    role="menu"
                  >
                    <div className="navbar__dropdown-header">
                      <span className="navbar__dropdown-kicker">{t.nav.accountMenu}</span>
                      <p className="navbar__dropdown-text">{t.nav.accountMenuHint}</p>
                    </div>

                    <div className="navbar__menu-links">
                      <NavLink
                        to="/profile"
                        className={({ isActive }) =>
                          `navbar__menu-link ${isActive ? 'navbar__menu-link--active' : ''}`
                        }
                        onClick={() => {
                          setIsUserMenuPinned(false)
                          setIsUserMenuHovered(false)
                          setIsUserMenuHoverSuppressed(false)
                        }}
                      >
                        <span className="navbar__menu-link-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <path
                              d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            />
                            <path
                              d="M5 20a7 7 0 0 1 14 0"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>
                        </span>
                        <span className="navbar__menu-link-copy">
                          <span className="navbar__menu-link-title">{t.nav.profile}</span>
                          <span className="navbar__menu-link-text">{t.nav.profileHint}</span>
                        </span>
                        <span className="navbar__menu-link-arrow" aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <path
                              d="m9 6 6 6-6 6"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </NavLink>

                      <NavLink
                        to="/settings"
                        className={({ isActive }) =>
                          `navbar__menu-link ${isActive ? 'navbar__menu-link--active' : ''}`
                        }
                        onClick={() => {
                          setIsUserMenuPinned(false)
                          setIsUserMenuHovered(false)
                          setIsUserMenuHoverSuppressed(false)
                        }}
                      >
                        <span className="navbar__menu-link-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <path
                              d="M12 9.2A2.8 2.8 0 1 0 12 14.8 2.8 2.8 0 0 0 12 9.2Z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            />
                            <path
                              d="M19.4 13.5v-3l-2-.5a5.9 5.9 0 0 0-.7-1.6l1.1-1.7-2.1-2.1-1.7 1.1a5.9 5.9 0 0 0-1.6-.7l-.5-2h-3l-.5 2a5.9 5.9 0 0 0-1.6.7L5.8 4.6 3.7 6.7l1.1 1.7a5.9 5.9 0 0 0-.7 1.6l-2 .5v3l2 .5c.1.6.4 1.1.7 1.6l-1.1 1.7 2.1 2.1 1.7-1.1c.5.3 1 .6 1.6.7l.5 2h3l.5-2c.6-.1 1.1-.4 1.6-.7l1.7 1.1 2.1-2.1-1.1-1.7c.3-.5.6-1 .7-1.6l2-.5Z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span className="navbar__menu-link-copy">
                          <span className="navbar__menu-link-title">{t.nav.settings}</span>
                          <span className="navbar__menu-link-text">{t.nav.settingsHint}</span>
                        </span>
                        <span className="navbar__menu-link-arrow" aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <path
                              d="m9 6 6 6-6 6"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </NavLink>
                    </div>

                    <button
                      className="navbar__dropdown-logout navbar__dropdown-logout--primary"
                      onClick={() => {
                        setIsUserMenuPinned(false)
                        setIsUserMenuHovered(false)
                        setIsUserMenuHoverSuppressed(false)
                        logout()
                      }}
                    >
                      <span className="navbar__dropdown-logout-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                          <path
                            d="M14 7V5.5A1.5 1.5 0 0 0 12.5 4h-6A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20h6a1.5 1.5 0 0 0 1.5-1.5V17"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M10 12h9"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                          <path
                            d="m16 8 4 4-4 4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      {t.nav.logout}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Navbar
