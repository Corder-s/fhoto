'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AuthModal } from './AuthModal';

export interface AuthModalOptions {
  returnUrl?: string;
  initialTab?: 'login' | 'register';
  message?: string;
  rolePreference?: 'customer' | 'creator';
}

interface AuthModalContextType {
  isOpen: boolean;
  options: AuthModalOptions;
  openAuthModal: (opts?: AuthModalOptions) => void;
  closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AuthModalOptions>({});

  const openAuthModal = useCallback((opts?: AuthModalOptions) => {
    setOptions(opts || {});
    setIsOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        options,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
      <AuthModal
        isOpen={isOpen}
        onClose={closeAuthModal}
        options={options}
      />
    </AuthModalContext.Provider>
  );
};

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
}
