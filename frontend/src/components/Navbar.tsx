import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { REGISTRATION_ENABLED } from '../config/runtime'
import { useLanguage } from '../context/LanguageContext'
import { getRoleLabel } from '../utils/presentation'

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const [isUserMenuPinned, setIsUserMenuPinned] = useState(false)
  const [isUserMenuHovered, setIsUserMenuHovered] = useState(false)
  const [isUserMenuHoverSuppressed, setIsUserMenuHoverSuppressed] = useState(false)
  const [shouldRenderUserMenu, setShouldRenderUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const isUserMenuOpen =
    isUserMenuPinned || (isUserMenuHovered && !isUserMenuHoverSuppressed)

  type UserMenuItem = {
    to: string
    label: string
    hint: string
    end: boolean
  }

  const userMenuItems = useMemo(() => {
    if (!isAuthenticated) {
      return []
    }

    const items: UserMenuItem[] = [
      { to: '/', label: t.nav.inventory, hint: t.nav.inventoryHint, end: true },
    ]

    if (user?.role === 'Admin') {
      items.push(
        {
          to: '/users',
          label: t.nav.users,
          hint: t.nav.usersHint,
          end: false,
        },
        {
          to: '/all-checkouts',
          label: t.nav.allCheckouts,
          hint: t.nav.allCheckoutsHint,
          end: false,
        },
      )
    } else {
      items.push({
        to: '/my-items',
        label: t.nav.myItems,
        hint: t.nav.myItemsHint,
        end: false,
      })
    }

    return items
  }, [
    isAuthenticated,
    t.nav.allCheckouts,
    t.nav.allCheckoutsHint,
    t.nav.inventory,
    t.nav.inventoryHint,
    t.nav.myItems,
    t.nav.myItemsHint,
    t.nav.users,
    t.nav.usersHint,
    user?.role,
  ])

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
                      <span className="navbar__dropdown-kicker">
                        {t.nav.workspaceMenu}
                      </span>
                      <p className="navbar__dropdown-text">{t.nav.workspaceMenuHint}</p>
                    </div>

                    <div className="navbar__dropdown-links">
                      {userMenuItems.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) =>
                            `navbar__dropdown-link ${
                              isActive ? 'navbar__dropdown-link--active' : ''
                            }`
                          }
                          onClick={() => {
                            setIsUserMenuPinned(false)
                            setIsUserMenuHovered(false)
                            setIsUserMenuHoverSuppressed(false)
                          }}
                        >
                          <span className="navbar__dropdown-link-title">{item.label}</span>
                          <span className="navbar__dropdown-link-text">{item.hint}</span>
                        </NavLink>
                      ))}
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
