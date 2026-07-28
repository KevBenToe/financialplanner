import { ArrowRightLeft, Download, LayoutDashboard, Menu, WalletCards, X } from 'lucide-react';

interface PlanSidebarProps {
  activeSection: 'plans' | 'cashflow' | 'loans';
  onShowPlans: () => void;
  onShowCashFlow: () => void;
  onShowLoans: () => void;
  onOpenProjectData: () => void;
  onToggleSidebar: () => void;
  collapsed: boolean;
}

export const PlanSidebar = ({
  activeSection,
  onShowPlans,
  onShowCashFlow,
  onShowLoans,
  onOpenProjectData,
  onToggleSidebar,
  collapsed,
}: PlanSidebarProps) => {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} aria-label="Sparplaene">
      <div className="sidebar-header">
        {!collapsed && <h2>Navigation</h2>}
        <button type="button" className="sidebar-icon-button" onClick={onToggleSidebar} title={collapsed ? 'Sidebar ausklappen' : 'Sidebar einklappen'} aria-label={collapsed ? 'Sidebar ausklappen' : 'Sidebar einklappen'}>
          {collapsed ? <Menu size={19} /> : <X size={19} />}
        </button>
      </div>

      <nav className="sidebar-navigation" aria-label="Navigation">
        <button type="button" className={`sidebar-nav-button ${activeSection === 'plans' ? 'active' : ''}`} onClick={onShowPlans} title="Sparplaene" aria-label="Sparplaene">
          <LayoutDashboard size={19} />
          {!collapsed && <span>Sparplaene</span>}
        </button>
        <button type="button" className={`sidebar-nav-button ${activeSection === 'cashflow' ? 'active' : ''}`} onClick={onShowCashFlow} title="Finanzfluss" aria-label="Finanzfluss">
          <ArrowRightLeft size={19} />
          {!collapsed && <span>Finanzfluss</span>}
        </button>
        <button type="button" className={`sidebar-nav-button ${activeSection === 'loans' ? 'active' : ''}`} onClick={onShowLoans} title="Kreditverwaltung" aria-label="Kreditverwaltung">
          <WalletCards size={19} />
          {!collapsed && <span>Kreditverwaltung</span>}
        </button>
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-nav-button" onClick={onOpenProjectData} title="Projektdaten importieren oder exportieren" aria-label="Projektdaten importieren oder exportieren">
          <Download size={19} />
          {!collapsed && <span>Projektdaten</span>}
        </button>
      </div>
    </aside>
  );
};
