import type {
  AppSettings,
  InflationConfig,
  SavingsPlan,
  TaxConfig,
} from './types';

export const DEFAULT_TAX_CONFIG: TaxConfig = {
  mode: 'taxable',
  personalTaxRatePercent: 26.375,
  annualAllowanceCents: 100000,
  partialExemptionPercent: 0,
  churchTaxPercent: 0,
  applyTaxAnnually: true,
  visibleInChart: true,
};

export const DEFAULT_INFLATION_CONFIG: InflationConfig = {
  enabled: false,
  fixedAnnualRatePercent: 2,
  minAnnualRatePercent: 1,
  baseAnnualRatePercent: 2,
  maxAnnualRatePercent: 3,
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  locale: 'de-DE',
  currency: 'EUR',
  apiKeys: {},
  showTaxSeries: true,
  basePath: import.meta.env.BASE_URL,
};

export const createEmptyPlan = (id: string): SavingsPlan => ({
  id,
  name: 'Neuer Sparplan',
  description: '',
  productType: 'generic-savings-plan',
  category: 'Allgemein',
  color: '#0f766e',
  currency: 'EUR',
  startDate: new Date().toISOString().slice(0, 10),
  initialValueCents: 0,
  isActive: true,
  isArchived: false,
  visibleInChart: true,
  returnMode: 'forecast',
  forecastReturns: {
    minAnnualPercent: 2,
    baseAnnualPercent: 5,
    maxAnnualPercent: 8,
  },
  contributionRules: [],
  subsidyRules: [],
  pauseRules: [],
  feeRules: [],
  taxConfig: { ...DEFAULT_TAX_CONFIG },
  inflationConfig: { ...DEFAULT_INFLATION_CONFIG },
  withdrawalRules: [],
});
