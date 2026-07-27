import type {
  AppSettings,
  FinanceAppExport,
  SavingsPlan,
  StoredMarketData,
} from '../domain/types';

export interface FinanceStorage {
  getPlans(): Promise<SavingsPlan[]>;
  savePlan(plan: SavingsPlan): Promise<void>;
  deletePlan(id: string): Promise<void>;
  getMarketData(): Promise<StoredMarketData[]>;
  saveMarketData(entry: StoredMarketData): Promise<void>;
  clearAll(): Promise<void>;
  getSettings(): Promise<AppSettings | null>;
  saveSettings(settings: AppSettings): Promise<void>;
  exportData(appVersion: string): Promise<FinanceAppExport>;
  importData(data: FinanceAppExport, mode: 'merge' | 'replace'): Promise<void>;
}
