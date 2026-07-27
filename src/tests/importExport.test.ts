import { describe, expect, test } from 'vitest';

import { migrateExport } from '../storage/migrations';
import { parseImportJson } from '../storage/exportImport';

describe('import export', () => {
  test('json import parse', () => {
    const input = JSON.stringify({
      schemaVersion: 2,
      exportedAt: '2026-01-01T00:00:00.000Z',
      appVersion: '1.0.0',
      plans: [],
      marketData: [],
      settings: {
        theme: 'system',
        locale: 'de-DE',
        currency: 'EUR',
        apiKeys: {},
        showTaxSeries: true,
        basePath: '/',
      },
    });

    const parsed = parseImportJson(input);
    expect(parsed.schemaVersion).toBe(2);
  });

  test('invalid import file', () => {
    expect(() => parseImportJson('{"foo":1}')).toThrow();
  });

  test('schema migration', () => {
    const oldVersion = {
      schemaVersion: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      appVersion: '0.9.0',
      plans: [
        {
          id: '1',
          name: 'Alt',
          productType: 'generic-savings-plan',
          category: 'Test',
          color: '#000',
          currency: 'EUR',
          startDate: '2026-01-01',
          initialValueCents: 0,
          isActive: true,
          visibleInChart: true,
          returnMode: 'forecast',
          forecastReturns: { baseAnnualPercent: 5 },
          contributionRules: [],
          subsidyRules: [],
          pauseRules: [],
          feeRules: [],
          taxConfig: {
            mode: 'disabled',
            applyTaxAnnually: false,
            visibleInChart: true,
          },
          inflationConfig: { enabled: false },
          withdrawalRules: [],
        },
      ],
      marketData: [],
      settings: {
        theme: 'system',
        locale: 'de-DE',
        currency: 'EUR',
        apiKeys: {},
        showTaxSeries: true,
        basePath: '/',
      },
    };

    const migrated = migrateExport(oldVersion as never);
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.plans[0].isArchived).toBe(false);
  });
});
