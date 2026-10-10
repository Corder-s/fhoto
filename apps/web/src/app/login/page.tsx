'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Camera, Phone, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
    }, 700);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val[val.length - 1];
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto-focus next field
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = otp.join('');
    if (entered.length < 6) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        window.location.href = '/customer/dashboard';
      }, 1000);
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

        <Link href="/" className="text-xs sm:text-sm font-semibold text-ink-secondary hover:text-ink-primary">
          Back to Home
        </Link>
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-md mx-auto my-10">
        <Card className="p-8 sm:p-10 shadow-card border-contour-subtle text-center">
          <div className="w-12 h-12 rounded-full bg-brand-subtle flex items-center justify-center text-brand mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <h1 className="text-2xl font-extrabold text-ink-primary tracking-tight">
            {step === 'phone' ? 'Sign in with Mobile' : 'Verify Your Number'}
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-1 mb-8">
            {step === 'phone'
              ? 'Enter your mobile number to receive a secure one-time verification code.'
              : `Enter the 6-digit verification code sent to +91 ${phoneNumber}.`}
          </p>

          {isSuccess ? (
            <div className="p-6 bg-green-50 rounded-card-md border border-green-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
              <p className="text-sm font-bold text-green-800">Authentication Verified!</p>
              <p className="text-xs text-green-700">Redirecting to your dashboard...</p>
            </div>
          ) : step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-5 text-left">
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
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    leftIcon={<Phone className="w-4 h-4" />}
                  />
                </div>
                <p className="text-[11px] text-ink-muted mt-1.5">
                  Development Mode: Use any 10-digit number. Static test OTP is <code className="bg-canvas-secondary px-1 py-0.5 rounded font-mono font-bold text-brand">123456</code>.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="md"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Send Verification OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {/* 6 Digit Input Grid */}
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

              <p className="text-xs text-ink-muted">
                Tip: Enter test OTP <span className="font-bold text-brand">1 2 3 4 5 6</span>
              </p>

              <Button
                type="submit"
                className="w-full"
                size="md"
                isLoading={isLoading}
              >
                Verify & Continue
              </Button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-xs font-bold text-ink-secondary hover:text-ink-primary underline"
              >
                Change Phone Number
              </button>
            </form>
          )}
        </Card>
      </div>

      {/* Footer Meta */}
      <div className="text-center text-xs text-ink-muted">
        <p>By continuing, you agree to SnapShoot&apos;s Terms of Service and Privacy Policy.</p>
      </div>
    </div>
  );
}
