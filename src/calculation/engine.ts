import { addMonths, endOfMonth, isAfter, isBefore, isEqual, parseISO, startOfMonth } from 'date-fns';

import type {
  CalculationRequest,
  ContributionRule,
  HistoricalPricePoint,
  PlanProjectionResult,
  ProjectionPoint,
  ProjectionScenario,
  SavingsPlan,
  SubsidyRule,
} from '../domain/types';
import { addByFrequency, isWithinInclusive, toIsoDate } from '../utils/date';

interface Cashflows {
  ownContributionCents: number;
  subsidyCents: number;
  purchaseFeeCents: number;
}

interface HistoricalState {
  shares: number;
  avgEntryPrice: number;
  investedOwnCents: number;
  investedSubsidyCents: number;
}

const DEFAULT_PROJECTION_YEARS = 30;

const getAnnualReturn = (
  plan: SavingsPlan,
  scenario: 'min' | 'base' | 'max',
): number => {
  if (plan.forecastReturns.fixedAnnualPercent !== undefined) {
    return plan.forecastReturns.fixedAnnualPercent;
  }

  if (scenario === 'min') {
    return plan.forecastReturns.minAnnualPercent ?? plan.forecastReturns.baseAnnualPercent ?? 0;
  }

  if (scenario === 'max') {
    return plan.forecastReturns.maxAnnualPercent ?? plan.forecastReturns.baseAnnualPercent ?? 0;
  }

  return plan.forecastReturns.baseAnnualPercent ?? 0;
};

export const annualToMonthlyRate = (annualPercent: number): number => {
  return Math.pow(1 + annualPercent / 100, 1 / 12) - 1;
};

const inflationAnnualRate = (
  plan: SavingsPlan,
  mode: CalculationRequest['inflationMode'],
): number => {
  if (!plan.inflationConfig.enabled || mode === 'off') {
    return 0;
  }

  if (mode === 'fixed') {
    return plan.inflationConfig.fixedAnnualRatePercent ?? 0;
  }

  if (mode === 'min') {
    return plan.inflationConfig.minAnnualRatePercent ?? 0;
  }

  if (mode === 'max') {
    return plan.inflationConfig.maxAnnualRatePercent ?? 0;
  }

  return plan.inflationConfig.baseAnnualRatePercent ?? plan.inflationConfig.fixedAnnualRatePercent ?? 0;
};

const isPlanPausedFor = (
  plan: SavingsPlan,
  monthStartDate: Date,
  field: 'pauseOwnContributions' | 'pauseSubsidies' | 'pauseFees',
): boolean => {
  return plan.pauseRules.some((pause) => {
    if (!pause[field]) {
      return false;
    }

    const start = parseISO(pause.startDate);
    const end = parseISO(pause.endDate);

    return isWithinInclusive(monthStartDate, start, end);
  });
};

const applyRuleEscalation = (
  ruleStartDate: string,
  monthDate: Date,
  baseCents: number,
  annualIncreasePercent?: number,
  annualIncreaseFixedCents?: number,
): number => {
  const yearsElapsed = Math.max(0, monthDate.getFullYear() - parseISO(ruleStartDate).getFullYear());

  let adjusted = baseCents;
  if (annualIncreasePercent && annualIncreasePercent !== 0) {
    adjusted = Math.round(adjusted * Math.pow(1 + annualIncreasePercent / 100, yearsElapsed));
  }

  if (annualIncreaseFixedCents && annualIncreaseFixedCents !== 0) {
    adjusted += annualIncreaseFixedCents * yearsElapsed;
  }

  return Math.max(0, adjusted);
};

const countOccurrencesInMonth = (
  ruleStartDate: string,
  monthStartDate: Date,
  monthEndDate: Date,
  frequency: ContributionRule['frequency'] | SubsidyRule['frequency'],
  endDate?: string,
): number => {
  let cursor = parseISO(ruleStartDate);
  const end = endDate ? parseISO(endDate) : undefined;
  let count = 0;

  while (isBefore(cursor, monthStartDate)) {
    cursor = addByFrequency(cursor, frequency);
    if (isAfter(cursor, monthEndDate)) {
      break;
    }
    if (frequency === 'one-time') {
      break;
    }
  }

  while (
    (isBefore(cursor, monthEndDate) || isEqual(cursor, monthEndDate)) &&
    (!end || isBefore(cursor, end) || isEqual(cursor, end))
  ) {
    if (!isBefore(cursor, monthStartDate)) {
      count += 1;
    }

    if (frequency === 'one-time') {
      break;
    }

    cursor = addByFrequency(cursor, frequency);
  }

  return count;
};

const activeInMonth = (startDate: string, monthDate: Date, endDate?: string): boolean => {
  const start = parseISO(startDate);
  const monthEndDate = endOfMonth(monthDate);

  if (isBefore(monthEndDate, start)) {
    return false;
  }

  if (!endDate) {
    return true;
  }

  const end = parseISO(endDate);
  return !(isAfter(monthDate, end));
};

const computeCashflows = (
  plan: SavingsPlan,
  monthStartDate: Date,
  monthEndDate: Date,
): Cashflows => {
  const pausedOwn = isPlanPausedFor(plan, monthStartDate, 'pauseOwnContributions');
  const pausedSubsidies = isPlanPausedFor(plan, monthStartDate, 'pauseSubsidies');

  let ownContributionCents = 0;
  for (const rule of plan.contributionRules) {
    if (!activeInMonth(rule.startDate, monthStartDate, rule.endDate)) {
      continue;
    }

    const amount = applyRuleEscalation(
      rule.startDate,
      monthStartDate,
      rule.amountCents,
      rule.annualIncreasePercent,
      rule.annualIncreaseFixedCents,
    );

    const count = countOccurrencesInMonth(
      rule.startDate,
      monthStartDate,
      monthEndDate,
      rule.frequency,
      rule.endDate,
    );

    if (!pausedOwn) {
      ownContributionCents += amount * count;
    }
  }

  let subsidyCents = 0;
  for (const rule of plan.subsidyRules) {
    if (!activeInMonth(rule.startDate, monthStartDate, rule.endDate)) {
      continue;
    }

    const amount = applyRuleEscalation(
      rule.startDate,
      monthStartDate,
      rule.amountCents,
      rule.annualIncreasePercent,
      rule.annualIncreaseFixedCents,
    );

    const count = countOccurrencesInMonth(
      rule.startDate,
      monthStartDate,
      monthEndDate,
      rule.frequency,
      rule.endDate,
    );

    if (!pausedSubsidies || rule.continueDuringPause) {
      subsidyCents += amount * count;
    }
  }

  let purchaseFeeCents = 0;
  const grossContribution = ownContributionCents + subsidyCents;
  for (const fee of plan.feeRules) {
    if (!activeInMonth(fee.startDate, monthStartDate, fee.endDate)) {
      continue;
    }

    if (fee.type === 'purchase-fixed') {
      purchaseFeeCents += fee.amountCents ?? 0;
    }

    if (fee.type === 'purchase-percentage') {
      purchaseFeeCents += Math.round(grossContribution * ((fee.percent ?? 0) / 100));
    }
  }

  return {
    ownContributionCents,
    subsidyCents,
    purchaseFeeCents,
  };
};

const computeMonthlyFees = (
  plan: SavingsPlan,
  monthStartDate: Date,
  totalValueCents: number,
): number => {
  if (isPlanPausedFor(plan, monthStartDate, 'pauseFees')) {
    return 0;
  }

  let fees = 0;

  for (const fee of plan.feeRules) {
    if (!activeInMonth(fee.startDate, monthStartDate, fee.endDate)) {
      continue;
    }

    switch (fee.type) {
      case 'one-time-closing':
      case 'one-time-setup':
        if (toIsoDate(monthStartDate) === fee.startDate) {
          fees += fee.amountCents ?? 0;
        }
        break;
      case 'fixed-monthly':
        fees += fee.amountCents ?? 0;
        break;
      case 'fixed-annual':
        if (monthStartDate.getMonth() === 0) {
          fees += fee.amountCents ?? 0;
        }
        break;
      case 'percentage-annual-management':
      case 'percentage-assets-under-management':
        fees += Math.round(totalValueCents * ((fee.percent ?? 0) / 100) / 12);
        break;
      default:
        if (fee.amountCents) {
          fees += fee.amountCents;
        }
        break;
    }
  }

  return Math.max(0, fees);
};

const computeTaxes = (
  plan: SavingsPlan,
  monthStartDate: Date,
  monthlyGainCents: number,
  yearTaxableGainCents: number,
): { monthTaxCents: number; updatedYearTaxableGainCents: number } => {
  if (plan.taxConfig.mode === 'tax-free' || plan.taxConfig.mode === 'disabled') {
    return {
      monthTaxCents: 0,
      updatedYearTaxableGainCents: yearTaxableGainCents + Math.max(0, monthlyGainCents),
    };
  }

  const taxRate =
    plan.taxConfig.mode === 'custom-rate'
      ? (plan.taxConfig.personalTaxRatePercent ?? 0) / 100
      : (plan.taxConfig.personalTaxRatePercent ?? 26.375) / 100;

  const updatedYearTaxableGainCents = yearTaxableGainCents + Math.max(0, monthlyGainCents);
  const allowance = plan.taxConfig.annualAllowanceCents ?? 0;
  const partialExemptionFactor =
    1 - (Math.max(0, plan.taxConfig.partialExemptionPercent ?? 0) / 100);

  if (plan.taxConfig.applyTaxAnnually) {
    if (monthStartDate.getMonth() !== 11) {
      return {
        monthTaxCents: 0,
        updatedYearTaxableGainCents,
      };
    }

    const taxable = Math.max(0, (updatedYearTaxableGainCents - allowance) * partialExemptionFactor);
    const churchTax = plan.taxConfig.churchTaxPercent ?? 0;
    const totalRate = taxRate * (1 + churchTax / 100);

    return {
      monthTaxCents: Math.round(taxable * totalRate),
      updatedYearTaxableGainCents: 0,
    };
  }

  const taxableMonth = Math.max(0, (monthlyGainCents - allowance / 12) * partialExemptionFactor);
  const churchTax = plan.taxConfig.churchTaxPercent ?? 0;
  const totalRate = taxRate * (1 + churchTax / 100);

  return {
    monthTaxCents: Math.round(taxableMonth * totalRate),
    updatedYearTaxableGainCents,
  };
};

const computeWithdrawals = (
  plan: SavingsPlan,
  monthStartDate: Date,
  monthEndDate: Date,
  currentValueCents: number,
): number => {
  let withdrawal = 0;

  for (const rule of plan.withdrawalRules) {
    if (!activeInMonth(rule.startDate, monthStartDate, rule.endDate)) {
      continue;
    }

    const count = countOccurrencesInMonth(
      rule.startDate,
      monthStartDate,
      monthEndDate,
      rule.type === 'percentage' ? 'monthly' : rule.type,
      rule.endDate,
    );

    if (rule.type === 'percentage') {
      withdrawal += Math.round(currentValueCents * ((rule.percentage ?? 0) / 100) * count);
    } else {
      withdrawal += (rule.amountCents ?? 0) * count;
    }
  }

  return Math.max(0, withdrawal);
};

const estimateXirr = (points: ProjectionPoint[]): number | undefined => {
  if (points.length < 2) {
    return undefined;
  }

  const first = points[0];
  const last = points[points.length - 1];
  if (first.grossContributions <= 0 || last.totalValue <= 0) {
    return undefined;
  }

  const years = Math.max(1 / 12, (points.length - 1) / 12);
  return (Math.pow(last.totalValue / first.grossContributions, 1 / years) - 1) * 100;
};

const runHistorical = (
  request: CalculationRequest,
  prices: HistoricalPricePoint[],
): PlanProjectionResult => {
  const sorted = [...prices].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) {
    return {
      planId: request.plan.id,
      scenarios: [{ scenario: 'base', points: [] }],
      averageAnnualReturnPercent: 0,
    };
  }

  const startDate = request.startDate ?? request.plan.startDate;
  const endDate = request.endDate ?? request.plan.endDate ?? sorted[sorted.length - 1].date;

  const points: ProjectionPoint[] = [];
  const historicalState: HistoricalState = {
    shares: 0,
    avgEntryPrice: 0,
    investedOwnCents: 0,
    investedSubsidyCents: 0,
  };

  let totalValueCents = 0;
  let cumulativeOwn = request.plan.initialValueCents;
  let cumulativeSubsidies = 0;
  let cumulativeFees = 0;
  const cumulativeTaxes = 0;
  let initialValueInvested = false;

  for (const pricePoint of sorted) {
    if (pricePoint.date < startDate || pricePoint.date > endDate) {
      continue;
    }

    const date = parseISO(pricePoint.date);
    const monthStartDate = startOfMonth(date);
    const monthEndDate = endOfMonth(date);

    const flows = computeCashflows(request.plan, monthStartDate, monthEndDate);
    const netInvestable = Math.max(0, flows.ownContributionCents + flows.subsidyCents - flows.purchaseFeeCents);
    const closePrice = pricePoint.adjustedClose ?? pricePoint.close;

    if (!initialValueInvested && closePrice > 0 && request.plan.initialValueCents > 0) {
      historicalState.shares += request.plan.initialValueCents / 100 / closePrice;
      historicalState.avgEntryPrice = closePrice;
      historicalState.investedOwnCents += request.plan.initialValueCents;
      initialValueInvested = true;
    }

    if (closePrice > 0 && netInvestable > 0) {
      const boughtShares = netInvestable / 100 / closePrice;
      const currentCost = historicalState.avgEntryPrice * historicalState.shares;
      historicalState.shares += boughtShares;
      historicalState.avgEntryPrice =
        historicalState.shares > 0
          ? (currentCost + netInvestable / 100) / historicalState.shares
          : historicalState.avgEntryPrice;
      historicalState.investedOwnCents += flows.ownContributionCents;
      historicalState.investedSubsidyCents += flows.subsidyCents;
    }

    totalValueCents = Math.round(historicalState.shares * closePrice * 100);

    cumulativeOwn += flows.ownContributionCents;
    cumulativeSubsidies += flows.subsidyCents;
    cumulativeFees += flows.purchaseFeeCents;

    const gains = totalValueCents - cumulativeOwn - cumulativeSubsidies + cumulativeFees + cumulativeTaxes;

    points.push({
      date: pricePoint.date,
      ownContributions: cumulativeOwn,
      subsidies: cumulativeSubsidies,
      grossContributions: cumulativeOwn + cumulativeSubsidies,
      fees: cumulativeFees,
      taxes: cumulativeTaxes,
      withdrawals: 0,
      gains,
      totalValue: totalValueCents,
    });
  }

  return {
    planId: request.plan.id,
    scenarios: [{ scenario: 'base', points }],
    averageAnnualReturnPercent: estimateXirr(points) ?? 0,
    xirrPercent: estimateXirr(points),
    avgEntryPrice: historicalState.avgEntryPrice,
    sharesOwned: historicalState.shares,
  };
};

const runForecastScenario = (
  request: CalculationRequest,
  scenario: 'min' | 'base' | 'max',
): ProjectionScenario => {
  const plan = request.plan;
  const startDate = request.startDate ?? plan.startDate;

  const defaultEnd = addMonths(parseISO(startDate), DEFAULT_PROJECTION_YEARS * 12);
  const endDate = request.endDate ?? plan.endDate ?? toIsoDate(defaultEnd);

  const monthlyRate = annualToMonthlyRate(getAnnualReturn(plan, scenario));
  const monthlyInflationRate = annualToMonthlyRate(
    inflationAnnualRate(plan, request.inflationMode ?? 'off'),
  );

  const points: ProjectionPoint[] = [];
  let cursor = startOfMonth(parseISO(startDate));
  const end = startOfMonth(parseISO(endDate));

  let value = plan.initialValueCents;
  let cumulativeOwn = plan.initialValueCents;
  let cumulativeSubsidies = 0;
  let cumulativeFees = 0;
  let cumulativeTaxes = 0;
  let cumulativeWithdrawals = 0;
  let yearlyTaxableGainCents = 0;

  while (!isAfter(cursor, end)) {
    const monthStartDate = cursor;
    const monthEndDate = endOfMonth(cursor);

    const flows = computeCashflows(plan, monthStartDate, monthEndDate);
    const grossContribution = flows.ownContributionCents + flows.subsidyCents;

    value += grossContribution;
    value -= flows.purchaseFeeCents;

    const beforeYield = value;
    value = Math.round(value * (1 + monthlyRate));
    const monthGain = value - beforeYield;

    const recurringFees = computeMonthlyFees(plan, monthStartDate, value);
    value -= recurringFees;

    const taxResult = computeTaxes(plan, monthStartDate, monthGain, yearlyTaxableGainCents);
    yearlyTaxableGainCents = taxResult.updatedYearTaxableGainCents;
    value -= taxResult.monthTaxCents;

    const withdrawal = computeWithdrawals(plan, monthStartDate, monthEndDate, value);
    const clampedWithdrawal = Math.min(value, withdrawal);
    value -= clampedWithdrawal;

    cumulativeOwn += flows.ownContributionCents;
    cumulativeSubsidies += flows.subsidyCents;
    cumulativeFees += flows.purchaseFeeCents + recurringFees;
    cumulativeTaxes += taxResult.monthTaxCents;
    cumulativeWithdrawals += clampedWithdrawal;

    const gains = value - cumulativeOwn - cumulativeSubsidies + cumulativeFees + cumulativeTaxes + cumulativeWithdrawals;
    const monthsSinceStart = points.length;
    const inflationFactor = Math.pow(1 + monthlyInflationRate, monthsSinceStart);

    points.push({
      date: toIsoDate(monthStartDate),
      ownContributions: cumulativeOwn,
      subsidies: cumulativeSubsidies,
      grossContributions: cumulativeOwn + cumulativeSubsidies,
      fees: cumulativeFees,
      taxes: cumulativeTaxes,
      withdrawals: cumulativeWithdrawals,
      gains,
      totalValue: value,
      realValue: monthlyInflationRate === 0 ? value : Math.round(value / inflationFactor),
    });

    cursor = addMonths(cursor, 1);
  }

  return {
    scenario,
    points,
  };
};

export const calculatePlanProjection = (
  request: CalculationRequest,
): PlanProjectionResult => {
  if (request.plan.returnMode === 'historical') {
    return runHistorical(request, request.historicalPrices ?? []);
  }

  const min = runForecastScenario(request, 'min');
  const base = runForecastScenario(request, 'base');
  const max = runForecastScenario(request, 'max');

  return {
    planId: request.plan.id,
    scenarios: [min, base, max],
    averageAnnualReturnPercent: estimateXirr(base.points) ?? 0,
    xirrPercent: estimateXirr(base.points),
  };
};
