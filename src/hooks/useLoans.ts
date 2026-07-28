import { useCallback, useEffect, useState } from 'react';

import type { LoanData, LoanEntry, LoanSpecialPayment } from '../domain/types';
import { createId } from '../utils/id';

const STORAGE_KEY = 'finance-planner:loans';

const loadFromStorage = (): LoanData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LoanData>;
      return {
        loans: parsed.loans ?? [],
      };
    }
  } catch {
    // ignore parse errors
  }

  return { loans: [] };
};

const saveToStorage = (data: LoanData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
};

export const useLoans = () => {
  const [data, setData] = useState<LoanData>(loadFromStorage);

  useEffect(() => {
    saveToStorage(data);
  }, [data]);

  const addLoan = useCallback((loan: Omit<LoanEntry, 'id'>) => {
    setData((prev) => ({
      loans: [...prev.loans, { ...loan, id: createId() }],
    }));
  }, []);

  const updateLoan = useCallback((id: string, changes: Partial<Omit<LoanEntry, 'id'>>) => {
    setData((prev) => ({
      loans: prev.loans.map((loan) => (loan.id === id ? { ...loan, ...changes } : loan)),
    }));
  }, []);

  const removeLoan = useCallback((id: string) => {
    setData((prev) => ({
      loans: prev.loans.filter((loan) => loan.id !== id),
    }));
  }, []);

  const addSpecialPayment = useCallback((loanId: string, payment: Omit<LoanSpecialPayment, 'id'>) => {
    setData((prev) => ({
      loans: prev.loans.map((loan) =>
        loan.id === loanId
          ? { ...loan, specialPayments: [...loan.specialPayments, { ...payment, id: createId() }] }
          : loan,
      ),
    }));
  }, []);

  const updateSpecialPayment = useCallback((loanId: string, paymentId: string, changes: Partial<Omit<LoanSpecialPayment, 'id'>>) => {
    setData((prev) => ({
      loans: prev.loans.map((loan) =>
        loan.id === loanId
          ? {
              ...loan,
              specialPayments: loan.specialPayments.map((payment) =>
                payment.id === paymentId ? { ...payment, ...changes } : payment,
              ),
            }
          : loan,
      ),
    }));
  }, []);

  const removeSpecialPayment = useCallback((loanId: string, paymentId: string) => {
    setData((prev) => ({
      loans: prev.loans.map((loan) =>
        loan.id === loanId
          ? {
              ...loan,
              specialPayments: loan.specialPayments.filter((payment) => payment.id !== paymentId),
            }
          : loan,
      ),
    }));
  }, []);

  return {
    data,
    addLoan,
    updateLoan,
    removeLoan,
    addSpecialPayment,
    updateSpecialPayment,
    removeSpecialPayment,
  };
};
