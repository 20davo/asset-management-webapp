import { useLanguage } from '../../context/LanguageContext'

type WarningFilter = 'all' | 'none' | 'dueSoon' | 'overdue'

interface InventoryFiltersProps {
  categories: string[]
  categoryFilter: string
  equipmentCount: number
  filteredCount: number
  onCategoryChange: (value: string) => void
  onReset: () => void
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
  onWarningChange: (value: WarningFilter) => void
  searchQuery: string
  statusFilter: string
  warningFilter: WarningFilter
}

export function InventoryFilters({
  categories,
  categoryFilter,
  equipmentCount,
  filteredCount,
  onCategoryChange,
  onReset,
  onSearchChange,
  onStatusChange,
  onWarningChange,
  searchQuery,
  statusFilter,
  warningFilter,
}: InventoryFiltersProps) {
  const { t } = useLanguage()

  return (
    <section className="section-card section-card--compact filter-panel">
      <div className="filter-panel__grid filter-panel__grid--inventory">
        <div className="form-field">
          <label htmlFor="inventory-search">{t.common.search}</label>
          <input
            id="inventory-search"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t.inventory.searchPlaceholder}
          />
        </div>

        <div className="form-field">
          <label htmlFor="inventory-status-filter">{t.inventory.statusFilterLabel}</label>
          <select
            id="inventory-status-filter"
            value={statusFilter}
            onChange={(event) => onStatusChange(event.target.value)}
          >
            <option value="all">{t.inventory.allStatuses}</option>
            <option value="Available">{t.inventory.available}</option>
            <option value="CheckedOut">{t.inventory.checkedOut}</option>
            <option value="Maintenance">{t.inventory.maintenance}</option>
          </select>
        </div>

        {statusFilter === 'CheckedOut' && (
          <div className="form-field">
            <label htmlFor="inventory-warning-filter">{t.common.warningFilterLabel}</label>
            <select
              id="inventory-warning-filter"
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

        <div className="form-field">
          <label htmlFor="inventory-category-filter">{t.inventory.categoryFilterLabel}</label>
          <select
            id="inventory-category-filter"
            value={categoryFilter}
            onChange={(event) => onCategoryChange(event.target.value)}
          >
            <option value="all">{t.inventory.allCategories}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="filter-panel__footer">
        <p className="filter-panel__summary">
          {filteredCount} / {equipmentCount}
        </p>
        <button type="button" className="button-secondary" onClick={onReset}>
          {t.common.clearFilters}
        </button>
      </div>
    </section>
  )
}
