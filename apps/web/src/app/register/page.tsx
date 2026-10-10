'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Camera, ShieldCheck, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function RegisterPage() {
  const [role, setRole] = useState<'customer' | 'creator'>('customer');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        window.location.href = role === 'creator' ? '/photographer/dashboard' : '/customer/dashboard';
      }, 1000);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-canvas-primary flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-card-sm bg-brand flex items-center justify-center text-white shadow-sm">
            <Camera className="w-4 h-4" />
          </div>
          <span className="text-xl font-bold tracking-tight text-ink-primary">
            Snap<span className="text-brand">Shoot</span>
          </span>
        </Link>

        <Link href="/login" className="text-xs sm:text-sm font-semibold text-ink-secondary hover:text-ink-primary">
          Already have an account? <span className="text-brand font-bold">Sign In</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-lg mx-auto my-10">
        <Card className="p-8 sm:p-10 shadow-card border-contour-subtle">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-brand-subtle flex items-center justify-center text-brand mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-ink-primary tracking-tight">
              Create Your SnapShoot Account
            </h1>
            <p className="text-xs sm:text-sm text-ink-secondary mt-1">
              Join as a client looking for shoots or as a professional creator.
            </p>
          </div>

          {/* Role Choice */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole('customer')}
              className={`p-3.5 rounded-card-sm border text-left transition-all ${
                role === 'customer'
                  ? 'border-brand bg-brand-subtle/50 text-ink-primary ring-1 ring-brand'
                  : 'border-contour-subtle bg-canvas-primary text-ink-secondary hover:bg-canvas-secondary'
              }`}
            >
              <User className="w-5 h-5 text-brand mb-1.5" />
              <p className="text-sm font-bold text-ink-primary">I want to hire</p>
              <p className="text-[11px] text-ink-muted">Book verified creators</p>
            </button>

            <button
              type="button"
              onClick={() => setRole('creator')}
              className={`p-3.5 rounded-card-sm border text-left transition-all ${
                role === 'creator'
                  ? 'border-brand bg-brand-subtle/50 text-ink-primary ring-1 ring-brand'
                  : 'border-contour-subtle bg-canvas-primary text-ink-secondary hover:bg-canvas-secondary'
              }`}
            >
              <Camera className="w-5 h-5 text-brand mb-1.5" />
              <p className="text-sm font-bold text-ink-primary">I am a creator</p>
              <p className="text-[11px] text-ink-muted">Earn from local bookings</p>
            </button>
          </div>

          {isSuccess ? (
            <div className="p-6 bg-green-50 rounded-card-md border border-green-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
              <p className="text-sm font-bold text-green-800">Account Created Successfully!</p>
              <p className="text-xs text-green-700">Redirecting to your workspace...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                required
                placeholder="Aarav Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-primary mb-1.5">
                  Mobile Number (For OTP Verification)
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
                label="Primary City"
                required
                placeholder="e.g. Delhi NCR, Mumbai, Bengaluru"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />

              <Button
                type="submit"
                className="w-full mt-2"
                size="md"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue to Verification
              </Button>
            </form>
          )}
        </Card>
      </div>

      <div className="text-center text-xs text-ink-muted">
        <p>© {new Date().getFullYear()} SnapShoot. Built for clients and creative artists across India.</p>
      </div>
    </div>
  );
}
