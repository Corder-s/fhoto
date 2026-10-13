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
  Check
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
      // Supabase Auth sends the recovery e-mail and validates the link when the user returns.
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
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 md:p-8">
        {/* Outer Split Card Container matching IMAGE 1 */}
        <div className="relative w-full max-w-5xl my-auto bg-[#FAF7F2] rounded-[28px] sm:rounded-[34px] border border-[#E8E2D8] shadow-[0_25px_60px_-15px_rgba(26,24,22,0.35)] z-10 text-left flex flex-col lg:flex-row overflow-hidden p-2 sm:p-2.5">
          {/* ========================================================= */}
          {/* LEFT PANEL: BRANDING & EDITORIAL PHOTOGRAPHY EXPERIENCE   */}
          {/* ========================================================= */}
          <div className="hidden lg:flex lg:w-[52%] min-w-0 relative flex-col justify-between p-7 sm:p-8 rounded-[20px] sm:rounded-[26px] bg-[#FBF7F0] overflow-hidden select-none">
            {/* Background Photographer Image with Golden-Hour Atmosphere */}
            <div
              className="absolute inset-0 bg-cover bg-right-top transition-transform duration-700 hover:scale-[1.02]"
              style={{
                backgroundImage: 'url(/reference-assets/auth_photographer_bg.jpg)',
              }}
            />

            {/* Warm Gradient Scrim for crisp text contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2]/95 via-[#FAF7F2]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FAF7F2] via-transparent to-transparent opacity-90" />

            {/* Layer 1: Top Brand Header & Script Note */}
            <div className="relative z-10 flex items-start justify-between">
              {/* SnapShoot Branding */}
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FF6E00] flex items-center justify-center text-white shadow-sm">
                    <Camera className="w-5 h-5 fill-white/20 stroke-[2.2]" />
                  </div>
                  <span className="text-xl font-black tracking-tight text-[#1A1816]">
                    SNAP<span className="text-[#FF6E00]">SHOOT</span>
                  </span>
                </div>
                <p className="text-[11px] font-medium text-[#736B63] tracking-wide mt-0.5 ml-11">
                  Moments. People. Stories.
                </p>
              </div>

              {/* Handwritten Script Note in Golden Sunlight */}
              <div className="font-script text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] text-2xl font-bold leading-[1.05] rotate-[-5deg] pr-2 text-right">
                Same
                <br />
                Passion
                <br />
                New
                <br />
                Beginnings
                <br />
                <span className="text-xl">♡</span>
              </div>
            </div>

            {/* Layer 2: Main Headline & Security Highlights */}
            <div className="relative z-10 my-auto py-4 space-y-5 max-w-sm">
              {/* Main Headline with cursive "account" */}
              <h1 className="text-3xl sm:text-[34px] font-black text-[#1A1816] tracking-tight leading-[1.15]">
                Take back
                <br />
                control of your
                <br />
                <span className="font-script text-[#FF6E00] text-4xl sm:text-[44px] font-bold italic tracking-normal inline-block relative ml-1">
                  account
                  <svg
                    className="absolute -bottom-1.5 left-0 w-full h-2 text-[#FF6E00]/60 pointer-events-none"
                    viewBox="0 0 100 12"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,8 Q50,0 100,6"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              <p className="text-xs sm:text-[13px] text-[#736B63] leading-relaxed">
                Reset your password securely and get back to capturing amazing opportunities.
              </p>

              {/* 3 Security Highlights */}
              <div className="space-y-3 pt-1">
                {/* Highlight 1: Secure & Encrypted */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FFEAD9] border border-[#FFD2B3] flex items-center justify-center text-[#FF6E00] shrink-0 shadow-2xs">
                    <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1A1816] leading-tight">
                      Secure &amp; Encrypted
                    </h4>
                    <p className="text-[11px] text-[#736B63] leading-tight">
                      Your information is always protected
                    </p>
                  </div>
                </div>

                {/* Highlight 2: Quick & Easy */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FFEAD9] border border-[#FFD2B3] flex items-center justify-center text-[#FF6E00] shrink-0 shadow-2xs">
                    <Zap className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1A1816] leading-tight">
                      Quick &amp; Easy
                    </h4>
                    <p className="text-[11px] text-[#736B63] leading-tight">
                      Reset in just a few steps
                    </p>
                  </div>
                </div>

                {/* Highlight 3: Account Safety */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FFEAD9] border border-[#FFD2B3] flex items-center justify-center text-[#FF6E00] shrink-0 shadow-2xs">
                    <Lock className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1A1816] leading-tight">
                      Account Safety
                    </h4>
                    <p className="text-[11px] text-[#736B63] leading-tight">
                      Keep your account secure
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Layer 3: Bottom Polaroid Collage & Social Proof */}
            <div className="relative z-10 pt-2 space-y-3">
              {/* 4 Overlapping Polaroid-Style Cards */}
              <div className="flex items-end -space-x-2 pt-2 overflow-visible">
                {/* Card 1: Couple */}
                <div className="relative -rotate-6 transition-transform hover:rotate-0 hover:z-20 duration-200">
                  <div className="p-1.5 pb-2.5 bg-white rounded-xl shadow-md border border-[#E8E2D8]">
                    <img
                      src="/reference-assets/auth_polaroid_couple.jpg"
                      alt="Wedding Couple"
                      className="w-19 h-19 sm:w-21 sm:h-21 object-cover rounded-lg"
                    />
                  </div>
                </div>

                {/* Card 2: Smiling Child */}
                <div className="relative rotate-3 -ml-3 transition-transform hover:rotate-0 hover:z-20 duration-200">
                  <div className="p-1.5 pb-2.5 bg-white rounded-xl shadow-md border border-[#E8E2D8]">
                    <img
                      src="/reference-assets/auth_polaroid_child.jpg"
                      alt="Baby and Kids Portrait"
                      className="w-19 h-19 sm:w-21 sm:h-21 object-cover rounded-lg"
                    />
                  </div>
                </div>

                {/* Card 3: Indian Traditional Bride */}
                <div className="relative -rotate-2 -ml-3 transition-transform hover:rotate-0 hover:z-20 duration-200">
                  <div className="p-1.5 pb-2.5 bg-white rounded-xl shadow-md border border-[#E8E2D8]">
                    <img
                      src="/reference-assets/auth_polaroid_portrait.jpg"
                      alt="Traditional Indian Portraits"
                      className="w-19 h-19 sm:w-21 sm:h-21 object-cover rounded-lg"
                    />
                  </div>
                </div>

                {/* Card 4: Mountain Scenery */}
                <div className="relative rotate-4 -ml-3 transition-transform hover:rotate-0 hover:z-20 duration-200">
                  <div className="p-1.5 pb-2.5 bg-white rounded-xl shadow-md border border-[#E8E2D8]">
                    <img
                      src="/reference-assets/auth_polaroid_mountain.jpg"
                      alt="Travel and Outdoor Photography"
                      className="w-19 h-19 sm:w-21 sm:h-21 object-cover rounded-lg"
                    />
                  </div>
                </div>

                {/* Handwritten "Real People Real Stories" */}
                <div className="ml-2 mb-1.5 font-script text-[#2A231C] leading-[1.05]">
                  <span className="text-[#FF6E00] text-lg block">♡</span>
                  <span className="text-sm sm:text-base font-bold whitespace-nowrap">
                    Real People
                    <br />
                    Real Stories
                  </span>
                </div>
              </div>

              {/* Social Proof Avatars & Customer Count */}
              <div className="flex items-center gap-3 pt-1 border-t border-[#E8E2D8]/60">
                <div className="flex -space-x-2 shrink-0">
                  <img
                    src="/reference-assets/avatar_aman.jpg"
                    alt="Customer"
                    className="w-7 h-7 rounded-full border-2 border-white object-cover"
                  />
                  <img
                    src="/reference-assets/avatar_riya.jpg"
                    alt="Customer"
                    className="w-7 h-7 rounded-full border-2 border-white object-cover"
                  />
                  <img
                    src="/reference-assets/avatar_karan.jpg"
                    alt="Customer"
                    className="w-7 h-7 rounded-full border-2 border-white object-cover"
                  />
                  <div className="w-7 h-7 rounded-full bg-[#1A1816] border-2 border-white flex items-center justify-center text-white text-[9px] font-bold">
                    10K+
                  </div>
                </div>
                <p className="text-[11px] font-medium text-[#5A544D] leading-tight">
                  Join thousands of photographers and clients capturing special moments.
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT PANEL: PASSWORD RECOVERY CARD                       */}
          {/* ========================================================= */}
          <div className="w-full lg:w-[48%] min-w-0 bg-white rounded-[20px] sm:rounded-[26px] p-6 sm:p-8 md:p-9 flex flex-col justify-between overflow-y-auto overscroll-contain shadow-xs">
            <div>
              {/* Top Navigation & Decorative Camera Sticker */}
              <div className="flex items-center justify-between mb-6">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#5A544D] hover:text-[#1A1816] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-[#8C847A]" />
                  <span>Back to Log In</span>
                </Link>

                {/* Decorative Camera Graphic */}
                <div className="relative">
                  <img
                    src="/reference-assets/cat_promo_camera.png"
                    alt="Camera illustration"
                    className="w-12 h-10 object-contain rotate-6 hover:rotate-12 transition-transform"
                  />
                </div>
              </div>

              {/* Header Titles */}
              <div className="mb-5 space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-black text-[#1A1816] tracking-tight">
                  Forgot Password?
                </h2>
                <p className="text-xs sm:text-[13px] text-[#736B63] leading-relaxed">
                  No worries! Enter your email address or mobile number and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              {/* Tab Selector: Email Address vs Mobile Number */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setMethod('email');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    method === 'email'
                      ? 'border-[#FF6E00] bg-[#FFF8F2] text-[#FF6E00] shadow-2xs font-black'
                      : 'border-[#E8E2D8] bg-white text-[#736B63] hover:border-[#D5CDBD]'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>Email Address</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMethod('phone');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    method === 'phone'
                      ? 'border-[#FF6E00] bg-[#FFF8F2] text-[#FF6E00] shadow-2xs font-black'
                      : 'border-[#E8E2D8] bg-white text-[#736B63] hover:border-[#D5CDBD]'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  <span>Mobile Number</span>
                </button>
              </div>

              {/* Status Feedback */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-bold">Instructions Dispatched</p>
                    <p className="text-[11px] text-green-700 mt-0.5 leading-relaxed">{successMessage}</p>
                  </div>
                </div>
              )}

              {/* Form Input */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {method === 'email' ? (
                  <div>
                    <label className="block text-xs font-bold text-[#1A1816] mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C847A]" />
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => {
                          setEmailInput(e.target.value);
                          setErrorMessage('');
                        }}
                        placeholder="name@example.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[#E8E2D8] text-xs sm:text-sm text-[#1A1816] placeholder:text-[#8C847A] focus:border-[#FF6E00] focus:ring-2 focus:ring-[#FF6E00]/20 outline-none font-medium transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-[#1A1816] mb-1.5">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C847A]" />
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => {
                          setPhoneInput(e.target.value);
                          setErrorMessage('');
                        }}
                        placeholder="+91 98765 43210"
                        maxLength={10}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[#E8E2D8] text-xs sm:text-sm text-[#1A1816] placeholder:text-[#8C847A] focus:border-[#FF6E00] focus:ring-2 focus:ring-[#FF6E00]/20 outline-none font-medium transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#FF6E00] hover:bg-[#E86300] active:scale-[0.99] text-white font-black text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E8E2D8]" />
                </div>
                <div className="relative flex justify-center text-[11px] font-bold uppercase tracking-wider text-[#8C847A]">
                  <span className="bg-white px-3">OR</span>
                </div>
              </div>

              {/* Security Information Box */}
              <div className="p-4 rounded-2xl bg-[#FFF8F2] border border-[#FFDFC6] flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FFEAD9] border border-[#FFD2B3] flex items-center justify-center text-[#FF6E00] shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1A1816]">Keep your account safe</h4>
                  <p className="text-[11px] text-[#736B63] mt-0.5 leading-relaxed">
                    We&apos;ll send a secure reset link to your {method === 'email' ? 'email address' : 'mobile number'}. Links expire after a limited time.
                  </p>
                </div>
              </div>
            </div>

            {/* 3-Step Password Reset Timeline */}
            <div className="pt-6 mt-6 border-t border-[#F2ECE3]">
              <div className="grid grid-cols-3 gap-2 text-center items-start">
                {/* Step 1 */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[#FFF2E8] text-[#FF6E00] flex items-center justify-center mb-1.5 shadow-2xs">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <h5 className="text-[11px] font-bold text-[#1A1816]">1. Enter {method === 'email' ? 'Email' : 'Mobile'}</h5>
                  <p className="text-[9px] text-[#8C847A] mt-0.5 leading-tight">
                    Provide your {method === 'email' ? 'email address' : 'mobile number'}
                  </p>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center relative">
                  <div className="w-8 h-8 rounded-full bg-[#FFF2E8] text-[#FF6E00] flex items-center justify-center mb-1.5 shadow-2xs">
                    <Send className="w-3.5 h-3.5" />
                  </div>
                  <h5 className="text-[11px] font-bold text-[#1A1816]">2. Check Inbox</h5>
                  <p className="text-[9px] text-[#8C847A] mt-0.5 leading-tight">
                    Open the reset link we send
                  </p>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[#FFF2E8] text-[#FF6E00] flex items-center justify-center mb-1.5 shadow-2xs">
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <h5 className="text-[11px] font-bold text-[#1A1816]">3. Set New Password</h5>
                  <p className="text-[9px] text-[#8C847A] mt-0.5 leading-tight">
                    Create a new secure password
                  </p>
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
