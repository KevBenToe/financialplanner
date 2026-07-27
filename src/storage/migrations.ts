import type { FinanceAppExport } from '../domain/types';

const CURRENT_SCHEMA_VERSION = 2;

const migrateV1toV2 = (input: FinanceAppExport): FinanceAppExport => {
  return {
    ...input,
    schemaVersion: 2,
    plans: input.plans.map((plan) => ({
      ...plan,
      isArchived: plan.isArchived ?? false,
      currentManualValueCents: plan.currentManualValueCents ?? plan.initialValueCents,
    })),
  };
};

export const migrateExport = (input: FinanceAppExport): FinanceAppExport => {
  if (input.schemaVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error('Nicht unterstuetzte Schema-Version in der Importdatei.');
  }

  if (input.schemaVersion === CURRENT_SCHEMA_VERSION) {
    return input;
  }

  if (input.schemaVersion === 1) {
    return migrateV1toV2(input);
  }

  throw new Error('Unbekannte Schema-Version in der Importdatei.');
};

export const getCurrentSchemaVersion = (): number => CURRENT_SCHEMA_VERSION;
