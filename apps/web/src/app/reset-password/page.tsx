'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '../../lib/supabase/client';

/**
 * Completes a Supabase password recovery. The recovery link redirects here with a
 * recovery session in the URL; Supabase's client stores it and this page sets the new password.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !isSupabaseConfigured()) {
      setStatus('invalid');
      return;
    }
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) setStatus(session ? 'ready' : 'invalid');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) setStatus('ready');
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirm) {
      setError('The passwords do not match.');
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError('Authentication service is not configured.');
      return;
    }
    setSaving(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateErr) {
      setError(updateErr.message);
      return;
    }
    // End the recovery session and ask the user to sign in with the new password.
    await supabase.auth.signOut();
    setDone(true);
    setTimeout(() => router.replace('/login'), 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7F9]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#E7EAEE] p-6 sm:p-8 shadow-sm space-y-5">
          <h1 className="text-2xl font-black text-[#191C22]">Set a new password</h1>

          {status === 'checking' && <p className="text-sm text-[#64748B]">Verifying your reset link…</p>}

          {status === 'invalid' && (
            <div className="space-y-4">
              <p className="text-sm text-[#64748B]">
                This password reset link is invalid or has expired. Request a new link to continue.
              </p>
              <Link href="/forgot-password" className="inline-block text-sm font-bold text-[#14B8A6] hover:underline">
                Request a new reset link
              </Link>
            </div>
          )}

          {status === 'ready' && !done && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block space-y-1">
                <span className="text-xs font-bold text-[#64748B]">New password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#E7EAEE] px-4 py-3 text-sm text-[#191C22] focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20 outline-none"
                  required
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-[#64748B]">Confirm new password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-xl border border-[#E7EAEE] px-4 py-3 text-sm text-[#191C22] focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20 outline-none"
                  required
                />
              </label>
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-[#14B8A6] hover:bg-[#0D9488] active:bg-[#0F766E] py-3 text-sm font-black text-[#0D0F12] hover:text-white transition-all disabled:opacity-60 cursor-pointer shadow-md"
              >
                {saving ? 'Saving…' : 'Update password'}
              </button>
            </form>
          )}

          {done && (
            <p className="text-sm font-semibold text-emerald-700">
              Your password has been updated. Redirecting you to sign in…
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
