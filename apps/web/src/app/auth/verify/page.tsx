'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Camera, ShieldCheck, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { sanitizeRedirectUrl } from '../../../lib/safeRedirect';

function AuthVerifyForm() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(45);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val[val.length - 1];
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    if (val && index < 5) {
      const nextInput = document.getElementById(`standalone-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const code = otp.join('');

    if (code.length < 6) {
      setErrorMessage('Please enter all 6 digits of your one-time verification code.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      if (code === '123456') {
        setIsSuccess(true);
        setTimeout(() => {
          const dest = sanitizeRedirectUrl(redirectParam, '/customer/dashboard');
          window.location.href = dest;
        }, 1000);
      } else {
        setErrorMessage('Verification code is invalid or has expired. Test code is 123456.');
      }
    }, 800);
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

        <Link href="/login" className="text-xs sm:text-sm font-semibold text-ink-secondary hover:text-ink-primary">
          Back to Login
        </Link>
      </div>

      {/* Main Verification Card */}
      <div className="w-full max-w-md mx-auto my-10">
        <Card className="p-8 sm:p-10 shadow-card border-contour-subtle text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-brand-subtle flex items-center justify-center text-brand mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-ink-primary tracking-tight">
              Two-Factor Verification
            </h1>
            <p className="text-xs sm:text-sm text-ink-secondary mt-1">
              Confirm your identity using the 6-digit code dispatched to your registered device.
            </p>
          </div>

          {isSuccess ? (
            <div className="p-6 bg-green-50 rounded-card-md border border-green-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
              <p className="text-sm font-bold text-green-800">Identity Successfully Verified!</p>
              <p className="text-xs text-green-700">Redirecting to your session...</p>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="flex items-center justify-center gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`standalone-otp-${idx}`}
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
                Authenticate Session
              </Button>

              <div className="flex items-center justify-between text-xs text-ink-muted pt-2 border-t border-contour-subtle">
                <span>Code expires in 5 minutes</span>
                {resendTimer > 0 ? (
                  <span>Resend in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setResendTimer(45);
                      setErrorMessage('');
                    }}
                    className="text-brand font-bold hover:underline"
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </form>
          )}
        </Card>
      </div>

      <div className="text-center text-xs text-ink-muted">
        <p>© {new Date().getFullYear()} SnapShoot Technologies Pvt. Ltd. Authenticated Session Guard.</p>
      </div>
    </div>
  );
}

export default function AuthVerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas-primary" />}>
      <AuthVerifyForm />
    </Suspense>
  );
}

