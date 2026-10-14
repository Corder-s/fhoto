'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AuthModalOptions } from './AuthModalContext';

const SnapShootAuthView = dynamic(
  () => import('./SnapShootAuthView').then((m) => m.SnapShootAuthView),
  {
    loading: () => (
      <div className="w-full max-w-4xl min-h-[460px] bg-white rounded-3xl p-8 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-[#FF6E00] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-[#8C847A]">Loading authentication studio...</p>
      </div>
    ),
    ssr: false,
  }
);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: AuthModalOptions;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, options }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Keyboard Escape Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto overflow-x-hidden animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Blurred Dark Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* SnapShoot Split-Screen Authentication Experience */}
      <SnapShootAuthView
        isModal={true}
        onClose={onClose}
        initialTab={options.initialTab || 'register'}
        rolePreference={options.rolePreference || 'customer'}
        returnUrl={options.returnUrl}
        message={options.message}
      />
    </div>
  );
};
