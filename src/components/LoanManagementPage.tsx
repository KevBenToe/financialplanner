import { useMemo, useState } from 'react';
import { CalendarRange, CirclePlus, PencilLine, PiggyBank, Trash2 } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

import type { LoanEntry, LoanSpecialPayment } from '../domain/types';
import { useLoans } from '../hooks/useLoans';
import { createId } from '../utils/id';
import { formatCurrency } from '../utils/money';

const todayIso = () => new Date().toISOString().slice(0, 10);

const addMonths = (isoDate: string, months: number) => {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
};

const centsToEuro = (cents: number) => cents / 100;

const euroToCents = (value: string) => {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
};

const calculateMonthlyPayment = (loan: LoanEntry) => {
  const principal = loan.principalCents / 100;
  const monthlyRate = loan.annualInterestRatePercent / 100 / 12;

  if (loan.monthlyPaymentCents > 0) {
    return loan.monthlyPaymentCents / 100;
  }

  if (loan.termMonths <= 0) {
    return 0;
  }

  if (monthlyRate === 0) {
    return principal / loan.termMonths;
  }

  return (principal * monthlyRate) / (1 - (1 + monthlyRate) ** -loan.termMonths);
};

const buildSummary = (loan: LoanEntry) => {
  const monthlyPayment = calculateMonthlyPayment(loan);
  const monthlyRate = loan.annualInterestRatePercent / 100 / 12;
  let balance = loan.principalCents / 100;
  let totalInterest = 0;
  let monthIndex = 0;
  let payoffDate = loan.startDate;

  while (balance > 0.01 && monthIndex < Math.max(loan.termMonths, 600)) {
    monthIndex += 1;
    const specialPayment = loan.specialPayments
      .filter((payment) => payment.monthIndex === monthIndex)
      .reduce((sum, payment) => sum + payment.amountCents / 100, 0);
    const interest = balance * monthlyRate;
    const paymentAmount = Math.min(balance + interest, monthlyPayment + loan.extraPaymentCents / 100 + specialPayment);

    totalInterest += interest;
    balance = Math.max(balance + interest - paymentAmount, 0);
    payoffDate = addMonths(loan.startDate, monthIndex);

    if (paymentAmount <= 0) {
      break;
    }
  }

  return {
    monthlyPayment,
    payoffDate,
    totalInterest,
    remainingBalance: balance,
  };
};

const buildLoanTimelineChart = (loan: LoanEntry) => {
  const monthlyPayment = calculateMonthlyPayment(loan);
  const monthlyRate = loan.annualInterestRatePercent / 100 / 12;
  const months = Math.max(loan.termMonths, 1);
  const balanceSeries: number[] = [loan.principalCents / 100];
  const interestSeries: number[] = [0];

  let balance = loan.principalCents / 100;
  let cumulativeInterest = 0;

  for (let monthIndex = 1; monthIndex <= months && balance > 0.01; monthIndex += 1) {
    const specialPayment = loan.specialPayments
      .filter((payment) => payment.monthIndex === monthIndex)
      .reduce((sum, payment) => sum + payment.amountCents / 100, 0);
    const interest = balance * monthlyRate;
    const paymentAmount = Math.min(balance + interest, monthlyPayment + loan.extraPaymentCents / 100 + specialPayment);

    cumulativeInterest += interest;
    balance = Math.max(balance + interest - paymentAmount, 0);
    balanceSeries.push(balance);
    interestSeries.push(cumulativeInterest);
  }

  const monthsAxis = balanceSeries.map((_, index) => index);

  return {
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: number) => formatCurrency(Math.round(value * 100), 'EUR'),
    },
    legend: {
      top: 0,
      data: ['Restschuld', 'Kumulierte Zinsen'],
    },
    grid: { left: 12, right: 12, top: 42, bottom: 20, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: monthsAxis,
      name: 'Monate',
    },
    yAxis: {
      type: 'value',
      name: 'EUR',
    },
    series: [
      {
        name: 'Restschuld',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 3, color: '#0969da' },
        areaStyle: { color: 'rgba(9, 105, 218, 0.14)' },
        data: balanceSeries,
      },
      {
        name: 'Kumulierte Zinsen',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 3, color: '#cf222e' },
        areaStyle: { color: 'rgba(207, 34, 46, 0.08)' },
        data: interestSeries,
      },
    ],
  };
};

const buildPortfolioChart = (loans: LoanEntry[]) => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    valueFormatter: (value: number) => formatCurrency(Math.round(value * 100), 'EUR'),
  },
  legend: {
    top: 0,
    data: ['Kreditsumme', 'Monatsrate', 'Geschaetzte Zinsen'],
  },
  grid: { left: 12, right: 12, top: 42, bottom: 20, containLabel: true },
  xAxis: {
    type: 'category',
    data: loans.map((loan) => loan.name),
    axisLabel: { interval: 0, rotate: 18 },
  },
  yAxis: {
    type: 'value',
    name: 'EUR',
  },
  series: [
    {
      name: 'Kreditsumme',
      type: 'bar',
      itemStyle: { color: '#0969da', borderRadius: [6, 6, 0, 0] },
      data: loans.map((loan) => loan.principalCents / 100),
    },
    {
      name: 'Monatsrate',
      type: 'bar',
      itemStyle: { color: '#2da44e', borderRadius: [6, 6, 0, 0] },
      data: loans.map((loan) => buildSummary(loan).monthlyPayment),
    },
    {
      name: 'Geschaetzte Zinsen',
      type: 'bar',
      itemStyle: { color: '#cf222e', borderRadius: [6, 6, 0, 0] },
      data: loans.map((loan) => buildSummary(loan).totalInterest),
    },
  ],
});

const emptySpecialPayment = (): LoanSpecialPayment => ({
  id: createId(),
  monthIndex: 12,
  amountCents: 0,
  label: 'Sonderzahlung',
});

const emptyLoan = (): LoanEntry => ({
  id: createId(),
  name: 'Neuer Kredit',
  principalCents: 2500000,
  annualInterestRatePercent: 4,
  termMonths: 120,
  monthlyPaymentCents: 0,
  extraPaymentCents: 0,
  startDate: todayIso(),
  specialPayments: [],
  notes: '',
});

export const LoanManagementPage = () => {
  const { data, addLoan, updateLoan, removeLoan } = useLoans();
  const [draft, setDraft] = useState<LoanEntry>(emptyLoan);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);

  const summary = useMemo(() => buildSummary(draft), [draft]);
  const draftChart = useMemo(() => buildLoanTimelineChart(draft), [draft]);
  const portfolioChart = useMemo(() => buildPortfolioChart(data.loans), [data.loans]);

  const saveDraft = () => {
    if (!draft.name.trim() || draft.principalCents < 0 || draft.termMonths <= 0) {
      return;
    }

    const { id: _draftId, ...changes } = draft;

    if (editingLoanId) {
      updateLoan(editingLoanId, changes);
    } else {
      addLoan(changes);
    }

    setEditingLoanId(null);
    setDraft(emptyLoan());
  };

  const editLoan = (loan: LoanEntry) => {
    setEditingLoanId(loan.id);
    setDraft(loan);
  };

  const cancelEdit = () => {
    setEditingLoanId(null);
    setDraft(emptyLoan());
  };

  return (
    <div className="loan-page">
      <div className="page-section-head">
        <div>
          <h2>Kreditverwaltung</h2>
          <p>Kredite mit Laufzeit, Tilgung, Sonderzahlungen und Zinsen verwalten.</p>
        </div>
      </div>

      <section className="loan-editor-card">
        <div className="loan-editor-head">
          <div>
            <h3>{editingLoanId ? 'Kredit bearbeiten' : 'Kredit anlegen'}</h3>
            <p>Die Tilgungsuebersicht zeigt eine einfache naehere Simulation der Laufzeit.</p>
          </div>
          <div className="loan-editor-actions">
            <button type="button" onClick={saveDraft}>{editingLoanId ? 'Aktualisieren' : 'Anlegen'}</button>
            {editingLoanId && <button type="button" onClick={cancelEdit}>Abbrechen</button>}
          </div>
        </div>

        <div className="editor-grid loan-grid">
          <label>
            Name
            <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </label>
          <label>
            Kreditsumme in EUR
            <input type="number" min="0" step="0.01" value={centsToEuro(draft.principalCents)} onChange={(event) => setDraft({ ...draft, principalCents: euroToCents(event.target.value) })} />
          </label>
          <label>
            Zinssatz p.a. in %
            <input type="number" min="0" step="0.01" value={draft.annualInterestRatePercent} onChange={(event) => setDraft({ ...draft, annualInterestRatePercent: Number(event.target.value || 0) })} />
          </label>
          <label>
            Laufzeit in Monaten
            <input type="number" min="1" step="1" value={draft.termMonths} onChange={(event) => setDraft({ ...draft, termMonths: Number(event.target.value || 0) })} />
          </label>
          <label>
            Monatliche Tilgung in EUR
            <input type="number" min="0" step="0.01" value={centsToEuro(draft.monthlyPaymentCents)} onChange={(event) => setDraft({ ...draft, monthlyPaymentCents: euroToCents(event.target.value) })} />
          </label>
          <label>
            Sondertilgung je Monat in EUR
            <input type="number" min="0" step="0.01" value={centsToEuro(draft.extraPaymentCents)} onChange={(event) => setDraft({ ...draft, extraPaymentCents: euroToCents(event.target.value) })} />
          </label>
          <label>
            Startdatum
            <input type="date" value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} />
          </label>
          <label>
            Notizen
            <input value={draft.notes ?? ''} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
          </label>
        </div>

        <div className="loan-chart-grid">
          <article className="chart-card loan-chart-card">
            <div className="chart-header">
              <div>
                <h3>Tilgungsverlauf</h3>
                <p>Entwicklung der Restschuld und Zinsen fuer den aktuellen Entwurf.</p>
              </div>
            </div>
            <ReactECharts option={draftChart} style={{ height: 320, width: '100%' }} notMerge lazyUpdate />
          </article>

          <article className="chart-card loan-chart-card">
            <div className="chart-header">
              <div>
                <h3>Kredituebersicht</h3>
                <p>Vergleich von Kreditsumme, Monatsrate und Zinskosten.</p>
              </div>
            </div>
            {data.loans.length > 0 ? (
              <ReactECharts option={portfolioChart} style={{ height: 320, width: '100%' }} notMerge lazyUpdate />
            ) : (
              <p className="loan-muted loan-chart-empty">Lege einen Kredit an, damit die Uebersicht gefuellt wird.</p>
            )}
          </article>
        </div>

        <div className="loan-specials">
          <div className="loan-specials-head">
            <h4>Sonderzahlungen</h4>
            <button
              type="button"
              onClick={() => setDraft({ ...draft, specialPayments: [...draft.specialPayments, emptySpecialPayment()] })}
            >
              <CirclePlus size={16} /> Hinzufuegen
            </button>
          </div>

          {draft.specialPayments.length === 0 ? (
            <p className="loan-muted">Keine Sonderzahlungen angelegt.</p>
          ) : (
            <div className="loan-special-list">
              {draft.specialPayments.map((payment) => (
                <div key={payment.id} className="loan-special-item">
                  <label>
                    Bezeichnung
                    <input value={payment.label ?? ''} onChange={(event) => setDraft({
                      ...draft,
                      specialPayments: draft.specialPayments.map((item) => item.id === payment.id ? { ...item, label: event.target.value } : item),
                    })} />
                  </label>
                  <label>
                    Monat
                    <input type="number" min="1" step="1" value={payment.monthIndex} onChange={(event) => setDraft({
                      ...draft,
                      specialPayments: draft.specialPayments.map((item) => item.id === payment.id ? { ...item, monthIndex: Number(event.target.value || 1) } : item),
                    })} />
                  </label>
                  <label>
                    Betrag in EUR
                    <input type="number" min="0" step="0.01" value={centsToEuro(payment.amountCents)} onChange={(event) => setDraft({
                      ...draft,
                      specialPayments: draft.specialPayments.map((item) => item.id === payment.id ? { ...item, amountCents: euroToCents(event.target.value) } : item),
                    })} />
                  </label>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => setDraft({ ...draft, specialPayments: draft.specialPayments.filter((item) => item.id !== payment.id) })}
                  >
                    Entfernen
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="loan-summary-grid">
          <div className="loan-summary-tile">
            <span>Geschaetzte Monatsrate</span>
            <strong>{formatCurrency(Math.round(summary.monthlyPayment * 100), 'EUR')}</strong>
          </div>
          <div className="loan-summary-tile">
            <span>Restschuld nach Laufzeit</span>
            <strong>{formatCurrency(Math.round(summary.remainingBalance * 100), 'EUR')}</strong>
          </div>
          <div className="loan-summary-tile">
            <span>Voraussichtlich tilgungsfrei ab</span>
            <strong>{summary.payoffDate}</strong>
          </div>
          <div className="loan-summary-tile">
            <span>Gezahlte Zinsen</span>
            <strong>{formatCurrency(Math.round(summary.totalInterest * 100), 'EUR')}</strong>
          </div>
        </div>
      </section>

      <section className="loan-list-card">
        <div className="loan-list-head">
          <h3>Gespeicherte Kredite</h3>
          <p>{data.loans.length} Eintrag{data.loans.length === 1 ? '' : 'e'}</p>
        </div>

        {data.loans.length === 0 ? (
          <p className="loan-muted">Noch keine Kredite angelegt.</p>
        ) : (
          <div className="loan-list">
            {data.loans.map((loan) => {
              const nextSummary = buildSummary(loan);
              return (
                <article key={loan.id} className="loan-card">
                  <div className="loan-card-head">
                    <div>
                      <h4>{loan.name}</h4>
                      <p>{formatCurrency(loan.principalCents, 'EUR')} · {loan.annualInterestRatePercent.toFixed(2)} % p.a. · {loan.termMonths} Monate</p>
                    </div>
                    <div className="loan-card-actions">
                      <button type="button" onClick={() => editLoan(loan)} aria-label={`${loan.name} bearbeiten`}>
                        <PencilLine size={16} />
                      </button>
                      <button type="button" onClick={() => removeLoan(loan.id)} aria-label={`${loan.name} loeschen`}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="loan-card-body">
                    <div>
                      <CalendarRange size={16} />
                      <span>Start {loan.startDate}</span>
                    </div>
                    <div>
                      <PiggyBank size={16} />
                      <span>Rate {formatCurrency(Math.round(nextSummary.monthlyPayment * 100), 'EUR')}</span>
                    </div>
                    <div>
                      <span>Sonderzahlungen {loan.specialPayments.length}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
