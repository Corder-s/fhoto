'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Camera, 
  ShieldCheck, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Lock,
  Info 
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function RegisterPage() {
  const [role, setRole] = useState<'customer' | 'creator'>('customer');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Please provide your full legal name.');
      return;
    }
    if (!phoneNumber || phoneNumber.length < 10) {
      setErrorMessage('Please provide a valid 10-digit Indian mobile number.');
      return;
    }
    if (!email || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address for notifications and receipts.');
      return;
    }
    if (!city.trim()) {
      setErrorMessage('Please specify your primary city or region.');
      return;
    }
    if (!agreedToTerms) {
      setErrorMessage('You must review and accept the Terms of Service and Privacy Policy.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        // Photographers are redirected to onboarding, NOT approved immediately
        if (role === 'creator') {
          window.location.href = '/for-photographers';
        } else {
          window.location.href = '/customer/dashboard';
        }
      }, 1200);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-canvas-primary flex flex-col justify-between p-4 sm:p-8">
      {/* Header */}
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
          Already registered? <span className="text-brand font-bold">Sign In</span>
        </Link>
      </div>

      {/* Main Registration Form */}
      <div className="w-full max-w-lg mx-auto my-10">
        <Card className="p-8 sm:p-10 shadow-card border-contour-subtle space-y-6">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-full bg-brand-subtle flex items-center justify-center text-brand mx-auto mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-ink-primary tracking-tight">
              Create Your Account
            </h1>
            <p className="text-xs sm:text-sm text-ink-secondary">
              Select your role to get started on India&apos;s visual marketplace.
            </p>
          </div>

          {/* Account Role Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setRole('customer');
                setErrorMessage('');
              }}
              className={`p-4 rounded-card-sm border text-left transition-all ${
                role === 'customer'
                  ? 'border-brand bg-brand-subtle/50 text-ink-primary ring-1 ring-brand'
                  : 'border-contour-subtle bg-canvas-primary text-ink-secondary hover:bg-canvas-secondary'
              }`}
            >
              <User className="w-5 h-5 text-brand mb-1.5" />
              <p className="text-sm font-bold text-ink-primary">Customer Account</p>
              <p className="text-[11px] text-ink-muted mt-0.5">Book & hire verified creators</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('creator');
                setErrorMessage('');
              }}
              className={`p-4 rounded-card-sm border text-left transition-all ${
                role === 'creator'
                  ? 'border-brand bg-brand-subtle/50 text-ink-primary ring-1 ring-brand'
                  : 'border-contour-subtle bg-canvas-primary text-ink-secondary hover:bg-canvas-secondary'
              }`}
            >
              <Camera className="w-5 h-5 text-brand mb-1.5" />
              <p className="text-sm font-bold text-ink-primary">Creator Partner</p>
              <p className="text-[11px] text-ink-muted mt-0.5">Submit KYC & earn payouts</p>
            </button>
          </div>

          {/* Role Policy Reminder */}
          {role === 'creator' && (
            <div className="p-3 bg-amber-50 rounded-card-sm border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Verification Policy:</strong> Photographer accounts require government identity verification and portfolio review by an administrator before appearing in search results.
              </span>
            </div>
          )}

          {isSuccess ? (
            <div className="p-6 bg-green-50 rounded-card-md border border-green-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
              <p className="text-sm font-bold text-green-800">Registration Successful!</p>
              <p className="text-xs text-green-700">
                {role === 'creator'
                  ? 'Proceeding to photographer onboarding...'
                  : 'Redirecting to your customer dashboard...'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <Input
                label="Full Legal Name"
                required
                placeholder="Aarav Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-primary mb-1.5">
                  Mobile Number (For SMS OTP)
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
                  />
                </div>
              </div>

              <Input
                label="Email Address (For Invoices & Deliverables)"
                type="email"
                required
                placeholder="aarav@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Primary Operating City"
                required
                placeholder="e.g. Delhi NCR, Mumbai, Bengaluru"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  id="terms-checkbox"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-contour-strong text-brand focus:ring-brand cursor-pointer"
                />
                <label htmlFor="terms-checkbox" className="text-xs text-ink-secondary cursor-pointer leading-relaxed">
                  I agree to the{' '}
                  <Link href="/terms" className="text-brand font-bold hover:underline">Terms of Service</Link>,{' '}
                  <Link href="/privacy" className="text-brand font-bold hover:underline">Privacy Policy</Link>, and acknowledge the{' '}
                  <Link href="/cancellation" className="text-brand font-bold hover:underline">Cancellation Terms</Link>.
                </label>
              </div>

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
                {role === 'creator' ? 'Continue to Creator Setup' : 'Complete Registration'}
              </Button>
            </form>
          )}

          {/* Strict Role Policy Warning */}
          <div className="pt-2 border-t border-contour-subtle flex items-center justify-between text-[11px] text-ink-muted">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-ink-muted" />
              Administrative roles cannot be self-assigned.
            </span>
            <span>256-bit TLS Protected</span>
          </div>
        </Card>
      </div>

      {/* Footer Meta */}
      <div className="text-center text-xs text-ink-muted">
        <p>© {new Date().getFullYear()} SnapShoot Technologies Pvt. Ltd. All rights reserved.</p>
      </div>
    </div>
  );
}
