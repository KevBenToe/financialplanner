import type { PlanProjectionResult, SavingsPlan } from '../domain/types';
import { formatCurrency, formatPercent } from '../utils/money';

interface ComparisonTableProps {
  plans: SavingsPlan[];
  projections: PlanProjectionResult[];
  onTogglePlanVisibility: (plan: SavingsPlan) => void;
}

export const ComparisonTable = ({ plans, projections, onTogglePlanVisibility }: ComparisonTableProps) => {
  const rows = plans.slice(0, 5).map((plan) => {
    const projection = projections.find((item) => item.planId === plan.id);
    const base = projection?.scenarios.find((s) => s.scenario === 'base');
    const last = base?.points[base.points.length - 1];

    if (!last) {
      return {
        id: plan.id,
        name: plan.name,
        plan,
        endValue: '-',
        grossContributions: '-',
        fees: '-',
        taxes: '-',
        gain: '-',
        returnPct: '-',
      };
    }

    const returnPct =
      last.grossContributions > 0
        ? ((last.totalValue - last.grossContributions) / last.grossContributions) * 100
        : 0;

    return {
      id: plan.id,
      name: plan.name,
      plan,
      endValue: formatCurrency(last.totalValue, plan.currency),
      grossContributions: formatCurrency(last.grossContributions, plan.currency),
      fees: formatCurrency(last.fees, plan.currency),
      taxes: formatCurrency(last.taxes, plan.currency),
      gain: formatCurrency(last.gains, plan.currency),
      returnPct: formatPercent(returnPct),
    };
  });

  return (
    <section className="table-card" aria-label="Vergleichsansicht">
      <h3>Vergleich (max. 5 Sparplaene)</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Plan</th>
              <th>Endwert</th>
              <th>Einzahlungen</th>
              <th>Gebuehren</th>
              <th>Steuern</th>
              <th>Gewinn</th>
              <th>Rendite</th>
              <th>Kurve</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.endValue}</td>
                <td>{row.grossContributions}</td>
                <td>{row.fees}</td>
                <td>{row.taxes}</td>
                <td>{row.gain}</td>
                <td>{row.returnPct}</td>
                <td>
                  <button
                    type="button"
                    className="chart-visibility-button"
                    onClick={() => onTogglePlanVisibility(row.plan)}
                  >
                    {row.plan.visibleInChart ? 'Ausblenden' : 'Anzeigen'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
