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
import { useLanguage } from '../i18n/language';

export const DashboardPage = () => {
  const { language, setLanguage } = useLanguage();
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
          <div>
            <h1>{language === 'de' ? 'Finanz- und Sparplan-Simulator' : 'Financial and Savings Plan Simulator'}</h1>
            <p>{language === 'de' ? 'Simulationstool ohne Anlage- oder Steuerberatung. Steuerberechnung ist vereinfacht.' : 'A planning simulation, not investment or tax advice. Tax calculations are simplified.'}</p>
          </div>
          <div className="language-switch planner-language-switch" aria-label={language === 'de' ? 'Sprache' : 'Language'}>
            <button type="button" className={language === 'de' ? 'active' : ''} onClick={() => setLanguage('de')} aria-pressed={language === 'de'}>DE</button>
            <button type="button" className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')} aria-pressed={language === 'en'}>EN</button>
          </div>
        </header>

        <AppStatusBar />

        {state.error && (
          <p className="error" role="alert">
            {state.error}
          </p>
        )}

        <section className="projection-date-control" aria-label="Berechnungsstichtag">
          <div>
            <h2>{language === 'de' ? 'Berechnungsstichtag' : 'Calculation date'}</h2>
            <p>{language === 'de' ? 'Standard: heute. Die Auswahl aendert nur die Anzeige und nicht die Planenddaten.' : 'Default: today. This only changes the display, not saved plan end dates.'}</p>
          </div>
          <div className="projection-date-actions">
            <button type="button" onClick={() => setProjectionEndDate(new Date().toISOString().slice(0, 10))}>{language === 'de' ? 'Heute' : 'Today'}</button>
            {[10, 20, 30].map((years) => <button key={years} type="button" onClick={() => selectHorizon(years)}>+{years} {language === 'de' ? 'Jahre' : 'years'}</button>)}
            <label>
              <span>{language === 'de' ? 'Datum' : 'Date'}</span>
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
              viewMode="dashboard"
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
            <FinanceChart plans={selectedPlan ? [selectedPlan] : []} projections={state.projections} showHiddenPlans viewMode="plan" />
            <PlanEditor plan={selectedPlan} onSave={persistPlan} />
          </>
        )}
      </main>

      <ImportExportPanel open={projectDataOpen} onClose={() => setProjectDataOpen(false)} onReload={load} onLoadDemo={loadDemoData} />
    </div>
  );
};
