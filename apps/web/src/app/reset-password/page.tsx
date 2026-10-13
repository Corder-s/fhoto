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
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#E8E1D6] p-6 sm:p-8 shadow-sm space-y-5">
          <h1 className="text-2xl font-black text-[#1A1816]">Set a new password</h1>

          {status === 'checking' && <p className="text-sm text-[#5A544D]">Verifying your reset link…</p>}

          {status === 'invalid' && (
            <div className="space-y-4">
              <p className="text-sm text-[#5A544D]">
                This password reset link is invalid or has expired. Request a new link to continue.
              </p>
              <Link href="/forgot-password" className="inline-block text-sm font-bold text-[#FF6E00]">
                Request a new reset link
              </Link>
            </div>
          )}

          {status === 'ready' && !done && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block space-y-1">
                <span className="text-xs font-bold text-[#5A544D]">New password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#E8E1D6] px-4 py-3 text-sm"
                  required
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-[#5A544D]">Confirm new password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-xl border border-[#E8E1D6] px-4 py-3 text-sm"
                  required
                />
              </label>
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-[#FF6E00] py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Update password'}
              </button>
            </form>
          )}

          {done && (
            <p className="text-sm font-semibold text-green-700">
              Your password has been updated. Redirecting you to sign in…
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
