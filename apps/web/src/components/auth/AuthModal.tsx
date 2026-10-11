'use client';

import React, { useEffect } from 'react';
import { AuthModalOptions } from './AuthModalContext';
import { SnapShootAuthView } from './SnapShootAuthView';

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
      className="fixed inset-0 z-50 flex justify-center p-3 sm:p-4 md:p-6 overflow-y-auto overflow-x-hidden animate-in fade-in duration-200"
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
