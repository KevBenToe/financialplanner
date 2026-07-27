import { useCallback, useEffect, useMemo, useState } from 'react';

import { calculatePlanProjection } from '../calculation';
import { createEmptyPlan, DEFAULT_SETTINGS } from '../domain/defaults';
import { createDemoPlans } from '../domain/demoData';
import type {
  AppSettings,
  PlanProjectionResult,
  SavingsPlan,
  StoredMarketData,
} from '../domain/types';
import { financeStorage } from '../storage/indexedDbStorage';
import { createId } from '../utils/id';

const APP_VERSION = '1.0.0';
const todayIso = () => new Date().toISOString().slice(0, 10);

export interface FinanceAppState {
  plans: SavingsPlan[];
  selectedPlanId?: string;
  projections: PlanProjectionResult[];
  settings: AppSettings;
  isLoading: boolean;
  error?: string;
  dirty: boolean;
  marketData: StoredMarketData[];
  projectionEndDate: string;
}

export const useFinanceApp = () => {
  const [state, setState] = useState<FinanceAppState>({
    plans: [],
    projections: [],
    settings: DEFAULT_SETTINGS,
    isLoading: true,
    dirty: false,
    marketData: [],
    projectionEndDate: todayIso(),
  });

  const selectedPlan = useMemo(
    () => state.plans.find((plan) => plan.id === state.selectedPlanId),
    [state.plans, state.selectedPlanId],
  );

  const recalc = useCallback((plans: SavingsPlan[], data: StoredMarketData[], endDate: string) => {
    return plans.map((plan) => {
      const hist = data.find((row) => row.planId === plan.id);
      return calculatePlanProjection({
        plan,
        historicalPrices: hist?.points,
        inflationMode: 'base',
        endDate,
      });
    });
  }, []);

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const [plans, settings, marketData] = await Promise.all([
        financeStorage.getPlans(),
        financeStorage.getSettings(),
        financeStorage.getMarketData(),
      ]);

      const nextSettings = settings ?? DEFAULT_SETTINGS;
      const projectionEndDate = todayIso();
      const projections = recalc(plans, marketData, projectionEndDate);

      setState({
        plans,
        selectedPlanId: plans[0]?.id,
        settings: nextSettings,
        projections,
        isLoading: false,
        dirty: false,
        marketData,
        projectionEndDate,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: `Fehler beim Laden der Daten: ${(error as Error).message}`,
      }));
    }
  }, [recalc]);

  useEffect(() => {
    void load();
  }, [load]);

  const persistPlan = useCallback(
    async (plan: SavingsPlan) => {
      await financeStorage.savePlan(plan);
      const plans = await financeStorage.getPlans();
      const marketData = await financeStorage.getMarketData();
      const projections = recalc(plans, marketData, state.projectionEndDate);

      setState((prev) => ({
        ...prev,
        plans,
        projections,
        selectedPlanId: prev.selectedPlanId ?? plan.id,
        dirty: false,
      }));
    },
    [recalc, state.projectionEndDate],
  );

  const addPlan = useCallback(async () => {
    const plan = createEmptyPlan(createId());
    await persistPlan(plan);
    setState((prev) => ({ ...prev, selectedPlanId: plan.id }));
  }, [persistPlan]);

  const duplicatePlan = useCallback(
    async (source: SavingsPlan) => {
      const duplicate: SavingsPlan = {
        ...source,
        id: createId(),
        name: `${source.name} (Kopie)`,
        scenarioOfPlanId: source.id,
      };

      await persistPlan(duplicate);
    },
    [persistPlan],
  );

  const removePlan = useCallback(
    async (id: string) => {
      await financeStorage.deletePlan(id);
      const plans = await financeStorage.getPlans();
      const projections = recalc(plans, state.marketData, state.projectionEndDate);

      setState((prev) => ({
        ...prev,
        plans,
        projections,
        selectedPlanId: plans[0]?.id,
      }));
    },
    [recalc, state.marketData, state.projectionEndDate],
  );

  const saveSettings = useCallback(async (settings: AppSettings) => {
    await financeStorage.saveSettings(settings);
    setState((prev) => ({ ...prev, settings }));
  }, []);

  const setSelectedPlanId = useCallback((id?: string) => {
    setState((prev) => ({ ...prev, selectedPlanId: id }));
  }, []);

  const replacePlans = useCallback(
    async (plans: SavingsPlan[]) => {
      await financeStorage.clearAll();
      for (const plan of plans) {
        await financeStorage.savePlan(plan);
      }

      const projections = recalc(plans, [], state.projectionEndDate);
      setState((prev) => ({
        ...prev,
        plans,
        projections,
        selectedPlanId: plans[0]?.id,
        marketData: [],
      }));
    },
    [recalc, state.projectionEndDate],
  );

  const setProjectionEndDate = useCallback((projectionEndDate: string) => {
    setState((prev) => ({
      ...prev,
      projectionEndDate,
      projections: recalc(prev.plans, prev.marketData, projectionEndDate),
    }));
  }, [recalc]);

  const loadDemoData = useCallback(async () => {
    await replacePlans(createDemoPlans());
  }, [replacePlans]);

  const exportData = useCallback(async () => {
    return financeStorage.exportData(APP_VERSION);
  }, []);

  return {
    state,
    selectedPlan,
    setSelectedPlanId,
    load,
    addPlan,
    duplicatePlan,
    removePlan,
    persistPlan,
    saveSettings,
    replacePlans,
    loadDemoData,
    exportData,
    setProjectionEndDate,
  };
};
