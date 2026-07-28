import { BriefcaseBusiness, Copy, Eye, EyeOff, LayoutDashboard, Plus } from 'lucide-react';

import type { SavingsPlan } from '../domain/types';
import { formatCurrency } from '../utils/money';

const productTypeLabels: Record<SavingsPlan['productType'], string> = {
  etf: 'ETF',
  'stock-portfolio': 'Aktiendepot',
  'savings-account': 'Tagesgeld',
  'fixed-deposit': 'Festgeld',
  'pension-insurance': 'Rentenversicherung',
  riester: 'Riester',
  'company-pension': 'Betriebliche Altersvorsorge',
  fund: 'Fonds',
  crypto: 'Kryptowaehrung',
  'generic-savings-plan': 'Allgemeiner Sparplan',
  'manual-product': 'Manuelles Produkt',
};

interface PlanListSidebarProps {
  plans: SavingsPlan[];
  selectedPlanId?: string;
  planSubview: 'dashboard' | 'editor';
  onSelectPlan: (id: string) => void;
  onShowPlanDashboard: () => void;
  onAddPlan: () => void;
  onDeletePlan: (id: string) => void;
  onDuplicatePlan: (plan: SavingsPlan) => void;
  onToggleVisibility: (plan: SavingsPlan) => void;
  onChangeColor: (plan: SavingsPlan, color: string) => void;
}

export const PlanListSidebar = ({
  plans,
  selectedPlanId,
  planSubview,
  onSelectPlan,
  onShowPlanDashboard,
  onAddPlan,
  onDeletePlan,
  onDuplicatePlan,
  onToggleVisibility,
  onChangeColor,
}: PlanListSidebarProps) => {
  return (
    <aside className="plan-secondary-sidebar" aria-label="Sparplaene">
      <div className="sidebar-subnav-head">
        <div>
          <h3>Sparplaene</h3>
          <p>Auswahl und Verwaltung der angelegten Plaene.</p>
        </div>
        <BriefcaseBusiness size={17} />
      </div>

      <button type="button" className={`sidebar-nav-button ${planSubview === 'dashboard' ? 'active' : ''}`} onClick={onShowPlanDashboard} title="Dashboard" aria-label="Dashboard">
        <LayoutDashboard size={19} />
        <span>Dashboard</span>
      </button>

      <button type="button" className="sidebar-nav-button" onClick={onAddPlan} title="Neuen Sparplan anlegen" aria-label="Neuen Sparplan anlegen">
        <Plus size={19} />
        <span>Sparplan anlegen</span>
      </button>

      <ul className="plan-list">
        {plans.map((plan) => (
          <li key={plan.id} className={plan.id === selectedPlanId && planSubview === 'editor' ? 'active' : ''} style={{ borderLeftColor: plan.color }}>
            <button type="button" className="plan-main" onClick={() => onSelectPlan(plan.id)} title={plan.name}>
              <span className="plan-color-dot" style={{ backgroundColor: plan.color }} />
              <span className="plan-details">
                <strong>{plan.name}</strong>
                <small>{productTypeLabels[plan.productType]}</small>
                <small>{formatCurrency(plan.currentManualValueCents ?? plan.initialValueCents, plan.currency)}</small>
              </span>
            </button>

            <div className="plan-actions">
              <label className="plan-color-picker" title="Planfarbe waehlen">
                <span>Farbe</span>
                <input type="color" value={plan.color} onChange={(event) => onChangeColor(plan, event.target.value)} aria-label={`Farbe fuer ${plan.name}`} />
              </label>
              <button type="button" className="plan-action-icon" onClick={() => onToggleVisibility(plan)} title={plan.visibleInChart ? 'Kurve ausblenden' : 'Kurve anzeigen'} aria-label={plan.visibleInChart ? 'Kurve ausblenden' : 'Kurve anzeigen'}>
                {plan.visibleInChart ? <Eye size={17} /> : <EyeOff size={17} />}
              </button>
              <button type="button" className="plan-action-icon" onClick={() => onDuplicatePlan(plan)} title="Sparplan duplizieren" aria-label="Sparplan duplizieren">
                <Copy size={17} />
              </button>
              <button type="button" className="plan-delete-button" onClick={() => onDeletePlan(plan.id)}>Loeschen</button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
};
