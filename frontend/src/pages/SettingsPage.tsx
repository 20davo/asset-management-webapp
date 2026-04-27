import { useEffect, useState } from 'react'
import { useAppearance } from '../context/AppearanceContext'
import { useLanguage } from '../context/LanguageContext'

function SettingsPage() {
  const { language, setLanguage, t } = useLanguage()
  const { appearance, setAppearance } = useAppearance()
  const [languagePulse, setLanguagePulse] = useState(false)
  const [themePulse, setThemePulse] = useState(false)
  const currentLanguageLabel = language === 'hu' ? 'Magyar / HU' : 'English / EN'
  const currentThemeLabel = appearance === 'light' ? t.nav.lightMode : t.nav.darkMode

  useEffect(() => {
    if (!languagePulse) {
      return
    }

    const timeoutId = setTimeout(() => {
      setLanguagePulse(false)
    }, 240)

    return () => clearTimeout(timeoutId)
  }, [languagePulse])

  useEffect(() => {
    if (!themePulse) {
      return
    }

    const timeoutId = setTimeout(() => {
      setThemePulse(false)
    }, 240)

    return () => clearTimeout(timeoutId)
  }, [themePulse])

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="page-hero__content">
          <span className="page-kicker">{t.settings.heroKicker}</span>
          <h1 className="page-title">{t.settings.heroTitle}</h1>
          <p className="page-subtitle">{t.settings.heroText}</p>
        </div>

        <div className="page-hero__panel">
          <span className="page-hero__panel-label">{t.settings.panelLabel}</span>
          <strong className="page-hero__panel-value">{t.settings.panelValue}</strong>
          <p className="page-hero__panel-text">{t.settings.panelText}</p>
          <div className="page-hero__panel-meta">
            <div className="page-hero__panel-meta-item">
              <span className="page-hero__panel-label">{t.nav.language}</span>
              <strong>{currentLanguageLabel}</strong>
            </div>
            <div className="page-hero__panel-meta-item">
              <span className="page-hero__panel-label">{t.nav.theme}</span>
              <strong>{currentThemeLabel}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="section-card settings-workspace">
        <div className="section-heading section-heading--toolbar">
          <div>
            <span className="section-heading__eyebrow">{t.settings.workspaceKicker}</span>
            <h2 className="section-heading__title">{t.settings.workspaceTitle}</h2>
          </div>
          <div className="section-heading__aside">
            <p className="section-heading__text">{t.settings.workspaceText}</p>
          </div>
        </div>

        <div className="settings-option-grid">
          <article className="settings-option-card">
            <div className="settings-option-card__header">
              <div>
                <span className="settings-option-card__kicker">{t.nav.language}</span>
                <h3 className="settings-option-card__title">{t.settings.languageTitle}</h3>
                <p className="settings-option-card__text">{t.settings.languageText}</p>
              </div>
              <span className="settings-option-card__value">{currentLanguageLabel}</span>
            </div>

            <div className="settings-option-card__control">
              <div
                className={`language-switcher settings-switcher ${
                  languagePulse ? 'settings-switcher--pulse' : ''
                } ${language === 'hu' ? 'settings-switcher--left' : 'settings-switcher--right'}`}
                aria-label={t.nav.language}
              >
                <button
                  type="button"
                  className={`language-switcher__button ${
                    language === 'hu' ? 'language-switcher__button--active' : ''
                  }`}
                  onClick={() => {
                    if (language !== 'hu') {
                      setLanguage('hu')
                      setLanguagePulse(true)
                    }
                  }}
                >
                  HU
                </button>
                <button
                  type="button"
                  className={`language-switcher__button ${
                    language === 'en' ? 'language-switcher__button--active' : ''
                  }`}
                  onClick={() => {
                    if (language !== 'en') {
                      setLanguage('en')
                      setLanguagePulse(true)
                    }
                  }}
                >
                  EN
                </button>
              </div>
            </div>
          </article>

          <article className="settings-option-card settings-option-card--appearance">
            <div className="settings-option-card__header">
              <div>
                <span className="settings-option-card__kicker">{t.nav.theme}</span>
                <h3 className="settings-option-card__title">{t.settings.themeTitle}</h3>
                <p className="settings-option-card__text">{t.settings.themeText}</p>
              </div>
              <span className="settings-option-card__value">{currentThemeLabel}</span>
            </div>

            <div className="settings-option-card__control">
              <div
                className={`language-switcher settings-switcher ${
                  themePulse ? 'settings-switcher--pulse' : ''
                } ${appearance === 'light' ? 'settings-switcher--left' : 'settings-switcher--right'}`}
                aria-label={t.nav.theme}
              >
                <button
                  type="button"
                  className={`language-switcher__button ${
                    appearance === 'light' ? 'language-switcher__button--active' : ''
                  }`}
                  onClick={() => {
                    if (appearance !== 'light') {
                      setAppearance('light')
                      setThemePulse(true)
                    }
                  }}
                >
                  {t.nav.lightMode}
                </button>
                <button
                  type="button"
                  className={`language-switcher__button ${
                    appearance === 'dark' ? 'language-switcher__button--active' : ''
                  }`}
                  onClick={() => {
                    if (appearance !== 'dark') {
                      setAppearance('dark')
                      setThemePulse(true)
                    }
                  }}
                >
                  {t.nav.darkMode}
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}

export default SettingsPage
