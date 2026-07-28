import { useCallback, useEffect, useState } from 'react';

import type { CashFlowCategoryConfig, CashFlowData, CashFlowEntry } from '../domain/types';
import { createId } from '../utils/id';

const STORAGE_KEY = 'finance-planner:cashflow';

const DEFAULT_CATEGORIES: CashFlowCategoryConfig[] = [
  { id: 'income', label: 'Einnahmen', color: '#22c55e', kind: 'income' },
  { id: 'housing', label: 'Wohnen', color: '#3b82f6', kind: 'expense' },
  { id: 'insurance', label: 'Versicherungen', color: '#8b5cf6', kind: 'expense' },
  { id: 'contracts', label: 'Vertraege', color: '#06b6d4', kind: 'expense' },
  { id: 'pension', label: 'Rente / Altersvorsorge', color: '#f59e0b', kind: 'expense' },
  { id: 'savings', label: 'Sparen / Investieren', color: '#10b981', kind: 'expense' },
  { id: 'mobility', label: 'Mobilitaet', color: '#f97316', kind: 'expense' },
  { id: 'groceries', label: 'Lebensmittel', color: '#84cc16', kind: 'expense' },
  { id: 'entertainment', label: 'Freizeit', color: '#ec4899', kind: 'expense' },
  { id: 'other', label: 'Sonstiges', color: '#94a3b8', kind: 'expense' },
];

const loadFromStorage = (): CashFlowData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CashFlowData>;
      return {
        entries: parsed.entries ?? [],
        categories: parsed.categories?.length ? parsed.categories : DEFAULT_CATEGORIES,
      };
    }
  } catch {
    // ignore parse errors
  }
  return { entries: [], categories: DEFAULT_CATEGORIES };
};

const saveToStorage = (data: CashFlowData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
};

export const useCashFlow = () => {
  const [data, setData] = useState<CashFlowData>(loadFromStorage);

  useEffect(() => {
    saveToStorage(data);
  }, [data]);

  const addEntry = useCallback((entry: Omit<CashFlowEntry, 'id'>) => {
    setData((prev) => ({
      ...prev,
      entries: [...prev.entries, { ...entry, id: createId() }],
    }));
  }, []);

  const updateEntry = useCallback((id: string, changes: Partial<Omit<CashFlowEntry, 'id'>>) => {
    setData((prev) => ({
      ...prev,
      entries: prev.entries.map((e) => (e.id === id ? { ...e, ...changes } : e)),
    }));
  }, []);

  const removeEntry = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      entries: prev.entries.filter((e) => e.id !== id),
    }));
  }, []);

  const addCategory = useCallback((category: Omit<CashFlowCategoryConfig, 'id'>) => {
    setData((prev) => ({
      ...prev,
      categories: [...prev.categories, { ...category, id: createId() }],
    }));
  }, []);

  const updateCategory = useCallback((id: string, changes: Partial<Omit<CashFlowCategoryConfig, 'id'>>) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.map((category) => (category.id === id ? { ...category, ...changes } : category)),
    }));
  }, []);

  const removeCategory = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.filter((category) => category.id !== id),
      entries: prev.entries.map((entry) => (entry.category === id ? { ...entry, category: 'other' } : entry)),
    }));
  }, []);

  return { data, addEntry, updateEntry, removeEntry, addCategory, updateCategory, removeCategory };
};
