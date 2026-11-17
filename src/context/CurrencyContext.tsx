import React, { createContext, useContext, useState, useEffect } from 'react';
import { Currency } from '../types';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatMoney: (amountNGN: number) => string;
  exchangeRate: number; // NGN per 1 USD
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const NGN_PER_USD = 1500;

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('agroinspo_currency');
    return (saved as Currency) || 'NGN';
  });

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('agroinspo_currency', c);
  };

  const formatMoney = (amountNGN: number): string => {
    if (currency === 'USD') {
      const usd = amountNGN / NGN_PER_USD;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(usd);
    }

    const amount = new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amountNGN);
    // A space keeps Inter's naira glyph from sitting on the first digit.
    return `₦\u2002${amount}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatMoney,
        exchangeRate: NGN_PER_USD
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
