'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  ArrowLeft,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  CheckCircle2,
  AlertCircle,
  Send,
  KeyRound,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '../../lib/supabase/client';
import Footer from '../../components/Footer';

export default function ForgotPasswordPage() {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const value = method === 'email' ? emailInput.trim() : phoneInput.trim();

    if (!value) {
      setErrorMessage(
        method === 'email'
          ? 'Please enter your registered email address.'
          : 'Please enter your registered mobile number.'
      );
      return;
    }

    if (method === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setErrorMessage('Please enter a valid email address format.');
        return;
      }
    } else {
      const cleanPhone = value.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setErrorMessage('Please enter a valid 10-digit mobile number.');
        return;
      }
    }

    if (method !== 'email') {
      setErrorMessage('Mobile number recovery is not available yet. Please reset your password with your registered email.');
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase || !isSupabaseConfigured()) {
      setErrorMessage('Password reset is unavailable because the authentication service is not configured.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(value, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setErrorMessage(error.message || 'Unable to process recovery request. Please try again.');
      } else {
        setSuccessMessage(
          `If an account exists for ${value}, a password reset link has been sent. Please check your inbox and spam folder.`
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to process recovery request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7F9]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 md:p-8">
        <div className="relative w-full max-w-5xl my-auto bg-white rounded-[28px] sm:rounded-[34px] border border-[#E7EAEE] shadow-[0_20px_50px_-12px_rgba(25,28,34,0.12)] z-10 text-left flex flex-col lg:flex-row overflow-hidden p-2 sm:p-2.5">
          {/* LEFT PANEL: BRANDING & EDITORIAL PHOTOGRAPHY */}
          <div className="hidden lg:flex lg:w-[50%] min-w-0 relative flex-col justify-between p-7 sm:p-8 rounded-[20px] sm:rounded-[26px] bg-[#0D0F12] text-white overflow-hidden select-none">
            <div
              className="absolute inset-0 bg-cover bg-right-top opacity-35"
              style={{
                backgroundImage: 'url(/reference-assets/auth_photographer_bg.jpg)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F12] via-[#0D0F12]/80 to-transparent" />

            <div className="relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#14B8A6] flex items-center justify-center text-[#0D0F12] shadow-sm">
                  <Camera className="w-5 h-5 stroke-[2.4]" />
                </div>
                <span className="text-xl font-black tracking-tight text-white">
                  REEPY
                </span>
              </div>
            </div>

            <div className="relative z-10 my-auto py-6 space-y-4 max-w-sm">
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Take back control of your <span className="text-[#14B8A6]">account</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                Reset your password securely and get back to discovering and booking talented local creators.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6] shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">Secure & Encrypted</h4>
                    <p className="text-[11px] text-[#94A3B8]">Your information is always protected</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6] shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">Fast Recovery</h4>
                    <p className="text-[11px] text-[#94A3B8]">Reset in just a few clicks</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-2 text-[11px] text-[#94A3B8]">
              Protected with 256-bit encrypted authentication handshake.
            </div>
          </div>

          {/* RIGHT PANEL: PASSWORD RECOVERY CARD */}
          <div className="w-full lg:w-[50%] min-w-0 bg-white rounded-[20px] sm:rounded-[26px] p-6 sm:p-8 md:p-9 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-6">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#191C22] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-[#94A3B8]" />
                  <span>Back to Log In</span>
                </Link>
              </div>

              <div className="mb-5 space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-black text-[#191C22] tracking-tight">
                  Forgot Password?
                </h2>
                <p className="text-xs sm:text-[13px] text-[#64748B] leading-relaxed">
                  Enter your email address and we&apos;ll send you a secure link to reset your password.
                </p>
              </div>

              {/* Status Feedback */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-bold">Instructions Dispatched</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">{successMessage}</p>
                  </div>
                </div>
              )}

              {/* Form Input */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#191C22] mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => {
                        setEmailInput(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[#E7EAEE] text-xs sm:text-sm text-[#191C22] placeholder:text-[#94A3B8] focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20 outline-none font-medium transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] active:bg-[#0F766E] text-[#0D0F12] hover:text-white font-black text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* 3-Step Password Reset Timeline */}
            <div className="pt-6 mt-8 border-t border-[#E7EAEE]">
              <div className="grid grid-cols-3 gap-2 text-center items-start">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[#EFFCF8] text-[#0F766E] border border-[#99F6E4] flex items-center justify-center mb-1.5">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <h5 className="text-[11px] font-bold text-[#191C22]">1. Enter Email</h5>
                  <p className="text-[9px] text-[#94A3B8] mt-0.5 leading-tight">Provide registered email</p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[#EFFCF8] text-[#0F766E] border border-[#99F6E4] flex items-center justify-center mb-1.5">
                    <Send className="w-3.5 h-3.5" />
                  </div>
                  <h5 className="text-[11px] font-bold text-[#191C22]">2. Check Inbox</h5>
                  <p className="text-[9px] text-[#94A3B8] mt-0.5 leading-tight">Open the reset link</p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[#EFFCF8] text-[#0F766E] border border-[#99F6E4] flex items-center justify-center mb-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <h5 className="text-[11px] font-bold text-[#191C22]">3. Set Password</h5>
                  <p className="text-[9px] text-[#94A3B8] mt-0.5 leading-tight">Set new secure password</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
