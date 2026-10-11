'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Camera,
  X,
  Phone,
  Mail,
  Lock,
  User,
  MapPin,
  ChevronDown,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Heart,
} from 'lucide-react';
import { saveAuthSession, AuthUser } from '../../lib/auth';
import { sanitizeRedirectUrl } from '../../lib/safeRedirect';

export interface SnapShootAuthViewProps {
  isModal?: boolean;
  onClose?: () => void;
  initialTab?: 'login' | 'register';
  rolePreference?: 'customer' | 'creator';
  returnUrl?: string;
  message?: string;
}

export const SnapShootAuthView: React.FC<SnapShootAuthViewProps> = ({
  isModal = false,
  onClose,
  initialTab = 'register',
  rolePreference = 'customer',
  returnUrl,
  message,
}) => {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);

  // Registration State
  const [regRole, setRegRole] = useState<'customer' | 'creator'>(rolePreference);
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [city, setCity] = useState('Greater Noida');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Login State
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState(['', '', '', '', '', '']);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);

  // Status & Notifications
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [socialNotice, setSocialNotice] = useState<string | null>(null);

  const rightScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTab(initialTab);
    if (rolePreference) setRegRole(rolePreference);
  }, [initialTab, rolePreference]);

  // Resend Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOtpSent && resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOtpSent, resendCountdown]);

  const resolvedReturnUrl = sanitizeRedirectUrl(returnUrl, '/explore');

  // Successful Auth Handler
  const handleAuthSuccess = (user: AuthUser, destinationUrl: string) => {
    saveAuthSession(user);
    setSuccessMessage(`Welcome back, ${user.name}! Redirecting you...`);

    setTimeout(() => {
      if (onClose) onClose();
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
      if (role === 'creator') {
        const creatorUser: AuthUser = {
          id: 'creator-demo-1',
          name: 'Rajat Kapoor',
          email: 'rajat.kapoor@snapshoot.local',
          phone: '+91 98765 43210',
          role: 'creator',
        };
        handleAuthSuccess(creatorUser, '/photographer/dashboard');
      } else {
        const customerUser: AuthUser = {
          id: 'cust-demo-1',
          name: 'Aman Sharma',
          email: 'aman.sharma@snapshoot.local',
          phone: '+91 98112 34567',
          role: 'customer',
        };
        handleAuthSuccess(customerUser, resolvedReturnUrl);
      }
    }, 600);
  };

  // OTP input handler
  const handleOtpBoxChange = (index: number, val: string) => {
    const char = val.slice(-1);
    const updated = [...loginOtp];
    updated[index] = char;
    setLoginOtp(updated);

    if (char && index < 5) {
      const nextInput = document.getElementById(`auth-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Submit Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSocialNotice(null);

    if (loginMethod === 'phone') {
      if (!isOtpSent) {
        const cleanPhone = loginPhone.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
          setErrorMessage('Please enter a valid 10-digit mobile number.');
          return;
        }
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
          setIsOtpSent(true);
          setResendCountdown(60);
        }, 500);
      } else {
        const code = loginOtp.join('');
        if (code.length < 6) {
          setErrorMessage('Please enter the complete 6-digit OTP.');
          return;
        }
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
          if (code === '123456') {
            const user: AuthUser = {
              id: 'cust-otp-1',
              name: 'Aman Sharma',
              email: 'aman@snapshoot.local',
              phone: `+91 ${loginPhone.trim()}`,
              role: 'customer',
            };
            handleAuthSuccess(user, resolvedReturnUrl);
          } else {
            setErrorMessage('Invalid verification code entered. (Test OTP code is 123456)');
          }
        }, 600);
      }
    } else {
      if (!loginEmail.includes('@') || !loginEmail.includes('.')) {
        setErrorMessage('Please provide a valid email address.');
        return;
      }
      if (loginPassword.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }

      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        const isCreator =
          loginEmail.toLowerCase().includes('creator') ||
          loginEmail.toLowerCase().includes('photographer');
        const user: AuthUser = {
          id: isCreator ? 'creator-email-1' : 'cust-email-1',
          name: isCreator ? 'Rajat Kapoor' : loginEmail.split('@')[0],
          email: loginEmail.trim(),
          role: isCreator ? 'creator' : 'customer',
        };
        handleAuthSuccess(user, isCreator ? '/photographer/dashboard' : resolvedReturnUrl);
      }, 600);
    }
  };

  // Submit Create Account
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSocialNotice(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full legal name.');
      return;
    }
    const cleanPhone = mobileNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!city.trim()) {
      setErrorMessage('Please select or specify your primary city or hub.');
      return;
    }
    if (!regEmail.includes('@') || !regEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Please create a password of at least 6 characters.');
      return;
    }
    if (!agreedToTerms) {
      setErrorMessage('You must agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const newUser: AuthUser = {
        id: `${regRole}-${Date.now()}`,
        name: fullName.trim(),
        email: regEmail.trim(),
        phone: `+91 ${cleanPhone}`,
        role: regRole,
      };

      if (regRole === 'creator') {
        saveAuthSession(newUser);
        setSuccessMessage('Creator profile created! Taking you to onboarding studio...');
        setTimeout(() => {
          if (onClose) onClose();
          router.push('/photographer/onboarding');
        }, 800);
      } else {
        handleAuthSuccess(newUser, resolvedReturnUrl);
      }
    }, 700);
  };

  // Social Login Notice Handler
  const handleSocialClick = (provider: 'google' | 'apple') => {
    setSocialNotice(
      `${provider === 'google' ? 'Google' : 'Apple'} Sign-In is configured for production domains. For instant local access, please continue with Email or Phone OTP.`
    );
  };

  return (
    <div className="relative w-full max-w-5xl my-auto bg-[#FAF7F2] rounded-[28px] sm:rounded-[34px] border border-[#E8E2D8] shadow-[0_25px_60px_-15px_rgba(26,24,22,0.35)] z-10 text-left flex flex-col lg:flex-row overflow-hidden p-2 sm:p-2.5 max-h-[calc(100vh-2rem)] max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)]">
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
            Capture
            <br />
            What
            <br />
            Matters
            <br />
            Most
            <br />
            <span className="text-xl">♡</span>
          </div>
        </div>

        {/* Layer 2: Main Headline & Feature Rows */}
        <div className="relative z-10 my-auto py-4 space-y-5 max-w-sm">
          {/* Main Headline */}
          <h1 className="text-3xl sm:text-[34px] font-black text-[#1A1816] tracking-tight leading-[1.15]">
            Find the
            <br />
            perfect photographer
            <br />
            for{' '}
            <span className="font-script text-[#FF6E00] text-4xl sm:text-[42px] font-bold italic tracking-normal inline-block ml-1">
              every moment
            </span>
          </h1>

          {/* 4 Feature Rows */}
          <div className="space-y-3 pt-1">
            {/* Feature 1 */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FFEAD9] border border-[#FFD2B3] flex items-center justify-center text-[#FF6E00] shrink-0 shadow-2xs">
                <Camera className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1A1816] leading-tight">
                  Verified & Talented Photographers
                </h4>
                <p className="text-[11px] text-[#736B63] leading-tight">Real creators, real work</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FFEAD9] border border-[#FFD2B3] flex items-center justify-center text-[#FF6E00] shrink-0 shadow-2xs">
                <Calendar className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1A1816] leading-tight">Easy Booking</h4>
                <p className="text-[11px] text-[#736B63] leading-tight">
                  Plan your shoot in minutes
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FFEAD9] border border-[#FFD2B3] flex items-center justify-center text-[#FF6E00] shrink-0 shadow-2xs">
                <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1A1816] leading-tight">Secure Payments</h4>
                <p className="text-[11px] text-[#736B63] leading-tight">
                  Safe and reliable transactions
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FFEAD9] border border-[#FFD2B3] flex items-center justify-center text-[#FF6E00] shrink-0 shadow-2xs">
                <Heart className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1A1816] leading-tight">
                  Memories for a Lifetime
                </h4>
                <p className="text-[11px] text-[#736B63] leading-tight">
                  From portraits to special events
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Layer 3: Photography Collage & Social Proof */}
        <div className="relative z-10 pt-2 space-y-4">
          {/* Overlapping Polaroid Collage Cards */}
          <div className="flex items-end gap-2 relative">
            {/* Card 1: Couple / Wedding */}
            <div className="relative -rotate-4 transition-transform hover:rotate-0 hover:z-20 duration-200">
              <div className="p-1.5 pb-2.5 bg-white rounded-xl shadow-md border border-[#E8E2D8]">
                <img
                  src="/reference-assets/auth_polaroid_couple.jpg"
                  alt="Couple Photography"
                  className="w-19 h-19 sm:w-21 sm:h-21 object-cover rounded-lg"
                />
              </div>
            </div>

            {/* Card 2: Child Laughing */}
            <div className="relative rotate-2 -ml-3 transition-transform hover:rotate-0 hover:z-20 duration-200">
              <div className="p-1.5 pb-2.5 bg-white rounded-xl shadow-md border border-[#E8E2D8]">
                <img
                  src="/reference-assets/auth_polaroid_child.jpg"
                  alt="Kids and Family Photography"
                  className="w-19 h-19 sm:w-21 sm:h-21 object-cover rounded-lg"
                />
              </div>
            </div>

            {/* Card 3: Indian Portrait */}
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
              Join thousands of happy customers discovering amazing photographers.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT PANEL: AUTHENTICATION FORM CONTAINER                */}
      {/* ========================================================= */}
      <div
        ref={rightScrollRef}
        className="w-full lg:w-[48%] min-w-0 bg-white rounded-[20px] sm:rounded-[26px] p-5 sm:p-7 md:p-8 flex flex-col justify-between overflow-y-auto overscroll-contain shadow-xs [scrollbar-width:thin] [scrollbar-color:#E0D8CB_transparent]"
      >
        {/* Header Row: Title & Close Button */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2
                id="auth-modal-title"
                className="text-2xl sm:text-[28px] font-black text-[#1A1816] tracking-tight leading-tight"
              >
                Welcome to SnapShoot
              </h2>
              <p className="text-xs sm:text-[13px] text-[#736B63] mt-1 leading-normal">
                {message ||
                  (tab === 'register'
                    ? 'Join SnapShoot to discover and book the perfect photographer.'
                    : 'Log in to manage shoots, message creators, and view your galleries.')}
              </p>
            </div>

            {/* Close Button (if modal or onClose provided) */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close authentication window"
                className="p-1.5 rounded-full text-[#8C847A] hover:text-[#1A1816] hover:bg-[#F2ECE3] transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Tab Switcher: Log In vs Create Account */}
          <div className="grid grid-cols-2 p-1 bg-[#F2ECE3] rounded-full mb-4">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMessage('');
                setSocialNotice(null);
                if (rightScrollRef.current) rightScrollRef.current.scrollTop = 0;
              }}
              className={`py-2 px-4 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                tab === 'login'
                  ? 'bg-white text-[#FF6E00] shadow-xs'
                  : 'text-[#736B63] hover:text-[#1A1816]'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setErrorMessage('');
                setSocialNotice(null);
                if (rightScrollRef.current) rightScrollRef.current.scrollTop = 0;
              }}
              className={`py-2 px-4 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                tab === 'register'
                  ? 'bg-white text-[#FF6E00] shadow-xs'
                  : 'text-[#736B63] hover:text-[#1A1816]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error / Feedback Banners */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}
          {socialNotice && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{socialNotice}</span>
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: CREATE ACCOUNT VIEW                                  */}
          {/* ========================================================= */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Account Type Selection */}
              <div>
                <span className="block text-xs font-bold text-[#1A1816] mb-1.5">
                  I want to join as:
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Customer Role Card */}
                  <button
                    type="button"
                    onClick={() => setRegRole('customer')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      regRole === 'customer'
                        ? 'border-2 border-[#FF6E00] bg-[#FFF8F2] shadow-xs'
                        : 'border-[#E8E2D8] bg-white hover:border-[#D5CDBD]'
                    }`}
                  >
                    <User className="w-4 h-4 text-[#FF6E00]" />
                    <span className="text-xs font-bold text-[#1A1816]">Customer</span>
                    <span className="text-[10px] text-[#736B63] leading-tight">
                      Book verified creators
                    </span>
                  </button>

                  {/* Photographer Role Card */}
                  <button
                    type="button"
                    onClick={() => setRegRole('creator')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      regRole === 'creator'
                        ? 'border-2 border-[#FF6E00] bg-[#FFF8F2] shadow-xs'
                        : 'border-[#E8E2D8] bg-white hover:border-[#D5CDBD]'
                    }`}
                  >
                    <Camera className="w-4 h-4 text-[#FF6E00]" />
                    <span className="text-xs font-bold text-[#1A1816]">Photographer</span>
                    <span className="text-[10px] text-[#736B63] leading-tight">
                      Get bookings & payouts
                    </span>
                  </button>
                </div>
              </div>

              {/* Field 1: Full Name */}
              <div>
                <label className="block text-xs font-bold text-[#1A1816] mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C847A]" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aman Sharma"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D8] text-xs sm:text-sm text-[#1A1816] placeholder:text-[#8C847A] focus:border-[#FF6E00] focus:ring-2 focus:ring-[#FF6E00]/20 outline-none font-medium"
                  />
                </div>
              </div>

              {/* Field 2 & 3: Mobile Number & City / Hub (2 Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#1A1816] mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C847A]" />
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="98112 34567"
                      maxLength={10}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-[#E8E2D8] text-xs sm:text-sm text-[#1A1816] placeholder:text-[#8C847A] focus:border-[#FF6E00] focus:ring-2 focus:ring-[#FF6E00]/20 outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1816] mb-1">City / Hub</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C847A]" />
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white border border-[#E8E2D8] text-xs sm:text-sm text-[#1A1816] focus:border-[#FF6E00] focus:ring-2 focus:ring-[#FF6E00]/20 outline-none font-medium appearance-none cursor-pointer"
                    >
                      <option value="Greater Noida">Greater Noida</option>
                      <option value="Delhi NCR">Delhi NCR</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Bengaluru">Bengaluru</option>
                      <option value="Jaipur">Jaipur</option>
                      <option value="Goa">Goa</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C847A] pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Field 4: Email Address */}
              <div>
                <label className="block text-xs font-bold text-[#1A1816] mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C847A]" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D8] text-xs sm:text-sm text-[#1A1816] placeholder:text-[#8C847A] focus:border-[#FF6E00] focus:ring-2 focus:ring-[#FF6E00]/20 outline-none font-medium"
                  />
                </div>
              </div>

              {/* Field 5: Password */}
              <div>
                <label className="block text-xs font-bold text-[#1A1816] mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C847A]" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white border border-[#E8E2D8] text-xs sm:text-sm text-[#1A1816] placeholder:text-[#8C847A] focus:border-[#FF6E00] focus:ring-2 focus:ring-[#FF6E00]/20 outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C847A] hover:text-[#1A1816] cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Terms and Privacy Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#FF6E00] focus:ring-[#FF6E00] border-[#E8E2D8] cursor-pointer accent-[#FF6E00]"
                />
                <span className="text-[11px] text-[#736B63] leading-tight">
                  I agree to the SnapShoot{' '}
                  <Link
                    href="/terms"
                    onClick={onClose}
                    className="underline text-[#FF6E00] hover:text-[#E86300]"
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/privacy"
                    onClick={onClose}
                    className="underline text-[#FF6E00] hover:text-[#E86300]"
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#FF6E00] hover:bg-[#E86300] active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Creating Account...' : 'Create Account & Continue'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* TAB: LOG IN VIEW                                          */}
          {/* ========================================================= */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              {loginMethod === 'email' ? (
                <>
                  {/* Login Field: Email */}
                  <div>
                    <label className="block text-xs font-bold text-[#1A1816] mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C847A]" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D8] text-xs sm:text-sm text-[#1A1816] placeholder:text-[#8C847A] focus:border-[#FF6E00] focus:ring-2 focus:ring-[#FF6E00]/20 outline-none font-medium"
                      />
                    </div>
                  </div>

                  {/* Login Field: Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-[#1A1816]">Password</label>
                      <Link
                        href="/forgot-password"
                        onClick={onClose}
                        className="text-[11px] font-bold text-[#FF6E00] hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C847A]" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white border border-[#E8E2D8] text-xs sm:text-sm text-[#1A1816] placeholder:text-[#8C847A] focus:border-[#FF6E00] focus:ring-2 focus:ring-[#FF6E00]/20 outline-none font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C847A] hover:text-[#1A1816] cursor-pointer"
                      >
                        {showLoginPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Phone OTP Login */}
                  <div>
                    <label className="block text-xs font-bold text-[#1A1816] mb-1">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C847A]" />
                      <input
                        type="tel"
                        disabled={isOtpSent}
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        placeholder="98112 34567"
                        maxLength={10}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D8] text-xs sm:text-sm text-[#1A1816] placeholder:text-[#8C847A] focus:border-[#FF6E00] focus:ring-2 focus:ring-[#FF6E00]/20 outline-none font-medium disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  {isOtpSent && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-[#1A1816]">
                          6-Digit Verification Code
                        </label>
                        <span className="text-[11px] text-[#736B63]">Test OTP: 123456</span>
                      </div>
                      <div className="flex items-center justify-between gap-1.5">
                        {loginOtp.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`auth-otp-${idx}`}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                            className="w-10 h-11 text-center font-bold text-base rounded-xl border border-[#E8E2D8] focus:border-[#FF6E00] focus:ring-2 focus:ring-[#FF6E00]/20 outline-none"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Quick Demo Accounts */}
              <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#736B63] block">
                  Instant Demo Accounts:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('customer')}
                    className="py-1.5 px-2 rounded-lg bg-white border border-[#E8E2D8] hover:border-[#FF6E00] text-[11px] font-bold text-[#1A1816] transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <User className="w-3 h-3 text-[#FF6E00]" />
                    <span>Customer (Aman)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('creator')}
                    className="py-1.5 px-2 rounded-lg bg-white border border-[#E8E2D8] hover:border-[#FF6E00] text-[11px] font-bold text-[#1A1816] transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Camera className="w-3 h-3 text-[#FF6E00]" />
                    <span>Creator (Rajat)</span>
                  </button>
                </div>
              </div>

              {/* Submit Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#FF6E00] hover:bg-[#E86300] active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading
                  ? 'Signing In...'
                  : loginMethod === 'phone' && !isOtpSent
                  ? 'Send 6-Digit OTP'
                  : 'Log In & Continue'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Divider: or continue with */}
          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E8E2D8]" />
            </div>
            <span className="relative px-3 bg-white text-[11px] font-medium text-[#8C847A]">
              or continue with
            </span>
          </div>

          {/* Social Authentication Row */}
          <div className="grid grid-cols-3 gap-2">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleSocialClick('google')}
              className="py-2.5 px-2 rounded-xl border border-[#E8E2D8] hover:border-[#D5CDBD] hover:bg-[#FAF7F2] text-xs font-bold text-[#1A1816] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </button>

            {/* Apple */}
            <button
              type="button"
              onClick={() => handleSocialClick('apple')}
              className="py-2.5 px-2 rounded-xl border border-[#E8E2D8] hover:border-[#D5CDBD] hover:bg-[#FAF7F2] text-xs font-bold text-[#1A1816] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.32-6.53-9.98-11.66-21.2-15.38-33.68-3.72-12.47-5.58-24.16-5.58-35.08 0-14.53 3.51-26.68 10.53-36.46 7.02-9.78 16.14-14.81 27.35-15.08 4.7 0 9.94 1.25 15.73 3.76 5.79 2.5 9.77 3.82 11.96 3.94 1.79-.24 5.92-1.63 12.38-4.17 6.46-2.54 11.89-3.69 16.29-3.46 12.18.67 22.08 5.14 29.7 13.41-10.74 6.53-15.99 15.53-15.76 27 .36 9.07 3.83 16.71 10.42 22.92 6.58 6.21 14.57 9.87 23.96 10.98-2.12 6.53-4.7 13.06-7.75 19.59zM119.22 31.84c0-7.39 2.68-14.39 8.04-20.98 5.36-6.59 12-10.86 19.92-12.82.95 8.16-1.52 15.65-7.41 22.48-5.89 6.83-12.75 11.05-20.55 11.32z" />
              </svg>
              <span>Apple</span>
            </button>

            {/* Phone OTP */}
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setLoginMethod('phone');
                setSocialNotice(null);
              }}
              className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === 'login' && loginMethod === 'phone'
                  ? 'border-[#FF6E00] bg-[#FFF8F2] text-[#FF6E00]'
                  : 'border-[#E8E2D8] hover:border-[#D5CDBD] hover:bg-[#FAF7F2] text-[#1A1816]'
              }`}
            >
              <Phone className="w-3.5 h-3.5 text-[#FF6E00]" />
              <span>Phone OTP</span>
            </button>
          </div>
        </div>

        {/* Footer Navigation Link */}
        <div className="pt-4 mt-3 border-t border-[#E8E2D8] text-center">
          {tab === 'register' ? (
            <p className="text-xs text-[#736B63]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMessage('');
                  setSocialNotice(null);
                  if (rightScrollRef.current) rightScrollRef.current.scrollTop = 0;
                }}
                className="font-bold text-[#FF6E00] hover:underline cursor-pointer ml-1"
              >
                Log In
              </button>
            </p>
          ) : (
            <p className="text-xs text-[#736B63]">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setErrorMessage('');
                  setSocialNotice(null);
                  if (rightScrollRef.current) rightScrollRef.current.scrollTop = 0;
                }}
                className="font-bold text-[#FF6E00] hover:underline cursor-pointer ml-1"
              >
                Create Account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
