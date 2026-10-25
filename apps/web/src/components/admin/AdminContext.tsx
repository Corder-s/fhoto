'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type DateRangeOption = '30d' | '7d' | 'month' | 'today';

interface AdminContextType {
  dateRange: DateRangeOption;
  setDateRange: (range: DateRangeOption) => void;
  dateRangeLabel: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const dateRangeLabels: Record<DateRangeOption, string> = {
  '30d': 'Oct 1, 2024 - Oct 31, 2024',
  '7d': 'Last 7 days',
  'month': 'This month',
  'today': 'Today',
};

const AdminContext = createContext<AdminContextType>({
  dateRange: '30d',
  setDateRange: () => {},
  dateRangeLabel: 'Oct 1, 2024 - Oct 31, 2024',
  searchQuery: '',
  setSearchQuery: () => {},
  mobileMenuOpen: false,
  setMobileMenuOpen: () => {},
});

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dateRange, setDateRange] = useState<DateRangeOption>('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <AdminContext.Provider
      value={{
        dateRange,
        setDateRange,
        dateRangeLabel: dateRangeLabels[dateRange] || 'Oct 1, 2024 - Oct 31, 2024',
        searchQuery,
        setSearchQuery,
        mobileMenuOpen,
        setMobileMenuOpen,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);
