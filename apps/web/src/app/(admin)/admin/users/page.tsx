'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Camera,
  ShieldCheck,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { AdministratorPanel } from '../../../../components/admin/AdministratorPanel';
import { useAuth } from '../../../../lib/auth';
import { useServerSession } from '../../../../lib/useServerSession';

interface UserAccount {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  accountStatus: string | null;
  createdAt: string;
  roles: string[];
  isAdministrator: boolean;
  isPhotographer: boolean;
  creatorStatus?: string | null;
}

export default function AdminUsersPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'customers' | 'photographers' | 'roles') || 'customers';
  const session = useServerSession();
  const canManage =
    session.status === 'authenticated' &&
    (session.user.isOwner ||
      session.user.permissions.includes('manage_administrators') ||
      session.user.roles.includes('admin') ||
      session.user.roles.includes('owner'));

  const [activeTab, setActiveTab] = useState<'customers' | 'photographers' | 'roles'>(initialTab);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users?filter=all', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load users (${res.status})`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err?.message || 'Could not load accounts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleAccountStatus = async (user: UserAccount) => {
    const newStatus = user.accountStatus === 'suspended' ? 'active' : 'suspended';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, accountStatus: newStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'Failed to update account status.');
      }
      setActionSuccess(`Account status updated to ${newStatus}.`);
      setTimeout(() => setActionSuccess(null), 4000);
      fetchUsers();
    } catch (err: any) {
      setError(err?.message || 'Status update failed.');
    }
  };

  const customers = users.filter((u) => u.roles.includes('customer') && !u.isPhotographer);
  const photographers = users.filter((u) => u.isPhotographer);

  const filteredCustomers = customers.filter(
    (c) =>
      (c.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone || '').includes(searchQuery)
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">User Management</h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Manage marketplace customers, photographer access, and administrator permissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#14B8A6]' : 'text-[#64748B]'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'customers'
              ? 'bg-[#14B8A6] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customers ({customers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('photographers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'photographers'
              ? 'bg-[#14B8A6] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Photographers ({photographers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'roles'
              ? 'bg-[#14B8A6] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Admins & Permissions</span>
        </button>
      </div>

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search customers by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#14B8A6]"
              />
            </div>
            <span className="text-xs text-[#64748B] font-medium">
              Showing {filteredCustomers.length} verified customer accounts
            </span>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="py-12 text-center text-[#94A3B8] text-xs space-y-1">
              <Users className="w-8 h-8 mx-auto text-[#CBD5E1]" />
              <p className="font-bold text-[#0F172A]">No customers match your search.</p>
              <p className="text-[11px] text-[#64748B]">New customer accounts will appear here automatically upon signup.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#F1F5F9] text-[#94A3B8] text-[11px] font-semibold">
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3">Joined Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredCustomers.map((c) => {
                    const isSuspended = c.accountStatus === 'suspended';
                    const initials = (c.fullName || 'Customer')
                      .split(' ')
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] font-bold text-xs flex items-center justify-center border border-[#BFDBFE]">
                              {initials}
                            </div>
                            <div>
                              <p className="font-bold text-[#0F172A]">{c.fullName || 'Customer'}</p>
                              <span className="text-[10px] text-[#94A3B8] font-mono">ID: {c.id.slice(0, 8)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <p className="text-[#0F172A] font-medium flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-[#94A3B8]" />
                              <span>{c.email}</span>
                            </p>
                            {c.phone && (
                              <p className="text-[#64748B] text-[11px] flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-[#94A3B8]" />
                                <span>{c.phone}</span>
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-[#64748B] whitespace-nowrap">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              isSuspended
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isSuspended ? 'bg-red-500' : 'bg-emerald-500'}`} />
                            <span className="capitalize">{c.accountStatus || 'active'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => toggleAccountStatus(c)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                              isSuspended
                                ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                                : 'border-red-200 text-red-600 hover:bg-red-50'
                            }`}
                          >
                            {isSuspended ? 'Reinstate' : 'Suspend'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Photographers Tab */}
      {activeTab === 'photographers' && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-2xs space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center mx-auto">
            <Camera className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#0F172A]">Photographer Operations & Verification</h3>
            <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1">
              Detailed photographer profiles, document verification queue, service areas, and pricing overrides are managed in the dedicated Photographer Operations Center.
            </p>
          </div>
          <Link
            href="/admin/photographers"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#14B8A6] text-white text-xs font-bold hover:bg-[#0D9488] transition-colors shadow-xs"
          >
            <span>Open Photographer Operations Desk</span>
          </Link>
        </div>
      )}

      {/* Roles & Admin Delegation Tab */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <AdministratorPanel canManage={canManage} />
        </div>
      )}
    </div>
  );
}
