'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Star,
  CheckCircle2,
  Clock,
  MoreVertical,
  X,
  FileText,
  UserPlus,
  Trash2,
  Sparkles,
  ArrowUpRight,
  Zap,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import { PhotographerClientDto } from '@snapshoot/shared';
import {
  getStoredClients,
  addClient,
  updateClient,
  deleteClient
} from '../../../../lib/clientService';
import {
  hasEntitlement,
  getStoredSubscription,
  getPlanDetails
} from '../../../../lib/subscriptionService';

export default function PhotographerClientsPage() {
  const [clients, setClients] = useState<PhotographerClientDto[]>([]);
  const [subscription, setSubscription] = useState(getStoredSubscription);
  const [hasCrm, setHasCrm] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'VIP'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<PhotographerClientDto | null>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  // Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'COMPLETED' | 'VIP'>('ACTIVE');
  const [newTotalShoots, setNewTotalShoots] = useState('1');
  const [newTotalSpent, setNewTotalSpent] = useState('5000');
  const [newNotes, setNewNotes] = useState('');

  const refreshClients = () => {
    setClients(getStoredClients());
    setSubscription(getStoredSubscription());
    setHasCrm(hasEntitlement('hasClientCrm'));
  };

  useEffect(() => {
    refreshClients();
    const handleSync = () => refreshClients();
    window.addEventListener('snapshoot:clients-change', handleSync);
    window.addEventListener('snapshoot:subscription-change', handleSync);
    return () => {
      window.removeEventListener('snapshoot:clients-change', handleSync);
      window.removeEventListener('snapshoot:subscription-change', handleSync);
    };
  }, []);

  const plan = getPlanDetails(subscription.tier);

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email ? c.email.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
      (c.phone ? c.phone.includes(searchQuery) : false);
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = clients.reduce((sum, c) => sum + c.totalSpentInr, 0);
  const vipCount = clients.filter((c) => c.status === 'VIP').length;
  const activeCount = clients.filter((c) => c.status === 'ACTIVE').length;

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    addClient({
      photographerId: 'pro-aman',
      name: newName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim() || '+91 90000 00000',
      totalShoots: parseInt(newTotalShoots) || 1,
      totalSpentInr: parseInt(newTotalSpent) || 0,
      lastShootDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      notes: newNotes.trim() || 'Client added from CRM dashboard.',
      status: newStatus,
    });

    setIsAddModalOpen(false);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewNotes('');
    refreshClients();
  };

  const handleSaveNotes = (clientId: string) => {
    updateClient(clientId, { notes: editedNotes });
    if (selectedClient && selectedClient.id === clientId) {
      setSelectedClient({ ...selectedClient, notes: editedNotes });
    }
    setIsEditingNotes(false);
    refreshClients();
  };

  const handleDelete = (clientId: string) => {
    if (confirm('Are you sure you want to remove this client from your CRM directory?')) {
      deleteClient(clientId);
      if (selectedClient?.id === clientId) {
        setSelectedClient(null);
      }
      refreshClients();
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand/10 text-brand">
              SaaS Business Suite
            </span>
            <span className="text-xs text-ink-muted">· Private Tenant Data</span>
          </div>
          <h1 className="text-3xl font-extrabold text-ink-primary tracking-tight mt-1">
            Client CRM & Directory
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Maintain your client relationships, private shoot notes, lifetime value, and repeat booking history.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-card-sm bg-brand text-white font-bold text-sm shadow-md hover:bg-brand-dark transition-all transform active:scale-95 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* SaaS Entitlement Gate Banner if on FREE */}
      {!hasCrm && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-ink-primary">
                Client CRM &amp; Private Directory (PRO Entitlement)
              </h4>
              <p className="text-xs text-ink-secondary">
                You are previewing the CRM on the <span className="font-bold">{plan.name}</span> plan. Upgrade to PRO or STUDIO to save unlimited private client profiles, shoot notes, and custom rates.
              </p>
            </div>
          </div>
          <Link
            href="/photographer/subscription"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-card-sm bg-brand text-white text-xs font-bold shadow-sm hover:bg-brand-dark transition-all shrink-0"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Upgrade to PRO</span>
          </Link>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-card border border-contour-subtle shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Total Clients</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-ink-primary">{clients.length}</span>
            <span className="text-xs font-medium text-emerald-600">Active Directory</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-card border border-contour-subtle shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Active Clients</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-ink-primary">{activeCount}</span>
            <span className="text-xs font-medium text-ink-muted">In ongoing cycle</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-card border border-contour-subtle shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">VIP Clients</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600">{vipCount}</span>
            <span className="text-xs font-medium text-ink-muted">High Lifetime Value</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-card border border-contour-subtle shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Lifetime Revenue</span>
            <div className="p-2 bg-brand/10 text-brand rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-ink-primary">₹{totalRevenue.toLocaleString('en-IN')}</span>
            <span className="text-xs font-medium text-emerald-600">From clients</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-card border border-contour-subtle shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, email, or phone..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-canvas-primary rounded-card-sm border border-contour-subtle focus:outline-none focus:border-brand transition-colors text-ink-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'ACTIVE', 'VIP', 'COMPLETED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors shrink-0 ${
                statusFilter === filter
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-canvas-secondary text-ink-secondary hover:text-ink-primary hover:bg-canvas-primary'
              }`}
            >
              {filter === 'ALL' ? 'All Clients' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Main Clients Grid / List */}
      <div className="bg-white rounded-card border border-contour-subtle shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-contour-subtle bg-canvas-primary/70 text-[11px] font-extrabold uppercase tracking-wider text-ink-muted">
                <th className="py-3.5 px-6">Client</th>
                <th className="py-3.5 px-6">Contact Info</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Shoots</th>
                <th className="py-3.5 px-6">Total Spent</th>
                <th className="py-3.5 px-6">Last Shoot</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-contour-subtle text-sm">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink-muted">
                    <Users className="w-10 h-10 mx-auto text-ink-muted/50 mb-2" />
                    <p className="font-semibold text-ink-secondary">No clients found</p>
                    <p className="text-xs text-ink-muted mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-canvas-secondary/50 transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedClient(client);
                        setEditedNotes(client.notes || '');
                        setIsEditingNotes(false);
                      }}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-black text-sm">
                            {client.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold text-ink-primary group-hover:text-brand transition-colors">
                              {client.name}
                            </p>
                            <p className="text-xs text-ink-muted">Client ID: {client.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-ink-secondary">
                            <Mail className="w-3.5 h-3.5 text-ink-muted" />
                            <span>{client.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-ink-muted">
                            <Phone className="w-3.5 h-3.5 text-ink-muted" />
                            <span>{client.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            client.status === 'VIP'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : client.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                          }`}
                        >
                          {client.status === 'VIP' && <Star className="w-3 h-3 fill-amber-500 text-amber-500" />}
                          {client.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-ink-primary">
                          {client.totalShoots} {client.totalShoots === 1 ? 'shoot' : 'shoots'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-ink-primary">
                          ₹{client.totalSpentInr.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-ink-secondary">
                        {client.lastShootDate || 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setSelectedClient(client);
                              setEditedNotes(client.notes || '');
                              setIsEditingNotes(true);
                            }}
                            title="Edit Private Notes"
                            className="p-1.5 rounded text-ink-muted hover:text-brand hover:bg-brand/10 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(client.id)}
                            title="Delete Client"
                            className="p-1.5 rounded text-ink-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Detail & Notes Drawer / Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-ink-primary/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-card border border-contour-subtle shadow-2xl max-w-lg w-full p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-black text-lg">
                  {selectedClient.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-ink-primary">{selectedClient.name}</h3>
                  <p className="text-xs text-ink-muted">Client ID: {selectedClient.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-1.5 text-ink-muted hover:text-ink-primary rounded-card-sm hover:bg-canvas-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-canvas-primary p-4 rounded-card-sm border border-contour-subtle text-xs">
              <div>
                <span className="text-ink-muted font-medium">Email Address</span>
                <p className="font-bold text-ink-primary truncate mt-0.5">{selectedClient.email}</p>
              </div>
              <div>
                <span className="text-ink-muted font-medium">Phone Number</span>
                <p className="font-bold text-ink-primary mt-0.5">{selectedClient.phone}</p>
              </div>
              <div className="mt-2">
                <span className="text-ink-muted font-medium">Lifetime Spend</span>
                <p className="font-bold text-brand mt-0.5 text-sm">₹{selectedClient.totalSpentInr.toLocaleString('en-IN')}</p>
              </div>
              <div className="mt-2">
                <span className="text-ink-muted font-medium">Completed Bookings</span>
                <p className="font-bold text-ink-primary mt-0.5 text-sm">{selectedClient.totalShoots} Sessions</p>
              </div>
            </div>

            {/* Private Notes Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-brand" />
                  Private Photographer Notes
                </label>
                {!isEditingNotes && (
                  <button
                    onClick={() => {
                      setIsEditingNotes(true);
                      setEditedNotes(selectedClient.notes || '');
                    }}
                    className="text-xs text-brand font-bold hover:underline"
                  >
                    Edit Note
                  </button>
                )}
              </div>

              {isEditingNotes ? (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Enter preferences, past shot styles, retouching requests..."
                    className="w-full text-xs p-3 rounded-card-sm border border-contour-subtle focus:outline-none focus:border-brand bg-white text-ink-primary"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditingNotes(false)}
                      className="px-3 py-1.5 rounded text-xs font-bold text-ink-muted hover:text-ink-primary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveNotes(selectedClient.id)}
                      className="px-3 py-1.5 rounded bg-brand text-white text-xs font-bold hover:bg-brand-dark"
                    >
                      Save Notes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-canvas-secondary p-3 rounded-card-sm text-xs text-ink-secondary border border-contour-subtle italic">
                  {selectedClient.notes || 'No private notes written for this client yet.'}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={`mailto:${selectedClient.email}`}
                className="flex-1 text-center py-2.5 px-3 rounded-card-sm border border-contour-subtle bg-white font-bold text-xs text-ink-primary hover:bg-canvas-secondary transition-colors"
              >
                Send Email
              </a>
              <a
                href={`https://wa.me/${selectedClient.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-center py-2.5 px-3 rounded-card-sm bg-emerald-600 font-bold text-xs text-white hover:bg-emerald-700 transition-colors"
              >
                WhatsApp Client
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Add New Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink-primary/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-card border border-contour-subtle shadow-2xl max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-ink-primary">Add Client to Directory</h3>
                <p className="text-xs text-ink-muted">Add a private client to track shoots and lifetime value.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-ink-muted hover:text-ink-primary rounded-card-sm hover:bg-canvas-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-primary mb-1">Client Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Radhika Sharma"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-card-sm border border-contour-subtle focus:border-brand focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-primary mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="radhika@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-card-sm border border-contour-subtle focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-primary mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-card-sm border border-contour-subtle focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-primary mb-1">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-card-sm border border-contour-subtle focus:border-brand focus:outline-none bg-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="VIP">VIP</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-primary mb-1">Shoots Done</label>
                  <input
                    type="number"
                    min="1"
                    value={newTotalShoots}
                    onChange={(e) => setNewTotalShoots(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-card-sm border border-contour-subtle focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-primary mb-1">Total Spent (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={newTotalSpent}
                    onChange={(e) => setNewTotalSpent(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-card-sm border border-contour-subtle focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-primary mb-1">Client Notes & Preferences</label>
                <textarea
                  rows={3}
                  placeholder="Preferred locations, special lenses, family details, retouching requests..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-card-sm border border-contour-subtle focus:border-brand focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-card-sm text-xs font-bold text-ink-secondary hover:bg-canvas-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-card-sm bg-brand text-white text-xs font-bold hover:bg-brand-dark shadow-sm"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
