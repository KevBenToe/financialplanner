import Papa from 'papaparse';

import type {
  FinancialProductReference,
  FinancialProductSearchResult,
  HistoricalPricePoint,
} from '../domain/types';

export interface MarketDataProvider {
  id: string;
  name: string;
  searchProducts(query: string): Promise<FinancialProductSearchResult[]>;
  getHistoricalPrices(
    product: FinancialProductReference,
    startDate: string,
    endDate: string,
  ): Promise<HistoricalPricePoint[]>;
}

export class ManualSeriesProvider implements MarketDataProvider {
  id = 'manual';
  name = 'Manueller Kursverlauf';

  constructor(private readonly points: HistoricalPricePoint[] = []) {}

  async searchProducts(query: string): Promise<FinancialProductSearchResult[]> {
    return [{ id: `manual-${query}`, name: `Manueller Datensatz: ${query}` }];
  }

  async getHistoricalPrices(): Promise<HistoricalPricePoint[]> {
    return this.points;
  }
}

export class DemoDataProvider implements MarketDataProvider {
  id = 'demo';
  name = 'Demo-Datenanbieter';

  async searchProducts(query: string): Promise<FinancialProductSearchResult[]> {
    return [
      {
        id: `demo-${query}`,
        name: `Demo Produkt ${query}`,
        ticker: `D-${query.slice(0, 4).toUpperCase()}`,
        currency: 'EUR',
      },
    ];
  }

  async getHistoricalPrices(
    _product: FinancialProductReference,
    startDate: string,
    endDate: string,
  ): Promise<HistoricalPricePoint[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const result: HistoricalPricePoint[] = [];
    const cursor = new Date(start);
    let seed = 101;

    while (cursor <= end) {
      seed = (seed * 9301 + 49297) % 233280;
      const dailyNoise = (seed / 233280 - 0.5) * 0.8;
      const trend = 100 + (cursor.getTime() - start.getTime()) / (1000 * 3600 * 24 * 30) * 0.6;
      const close = Number((trend + dailyNoise).toFixed(2));

      result.push({
        date: cursor.toISOString().slice(0, 10),
        close,
        adjustedClose: close,
        currency: 'EUR',
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }
}

export const parseHistoricalCsv = (input: string): HistoricalPricePoint[] => {
  const parse = Papa.parse<Record<string, string>>(input, {
    header: true,
    skipEmptyLines: true,
    delimitersToGuess: [';', ','],
  });

  if (parse.errors.length > 0) {
    throw new Error(`CSV-Import fehlgeschlagen: ${parse.errors[0].message}`);
  }

  const normalized = parse.data
    .map((row) => {
      const date = row.Datum ?? row.Date ?? row.date ?? row.datum;
      const closeRaw =
        row.Schlusskurs ??
        row.Close ??
        row.close ??
        row['bereinigter Schlusskurs'] ??
        row.AdjustedClose;

      if (!date || !closeRaw) {
        return null;
      }

      const normalizedDate = normalizeDate(date);
      const close = Number.parseFloat(closeRaw.replace(',', '.'));

      if (!normalizedDate || Number.isNaN(close)) {
        return null;
      }

      return {
        date: normalizedDate,
        close,
      } satisfies HistoricalPricePoint;
    })
    .filter((item): item is HistoricalPricePoint => item !== null);

  if (normalized.length === 0) {
    throw new Error('CSV-Import hat keine verwertbaren Kursdaten geliefert.');
  }

  return normalized.sort((a, b) => a.date.localeCompare(b.date));
};

export const parseHistoricalJson = (input: string): HistoricalPricePoint[] => {
  const parsed = JSON.parse(input) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('JSON-Import erwartet ein Array von Kursdaten.');
  }

  const rows: HistoricalPricePoint[] = [];

  for (const item of parsed) {
    if (typeof item !== 'object' || item === null) {
      continue;
    }

    const row = item as Record<string, unknown>;
    if (typeof row.date !== 'string' || typeof row.close !== 'number') {
      continue;
    }

    rows.push({
      date: normalizeDate(row.date) ?? row.date,
      close: row.close,
      adjustedClose: typeof row.adjustedClose === 'number' ? row.adjustedClose : undefined,
    });
  }

  return rows.sort((a, b) => a.date.localeCompare(b.date));
};

const normalizeDate = (value: string): string | null => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
    const [d, m, y] = value.split('.');
    return `${y}-${m}-${d}`;
  }

  return null;
};

export class ExternalApiAdapterProvider implements MarketDataProvider {
  id = 'external-adapter';
  name = 'Externe API-Adapterstruktur';

  async searchProducts(query: string): Promise<FinancialProductSearchResult[]> {
    void query;
    return [];
  }

  async getHistoricalPrices(): Promise<HistoricalPricePoint[]> {
    throw new Error(
      'Externe Browserabfragen koennen durch CORS oder API-Beschraenkungen blockiert sein. Hinterlegen Sie API-Schluessel nur lokal in den App-Einstellungen.',
    );
  }
}
