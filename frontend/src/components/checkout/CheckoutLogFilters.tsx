import { useLanguage } from '../../context/LanguageContext'

type CheckoutFilter = 'all' | 'active' | 'closed'
type WarningFilter = 'all' | 'none' | 'dueSoon' | 'overdue'

interface CheckoutLogFiltersProps {
  checkoutCount: number
  filteredCount: number
  onReset: () => void
  onSearchChange: (value: string) => void
  onStateChange: (value: CheckoutFilter) => void
  onWarningChange: (value: WarningFilter) => void
  searchQuery: string
  stateFilter: CheckoutFilter
  warningFilter: WarningFilter
}

export function CheckoutLogFilters({
  checkoutCount,
  filteredCount,
  onReset,
  onSearchChange,
  onStateChange,
  onWarningChange,
  searchQuery,
  stateFilter,
  warningFilter,
}: CheckoutLogFiltersProps) {
  const { t } = useLanguage()

  return (
    <section className="section-card section-card--compact filter-panel">
      <div className="filter-panel__grid filter-panel__grid--checkout-log">
        <div className="form-field">
          <label htmlFor="all-checkouts-search">{t.common.search}</label>
          <input
            id="all-checkouts-search"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t.checkouts.allSearchPlaceholder}
          />
        </div>

        <div className="form-field">
          <label htmlFor="all-checkouts-status-filter">
            {t.checkouts.statusFilterLabel}
          </label>
          <select
            id="all-checkouts-status-filter"
            value={stateFilter}
            onChange={(event) => onStateChange(event.target.value as CheckoutFilter)}
          >
            <option value="all">{t.checkouts.filterAll}</option>
            <option value="active">{t.checkouts.filterActive}</option>
            <option value="closed">{t.checkouts.filterClosed}</option>
          </select>
        </div>

        {stateFilter === 'active' && (
          <div className="form-field">
            <label htmlFor="all-checkouts-warning-filter">
              {t.common.warningFilterLabel}
            </label>
            <select
              id="all-checkouts-warning-filter"
              value={warningFilter}
              onChange={(event) => onWarningChange(event.target.value as WarningFilter)}
            >
              <option value="all">{t.common.allWarnings}</option>
              <option value="none">{t.common.noWarning}</option>
              <option value="dueSoon">{t.common.warningDueSoon}</option>
              <option value="overdue">{t.common.warningOverdue}</option>
            </select>
          </div>
        )}
      </div>

      <div className="filter-panel__footer">
        <p className="filter-panel__summary">
          {filteredCount} / {checkoutCount}
        </p>
        <button type="button" className="button-secondary" onClick={onReset}>
          {t.common.clearFilters}
        </button>
      </div>
    </section>
  )
}
