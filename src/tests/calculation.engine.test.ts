import { describe, expect, test } from 'vitest';

import { annualToMonthlyRate, calculatePlanProjection } from '../calculation/engine';
import { DEFAULT_INFLATION_CONFIG, DEFAULT_TAX_CONFIG } from '../domain/defaults';
import type { SavingsPlan } from '../domain/types';

const basePlan = (overrides: Partial<SavingsPlan> = {}): SavingsPlan => ({
  id: 'p1',
  name: 'Testplan',
  productType: 'generic-savings-plan',
  category: 'Test',
  color: '#000000',
  currency: 'EUR',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  initialValueCents: 0,
  isActive: true,
  isArchived: false,
  visibleInChart: true,
  returnMode: 'forecast',
  forecastReturns: { fixedAnnualPercent: 0 },
  contributionRules: [],
  subsidyRules: [],
  pauseRules: [],
  feeRules: [],
  taxConfig: { ...DEFAULT_TAX_CONFIG, mode: 'disabled', applyTaxAnnually: false },
  inflationConfig: { ...DEFAULT_INFLATION_CONFIG, enabled: false },
  withdrawalRules: [],
  ...overrides,
});

describe('calculation engine', () => {
  test('monthly contribution', () => {
    const plan = basePlan({
      contributionRules: [
        {
          id: 'c1',
          amountCents: 10000,
          startDate: '2025-01-01',
          frequency: 'monthly',
          execution: 'period-start',
        },
      ],
    });

    const result = calculatePlanProjection({ plan });
    const end = result.scenarios[1].points.at(-1);
    expect(end?.ownContributions).toBe(120000);
  });

  test('weekly contribution', () => {
    const plan = basePlan({
      contributionRules: [
        {
          id: 'c1',
          amountCents: 1000,
          startDate: '2025-01-01',
          frequency: 'weekly',
          execution: 'period-start',
        },
      ],
    });

    const result = calculatePlanProjection({ plan });
    const end = result.scenarios[1].points.at(-1);
    expect((end?.ownContributions ?? 0) / 1000).toBeGreaterThanOrEqual(52);
  });

  test('annual contribution', () => {
    const plan = basePlan({
      endDate: '2027-12-31',
      contributionRules: [
        {
          id: 'c1',
          amountCents: 50000,
          startDate: '2025-01-01',
          frequency: 'annual',
          execution: 'period-start',
        },
      ],
    });

    const result = calculatePlanProjection({ plan });
    const end = result.scenarios[1].points.at(-1);
    expect(end?.ownContributions).toBe(150000);
  });

  test('one-time contribution', () => {
    const plan = basePlan({
      contributionRules: [
        {
          id: 'c1',
          amountCents: 99999,
          startDate: '2025-03-01',
          frequency: 'one-time',
          execution: 'period-start',
        },
      ],
    });

    const end = calculatePlanProjection({ plan }).scenarios[1].points.at(-1);
    expect(end?.ownContributions).toBe(99999);
  });

  test('employer subsidy', () => {
    const plan = basePlan({
      subsidyRules: [
        {
          id: 's1',
          type: 'employer',
          label: 'AG',
          amountCents: 2000,
          frequency: 'monthly',
          startDate: '2025-01-01',
          continueDuringPause: true,
        },
      ],
    });

    const end = calculatePlanProjection({ plan }).scenarios[1].points.at(-1);
    expect(end?.subsidies).toBe(24000);
  });

  test('annual subsidy', () => {
    const plan = basePlan({
      subsidyRules: [
        {
          id: 's1',
          type: 'government',
          label: 'Zulage',
          amountCents: 17500,
          frequency: 'annual',
          startDate: '2025-01-01',
          continueDuringPause: false,
        },
      ],
    });

    const end = calculatePlanProjection({ plan }).scenarios[1].points.at(-1);
    expect(end?.subsidies).toBe(17500);
  });

  test('single pause', () => {
    const plan = basePlan({
      contributionRules: [
        {
          id: 'c1',
          amountCents: 10000,
          startDate: '2025-01-01',
          frequency: 'monthly',
          execution: 'period-start',
        },
      ],
      pauseRules: [
        {
          id: 'p',
          label: 'Pause',
          startDate: '2025-04-01',
          endDate: '2025-06-30',
          pauseOwnContributions: true,
          pauseSubsidies: false,
          pauseFees: true,
          continueInterestAccrual: true,
        },
      ],
    });

    const end = calculatePlanProjection({ plan }).scenarios[1].points.at(-1);
    expect(end?.ownContributions).toBe(90000);
  });

  test('multiple overlapping pauses', () => {
    const plan = basePlan({
      contributionRules: [
        {
          id: 'c1',
          amountCents: 10000,
          startDate: '2025-01-01',
          frequency: 'monthly',
          execution: 'period-start',
        },
      ],
      pauseRules: [
        {
          id: 'p1',
          label: 'Pause1',
          startDate: '2025-04-01',
          endDate: '2025-04-30',
          pauseOwnContributions: true,
          pauseSubsidies: false,
          pauseFees: false,
          continueInterestAccrual: true,
        },
        {
          id: 'p2',
          label: 'Pause2',
          startDate: '2025-04-15',
          endDate: '2025-05-31',
          pauseOwnContributions: true,
          pauseSubsidies: false,
          pauseFees: false,
          continueInterestAccrual: true,
        },
      ],
    });

    const end = calculatePlanProjection({ plan }).scenarios[1].points.at(-1);
    expect(end?.ownContributions).toBe(100000);
  });

  test('negative return', () => {
    const plan = basePlan({
      initialValueCents: 100000,
      forecastReturns: { fixedAnnualPercent: -12 },
    });

    const end = calculatePlanProjection({ plan }).scenarios[1].points.at(-1);
    expect((end?.totalValue ?? 0) < 100000).toBe(true);
  });

  test('zero return', () => {
    const plan = basePlan({
      initialValueCents: 100000,
      forecastReturns: { fixedAnnualPercent: 0 },
    });

    const end = calculatePlanProjection({ plan }).scenarios[1].points.at(-1);
    expect(end?.totalValue).toBe(100000);
    expect(end?.ownContributions).toBe(100000);
    expect(end?.gains).toBe(0);
  });

  test('min base max scenarios', () => {
    const plan = basePlan({
      initialValueCents: 100000,
      forecastReturns: { minAnnualPercent: 1, baseAnnualPercent: 5, maxAnnualPercent: 9 },
    });

    const result = calculatePlanProjection({ plan });
    const min = result.scenarios.find((s) => s.scenario === 'min')?.points.at(-1)?.totalValue ?? 0;
    const base = result.scenarios.find((s) => s.scenario === 'base')?.points.at(-1)?.totalValue ?? 0;
    const max = result.scenarios.find((s) => s.scenario === 'max')?.points.at(-1)?.totalValue ?? 0;
    expect(min < base && base < max).toBe(true);
  });

  test('fees reduce value', () => {
    const plan = basePlan({
      initialValueCents: 100000,
      feeRules: [
        {
          id: 'f1',
          name: 'Monat',
          type: 'fixed-monthly',
          amountCents: 500,
          startDate: '2025-01-01',
          paymentFrequency: 'monthly',
          taxRelevant: false,
        },
      ],
    });

    const end = calculatePlanProjection({ plan }).scenarios[1].points.at(-1);
    expect(end?.fees).toBe(6000);
  });

  test('allowance affects taxes', () => {
    const plan = basePlan({
      initialValueCents: 1_000_000,
      forecastReturns: { fixedAnnualPercent: 10 },
      taxConfig: {
        ...DEFAULT_TAX_CONFIG,
        mode: 'taxable',
        annualAllowanceCents: 10_000_000,
        applyTaxAnnually: true,
      },
    });

    const end = calculatePlanProjection({ plan }).scenarios[1].points.at(-1);
    expect(end?.taxes).toBe(0);
  });

  test('inflation real value', () => {
    const plan = basePlan({
      initialValueCents: 100000,
      forecastReturns: { fixedAnnualPercent: 5 },
      inflationConfig: {
        ...DEFAULT_INFLATION_CONFIG,
        enabled: true,
        fixedAnnualRatePercent: 2,
      },
    });

    const end = calculatePlanProjection({ plan, inflationMode: 'fixed' }).scenarios[1].points.at(-1);
    expect((end?.realValue ?? 0) < (end?.totalValue ?? 0)).toBe(true);
  });

  test('one-time withdrawal', () => {
    const plan = basePlan({
      initialValueCents: 100000,
      withdrawalRules: [
        {
          id: 'w1',
          type: 'one-time',
          amountCents: 50000,
          startDate: '2025-06-01',
        },
      ],
    });

    const end = calculatePlanProjection({ plan }).scenarios[1].points.at(-1);
    expect(end?.withdrawals).toBe(50000);
  });

  test('regular withdrawal', () => {
    const plan = basePlan({
      initialValueCents: 300000,
      withdrawalRules: [
        {
          id: 'w1',
          type: 'monthly',
          amountCents: 1000,
          startDate: '2025-01-01',
        },
      ],
    });

    const end = calculatePlanProjection({ plan }).scenarios[1].points.at(-1);
    expect(end?.withdrawals).toBe(12000);
  });

  test('historical share purchases', () => {
    const plan = basePlan({
      returnMode: 'historical',
      contributionRules: [
        {
          id: 'c1',
          amountCents: 10000,
          startDate: '2025-01-01',
          frequency: 'monthly',
          execution: 'period-start',
        },
      ],
    });

    const prices = [
      { date: '2025-01-31', close: 100 },
      { date: '2025-02-28', close: 100 },
      { date: '2025-03-31', close: 100 },
    ];

    const result = calculatePlanProjection({ plan, historicalPrices: prices });
    expect((result.sharesOwned ?? 0) > 0).toBe(true);
    expect(result.scenarios[0].points.at(-1)?.grossContributions).toBe(30000);
  });

  test('leap year handling', () => {
    const plan = basePlan({
      startDate: '2024-01-31',
      endDate: '2024-12-31',
      contributionRules: [
        {
          id: 'c1',
          amountCents: 10000,
          startDate: '2024-01-31',
          frequency: 'monthly',
          execution: 'period-start',
        },
      ],
    });

    const end = calculatePlanProjection({ plan }).scenarios[1].points.at(-1);
    expect(end?.ownContributions).toBe(120000);
  });

  test('cent rounding stability', () => {
    const plan = basePlan({
      initialValueCents: 1,
      forecastReturns: { fixedAnnualPercent: 0.1 },
    });

    const end = calculatePlanProjection({ plan }).scenarios[1].points.at(-1);
    expect(Number.isInteger(end?.totalValue)).toBe(true);
  });

  test('monthly rate formula', () => {
    const monthly = annualToMonthlyRate(12);
    expect(monthly).toBeCloseTo(Math.pow(1.12, 1 / 12) - 1);
  });
});
