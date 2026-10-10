'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  X,
  Phone,
  Mail,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { saveAuthSession, AuthUser } from '../../lib/auth';
import { sanitizeRedirectUrl } from '../../lib/safeRedirect';
import { AuthModalOptions } from './AuthModalContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: AuthModalOptions;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, options }) => {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login Method: 'phone' | 'email'
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [phoneStep, setPhoneStep] = useState<'phone' | 'otp'>('phone');

  // Phone Auth State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(60);

  // Email Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register State
  const [regRole, setRegRole] = useState<'customer' | 'creator'>('customer');
  const [fullName, setFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [city, setCity] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Status & Error
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  // Initialize tab and roles when opened
  useEffect(() => {
    if (isOpen) {
      if (options.initialTab) {
        setTab(options.initialTab);
      } else {
        setTab('login');
      }
      if (options.rolePreference) {
        setRegRole(options.rolePreference);
      }
      setErrorMessage('');
      setSuccessMessage('');
      setPhoneStep('phone');
      setIsLoading(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, options]);

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

  // Resend Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && phoneStep === 'otp' && resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, phoneStep, resendCountdown]);

  if (!isOpen) return null;

  const resolvedReturnUrl = sanitizeRedirectUrl(options.returnUrl, '/explore');

  // Handle successful authentication
  const handleAuthSuccess = (user: AuthUser, destinationUrl: string) => {
    saveAuthSession(user);
    setSuccessMessage(`Welcome back, ${user.name}! Directing you to your destination...`);

    setTimeout(() => {
      onClose();
      // Role-based validation on redirection:
      // If customer requested a photographer-only route, redirect to customer dashboard
      let target = destinationUrl;
      if (user.role === 'customer' && target.startsWith('/photographer')) {
        target = '/customer/dashboard';
      }
      router.push(target);
    }, 700);
  };

  // Quick Demo Logins
  const handleQuickDemoLogin = (role: 'customer' | 'creator') => {
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      if (role === 'customer') {
        const demoCustomer: AuthUser = {
          id: 'cust-demo-1',
          name: 'Aman Sharma',
          email: 'aman@snapshoot.local',
          phone: '+91 98112 34567',
          role: 'customer',
        };
        handleAuthSuccess(demoCustomer, resolvedReturnUrl);
      } else {
        const demoCreator: AuthUser = {
          id: 'creator-demo-1',
          name: 'Rajat Kapoor',
          email: 'rajat.kapoor@snapshoot.local',
          phone: '+91 98765 43210',
          role: 'creator',
        };
        // If photographer logged in without specific customer discovery target, open photographer dashboard
        const dest = resolvedReturnUrl === '/explore' ? '/photographer/dashboard' : resolvedReturnUrl;
        handleAuthSuccess(demoCreator, dest);
      }
    }, 450);
  };

  // Phone send OTP
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setPhoneStep('otp');
      setResendCountdown(60);
      setOtpCode(['', '', '', '', '', '']);
    }, 500);
  };

  // OTP Input change handler
  const handleOtpBoxChange = (index: number, val: string) => {
    const char = val.slice(-1);
    const updated = [...otpCode];
    updated[index] = char;
    setOtpCode(updated);

    if (char && index < 5) {
      const nextInput = document.getElementById(`modal-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const code = otpCode.join('');

    if (code.length < 6) {
      setErrorMessage('Please enter all 6 digits of the OTP verification code.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Valid demonstration OTP is 123456
      if (code === '123456') {
        const user: AuthUser = {
          id: 'cust-otp-1',
          name: 'Aman Sharma',
          email: 'aman@snapshoot.local',
          phone: `+91 ${phoneNumber.trim()}`,
          role: 'customer',
        };
        handleAuthSuccess(user, resolvedReturnUrl);
      } else {
        setErrorMessage('Invalid verification code entered. (Test OTP code is 123456)');
      }
    }, 600);
  };

  // Email login
  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const isCreator = email.toLowerCase().includes('creator') || email.toLowerCase().includes('photographer');
      const user: AuthUser = {
        id: isCreator ? 'creator-email-1' : 'cust-email-1',
        name: isCreator ? 'Rajat Kapoor' : email.split('@')[0],
        email: email.trim(),
        role: isCreator ? 'creator' : 'customer',
      };
      const dest = isCreator && resolvedReturnUrl === '/explore' ? '/photographer/dashboard' : resolvedReturnUrl;
      handleAuthSuccess(user, dest);
    }, 600);
  };

  // Create account submission
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Please provide your full legal name.');
      return;
    }
    const cleanPhone = regPhone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please provide a valid 10-digit mobile number.');
      return;
    }
    if (!regEmail || !regEmail.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (!city.trim()) {
      setErrorMessage('Please enter your primary city (e.g. Greater Noida, Delhi NCR).');
      return;
    }
    if (!agreedToTerms) {
      setErrorMessage('Please accept the SnapShoot Terms of Service to continue.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const newUser: AuthUser = {
        id: `user-${Date.now()}`,
        name: fullName.trim(),
        email: regEmail.trim(),
        phone: `+91 ${cleanPhone}`,
        role: regRole,
      };

      if (regRole === 'creator') {
        saveAuthSession(newUser);
        setSuccessMessage('Creator profile initialized! Continuing to onboarding studio...');
        setTimeout(() => {
          onClose();
          router.push('/photographer/onboarding');
        }, 800);
      } else {
        handleAuthSuccess(newUser, resolvedReturnUrl);
      }
    }, 700);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        ref={modalRef}
        className="relative w-full max-w-lg bg-[#FAF7F2] rounded-3xl border border-[#E8E2D8] shadow-[0_25px_60px_-15px_rgba(26,24,22,0.3)] p-6 sm:p-8 z-10 text-left animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close authentication modal"
          className="absolute top-5 right-5 p-2 rounded-full text-[#8C847A] hover:text-[#1A1816] hover:bg-[#F2ECE3] focus:outline-none focus:ring-2 focus:ring-[#FF6E00] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#FF6E00] flex items-center justify-center text-white shadow-sm">
            <Camera className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-xl font-black tracking-tight text-[#1A1816]">
            SNAP<span className="text-[#FF6E00]">SHOOT</span>
          </span>
        </div>

        {/* Modal Title & Description */}
        <div className="space-y-1.5 mb-6">
          <h2
            id="auth-modal-title"
            className="text-2xl sm:text-3xl font-black text-[#1A1816] tracking-tight"
          >
            Welcome to SnapShoot
          </h2>
          <p className="text-xs sm:text-sm text-[#5A544D] leading-relaxed">
            {options.message ||
              'Log in or create your account to discover photographers, manage bookings, and access your personalized workspace.'}
          </p>
        </div>

        {/* Tab Switcher: Log In vs Create Account */}
        <div className="grid grid-cols-2 p-1 bg-[#F2ECE3] rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMessage('');
            }}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              tab === 'login'
                ? 'bg-white text-[#1A1816] shadow-sm'
                : 'text-[#8C847A] hover:text-[#1A1816]'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMessage('');
            }}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              tab === 'register'
                ? 'bg-white text-[#1A1816] shadow-sm'
                : 'text-[#8C847A] hover:text-[#1A1816]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Feedback */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: LOG IN */}
        {tab === 'login' && (
          <div className="space-y-4">
            {/* Quick Demo Access Bar */}
            <div className="p-3 rounded-2xl bg-white border border-[#E8E2D8] space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#8C847A] uppercase tracking-wider">
                <span className="flex items-center gap-1 text-[#FF6E00]">
                  <Sparkles className="w-3.5 h-3.5" /> Instant Demo Sign-In
                </span>
                <span>One-Click</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('customer')}
                  disabled={isLoading}
                  className="py-2 px-3 rounded-xl bg-[#FFF3E5] hover:bg-[#FFE6CC] active:scale-[0.98] text-[#FF6E00] border border-[#FFD8B3] text-xs font-bold text-center transition-all cursor-pointer"
                >
                  Customer Demo
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('creator')}
                  disabled={isLoading}
                  className="py-2 px-3 rounded-xl bg-[#F2ECE3] hover:bg-[#E8E2D8] active:scale-[0.98] text-[#1A1816] border border-[#E0D8CB] text-xs font-bold text-center transition-all cursor-pointer"
                >
                  Photographer Demo
                </button>
              </div>
            </div>

            {/* Auth Method Sub-tabs */}
            <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-2">
              <div className="flex gap-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('phone');
                    setErrorMessage('');
                  }}
                  className={`flex items-center gap-1.5 pb-1 border-b-2 transition-colors ${
                    authMethod === 'phone'
                      ? 'border-[#FF6E00] text-[#FF6E00]'
                      : 'border-transparent text-[#8C847A] hover:text-[#1A1816]'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Phone Number</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('email');
                    setErrorMessage('');
                  }}
                  className={`flex items-center gap-1.5 pb-1 border-b-2 transition-colors ${
                    authMethod === 'email'
                      ? 'border-[#FF6E00] text-[#FF6E00]'
                      : 'border-transparent text-[#8C847A] hover:text-[#1A1816]'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Address</span>
                </button>
              </div>
              <span className="text-[10px] text-[#8C847A]">Secure OTP / SSL</span>
            </div>

            {/* PHONE METHOD */}
            {authMethod === 'phone' && (
              <>
                {phoneStep === 'phone' ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1A1816] mb-1.5">
                        Indian Mobile Number
                      </label>
                      <div className="flex rounded-xl bg-white border border-[#E8E2D8] overflow-hidden focus-within:border-[#FF6E00] focus-within:ring-2 focus-within:ring-[#FF6E00]/20 transition-all">
                        <span className="px-3.5 py-3 text-xs font-bold bg-[#F2ECE3] text-[#5A544D] border-r border-[#E8E2D8] flex items-center">
                          +91
                        </span>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="98112 34567"
                          maxLength={12}
                          className="flex-1 px-3.5 py-3 text-xs sm:text-sm text-[#1A1816] placeholder:text-[#8C847A] outline-none font-medium bg-transparent"
                          autoFocus
                        />
                      </div>
                      <p className="text-[11px] text-[#8C847A] mt-1.5">
                        We will send a 6-digit OTP code to verify your mobile number.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-[#FF6E00] hover:bg-[#E86300] active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? 'Sending Code...' : 'Get Verification Code'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-[#1A1816]">
                          Enter 6-digit OTP
                        </label>
                        <button
                          type="button"
                          onClick={() => setPhoneStep('phone')}
                          className="text-[11px] font-semibold text-[#FF6E00] hover:underline"
                        >
                          Change +91 {phoneNumber}
                        </button>
                      </div>

                      {/* 6 OTP boxes */}
                      <div className="flex justify-between gap-1.5 sm:gap-2">
                        {otpCode.map((val, idx) => (
                          <input
                            key={idx}
                            id={`modal-otp-${idx}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={val}
                            onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                            className="w-10 sm:w-12 h-12 text-center text-lg font-black bg-white border border-[#E8E2D8] rounded-xl focus:border-[#FF6E00] focus:ring-2 focus:ring-[#FF6E00]/20 outline-none text-[#1A1816]"
                            autoFocus={idx === 0}
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-2 text-[11px] text-[#8C847A]">
                        <span>Test OTP: <strong className="text-[#1A1816]">123456</strong></span>
                        {resendCountdown > 0 ? (
                          <span>Resend in {resendCountdown}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setResendCountdown(60)}
                            className="text-[#FF6E00] font-bold hover:underline"
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-[#FF6E00] hover:bg-[#E86300] active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? 'Verifying...' : 'Log In & Continue'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </>
            )}

            {/* EMAIL METHOD */}
            {authMethod === 'email' && (
              <form onSubmit={handleEmailLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#1A1816] mb-1">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D8] focus-within:border-[#FF6E00] focus-within:ring-2 focus-within:ring-[#FF6E00]/20">
                    <Mail className="w-4 h-4 text-[#8C847A]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="aman@snapshoot.local"
                      className="w-full text-xs sm:text-sm text-[#1A1816] placeholder:text-[#8C847A] outline-none bg-transparent font-medium"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1816] mb-1">
                    Password
                  </label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D8] focus-within:border-[#FF6E00] focus-within:ring-2 focus-within:ring-[#FF6E00]/20">
                    <Lock className="w-4 h-4 text-[#8C847A]" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs sm:text-sm text-[#1A1816] placeholder:text-[#8C847A] outline-none bg-transparent font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-[#FF6E00] hover:bg-[#E86300] active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? 'Signing In...' : 'Log In & Continue'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: CREATE ACCOUNT */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            {/* Account Role Selector */}
            <div>
              <label className="block text-xs font-bold text-[#1A1816] mb-1.5">
                I want to join as:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegRole('customer')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    regRole === 'customer'
                      ? 'border-[#FF6E00] bg-[#FFF3E5]/60 text-[#1A1816] ring-1 ring-[#FF6E00]'
                      : 'border-[#E8E2D8] bg-white text-[#5A544D] hover:bg-[#F2ECE3]'
                  }`}
                >
                  <User className="w-4 h-4 text-[#FF6E00] mb-1" />
                  <p className="text-xs font-bold text-[#1A1816]">Customer</p>
                  <p className="text-[10px] text-[#8C847A]">Book verified creators</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole('creator')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    regRole === 'creator'
                      ? 'border-[#FF6E00] bg-[#FFF3E5]/60 text-[#1A1816] ring-1 ring-[#FF6E00]'
                      : 'border-[#E8E2D8] bg-white text-[#5A544D] hover:bg-[#F2ECE3]'
                  }`}
                >
                  <Camera className="w-4 h-4 text-[#FF6E00] mb-1" />
                  <p className="text-xs font-bold text-[#1A1816]">Photographer</p>
                  <p className="text-[10px] text-[#8C847A]">Get bookings & payouts</p>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-[#1A1816] mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Aman Sharma"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D8] text-xs sm:text-sm text-[#1A1816] placeholder:text-[#8C847A] focus:border-[#FF6E00] focus:ring-2 focus:ring-[#FF6E00]/20 outline-none font-medium"
              />
            </div>

            {/* Mobile Number & City Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1A1816] mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="98112 34567"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D8] text-xs sm:text-sm text-[#1A1816] placeholder:text-[#8C847A] focus:border-[#FF6E00] focus:ring-2 focus:ring-[#FF6E00]/20 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1816] mb-1">
                  City / Hub
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Greater Noida"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D8] text-xs sm:text-sm text-[#1A1816] placeholder:text-[#8C847A] focus:border-[#FF6E00] focus:ring-2 focus:ring-[#FF6E00]/20 outline-none font-medium"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-[#1A1816] mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D8] text-xs sm:text-sm text-[#1A1816] placeholder:text-[#8C847A] focus:border-[#FF6E00] focus:ring-2 focus:ring-[#FF6E00]/20 outline-none font-medium"
              />
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#FF6E00] focus:ring-[#FF6E00] border-[#E8E2D8]"
              />
              <span className="text-[11px] text-[#5A544D] leading-tight">
                I agree to the SnapShoot Terms of Service and Privacy Policy.
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#FF6E00] hover:bg-[#E86300] active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Creating Account...' : 'Create Account & Continue'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Footer Support Text */}
        <div className="mt-5 pt-4 border-t border-[#E8E2D8] text-center">
          <p className="text-[11px] text-[#8C847A] flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF6E00]" />
            Find photographers, book shoots, and manage your photography experience in one place.
          </p>
        </div>
      </div>
    </div>
  );
};
