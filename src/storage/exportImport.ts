import type { FinanceAppExport } from '../domain/types';
import { exportSchema } from './schema';

const BLOCKED_KEYS = ['__proto__', 'constructor', 'prototype'];

const safeReviver = (key: string, value: unknown): unknown => {
  if (BLOCKED_KEYS.includes(key)) {
    return undefined;
  }

  return value;
};

export const parseImportJson = (raw: string): FinanceAppExport => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw, safeReviver);
  } catch (error) {
    throw new Error(`Importdatei ist keine gueltige JSON-Datei: ${(error as Error).message}`);
  }

  const validation = exportSchema.safeParse(parsed);
  if (!validation.success) {
    throw new Error(`Importdatei ist ungueltig: ${validation.error.message}`);
  }

  return validation.data as unknown as FinanceAppExport;
};

export const downloadJson = (payload: FinanceAppExport): void => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `finance-planner-export-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();

  URL.revokeObjectURL(url);
};
