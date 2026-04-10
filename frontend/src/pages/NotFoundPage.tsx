import { useLanguage } from '../context/LanguageContext'

function NotFoundPage() {
  const { language } = useLanguage()

  const copy =
    language === 'en'
      ? {
          kicker: 'Missing route',
          title: 'This page could not be found.',
          text:
            'The address is not part of the current app, or the page may have moved.',
        }
      : {
          kicker: 'Hiányzó oldal',
          title: 'Ez az oldal nem található.',
          text:
            'A beírt útvonal nem létezik, vagy az oldal már máshova került.',
        }

  return (
    <div className="page-shell">
      <section className="empty-state">
        <span className="section-heading__eyebrow">{copy.kicker}</span>
        <h1 className="page-title">{copy.title}</h1>
        <p>{copy.text}</p>
      </section>
    </div>
  )
}

export default NotFoundPage
