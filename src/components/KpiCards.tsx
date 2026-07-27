import type { PlanProjectionResult, SavingsPlan } from '../domain/types';
import { formatCurrency, formatPercent } from '../utils/money';

interface KpiCardsProps {
  selectedPlan?: SavingsPlan;
  projection?: PlanProjectionResult;
  projectionEndDate: string;
}

export const KpiCards = ({ selectedPlan, projection, projectionEndDate }: KpiCardsProps) => {
  if (!selectedPlan || !projection) {
    return <div className="kpi-grid">Waehlen Sie einen Sparplan aus.</div>;
  }

  const baseScenario = projection.scenarios.find((s) => s.scenario === 'base');
  const last = baseScenario?.points[baseScenario.points.length - 1];

  if (!last) {
    return <div className="kpi-grid">Keine Berechnungsdaten verfuegbar.</div>;
  }

  const ratio =
    last.grossContributions > 0
      ? ((last.totalValue - last.grossContributions) / last.grossContributions) * 100
      : 0;

  const cards = [
    { label: `Wert am ${new Date(`${projectionEndDate}T00:00:00`).toLocaleDateString('de-DE')}`, value: formatCurrency(last.totalValue, selectedPlan.currency) },
    {
      label: 'Eigene Einzahlungen',
      value: formatCurrency(last.ownContributions, selectedPlan.currency),
    },
    {
      label: 'Zuschuesse',
      value: formatCurrency(last.subsidies, selectedPlan.currency),
    },
    {
      label: 'Gebuehren',
      value: formatCurrency(last.fees, selectedPlan.currency),
    },
    {
      label: 'Steuern',
      value: formatCurrency(last.taxes, selectedPlan.currency),
    },
    {
      label: 'Gewinn',
      value: formatCurrency(last.gains, selectedPlan.currency),
    },
    {
      label: 'Rendite',
      value: formatPercent(ratio),
    },
    {
      label: 'XIRR (simuliert)',
      value: projection.xirrPercent !== undefined ? formatPercent(projection.xirrPercent) : '-',
    },
  ];

  return (
    <section className="kpi-grid" aria-label="Kennzahlen">
      {cards.map((card) => (
        <article className="kpi-card" key={card.label}>
          <h4>{card.label}</h4>
          <p>{card.value}</p>
        </article>
      ))}
    </section>
  );
};
