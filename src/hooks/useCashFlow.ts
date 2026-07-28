import { useCallback, useEffect, useState } from 'react';

import type { CashFlowData, CashFlowEntry } from '../domain/types';
import { createId } from '../utils/id';

const STORAGE_KEY = 'finance-planner:cashflow';

const loadFromStorage = (): CashFlowData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as CashFlowData;
    }
  } catch {
    // ignore parse errors
  }
  return { entries: [] };
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
      entries: [...prev.entries, { ...entry, id: createId() }],
    }));
  }, []);

  const updateEntry = useCallback((id: string, changes: Partial<Omit<CashFlowEntry, 'id'>>) => {
    setData((prev) => ({
      entries: prev.entries.map((e) => (e.id === id ? { ...e, ...changes } : e)),
    }));
  }, []);

  const removeEntry = useCallback((id: string) => {
    setData((prev) => ({
      entries: prev.entries.filter((e) => e.id !== id),
    }));
  }, []);

  return { data, addEntry, updateEntry, removeEntry };
};
