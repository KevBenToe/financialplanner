import type { PlanProjectionResult, SavingsPlan } from '../domain/types';
import { formatCurrency } from '../utils/money';

interface PortfolioKpiCardsProps {
  plans: SavingsPlan[];
  projections: PlanProjectionResult[];
  currency: string;
  projectionEndDate: string;
}

export const PortfolioKpiCards = ({
  plans,
  projections,
  currency,
  projectionEndDate,
}: PortfolioKpiCardsProps) => {
  const totals = projections.reduce(
    (current, projection) => {
      const last = projection.scenarios.find((scenario) => scenario.scenario === 'base')?.points.at(-1);
      if (!last) {
        return current;
      }

      return {
        totalValue: current.totalValue + last.totalValue,
        ownContributions: current.ownContributions + last.ownContributions,
        subsidies: current.subsidies + last.subsidies,
        fees: current.fees + last.fees,
        taxes: current.taxes + last.taxes,
        gains: current.gains + last.gains,
        withdrawals: current.withdrawals + last.withdrawals,
      };
    },
    { totalValue: 0, ownContributions: 0, subsidies: 0, fees: 0, taxes: 0, gains: 0, withdrawals: 0 },
  );

  const dateLabel = new Date(`${projectionEndDate}T00:00:00`).toLocaleDateString('de-DE');
  const cards = [
    { label: `Wert am ${dateLabel}`, value: formatCurrency(totals.totalValue, currency) },
    { label: 'Eigene Einzahlungen', value: formatCurrency(totals.ownContributions, currency) },
    { label: 'Zuschuesse', value: formatCurrency(totals.subsidies, currency) },
    { label: 'Gebuehren', value: formatCurrency(totals.fees, currency) },
    { label: 'Steuern', value: formatCurrency(totals.taxes, currency) },
    { label: 'Gewinn', value: formatCurrency(totals.gains, currency) },
    { label: 'Entnahmen', value: formatCurrency(totals.withdrawals, currency) },
  ];

  return (
    <section className="kpi-grid" aria-label={`Gesamtkennzahlen fuer ${plans.length} Sparplaene`}>
      {cards.map((card) => (
        <article className="kpi-card" key={card.label}>
          <h4>{card.label}</h4>
          <p>{card.value}</p>
        </article>
      ))}
    </section>
  );
};