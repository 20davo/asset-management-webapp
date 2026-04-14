import { useLanguage } from '../context/LanguageContext'

function NotFoundPage() {
  const { language } = useLanguage()

  const copy =
    language === 'en'
      ? {
          kicker: 'Not found',
          title: 'This page is not available.',
          text: 'The address is not valid, or the page has moved.',
        }
      : {
          kicker: 'Nem található',
          title: 'Ez az oldal nem érhető el.',
          text: 'A megadott cím nem létezik, vagy az oldal máshová került.',
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
