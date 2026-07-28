export type CurrencyCode = 'EUR' | 'USD' | 'CHF' | 'GBP' | 'JPY' | string;

export type ProductType =
  | 'etf'
  | 'stock-portfolio'
  | 'savings-account'
  | 'fixed-deposit'
  | 'pension-insurance'
  | 'riester'
  | 'company-pension'
  | 'fund'
  | 'crypto'
  | 'generic-savings-plan'
  | 'manual-product';

export type ContributionFrequency =
  | 'one-time'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'semi-annual'
  | 'annual';

export type ExecutionTiming = 'period-start' | 'period-end';

export type SubsidyType =
  | 'employer'
  | 'government'
  | 'bonus'
  | 'other';

export type FeeType =
  | 'one-time-closing'
  | 'one-time-setup'
  | 'fixed-monthly'
  | 'fixed-annual'
  | 'percentage-annual-management'
  | 'percentage-assets-under-management'
  | 'purchase-fixed'
  | 'purchase-percentage'
  | 'sell-fee'
  | 'other';

export type TaxMode =
  | 'tax-free'
  | 'taxable'
  | 'disabled'
  | 'custom-rate';

export type WithdrawalType =
  | 'one-time'
  | 'monthly'
  | 'annual'
  | 'percentage';

export type ReturnMode = 'forecast' | 'historical';

export interface ContributionRule {
  id: string;
  amountCents: number;
  startDate: string;
  endDate?: string;
  frequency: ContributionFrequency;
  execution: ExecutionTiming;
  annualIncreasePercent?: number;
  annualIncreaseFixedCents?: number;
  description?: string;
}

export interface SubsidyRule {
  id: string;
  type: SubsidyType;
  label: string;
  amountCents: number;
  frequency: ContributionFrequency;
  startDate: string;
  endDate?: string;
  annualIncreasePercent?: number;
  annualIncreaseFixedCents?: number;
  continueDuringPause: boolean;
}

export interface PauseRule {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  pauseOwnContributions: boolean;
  pauseSubsidies: boolean;
  pauseFees: boolean;
  continueInterestAccrual: boolean;
}

export interface FeeRule {
  id: string;
  name: string;
  type: FeeType;
  amountCents?: number;
  percent?: number;
  startDate: string;
  endDate?: string;
  paymentFrequency: ContributionFrequency;
  taxRelevant: boolean;
}

export interface TaxConfig {
  mode: TaxMode;
  personalTaxRatePercent?: number;
  annualAllowanceCents?: number;
  partialExemptionPercent?: number;
  churchTaxPercent?: number;
  applyTaxAnnually: boolean;
  visibleInChart: boolean;
}

export interface InflationConfig {
  enabled: boolean;
  fixedAnnualRatePercent?: number;
  minAnnualRatePercent?: number;
  baseAnnualRatePercent?: number;
  maxAnnualRatePercent?: number;
}

export interface WithdrawalRule {
  id: string;
  type: WithdrawalType;
  amountCents?: number;
  percentage?: number;
  startDate: string;
  endDate?: string;
}

export interface ForecastReturnConfig {
  fixedAnnualPercent?: number;
  minAnnualPercent?: number;
  baseAnnualPercent?: number;
  maxAnnualPercent?: number;
}

export interface FinancialProductReference {
  isin?: string;
  wkn?: string;
  ticker?: string;
  exchange?: string;
  name?: string;
  productCurrency?: CurrencyCode;
  dataSourceId?: string;
  dataSourceIdentifier?: string;
}

export interface SavingsPlan {
  id: string;
  name: string;
  description?: string;
  productType: ProductType;
  category: string;
  color: string;
  currency: CurrencyCode;
  startDate: string;
  endDate?: string;
  initialValueCents: number;
  currentManualValueCents?: number;
  isActive: boolean;
  isArchived: boolean;
  visibleInChart: boolean;
  returnMode: ReturnMode;
  forecastReturns: ForecastReturnConfig;
  historicalProduct?: FinancialProductReference;
  contributionRules: ContributionRule[];
  subsidyRules: SubsidyRule[];
  pauseRules: PauseRule[];
  feeRules: FeeRule[];
  taxConfig: TaxConfig;
  inflationConfig: InflationConfig;
  withdrawalRules: WithdrawalRule[];
  scenarioOfPlanId?: string;
}

export interface HistoricalPricePoint {
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close: number;
  adjustedClose?: number;
  distribution?: number;
  currency?: CurrencyCode;
}

export interface StoredMarketData {
  id: string;
  planId?: string;
  productKey: string;
  providerId: string;
  points: HistoricalPricePoint[];
  importedAt: string;
}

export interface ProjectionPoint {
  date: string;
  ownContributions: number;
  subsidies: number;
  grossContributions: number;
  fees: number;
  taxes: number;
  withdrawals: number;
  gains: number;
  totalValue: number;
  realValue?: number;
}

export interface ProjectionScenario {
  scenario: 'min' | 'base' | 'max';
  points: ProjectionPoint[];
}

export interface PlanProjectionResult {
  planId: string;
  scenarios: ProjectionScenario[];
  averageAnnualReturnPercent: number;
  xirrPercent?: number;
  avgEntryPrice?: number;
  sharesOwned?: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  locale: string;
  currency: CurrencyCode;
  apiKeys: Record<string, string>;
  showTaxSeries: boolean;
  basePath: string;
  lastSavedAt?: string;
}

export interface FinanceAppExport {
  schemaVersion: number;
  exportedAt: string;
  appVersion: string;
  plans: SavingsPlan[];
  marketData: StoredMarketData[];
  settings: AppSettings;
}

export interface FinancialProductSearchResult {
  id: string;
  name: string;
  isin?: string;
  wkn?: string;
  ticker?: string;
  exchange?: string;
  currency?: CurrencyCode;
}

export interface CalculationRequest {
  plan: SavingsPlan;
  startDate?: string;
  endDate?: string;
  inflationMode?: 'off' | 'fixed' | 'min' | 'base' | 'max';
  historicalPrices?: HistoricalPricePoint[];
}

export type CashFlowCategory = string;

export interface CashFlowCategoryConfig {
  id: string;
  label: string;
  color: string;
  kind: 'income' | 'expense';
}

export interface CashFlowEntry {
  id: string;
  label: string;
  amountCents: number;
  frequency: 'monthly' | 'annual';
  category: CashFlowCategory;
  startDate?: string;
  durationMonths?: number;
  notes?: string;
}

export interface CashFlowData {
  entries: CashFlowEntry[];
  categories: CashFlowCategoryConfig[];
}

export interface LoanSpecialPayment {
  id: string;
  monthIndex: number;
  amountCents: number;
  label?: string;
}

export interface LoanEntry {
  id: string;
  name: string;
  principalCents: number;
  annualInterestRatePercent: number;
  termMonths: number;
  monthlyPaymentCents: number;
  extraPaymentCents: number;
  startDate: string;
  specialPayments: LoanSpecialPayment[];
  notes?: string;
}

export interface LoanData {
  loans: LoanEntry[];
}
