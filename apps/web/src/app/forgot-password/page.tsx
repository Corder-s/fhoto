'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Camera, Mail, Phone, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please provide your registered mobile number or email.');
      return;
    }

    setError('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 700);
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
          Back to Sign In
        </Link>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md mx-auto my-10">
        <Card className="p-8 sm:p-10 shadow-card border-contour-subtle text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-brand-subtle flex items-center justify-center text-brand mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-ink-primary tracking-tight">
              Account Recovery
            </h1>
            <p className="text-xs sm:text-sm text-ink-secondary mt-1">
              Reset your credentials or recover account access.
            </p>
          </div>

          {isSubmitted ? (
            <div className="space-y-4 text-center py-2">
              <div className="p-5 bg-green-50 rounded-card-md border border-green-200 text-left space-y-2">
                <div className="flex items-center gap-2 text-green-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <span>Recovery Instructions Dispatched</span>
                </div>
                {/* Security Anti-Enumeration Notice: deliberately generic */}
                <p className="text-xs text-green-700 leading-relaxed">
                  If an active SnapShoot account is associated with <strong>{identifier}</strong>, a secure verification link and SMS code have been sent. Please check your messages.
                </p>
              </div>

              <p className="text-xs text-ink-muted">
                Didn&apos;t receive a code? Check spam or wait 60 seconds before retrying.
              </p>

              <Link href="/login">
                <Button variant="primary" className="w-full mt-2" size="md">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <Input
                label="Registered Mobile or Email"
                required
                placeholder="98765 43210 or name@example.com"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError('');
                }}
                leftIcon={<Mail className="w-4 h-4" />}
                helperText="We will transmit a time-limited 6-digit recovery code."
              />

              {error && (
                <div className="p-3 bg-red-50 rounded-card-sm border border-red-200 flex items-start gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full mt-2"
                size="md"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Send Recovery Instructions
              </Button>
            </form>
          )}

          <div className="pt-2 border-t border-contour-subtle text-xs text-ink-secondary">
            Remember your credentials?{' '}
            <Link href="/login" className="text-brand font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </Card>
      </div>

      <div className="text-center text-xs text-ink-muted">
        <p>© {new Date().getFullYear()} SnapShoot Technologies Pvt. Ltd. Account security team.</p>
      </div>
    </div>
  );
}
