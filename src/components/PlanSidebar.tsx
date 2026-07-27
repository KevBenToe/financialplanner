import { Copy, Download, Eye, EyeOff, LayoutDashboard, Menu, Plus, X } from 'lucide-react';

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

interface PlanSidebarProps {
  plans: SavingsPlan[];
  selectedPlanId?: string;
  activeView: 'dashboard' | 'plan';
  onSelectPlan: (id: string) => void;
  onShowDashboard: () => void;
  onAddPlan: () => void;
  onDeletePlan: (id: string) => void;
  onDuplicatePlan: (plan: SavingsPlan) => void;
  onToggleVisibility: (plan: SavingsPlan) => void;
  onChangeColor: (plan: SavingsPlan, color: string) => void;
  onOpenProjectData: () => void;
  onToggleSidebar: () => void;
  collapsed: boolean;
}

export const PlanSidebar = ({
  plans,
  selectedPlanId,
  activeView,
  onSelectPlan,
  onShowDashboard,
  onAddPlan,
  onDeletePlan,
  onDuplicatePlan,
  onToggleVisibility,
  onChangeColor,
  onOpenProjectData,
  onToggleSidebar,
  collapsed,
}: PlanSidebarProps) => {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} aria-label="Sparplaene">
      <div className="sidebar-header">
        {!collapsed && <h2>Sparplaene</h2>}
        <button type="button" className="sidebar-icon-button" onClick={onToggleSidebar} title={collapsed ? 'Sidebar ausklappen' : 'Sidebar einklappen'} aria-label={collapsed ? 'Sidebar ausklappen' : 'Sidebar einklappen'}>
          {collapsed ? <Menu size={19} /> : <X size={19} />}
        </button>
      </div>

      <nav className="sidebar-navigation" aria-label="Navigation">
        <button type="button" className={`sidebar-nav-button ${activeView === 'dashboard' ? 'active' : ''}`} onClick={onShowDashboard} title="Dashboard" aria-label="Dashboard">
          <LayoutDashboard size={19} />
          {!collapsed && <span>Dashboard</span>}
        </button>
      </nav>

      <ul className="plan-list">
        {plans.map((plan) => (
          <li key={plan.id} className={activeView === 'plan' && plan.id === selectedPlanId ? 'active' : ''} style={{ borderLeftColor: plan.color }}>
            <button type="button" className="plan-main" onClick={() => onSelectPlan(plan.id)} title={plan.name}>
              <span className="plan-color-dot" style={{ backgroundColor: plan.color }} />
              {!collapsed && <span className="plan-details"><strong>{plan.name}</strong><small>{productTypeLabels[plan.productType]}</small><small>{formatCurrency(plan.currentManualValueCents ?? plan.initialValueCents, plan.currency)}</small></span>}
            </button>

            {!collapsed && <div className="plan-actions">
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
            </div>}
          </li>
        ))}
      </ul>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-nav-button" onClick={onAddPlan} title="Neuen Sparplan anlegen" aria-label="Neuen Sparplan anlegen">
          <Plus size={19} />
          {!collapsed && <span>Sparplan anlegen</span>}
        </button>
        <button type="button" className="sidebar-nav-button" onClick={onOpenProjectData} title="Projektdaten importieren oder exportieren" aria-label="Projektdaten importieren oder exportieren">
          <Download size={19} />
          {!collapsed && <span>Projektdaten</span>}
        </button>
      </div>
    </aside>
  );
};
