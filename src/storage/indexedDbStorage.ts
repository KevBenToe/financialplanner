import Dexie, { type Table } from 'dexie';

import { DEFAULT_SETTINGS } from '../domain/defaults';
import type {
  AppSettings,
  FinanceAppExport,
  SavingsPlan,
  StoredMarketData,
} from '../domain/types';
import { getCurrentSchemaVersion, migrateExport } from './migrations';
import { exportSchema, settingsSchema } from './schema';
import type { FinanceStorage } from './types';

interface SettingRecord {
  id: 'app';
  value: AppSettings;
}

class FinanceDb extends Dexie {
  plans!: Table<SavingsPlan, string>;
  marketData!: Table<StoredMarketData, string>;
  settings!: Table<SettingRecord, 'app'>;

  constructor() {
    super('finance-planner-db');

    this.version(1).stores({
      plans: '&id, name, productType, startDate, endDate',
      marketData: '&id, planId, productKey, providerId',
      settings: '&id',
    });
  }
}

export class IndexedDbFinanceStorage implements FinanceStorage {
  private readonly db = new FinanceDb();

  async getPlans(): Promise<SavingsPlan[]> {
    return this.db.plans.toArray();
  }

  async savePlan(plan: SavingsPlan): Promise<void> {
    await this.db.plans.put(plan);
  }

  async deletePlan(id: string): Promise<void> {
    await this.db.plans.delete(id);
  }

  async getMarketData(): Promise<StoredMarketData[]> {
    return this.db.marketData.toArray();
  }

  async saveMarketData(entry: StoredMarketData): Promise<void> {
    await this.db.marketData.put(entry);
  }

  async clearAll(): Promise<void> {
    await this.db.transaction('rw', [this.db.plans, this.db.marketData, this.db.settings], async () => {
      await this.db.plans.clear();
      await this.db.marketData.clear();
      await this.db.settings.clear();
    });
  }

  async getSettings(): Promise<AppSettings | null> {
    const record = await this.db.settings.get('app');

    if (!record) {
      return null;
    }

    const parsed = settingsSchema.safeParse(record.value);
    return parsed.success ? (parsed.data as unknown as AppSettings) : null;
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await this.db.settings.put({ id: 'app', value: settings });
    localStorage.setItem('finance-planner:theme', settings.theme);
    localStorage.setItem('finance-planner:last-saved-at', new Date().toISOString());
  }

  async exportData(appVersion: string): Promise<FinanceAppExport> {
    const plans = await this.getPlans();
    const marketData = await this.getMarketData();
    const settings = (await this.getSettings()) ?? DEFAULT_SETTINGS;

    return {
      schemaVersion: getCurrentSchemaVersion(),
      exportedAt: new Date().toISOString(),
      appVersion,
      plans,
      marketData,
      settings,
    };
  }

  async importData(data: FinanceAppExport, mode: 'merge' | 'replace'): Promise<void> {
    const migrated = migrateExport(data);
    const parsed = exportSchema.parse(migrated);

    if (mode === 'replace') {
      await this.clearAll();
    }

    await this.db.transaction('rw', [this.db.plans, this.db.marketData, this.db.settings], async () => {
      for (const plan of parsed.plans) {
        await this.db.plans.put(plan as unknown as SavingsPlan);
      }

      for (const row of parsed.marketData) {
        await this.db.marketData.put(row);
      }

      await this.db.settings.put({ id: 'app', value: parsed.settings as unknown as AppSettings });
    });
  }
}

export const financeStorage: FinanceStorage = new IndexedDbFinanceStorage();
