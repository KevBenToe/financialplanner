import { BarChart3, LineChart } from 'lucide-react';
import { useState } from 'react';
import ReactECharts from 'echarts-for-react';

import type { PlanProjectionResult, SavingsPlan } from '../domain/types';

interface FinanceChartProps {
  plans: SavingsPlan[];
  projections: PlanProjectionResult[];
  onPlanSelect?: (planId: string) => void;
  showHiddenPlans?: boolean;
  viewMode?: 'dashboard' | 'plan';
}

const buildSeries = (
  plan: SavingsPlan,
  projection: PlanProjectionResult,
  includePlanDetails: boolean,
) => {
  const base = projection.scenarios.find((s) => s.scenario === 'base');
  const min = projection.scenarios.find((s) => s.scenario === 'min');
  const max = projection.scenarios.find((s) => s.scenario === 'max');

  if (!base) {
    return [];
  }

  const baseSeries = {
    id: `${plan.id}:total-value`,
    name: `${plan.name} Gesamtwert`,
    type: 'line',
    smooth: true,
    showSymbol: false,
    lineStyle: { width: 2, color: plan.color },
    areaStyle: { opacity: 0.12, color: plan.color },
    data: base.points.map((point) => [point.date, point.totalValue / 100]),
  };

  const ownSeries = {
    id: `${plan.id}:own-contributions`,
    name: `${plan.name} Eigenbeitraege`,
    type: 'line',
    smooth: true,
    showSymbol: false,
    lineStyle: { width: 1, type: 'dashed', color: plan.color },
    data: base.points.map((point) => [point.date, point.ownContributions / 100]),
  };

  const minSeries = min
    ? {
      id: `${plan.id}:min`,
        name: `${plan.name} Min`,
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1, opacity: 0.5, color: plan.color },
        data: min.points.map((point) => [point.date, point.totalValue / 100]),
      }
    : null;

  const maxSeries = max
    ? {
      id: `${plan.id}:max`,
        name: `${plan.name} Max`,
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1, opacity: 0.5, color: plan.color },
        data: max.points.map((point) => [point.date, point.totalValue / 100]),
      }
    : null;

  return includePlanDetails
    ? [baseSeries, ownSeries, minSeries, maxSeries].filter(Boolean)
    : [baseSeries];
};

const buildPortfolioSeries = (plans: SavingsPlan[], projections: PlanProjectionResult[]) => {
  const scenarioPoints = plans.flatMap((plan) => {
    const points = projections
      .find((projection) => projection.planId === plan.id)
      ?.scenarios.find((scenario) => scenario.scenario === 'base')?.points;

    return points ? [{ planId: plan.id, points }] : [];
  });
  const dates = [...new Set(scenarioPoints.flatMap((item) => item.points.map((point) => point.date)))].sort();
  const indices = new Map(scenarioPoints.map((item) => [item.planId, 0]));

  return {
    id: 'portfolio:total-value',
    name: 'Gesamtwert aller Sparplaene',
    type: 'line',
    smooth: true,
    showSymbol: false,
    z: 10,
    lineStyle: { width: 3, opacity: 1, color: '#102a1b' },
    areaStyle: { opacity: 0, color: '#102a1b' },
    data: dates.map((date) => {
      const totalValue = scenarioPoints.reduce((sum, item) => {
        let index = indices.get(item.planId) ?? 0;
        while (index + 1 < item.points.length && item.points[index + 1].date <= date) {
          index += 1;
        }
        indices.set(item.planId, index);
        const point = item.points[index];
        return sum + (point?.date <= date ? point.totalValue : 0);
      }, 0);

      return [date, totalValue / 100];
    }),
  };
};

interface AnnualBarRow {
  year: string;
  ownContributions: number;
  subsidies: number;
  netInterestAfterTaxAndInflation: number;
}

const buildAnnualBarRows = (
  plans: SavingsPlan[],
  projections: PlanProjectionResult[],
): AnnualBarRow[] => {
  const rows = new Map<string, AnnualBarRow>();

  for (const plan of plans) {
    const points = projections
      .find((projection) => projection.planId === plan.id)
      ?.scenarios.find((scenario) => scenario.scenario === 'base')?.points;

    if (!points) {
      continue;
    }

    let previousOwnContributions = 0;
    let previousSubsidies = 0;
    let previousWithdrawals = 0;
    let previousRealValue = 0;

    for (const point of points) {
      const year = point.date.slice(0, 4);
      const ownContributions = point.ownContributions - previousOwnContributions;
      const subsidies = point.subsidies - previousSubsidies;
      const withdrawals = point.withdrawals - previousWithdrawals;
      const realValue = point.realValue ?? point.totalValue;
      const netInterestAfterTaxAndInflation = realValue - previousRealValue - ownContributions - subsidies + withdrawals;
      const row = rows.get(year) ?? { year, ownContributions: 0, subsidies: 0, netInterestAfterTaxAndInflation: 0 };

      row.ownContributions += ownContributions / 100;
      row.subsidies += subsidies / 100;
      row.netInterestAfterTaxAndInflation += netInterestAfterTaxAndInflation / 100;
      rows.set(year, row);

      previousOwnContributions = point.ownContributions;
      previousSubsidies = point.subsidies;
      previousWithdrawals = point.withdrawals;
      previousRealValue = realValue;
    }
  }

  return [...rows.values()].sort((left, right) => left.year.localeCompare(right.year));
};

export const FinanceChart = ({
  plans,
  projections,
  onPlanSelect,
  showHiddenPlans = false,
  viewMode = 'dashboard',
}: FinanceChartProps) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const visiblePlans = showHiddenPlans ? plans : plans.filter((plan) => plan.visibleInChart);

  const series = visiblePlans.flatMap((plan) => {
    const projection = projections.find((item) => item.planId === plan.id);
    if (!projection) {
      return [];
    }

    return buildSeries(plan, projection, viewMode === 'plan');
  });

  if (viewMode === 'dashboard') {
    series.push(buildPortfolioSeries(visiblePlans, projections));
  }

  const annualBarRows = buildAnnualBarRows(visiblePlans, projections);

  const lineOption = {
    animation: true,
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: number) => `${value.toLocaleString('de-DE')} EUR`,
    },
    legend: {
      type: 'scroll',
      bottom: 0,
    },
    toolbox: {
      feature: {
        saveAsImage: { title: 'Als PNG speichern' },
        dataZoom: { yAxisIndex: 'none' },
        restore: { title: 'Zuruecksetzen' },
      },
    },
    dataZoom: [
      { type: 'inside', xAxisIndex: 0 },
      { type: 'slider', xAxisIndex: 0, bottom: 40 },
    ],
    grid: { left: 60, right: 40, top: 30, bottom: 90 },
    xAxis: {
      type: 'time',
      axisLabel: {
        formatter: (value: number) => new Date(value).toLocaleDateString('de-DE'),
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => `${value.toLocaleString('de-DE')} EUR`,
      },
    },
    series,
  };

  const barOption = {
    animation: true,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (value: number) => `${value.toLocaleString('de-DE')} EUR`,
    },
    legend: { bottom: 0 },
    grid: { left: 60, right: 40, top: 30, bottom: 60 },
    xAxis: {
      type: 'category',
      data: annualBarRows.map((row) => row.year),
      axisLabel: { interval: 0, rotate: annualBarRows.length > 10 ? 25 : 0 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (value: number) => `${value.toLocaleString('de-DE')} EUR` },
    },
    series: [
      {
        id: 'bar:own-contributions',
        name: 'Eigene Einzahlungen',
        type: 'bar',
        stack: 'jahr',
        itemStyle: { color: '#1f7a8c' },
        data: annualBarRows.map((row) => row.ownContributions),
      },
      {
        id: 'bar:subsidies',
        name: 'Zuschuesse',
        type: 'bar',
        stack: 'jahr',
        itemStyle: { color: '#3b9c5f' },
        data: annualBarRows.map((row) => row.subsidies),
      },
      {
        id: 'bar:net-interest',
        name: 'Zinsen nach Steuer und Inflation',
        type: 'bar',
        stack: 'jahr',
        itemStyle: { color: '#d97706' },
        data: annualBarRows.map((row) => row.netInterestAfterTaxAndInflation),
      },
    ],
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h3>Wertentwicklung</h3>
          <p>{chartType === 'line' ? viewMode === 'dashboard' ? 'Basiswerte und Gesamtwert aller sichtbaren Sparplaene.' : 'Basiswert, Einzahlungen sowie Min-/Max-Szenarien.' : 'Jaehrliche Aufschluesselung nach Steuer und Inflation.'}</p>
        </div>
        <div className="chart-controls">
          <span>{visiblePlans.length} von {plans.length} Kurven sichtbar</span>
          <div className="chart-mode-switch" aria-label="Diagrammtyp">
            <button type="button" className={chartType === 'line' ? 'active' : ''} onClick={() => setChartType('line')} aria-label="Liniendiagramm anzeigen" title="Liniendiagramm anzeigen" aria-pressed={chartType === 'line'}>
              <LineChart size={18} />
            </button>
            <button type="button" className={chartType === 'bar' ? 'active' : ''} onClick={() => setChartType('bar')} aria-label="Balkenaufteilung anzeigen" title="Balkenaufteilung anzeigen" aria-pressed={chartType === 'bar'}>
              <BarChart3 size={18} />
            </button>
          </div>
        </div>
      </div>
      <ReactECharts
        option={chartType === 'line' ? lineOption : barOption}
        style={{ height: 420, width: '100%' }}
        notMerge
        lazyUpdate
        onEvents={{
          click: (event: { seriesId?: string; dataIndex?: number }) => {
            const clickedPlanId = chartType === 'bar'
              ? visiblePlans.length === 1 ? visiblePlans[0].id : undefined
              : visiblePlans.find((plan) => event.seriesId?.startsWith(`${plan.id}:`))?.id;
            if (clickedPlanId) {
              onPlanSelect?.(clickedPlanId);
            }
          },
        }}
      />
    </div>
  );
};
