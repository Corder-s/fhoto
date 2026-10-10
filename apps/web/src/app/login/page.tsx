'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Camera, 
  Phone, 
  Mail, 
  Lock, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw,
  Info
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function LoginPage() {
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  
  // Phone Auth State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Email Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Status & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Resend Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'verify' && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (authMethod === 'phone') {
      if (!phoneNumber || phoneNumber.length < 10) {
        setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
        return;
      }
    } else {
      if (!email.includes('@') || !email.includes('.')) {
        setErrorMessage('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
    }

    setIsLoading(true);

    // Simulate Network Request to Backend / SMS Dispatcher
    setTimeout(() => {
      setIsLoading(false);
      if (authMethod === 'phone') {
        setStep('verify');
        setResendTimer(60);
        setCanResend(false);
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          window.location.href = '/customer/dashboard';
        }, 1000);
      }
    }, 700);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val[val.length - 1];
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const entered = otp.join('');

    if (entered.length < 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    if (attempts >= 4) {
      setErrorMessage('Too many failed attempts. For your security, this number is locked for 10 minutes.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // Valid demonstration code is 123456
      if (entered === '123456') {
        setIsSuccess(true);
        setTimeout(() => {
          window.location.href = '/customer/dashboard';
        }, 1000);
      } else {
        setAttempts((prev) => prev + 1);
        setErrorMessage(`Invalid code entered. ${4 - attempts} attempts remaining. (Test OTP: 123456)`);
      }
    }, 800);
  };

  const handleResendOtp = () => {
    if (!canResend) return;
    setErrorMessage('');
    setOtp(['', '', '', '', '', '']);
    setResendTimer(60);
    setCanResend(false);
  };

  return (
    <div className="min-h-screen bg-canvas-primary flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-card-sm bg-brand flex items-center justify-center text-white shadow-sm">
            <Camera className="w-4 h-4" />
          </div>
          <span className="text-xl font-bold tracking-tight text-ink-primary">
            Snap<span className="text-brand">Shoot</span>
          </span>
        </Link>

        <Link href="/" className="text-xs sm:text-sm font-semibold text-ink-secondary hover:text-ink-primary">
          Back to Home
        </Link>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md mx-auto my-10">
        <Card className="p-8 sm:p-10 shadow-card border-contour-subtle text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-brand-subtle flex items-center justify-center text-brand mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-ink-primary tracking-tight">
              {step === 'input' ? 'Sign in to SnapShoot' : 'Verify Mobile Code'}
            </h1>
            <p className="text-xs sm:text-sm text-ink-secondary mt-1">
              {step === 'input'
                ? 'Access your bookings, delivered galleries, or creator workspace.'
                : `Enter the 6-digit code dispatched to +91 ${phoneNumber}.`}
            </p>
          </div>

          {/* METHOD TOGGLE (Phone vs Email) */}
          {step === 'input' && !isSuccess && (
            <div className="flex rounded-card-sm p-1 bg-canvas-primary border border-contour-subtle">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('phone');
                  setErrorMessage('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-card-sm transition-all flex items-center justify-center gap-1.5 ${
                  authMethod === 'phone'
                    ? 'bg-white text-ink-primary shadow-subtle'
                    : 'text-ink-secondary hover:text-ink-primary'
                }`}
              >
                <Phone className="w-3.5 h-3.5 text-brand" />
                <span>Mobile OTP</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMethod('email');
                  setErrorMessage('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-card-sm transition-all flex items-center justify-center gap-1.5 ${
                  authMethod === 'email'
                    ? 'bg-white text-ink-primary shadow-subtle'
                    : 'text-ink-secondary hover:text-ink-primary'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-brand" />
                <span>Email Password</span>
              </button>
            </div>
          )}

          {/* SUCCESS STATE */}
          {isSuccess ? (
            <div className="p-6 bg-green-50 rounded-card-md border border-green-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
              <p className="text-sm font-bold text-green-800">Authentication Verified!</p>
              <p className="text-xs text-green-700">Redirecting to your dashboard...</p>
            </div>
          ) : step === 'input' ? (
            /* STEP 1: CREDENTIAL INPUT */
            <form onSubmit={handleSendCode} className="space-y-4 text-left">
              {authMethod === 'phone' ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-primary mb-1.5">
                    Mobile Number
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="px-3.5 py-2.5 bg-canvas-secondary border border-contour-subtle rounded-card-sm text-sm font-bold text-ink-primary">
                      +91
                    </div>
                    <Input
                      type="tel"
                      required
                      placeholder="98765 43210"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value.replace(/\D/g, ''));
                        setErrorMessage('');
                      }}
                      leftIcon={<Phone className="w-4 h-4" />}
                    />
                  </div>
                  <p className="text-[11px] text-ink-muted mt-1.5">
                    Static test OTP for preview is <code className="bg-canvas-secondary px-1 py-0.5 rounded font-mono font-bold text-brand">123456</code>.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    label="Email Address"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage('');
                    }}
                    leftIcon={<Mail className="w-4 h-4" />}
                  />

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-primary">
                        Password
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-xs font-bold text-brand hover:underline"
                      >
                        Forgot?
                      </Link>
                    </div>
                    <Input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMessage('');
                      }}
                      leftIcon={<Lock className="w-4 h-4" />}
                    />
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-red-50 rounded-card-sm border border-red-200 flex items-start gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full mt-2"
                size="md"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {authMethod === 'phone' ? 'Send One-Time Code' : 'Sign In'}
              </Button>
            </form>
          ) : (
            /* STEP 2: OTP VERIFICATION */
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="flex items-center justify-center gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-12 h-14 text-center text-xl font-bold rounded-card-sm bg-canvas-primary border border-contour-strong focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand text-ink-primary"
                  />
                ))}
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 rounded-card-sm border border-red-200 flex items-start gap-2 text-xs text-red-700 text-left">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="md"
                isLoading={isLoading}
              >
                Verify & Continue
              </Button>

              <div className="flex items-center justify-between text-xs text-ink-muted pt-2 border-t border-contour-subtle">
                <button
                  type="button"
                  onClick={() => {
                    setStep('input');
                    setErrorMessage('');
                  }}
                  className="hover:text-ink-primary font-semibold underline"
                >
                  Change Number
                </button>

                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-brand font-bold hover:underline"
                  >
                    Resend Code
                  </button>
                ) : (
                  <span>Resend in {resendTimer}s</span>
                )}
              </div>
            </form>
          )}

          {/* Registration Link */}
          <div className="pt-2 border-t border-contour-subtle text-xs text-ink-secondary">
            Don&apos;t have an account yet?{' '}
            <Link href="/register" className="text-brand font-bold hover:underline">
              Create an account
            </Link>
          </div>

          {/* Architectural Security Disclaimer */}
          <div className="p-2.5 bg-canvas-primary rounded-card-sm border border-contour-subtle text-[11px] text-ink-muted text-left flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
            <span>
              <strong>Architecture Note:</strong> Real authentication sessions are issued by the backend via HTTP-only secure cookies. Credentials or tokens are never stored in browser localStorage.
            </span>
          </div>
        </Card>
      </div>

      {/* Footer Legal Links */}
      <div className="text-center text-xs text-ink-muted">
        <p>
          By signing in, you agree to SnapShoot&apos;s{' '}
          <Link href="/terms" className="hover:underline text-ink-secondary">Terms of Service</Link> and{' '}
          <Link href="/privacy" className="hover:underline text-ink-secondary">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
