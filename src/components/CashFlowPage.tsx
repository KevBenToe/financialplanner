import { useMemo, useState } from 'react';
import { CirclePlus, PencilLine, PiggyBank, Plus, Trash2, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

import type { CashFlowCategoryConfig, CashFlowEntry } from '../domain/types';
import { useCashFlow } from '../hooks/useCashFlow';
import { createId } from '../utils/id';
import { formatCurrency } from '../utils/money';

type ViewMode = 'monthly' | 'annual';

type EntryKind = 'income' | 'expense';

const addMonths = (isoDate: string, months: number) => {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyEntryDraft = (kind: EntryKind): CashFlowEntry => ({
  id: createId(),
  label: '',
  amountCents: 0,
  frequency: 'monthly',
  category: kind === 'income' ? 'income' : 'housing',
  startDate: todayIso(),
  durationMonths: undefined,
  notes: '',
});

const toDisplayAmount = (entry: CashFlowEntry, mode: ViewMode): number => {
  if (mode === 'monthly') {
    return entry.frequency === 'monthly' ? entry.amountCents : Math.round(entry.amountCents / 12);
  }

  return entry.frequency === 'annual' ? entry.amountCents : entry.amountCents * 12;
};

const buildDurationLabel = (entry: CashFlowEntry) => {
  if (!entry.durationMonths || entry.durationMonths <= 0) {
    return undefined;
  }

  const endDate = addMonths(entry.startDate ?? todayIso(), entry.durationMonths);
  return `bis ${endDate} · wieder mehr Geld ab ${endDate}`;
};

const buildSankeyOption = (entries: CashFlowEntry[], categories: CashFlowCategoryConfig[], mode: ViewMode) => {
  const incomeEntries = entries.filter((entry) => entry.category === 'income');
  const expenseEntries = entries.filter((entry) => entry.category !== 'income');

  const totalIncomeCents = incomeEntries.reduce((sum, entry) => sum + toDisplayAmount(entry, mode), 0);
  const totalExpenseCents = expenseEntries.reduce((sum, entry) => sum + toDisplayAmount(entry, mode), 0);
  const surplusCents = totalIncomeCents - totalExpenseCents;

  if (totalIncomeCents === 0) {
    return null;
  }

  const categoryTotals = new Map<string, number>();
  for (const entry of expenseEntries) {
    categoryTotals.set(entry.category, (categoryTotals.get(entry.category) ?? 0) + toDisplayAmount(entry, mode));
  }

  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const availableNodeName = 'Verfuegbar';
  const nodes: { name: string; itemStyle: { color: string } }[] = [];
  const links: { source: string; target: string; value: number }[] = [];

  const formatNodeName = (name?: string) => {
    if (!name) {
      return '';
    }

    const [, displayName] = name.split('|');
    if (displayName) {
      return displayName;
    }

    if (name.startsWith('income:')) {
      return 'Einnahmen';
    }

    if (name.startsWith('category:')) {
      return name.replace('category:', 'Kategorie: ');
    }

    if (name.startsWith('entry:')) {
      return name.replace('entry:', 'Eintrag: ');
    }

    return name;
  };

  for (const entry of incomeEntries) {
    const entryNodeName = `income:${entry.id}|${entry.label}`;
    nodes.push({ name: entryNodeName, itemStyle: { color: '#16a34a' } });
    links.push({ source: entryNodeName, target: availableNodeName, value: Math.max(toDisplayAmount(entry, mode) / 100, 0.01) });
  }

  nodes.push({ name: availableNodeName, itemStyle: { color: '#4b5563' } });

  for (const [categoryId, amountCents] of categoryTotals.entries()) {
    const category = categoryMap.get(categoryId);
    if (category && amountCents > 0) {
      const categoryNodeName = `category:${category.id}|${category.label}`;
      nodes.push({ name: categoryNodeName, itemStyle: { color: category.color } });
      links.push({ source: availableNodeName, target: categoryNodeName, value: Math.max(amountCents / 100, 0.01) });

      for (const entry of expenseEntries.filter((item) => item.category === categoryId)) {
        const entryNodeName = `entry:${entry.id}|${entry.label}`;
        nodes.push({ name: entryNodeName, itemStyle: { color: category.color } });
        links.push({ source: categoryNodeName, target: entryNodeName, value: Math.max(toDisplayAmount(entry, mode) / 100, 0.01) });
      }
    }
  }

  if (surplusCents > 0) {
    nodes.push({ name: 'Ueberschuss', itemStyle: { color: '#6b7280' } });
    links.push({ source: availableNodeName, target: 'Ueberschuss', value: surplusCents / 100 });
  }

  return {
    animation: true,
    tooltip: {
      trigger: 'item',
      formatter: (params: { name?: string; value?: number; dataType?: string; data?: { source?: string; target?: string } }) => {
        if (params.dataType === 'edge') {
          return `${formatNodeName(params.data?.source)} -> ${formatNodeName(params.data?.target)}: ${(params.value ?? 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`;
        }

        return `${formatNodeName(params.name)}: ${(params.value ?? 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`;
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
        label: { show: true, position: 'right', formatter: (params: { name?: string }) => formatNodeName(params.name) },
      },
    ],
  };
};

export const CashFlowPage = () => {
  const { data, addEntry, updateEntry, removeEntry, addCategory, updateCategory, removeCategory } = useCashFlow();
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [editingEntry, setEditingEntry] = useState<CashFlowEntry | null>(null);
  const [entryKind, setEntryKind] = useState<EntryKind>('income');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#64748b');
  const [newCategoryKind, setNewCategoryKind] = useState<EntryKind>('expense');

  const categories = data.categories;
  const incomeCategory = categories.find((category) => category.id === 'income') ?? { id: 'income', label: 'Einnahmen', color: '#16a34a', kind: 'income' as const };
  const expenseCategories = categories.filter((category) => category.kind === 'expense');

  const incomeEntries = data.entries.filter((entry) => entry.category === 'income');
  const expenseEntries = data.entries.filter((entry) => entry.category !== 'income');

  const groupedExpenses = useMemo(() => {
    const map = new Map<string, CashFlowEntry[]>();
    for (const entry of expenseEntries) {
      map.set(entry.category, [...(map.get(entry.category) ?? []), entry]);
    }
    return map;
  }, [expenseEntries]);

  const totalIncomeCents = incomeEntries.reduce((sum, entry) => sum + toDisplayAmount(entry, viewMode), 0);
  const totalExpenseCents = expenseEntries.reduce((sum, entry) => sum + toDisplayAmount(entry, viewMode), 0);
  const surplusCents = totalIncomeCents - totalExpenseCents;
  const pensionEntries = expenseEntries.filter((entry) => entry.category === 'pension');
  const savingsEntries = expenseEntries.filter((entry) => entry.category === 'savings');
  const totalSavingsCents = [...savingsEntries, ...pensionEntries].reduce((sum, entry) => sum + toDisplayAmount(entry, viewMode), 0);
  const savingsRate = totalIncomeCents > 0 ? (totalSavingsCents / totalIncomeCents) * 100 : 0;
  const periodLabel = viewMode === 'monthly' ? 'monatlich' : 'jaehrlich';

  const sankeyOption = buildSankeyOption(data.entries, categories, viewMode);

  const openEditor = (kind: EntryKind, entry?: CashFlowEntry) => {
    setEntryKind(kind);
    setEditingEntry(entry ?? emptyEntryDraft(kind));
  };

  const closeEditor = () => {
    setEditingEntry(null);
  };

  const saveEntry = () => {
    if (!editingEntry || !editingEntry.label.trim()) {
      return;
    }

    const nextEntry = {
      ...editingEntry,
      label: editingEntry.label.trim(),
      category: entryKind === 'income' ? 'income' : editingEntry.category,
      durationMonths: editingEntry.durationMonths && editingEntry.durationMonths > 0 ? editingEntry.durationMonths : undefined,
    };

    if (data.entries.some((entry) => entry.id === nextEntry.id)) {
      const { id: _id, ...changes } = nextEntry;
      updateEntry(nextEntry.id, changes);
    } else {
      addEntry(nextEntry);
    }

    closeEditor();
  };

  const createCategory = () => {
    if (!newCategoryName.trim()) {
      return;
    }

    addCategory({ label: newCategoryName.trim(), color: newCategoryColor, kind: newCategoryKind });
    setNewCategoryName('');
    setNewCategoryColor('#64748b');
    setNewCategoryKind('expense');
  };

  return (
    <div className="cashflow-page">
      <div className="chart-card cashflow-chart-card cashflow-chart-card--top">
        <div className="chart-header">
          <div>
            <h3>Finanzfluss-Diagramm</h3>
            <p>Links Einnahmen, rechts Ausgaben. Mehrere Eintraege pro Kategorie werden getrennt dargestellt.</p>
          </div>
        </div>
        {sankeyOption ? (
          <ReactECharts option={sankeyOption} style={{ height: 460, width: '100%' }} notMerge lazyUpdate />
        ) : (
          <p className="cashflow-chart-empty">
            Tragen Sie Einnahmen und Ausgaben ein, um das Flussdiagramm zu sehen.
          </p>
        )}
      </div>

      <div className="cashflow-header">
        <div>
          <h2 className="cashflow-title">Finanzfluss</h2>
          <p className="cashflow-subtitle">Einnahmen, Ausgaben, Kategorien und Laufzeiten im Ueberblick.</p>
        </div>
        <div className="cashflow-view-toggle" role="group" aria-label="Anzeige">
          <button type="button" className={viewMode === 'monthly' ? 'active' : ''} onClick={() => setViewMode('monthly')} aria-pressed={viewMode === 'monthly'}>
            Monatlich
          </button>
          <button type="button" className={viewMode === 'annual' ? 'active' : ''} onClick={() => setViewMode('annual')} aria-pressed={viewMode === 'annual'}>
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

      <div className="cashflow-layout">
        <section className="cashflow-card">
          <div className="cashflow-section-header">
            <div>
              <h3>Einnahmen</h3>
              <p>Eintraege lassen sich direkt bearbeiten.</p>
            </div>
            <button type="button" className="cashflow-add-btn" onClick={() => openEditor('income')}>
              <Plus size={15} /> Eintrag
            </button>
          </div>

          <div className="cashflow-entry-group">
            <div className="cashflow-category-summary" style={{ borderLeftColor: incomeCategory.color }}>
              <strong>{incomeCategory.label}</strong>
              <span>{formatCurrency(totalIncomeCents, 'EUR')}</span>
            </div>
            <div className="cashflow-entry-list">
              {incomeEntries.length === 0 ? (
                <div className="cashflow-empty">Noch keine Einnahmen eingetragen.</div>
              ) : (
                incomeEntries.map((entry) => (
                  <article key={entry.id} className="cashflow-entry-card">
                    <span className="cashflow-entry-dot" style={{ backgroundColor: incomeCategory.color }} />
                    <div className="cashflow-entry-main">
                      <strong>{entry.label}</strong>
                      <span>{entry.frequency === 'monthly' ? 'monatlich' : 'jaehrlich'} · {formatCurrency(toDisplayAmount(entry, viewMode), 'EUR')}</span>
                      {buildDurationLabel(entry) && <small>{buildDurationLabel(entry)}</small>}
                    </div>
                    <div className="cashflow-entry-actions">
                      <button type="button" onClick={() => openEditor('income', entry)} aria-label={`${entry.label} bearbeiten`}>
                        <PencilLine size={15} />
                      </button>
                      <button type="button" onClick={() => removeEntry(entry.id)} aria-label={`${entry.label} loeschen`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="cashflow-card">
          <div className="cashflow-section-header">
            <div>
              <h3>Ausgaben</h3>
              <p>Mehrere Eintraege pro Kategorie werden gruppiert dargestellt.</p>
            </div>
            <button type="button" className="cashflow-add-btn" onClick={() => openEditor('expense')}>
              <Plus size={15} /> Eintrag
            </button>
          </div>

          <div className="cashflow-category-list">
            {expenseCategories.map((category) => {
              const entries = groupedExpenses.get(category.id) ?? [];
              const totalCategoryCents = entries.reduce((sum, entry) => sum + toDisplayAmount(entry, viewMode), 0);
              return (
                <article key={category.id} className="cashflow-category-card" style={{ borderLeftColor: category.color }}>
                  <div className="cashflow-category-head">
                    <div>
                      <strong>{category.label}</strong>
                      <span>{formatCurrency(totalCategoryCents, 'EUR')}</span>
                    </div>
                    <div className="cashflow-category-color" style={{ backgroundColor: category.color }} />
                  </div>
                  <div className="cashflow-entry-list">
                    {entries.length === 0 ? (
                      <div className="cashflow-empty compact">Keine Eintraege.</div>
                    ) : (
                      entries.map((entry) => (
                        <article key={entry.id} className="cashflow-entry-card">
                          <span className="cashflow-entry-dot" style={{ backgroundColor: category.color }} title={category.label} />
                          <div className="cashflow-entry-main">
                            <strong>{entry.label}</strong>
                            <span>{entry.frequency === 'monthly' ? 'monatlich' : 'jaehrlich'} · {formatCurrency(toDisplayAmount(entry, viewMode), 'EUR')}</span>
                            {buildDurationLabel(entry) && <small>{buildDurationLabel(entry)}</small>}
                          </div>
                          <div className="cashflow-entry-actions">
                            <button type="button" onClick={() => openEditor('expense', entry)} aria-label={`${entry.label} bearbeiten`}>
                              <PencilLine size={15} />
                            </button>
                            <button type="button" onClick={() => removeEntry(entry.id)} aria-label={`${entry.label} loeschen`}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      {editingEntry && (
        <section className="cashflow-editor-card">
          <div className="cashflow-section-header">
            <div>
              <h3>{data.entries.some((entry) => entry.id === editingEntry.id) ? 'Eintrag bearbeiten' : 'Eintrag anlegen'}</h3>
              <p>Mit Laufzeit kann sichtbar gemacht werden, wann wieder mehr Geld verfuegbar ist.</p>
            </div>
            <button type="button" className="cashflow-cancel-btn" onClick={closeEditor}>
              Abbrechen
            </button>
          </div>

          <div className="editor-grid cashflow-editor-grid">
            <label>
              Bezeichnung
              <input value={editingEntry.label} onChange={(event) => setEditingEntry({ ...editingEntry, label: event.target.value })} />
            </label>
            <label>
              Betrag in EUR
              <input
                type="number"
                min="0"
                step="0.01"
                value={editingEntry.amountCents / 100}
                onChange={(event) => setEditingEntry({ ...editingEntry, amountCents: Math.round(Number(event.target.value || 0) * 100) })}
              />
            </label>
            <label>
              Haeufigkeit
              <select value={editingEntry.frequency} onChange={(event) => setEditingEntry({ ...editingEntry, frequency: event.target.value as CashFlowEntry['frequency'] })}>
                <option value="monthly">Monatlich</option>
                <option value="annual">Jaehrlich</option>
              </select>
            </label>
            <label>
              Kategorie
              <select
                value={entryKind === 'income' ? 'income' : editingEntry.category}
                onChange={(event) => setEditingEntry({ ...editingEntry, category: event.target.value })}
                disabled={entryKind === 'income'}
              >
                {entryKind === 'income' ? (
                  <option value="income">Einnahmen</option>
                ) : (
                  expenseCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label>
              Startdatum
              <input type="date" value={editingEntry.startDate ?? todayIso()} onChange={(event) => setEditingEntry({ ...editingEntry, startDate: event.target.value })} />
            </label>
            <label>
              Laufzeit in Monaten
              <input
                type="number"
                min="0"
                step="1"
                value={editingEntry.durationMonths ?? ''}
                onChange={(event) => setEditingEntry({ ...editingEntry, durationMonths: event.target.value === '' ? undefined : Number(event.target.value) })}
              />
            </label>
            <label className="editor-wide">
              Notizen
              <input value={editingEntry.notes ?? ''} onChange={(event) => setEditingEntry({ ...editingEntry, notes: event.target.value })} />
            </label>
          </div>

          <div className="cashflow-form-actions">
            <button type="button" className="cashflow-save-btn" onClick={saveEntry}>
              Speichern
            </button>
            <button type="button" className="cashflow-cancel-btn" onClick={closeEditor}>
              Verwerfen
            </button>
          </div>
        </section>
      )}

      <section className="cashflow-card">
        <div className="cashflow-section-header">
          <div>
            <h3>Kategorien</h3>
            <p>Farben und Bezeichnungen koennen angepasst und erweitert werden.</p>
          </div>
        </div>

        <div className="cashflow-category-admin">
          <div className="cashflow-category-form">
            <input placeholder="Neue Kategorie" value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} />
            <input type="color" value={newCategoryColor} onChange={(event) => setNewCategoryColor(event.target.value)} />
            <select value={newCategoryKind} onChange={(event) => setNewCategoryKind(event.target.value as EntryKind)}>
              <option value="expense">Ausgabe</option>
              <option value="income">Einnahme</option>
            </select>
            <button type="button" onClick={createCategory}>
              <CirclePlus size={15} /> Kategorie
            </button>
          </div>

          <div className="cashflow-category-pills">
            {categories.map((category) => (
              <div key={category.id} className="cashflow-category-pill" style={{ borderColor: category.color }}>
                <input value={category.label} onChange={(event) => updateCategory(category.id, { label: event.target.value })} />
                <input type="color" value={category.color} onChange={(event) => updateCategory(category.id, { color: event.target.value })} />
                {category.id !== 'income' && (
                  <button type="button" className="cashflow-delete-btn" onClick={() => removeCategory(category.id)} aria-label={`${category.label} entfernen`}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="cashflow-chart-footnote">Anzeige: {periodLabel}</div>
    </div>
  );
};
