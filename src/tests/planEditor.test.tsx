import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { DEFAULT_INFLATION_CONFIG, DEFAULT_TAX_CONFIG } from '../domain/defaults';
import type { SavingsPlan } from '../domain/types';
import { PlanEditor } from '../components/PlanEditor';

const plan: SavingsPlan = {
  id: '1',
  name: 'Plan',
  productType: 'generic-savings-plan',
  category: 'Test',
  color: '#000000',
  currency: 'EUR',
  startDate: '2025-01-01',
  initialValueCents: 0,
  isActive: true,
  isArchived: false,
  visibleInChart: true,
  returnMode: 'forecast',
  forecastReturns: { baseAnnualPercent: 5 },
  contributionRules: [],
  subsidyRules: [],
  pauseRules: [],
  feeRules: [],
  taxConfig: DEFAULT_TAX_CONFIG,
  inflationConfig: DEFAULT_INFLATION_CONFIG,
  withdrawalRules: [],
};

describe('plan editor', () => {
  test('shows validation error on empty name', async () => {
    const onSave = vi.fn(async () => {});
    render(<PlanEditor plan={plan} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '' } });
    fireEvent.click(screen.getByText('Speichern'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Leere Namen sind nicht zulaessig');
  });

  test('adds and saves a contribution rule', async () => {
    const onSave = vi.fn(async () => {});
    render(<PlanEditor plan={plan} onSave={onSave} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Einzahlungen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Regel hinzufuegen' }));
    fireEvent.change(screen.getByLabelText('Betrag in EUR'), { target: { value: '125.50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          contributionRules: [expect.objectContaining({ amountCents: 12550 })],
        }),
      );
    });
  });
});
