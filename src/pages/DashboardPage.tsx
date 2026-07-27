import { useMemo, useState } from 'react';

import { ComparisonTable } from '../components/ComparisonTable';
import { AppStatusBar } from '../components/AppStatusBar';
import { FinanceChart } from '../components/FinanceChart';
import { ImportExportPanel } from '../components/ImportExportPanel';
import { KpiCards } from '../components/KpiCards';
import { PortfolioKpiCards } from '../components/PortfolioKpiCards';
import { PlanEditor } from '../components/PlanEditor';
import { PlanSidebar } from '../components/PlanSidebar';
import { StartChoiceModal } from '../components/StartChoiceModal';
import { useFinanceApp } from '../hooks/useFinanceApp';

export const DashboardPage = () => {
  const {
    state,
    selectedPlan,
    setSelectedPlanId,
    addPlan,
    duplicatePlan,
    removePlan,
    persistPlan,
    load,
    loadDemoData,
    setProjectionEndDate,
  } = useFinanceApp();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [startModalDismissed, setStartModalDismissed] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'plan'>('dashboard');
  const [projectDataOpen, setProjectDataOpen] = useState(false);

  const selectedProjection = useMemo(
    () => state.projections.find((projection) => projection.planId === selectedPlan?.id),
    [selectedPlan?.id, state.projections],
  );

  const selectHorizon = (years: number) => {
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + years);
    setProjectionEndDate(endDate.toISOString().slice(0, 10));
  };

  if (state.isLoading) {
    return <div className="shell">Daten werden geladen ...</div>;
  }

  return (
    <div className={`shell ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      {!startModalDismissed && state.plans.length === 0 && (
        <StartChoiceModal
          onCreateEmpty={() => {
            void addPlan();
            setStartModalDismissed(true);
          }}
          onLoadDemo={() => {
            void loadDemoData();
            setStartModalDismissed(true);
          }}
          onImportJson={() => {
            setStartModalDismissed(true);
          }}
        />
      )}

      <PlanSidebar
        plans={state.plans}
        selectedPlanId={state.selectedPlanId}
        activeView={activeView}
        onSelectPlan={(planId) => {
          setSelectedPlanId(planId);
          setActiveView('plan');
        }}
        onShowDashboard={() => setActiveView('dashboard')}
        onAddPlan={() => void addPlan()}
        onDeletePlan={(id) => {
          if (window.confirm('Sparplan wirklich loeschen?')) {
            void removePlan(id);
          }
        }}
        onDuplicatePlan={(plan) => void duplicatePlan(plan)}
        onToggleVisibility={(plan) => {
          void persistPlan({ ...plan, visibleInChart: !plan.visibleInChart });
        }}
        onChangeColor={(plan, color) => {
          void persistPlan({ ...plan, color });
        }}
        onOpenProjectData={() => setProjectDataOpen(true)}
        onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
        collapsed={sidebarCollapsed}
      />

      <main className="main-content">
        <header className="topbar">
          <h1>Finanz- und Sparplan-Simulator</h1>
          <p>
            Simulationstool ohne Anlage- oder Steuerberatung. Steuerberechnung ist vereinfacht.
          </p>
        </header>

        <AppStatusBar />

        {state.error && (
          <p className="error" role="alert">
            {state.error}
          </p>
        )}

        <section className="projection-date-control" aria-label="Berechnungsstichtag">
          <div>
            <h2>Berechnungsstichtag</h2>
            <p>Standard: heute. Die Auswahl aendert nur die Anzeige und nicht die Planenddaten.</p>
          </div>
          <div className="projection-date-actions">
            <button type="button" onClick={() => setProjectionEndDate(new Date().toISOString().slice(0, 10))}>Heute</button>
            {[10, 20, 30].map((years) => <button key={years} type="button" onClick={() => selectHorizon(years)}>+{years} Jahre</button>)}
            <label>
              <span>Datum</span>
              <input type="date" value={state.projectionEndDate} onChange={(event) => setProjectionEndDate(event.target.value)} />
            </label>
          </div>
        </section>

        {activeView === 'dashboard' ? (
          <>
            <PortfolioKpiCards
              plans={state.plans}
              projections={state.projections}
              currency={state.settings.currency}
              projectionEndDate={state.projectionEndDate}
            />
            <FinanceChart
              plans={state.plans}
              projections={state.projections}
              onPlanSelect={(planId) => {
                setSelectedPlanId(planId);
                setActiveView('plan');
              }}
            />
            <ComparisonTable
              plans={state.plans}
              projections={state.projections}
              onTogglePlanVisibility={(plan) => {
                void persistPlan({ ...plan, visibleInChart: !plan.visibleInChart });
              }}
            />
          </>
        ) : (
          <>
            <KpiCards selectedPlan={selectedPlan} projection={selectedProjection} projectionEndDate={state.projectionEndDate} />
            <FinanceChart plans={selectedPlan ? [selectedPlan] : []} projections={state.projections} showHiddenPlans />
            <PlanEditor plan={selectedPlan} onSave={persistPlan} />
          </>
        )}
      </main>

      <ImportExportPanel open={projectDataOpen} onClose={() => setProjectDataOpen(false)} onReload={load} onLoadDemo={loadDemoData} />
    </div>
  );
};
