import { useState } from 'react';
import { PiggyBank, Plus, Trash2, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

import type { CashFlowCategory } from '../domain/types';
import { useCashFlow } from '../hooks/useCashFlow';
import { formatCurrency } from '../utils/money';

type ViewMode = 'monthly' | 'annual';

interface CategoryMeta {
  id: Exclude<CashFlowCategory, 'income'>;
  label: string;
  color: string;
}

const EXPENSE_CATEGORIES: CategoryMeta[] = [
  { id: 'housing', label: 'Wohnen', color: '#3b82f6' },
  { id: 'insurance', label: 'Versicherungen', color: '#a855f7' },
  { id: 'contracts', label: 'Vertraege', color: '#06b6d4' },
  { id: 'pension', label: 'Rente / Altersvorsorge', color: '#f59e0b' },
  { id: 'savings', label: 'Sparen / Investieren', color: '#10b981' },
  { id: 'mobility', label: 'Mobilitaet', color: '#f97316' },
  { id: 'groceries', label: 'Lebensmittel', color: '#84cc16' },
  { id: 'entertainment', label: 'Freizeit', color: '#ec4899' },
  { id: 'other', label: 'Sonstiges', color: '#94a3b8' },
];

const CATEGORY_MAP = new Map(EXPENSE_CATEGORIES.map((c) => [c.id, c]));

interface CashFlowEntry {
  id: string;
  label: string;
  amountCents: number;
  frequency: 'monthly' | 'annual';
  category: CashFlowCategory;
}

const toDisplayAmount = (entry: CashFlowEntry, mode: ViewMode): number => {
  if (mode === 'monthly') {
    return entry.frequency === 'monthly' ? entry.amountCents : Math.round(entry.amountCents / 12);
  }
  return entry.frequency === 'annual' ? entry.amountCents : entry.amountCents * 12;
};

const buildSankeyOption = (entries: CashFlowEntry[], mode: ViewMode) => {
  const incomeEntries = entries.filter((e) => e.category === 'income');
  const expenseEntries = entries.filter((e) => e.category !== 'income');

  const totalIncomeCents = incomeEntries.reduce((sum, e) => sum + toDisplayAmount(e, mode), 0);
  const totalExpenseCents = expenseEntries.reduce((sum, e) => sum + toDisplayAmount(e, mode), 0);
  const surplusCents = totalIncomeCents - totalExpenseCents;

  if (totalIncomeCents === 0) return null;

  // Group expenses by category
  const categoryTotals = new Map<string, number>();
  for (const entry of expenseEntries) {
    const amount = toDisplayAmount(entry, mode);
    categoryTotals.set(entry.category, (categoryTotals.get(entry.category) ?? 0) + amount);
  }

  const incomeNodeName = 'Einnahmen';
  const nodes: { name: string; itemStyle: { color: string } }[] = [
    { name: incomeNodeName, itemStyle: { color: '#22c55e' } },
  ];
  const links: { source: string; target: string; value: number }[] = [];

  for (const [catId, amountCents] of categoryTotals.entries()) {
    const cat = CATEGORY_MAP.get(catId as Exclude<CashFlowCategory, 'income'>);
    if (cat && amountCents > 0) {
      nodes.push({ name: cat.label, itemStyle: { color: cat.color } });
      links.push({ source: incomeNodeName, target: cat.label, value: Math.max(amountCents / 100, 0.01) });
    }
  }

  if (surplusCents > 0) {
    nodes.push({ name: 'Ueberschuss', itemStyle: { color: '#6b7280' } });
    links.push({ source: incomeNodeName, target: 'Ueberschuss', value: surplusCents / 100 });
  }

  return {
    animation: true,
    tooltip: {
      trigger: 'item',
      formatter: (params: { name?: string; value?: number; dataType?: string; data?: { source?: string; target?: string } }) => {
        if (params.dataType === 'edge') {
          return `${params.data?.source} \u2192 ${params.data?.target}: ${(params.value ?? 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`;
        }
        return `${params.name}: ${(params.value ?? 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`;
      },
    },
    series: [
      {
        type: 'sankey',
        layout: 'none',
        emphasis: { focus: 'adjacency' },
        data: nodes,
        links,
        nodeAlign: 'left',
        lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.45 },
        label: { show: true, position: 'right' },
      },
    ],
  };
};

export const CashFlowPage = () => {
  const { data, addEntry, removeEntry } = useCashFlow();
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');

  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [incomeLabel, setIncomeLabel] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeFrequency, setIncomeFrequency] = useState<'monthly' | 'annual'>('monthly');

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseLabel, setExpenseLabel] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseFrequency, setExpenseFrequency] = useState<'monthly' | 'annual'>('monthly');
  const [expenseCategory, setExpenseCategory] = useState<Exclude<CashFlowCategory, 'income'>>('housing');

  const incomeEntries = data.entries.filter((e) => e.category === 'income');
  const expenseEntries = data.entries.filter((e) => e.category !== 'income');

  const totalIncomeCents = incomeEntries.reduce((sum, e) => sum + toDisplayAmount(e, viewMode), 0);
  const totalExpenseCents = expenseEntries.reduce((sum, e) => sum + toDisplayAmount(e, viewMode), 0);
  const surplusCents = totalIncomeCents - totalExpenseCents;

  const savingsEntries = expenseEntries.filter((e) => e.category === 'savings');
  const totalSavingsCents = savingsEntries.reduce((sum, e) => sum + toDisplayAmount(e, viewMode), 0);
  const savingsRate = totalIncomeCents > 0 ? (totalSavingsCents / totalIncomeCents) * 100 : 0;

  const periodLabel = viewMode === 'monthly' ? 'monatlich' : 'jaehrlich';

  const handleAddIncome = () => {
    const amount = parseFloat(incomeAmount.replace(',', '.'));
    if (!incomeLabel.trim() || !Number.isFinite(amount) || amount <= 0) return;
    addEntry({ label: incomeLabel.trim(), amountCents: Math.round(amount * 100), frequency: incomeFrequency, category: 'income' });
    setIncomeLabel('');
    setIncomeAmount('');
    setIncomeFrequency('monthly');
    setShowIncomeForm(false);
  };

  const handleAddExpense = () => {
    const amount = parseFloat(expenseAmount.replace(',', '.'));
    if (!expenseLabel.trim() || !Number.isFinite(amount) || amount <= 0) return;
    addEntry({ label: expenseLabel.trim(), amountCents: Math.round(amount * 100), frequency: expenseFrequency, category: expenseCategory });
    setExpenseLabel('');
    setExpenseAmount('');
    setExpenseFrequency('monthly');
    setExpenseCategory('housing');
    setShowExpenseForm(false);
  };

  const sankeyOption = buildSankeyOption(data.entries, viewMode);

  return (
    <div className="cashflow-page">
      <div className="cashflow-header">
        <div>
          <h2 className="cashflow-title">Finanzfluss</h2>
          <p className="cashflow-subtitle">Einnahmen, fixe Ausgaben und Sparquote im Ueberblick</p>
        </div>
        <div className="cashflow-view-toggle" role="group" aria-label="Anzeige">
          <button
            type="button"
            className={viewMode === 'monthly' ? 'active' : ''}
            onClick={() => setViewMode('monthly')}
            aria-pressed={viewMode === 'monthly'}
          >
            Monatlich
          </button>
          <button
            type="button"
            className={viewMode === 'annual' ? 'active' : ''}
            onClick={() => setViewMode('annual')}
            aria-pressed={viewMode === 'annual'}
          >
            Jaehrlich
          </button>
        </div>
      </div>

      <div className="cashflow-kpi-grid">
        <div className="cashflow-kpi cashflow-kpi--income">
          <TrendingUp size={22} />
          <div>
            <span>Einnahmen {periodLabel}</span>
            <strong>{formatCurrency(totalIncomeCents, 'EUR')}</strong>
          </div>
        </div>
        <div className="cashflow-kpi cashflow-kpi--expense">
          <TrendingDown size={22} />
          <div>
            <span>Ausgaben {periodLabel}</span>
            <strong>{formatCurrency(totalExpenseCents, 'EUR')}</strong>
          </div>
        </div>
        <div className={`cashflow-kpi ${surplusCents >= 0 ? 'cashflow-kpi--surplus-pos' : 'cashflow-kpi--surplus-neg'}`}>
          <Wallet size={22} />
          <div>
            <span>Ueberschuss {periodLabel}</span>
            <strong>{formatCurrency(surplusCents, 'EUR')}</strong>
          </div>
        </div>
        <div className="cashflow-kpi cashflow-kpi--savings">
          <PiggyBank size={22} />
          <div>
            <span>Sparquote</span>
            <strong>{savingsRate.toFixed(1)} %</strong>
          </div>
        </div>
      </div>

      <div className="cashflow-entries">
        <section className="cashflow-section">
          <div className="cashflow-section-header">
            <h3>Einnahmen</h3>
            <button
              type="button"
              className="cashflow-add-btn"
              onClick={() => setShowIncomeForm((v) => !v)}
              aria-expanded={showIncomeForm}
            >
              <Plus size={15} /> Eintrag hinzufuegen
            </button>
          </div>

          {showIncomeForm && (
            <div className="cashflow-form">
              <input
                type="text"
                placeholder="Bezeichnung (z.B. Gehalt)"
                value={incomeLabel}
                onChange={(e) => setIncomeLabel(e.target.value)}
                aria-label="Bezeichnung"
                onKeyDown={(e) => e.key === 'Enter' && handleAddIncome()}
              />
              <input
                type="number"
                placeholder="Betrag in EUR"
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
                min="0"
                step="0.01"
                aria-label="Betrag in EUR"
                onKeyDown={(e) => e.key === 'Enter' && handleAddIncome()}
              />
              <select
                value={incomeFrequency}
                onChange={(e) => setIncomeFrequency(e.target.value as 'monthly' | 'annual')}
                aria-label="Haeufigkeit"
              >
                <option value="monthly">Monatlich</option>
                <option value="annual">Jaehrlich</option>
              </select>
              <div className="cashflow-form-actions">
                <button type="button" className="cashflow-save-btn" onClick={handleAddIncome}>
                  Hinzufuegen
                </button>
                <button type="button" className="cashflow-cancel-btn" onClick={() => setShowIncomeForm(false)}>
                  Abbrechen
                </button>
              </div>
            </div>
          )}

          <ul className="cashflow-entry-list" aria-label="Einnahmen-Liste">
            {incomeEntries.length === 0 && (
              <li className="cashflow-empty">Noch keine Einnahmen eingetragen.</li>
            )}
            {incomeEntries.map((entry) => (
              <li key={entry.id} className="cashflow-entry">
                <span className="cashflow-entry-dot" style={{ backgroundColor: '#22c55e' }} />
                <span className="cashflow-entry-label">{entry.label}</span>
                <span className="cashflow-entry-freq">{entry.frequency === 'monthly' ? 'mtl.' : 'jaehrl.'}</span>
                <span className="cashflow-entry-amount">{formatCurrency(toDisplayAmount(entry, viewMode), 'EUR')}</span>
                <button
                  type="button"
                  className="cashflow-delete-btn"
                  onClick={() => removeEntry(entry.id)}
                  aria-label={`${entry.label} loeschen`}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="cashflow-section">
          <div className="cashflow-section-header">
            <h3>Ausgaben</h3>
            <button
              type="button"
              className="cashflow-add-btn"
              onClick={() => setShowExpenseForm((v) => !v)}
              aria-expanded={showExpenseForm}
            >
              <Plus size={15} /> Eintrag hinzufuegen
            </button>
          </div>

          {showExpenseForm && (
            <div className="cashflow-form">
              <input
                type="text"
                placeholder="Bezeichnung (z.B. Miete)"
                value={expenseLabel}
                onChange={(e) => setExpenseLabel(e.target.value)}
                aria-label="Bezeichnung"
                onKeyDown={(e) => e.key === 'Enter' && handleAddExpense()}
              />
              <input
                type="number"
                placeholder="Betrag in EUR"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                min="0"
                step="0.01"
                aria-label="Betrag in EUR"
                onKeyDown={(e) => e.key === 'Enter' && handleAddExpense()}
              />
              <select
                value={expenseFrequency}
                onChange={(e) => setExpenseFrequency(e.target.value as 'monthly' | 'annual')}
                aria-label="Haeufigkeit"
              >
                <option value="monthly">Monatlich</option>
                <option value="annual">Jaehrlich</option>
              </select>
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value as Exclude<CashFlowCategory, 'income'>)}
                aria-label="Kategorie"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <div className="cashflow-form-actions">
                <button type="button" className="cashflow-save-btn" onClick={handleAddExpense}>
                  Hinzufuegen
                </button>
                <button type="button" className="cashflow-cancel-btn" onClick={() => setShowExpenseForm(false)}>
                  Abbrechen
                </button>
              </div>
            </div>
          )}

          <ul className="cashflow-entry-list" aria-label="Ausgaben-Liste">
            {expenseEntries.length === 0 && (
              <li className="cashflow-empty">Noch keine Ausgaben eingetragen.</li>
            )}
            {expenseEntries.map((entry) => {
              const cat = CATEGORY_MAP.get(entry.category as Exclude<CashFlowCategory, 'income'>);
              return (
                <li key={entry.id} className="cashflow-entry">
                  <span
                    className="cashflow-entry-dot"
                    style={{ backgroundColor: cat?.color ?? '#94a3b8' }}
                    title={cat?.label}
                  />
                  <span className="cashflow-entry-label">{entry.label}</span>
                  <span className="cashflow-entry-cat">{cat?.label ?? entry.category}</span>
                  <span className="cashflow-entry-freq">{entry.frequency === 'monthly' ? 'mtl.' : 'jaehrl.'}</span>
                  <span className="cashflow-entry-amount">{formatCurrency(toDisplayAmount(entry, viewMode), 'EUR')}</span>
                  <button
                    type="button"
                    className="cashflow-delete-btn"
                    onClick={() => removeEntry(entry.id)}
                    aria-label={`${entry.label} loeschen`}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="chart-card cashflow-chart-card">
        <div className="chart-header">
          <div>
            <h3>Finanzfluss-Diagramm</h3>
            <p>Visualisierung der Geldfluesse ({periodLabel})</p>
          </div>
        </div>
        {sankeyOption ? (
          <ReactECharts option={sankeyOption} style={{ height: 420, width: '100%' }} notMerge lazyUpdate />
        ) : (
          <p className="cashflow-chart-empty">
            Tragen Sie Einnahmen und Ausgaben ein, um das Flussdiagramm zu sehen.
          </p>
        )}
      </div>
    </div>
  );
};
