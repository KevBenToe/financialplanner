import { z } from 'zod';

export const contributionRuleSchema = z.object({
  id: z.string(),
  amountCents: z.number(),
  startDate: z.string(),
  endDate: z.string().optional(),
  frequency: z.enum([
    'one-time',
    'weekly',
    'biweekly',
    'monthly',
    'quarterly',
    'semi-annual',
    'annual',
  ]),
  execution: z.enum(['period-start', 'period-end']),
  annualIncreasePercent: z.number().optional(),
  annualIncreaseFixedCents: z.number().optional(),
  description: z.string().optional(),
});

export const subsidyRuleSchema = z.object({
  id: z.string(),
  type: z.enum(['employer', 'government', 'bonus', 'other']),
  label: z.string(),
  amountCents: z.number(),
  frequency: z.enum([
    'one-time',
    'weekly',
    'biweekly',
    'monthly',
    'quarterly',
    'semi-annual',
    'annual',
  ]),
  startDate: z.string(),
  endDate: z.string().optional(),
  annualIncreasePercent: z.number().optional(),
  annualIncreaseFixedCents: z.number().optional(),
  continueDuringPause: z.boolean(),
});

export const pauseSchema = z.object({
  id: z.string(),
  label: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  pauseOwnContributions: z.boolean(),
  pauseSubsidies: z.boolean(),
  pauseFees: z.boolean(),
  continueInterestAccrual: z.boolean(),
});

export const feeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  amountCents: z.number().optional(),
  percent: z.number().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  paymentFrequency: z.string(),
  taxRelevant: z.boolean(),
});

export const planSchema = z
  .object({
    id: z.string(),
    name: z.string().min(1),
    description: z.string().optional(),
    productType: z.string(),
    category: z.string(),
    color: z.string(),
    currency: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    initialValueCents: z.number(),
    currentManualValueCents: z.number().optional(),
    isActive: z.boolean(),
    isArchived: z.boolean(),
    visibleInChart: z.boolean(),
    returnMode: z.enum(['forecast', 'historical']),
    forecastReturns: z.object({
      fixedAnnualPercent: z.number().optional(),
      minAnnualPercent: z.number().optional(),
      baseAnnualPercent: z.number().optional(),
      maxAnnualPercent: z.number().optional(),
    }),
    historicalProduct: z
      .object({
        isin: z.string().optional(),
        wkn: z.string().optional(),
        ticker: z.string().optional(),
        exchange: z.string().optional(),
        name: z.string().optional(),
        productCurrency: z.string().optional(),
        dataSourceId: z.string().optional(),
        dataSourceIdentifier: z.string().optional(),
      })
      .optional(),
    contributionRules: z.array(contributionRuleSchema),
    subsidyRules: z.array(subsidyRuleSchema),
    pauseRules: z.array(pauseSchema),
    feeRules: z.array(feeSchema),
    taxConfig: z.object({
      mode: z.enum(['tax-free', 'taxable', 'disabled', 'custom-rate']),
      personalTaxRatePercent: z.number().optional(),
      annualAllowanceCents: z.number().optional(),
      partialExemptionPercent: z.number().optional(),
      churchTaxPercent: z.number().optional(),
      applyTaxAnnually: z.boolean(),
      visibleInChart: z.boolean(),
    }),
    inflationConfig: z.object({
      enabled: z.boolean(),
      fixedAnnualRatePercent: z.number().optional(),
      minAnnualRatePercent: z.number().optional(),
      baseAnnualRatePercent: z.number().optional(),
      maxAnnualRatePercent: z.number().optional(),
    }),
    withdrawalRules: z.array(
      z.object({
        id: z.string(),
        type: z.enum(['one-time', 'monthly', 'annual', 'percentage']),
        amountCents: z.number().optional(),
        percentage: z.number().optional(),
        startDate: z.string(),
        endDate: z.string().optional(),
      }),
    ),
    scenarioOfPlanId: z.string().optional(),
  })
  .refine(
    (plan) => !plan.endDate || plan.endDate >= plan.startDate,
    'Enddatum darf nicht vor dem Startdatum liegen.',
  );

export const marketDataSchema = z.object({
  id: z.string(),
  planId: z.string().optional(),
  productKey: z.string(),
  providerId: z.string(),
  points: z.array(
    z.object({
      date: z.string(),
      open: z.number().optional(),
      high: z.number().optional(),
      low: z.number().optional(),
      close: z.number(),
      adjustedClose: z.number().optional(),
      distribution: z.number().optional(),
      currency: z.string().optional(),
    }),
  ),
  importedAt: z.string(),
});

export const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  locale: z.string(),
  currency: z.string(),
  apiKeys: z.record(z.string(), z.string()),
  showTaxSeries: z.boolean(),
  basePath: z.string(),
  lastSavedAt: z.string().optional(),
});

export const exportSchema = z.object({
  schemaVersion: z.number(),
  exportedAt: z.string(),
  appVersion: z.string(),
  plans: z.array(planSchema),
  marketData: z.array(marketDataSchema),
  settings: settingsSchema,
});
