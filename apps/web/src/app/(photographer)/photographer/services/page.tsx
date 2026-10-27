'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Layers,
  Loader2
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Modal } from '../../../../components/ui/Modal';
import {
  getStoredSubscription,
  getPlanDetails
} from '../../../../lib/subscriptionService';
import { useCurrentUserProfile } from '../../../../context/UserProfileContext';
import Link from 'next/link';

interface ServicePackageItem {
  id: string;
  title: string;
  category: string;
  description: string;
  durationHours: number;
  priceInr: number;
  deliverables: string[];
  additionalHourRateInr?: number;
  isActive: boolean;
}

export default function PhotographerServicesPage() {
  const { authUser, creatorProfile } = useCurrentUserProfile();
  const [services, setServices] = useState<ServicePackageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState(getStoredSubscription);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServicePackageItem | null>(null);
  const [previewService, setPreviewService] = useState<ServicePackageItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const plan = getPlanDetails(subscription.tier);
  const isAtQuota = services.length >= plan.maxServicePackages;

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    title: '',
    category: 'Portrait',
    description: '',
    durationHours: 2,
    priceInr: 4999,
    deliverablesText: '30 Edited High-Res Photos\nOnline Gallery Link\n48-Hour Turnaround',
    additionalHourRateInr: 1500,
    isActive: true,
  });
  const [formError, setFormError] = useState('');

  // Load real services from Supabase
  useEffect(() => {
    let isCancelled = false;

    async function loadServices() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/photographers/services');
        const data = await res.json();
        if (isCancelled) return;

        if (data.services && Array.isArray(data.services)) {
          setServices(
            data.services.map((s: any) => ({
              id: s.id,
              title: s.title,
              category: s.service_categories?.name || 'Portrait',
              description: s.description || '',
              durationHours: Math.max(1, Math.round((s.duration_minutes || 120) / 60)),
              priceInr: Number(s.base_price) || 4999,
              deliverables: ['Digital High-Res Photos', 'Private Client Gallery'],
              additionalHourRateInr: 1500,
              isActive: s.is_active !== false,
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching creator services:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadServices();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleOpenAdd = () => {
    if (isAtQuota) {
      alert(`Package limit reached (${plan.maxServicePackages} packages on ${plan.name} plan). Please upgrade your subscription to create more packages.`);
      return;
    }
    setFormData({
      title: '',
      category: 'Portrait',
      description: '',
      durationHours: 2,
      priceInr: 4999,
      deliverablesText: '30 Edited High-Res Photos\nOnline Gallery Link\n48-Hour Turnaround',
      additionalHourRateInr: 1500,
      isActive: true,
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (srv: ServicePackageItem) => {
    setEditingService(srv);
    setFormData({
      title: srv.title,
      category: srv.category,
      description: srv.description,
      durationHours: srv.durationHours,
      priceInr: srv.priceInr,
      deliverablesText: srv.deliverables.join('\n'),
      additionalHourRateInr: srv.additionalHourRateInr || 1500,
      isActive: srv.isActive,
    });
    setFormError('');
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setFormError('Service package title is required.');
      return false;
    }
    if (formData.priceInr < 500) {
      setFormError('Minimum price per package must be at least ₹500.');
      return false;
    }
    if (formData.durationHours <= 0) {
      setFormError('Duration must be greater than 0 hours.');
      return false;
    }
    return true;
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      const res = await fetch('/api/photographers/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authUser?.id,
          creatorId: creatorProfile?.id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          basePrice: formData.priceInr,
          durationMinutes: formData.durationHours * 60,
          deliveryTimeHours: 48,
          isActive: formData.isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save package.');
      }

      const newPackage: ServicePackageItem = {
        id: data.service.id,
        title: data.service.title,
        category: formData.category,
        description: data.service.description,
        durationHours: formData.durationHours,
        priceInr: Number(data.service.base_price),
        deliverables: formData.deliverablesText.split('\n').filter((d) => d.trim().length > 0),
        additionalHourRateInr: formData.additionalHourRateInr,
        isActive: data.service.is_active !== false,
      };

      setServices([newPackage, ...services]);
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Error saving package');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !editingService) return;

    try {
      setIsSaving(true);
      const res = await fetch('/api/photographers/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingService.id,
          userId: authUser?.id,
          creatorId: creatorProfile?.id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          basePrice: formData.priceInr,
          durationMinutes: formData.durationHours * 60,
          deliveryTimeHours: 48,
          isActive: formData.isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update package.');
      }

      setServices(
        services.map((s) =>
          s.id === editingService.id
            ? {
                ...s,
                title: formData.title,
                category: formData.category,
                description: formData.description,
                durationHours: formData.durationHours,
                priceInr: formData.priceInr,
                deliverables: formData.deliverablesText.split('\n').filter((d) => d.trim().length > 0),
                additionalHourRateInr: formData.additionalHourRateInr,
                isActive: formData.isActive,
              }
            : s
        )
      );
      setEditingService(null);
    } catch (err: any) {
      setFormError(err.message || 'Error updating package');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    const srv = services.find((s) => s.id === id);
    if (!srv) return;

    const newActiveState = !srv.isActive;
    setServices(services.map((s) => (s.id === id ? { ...s, isActive: newActiveState } : s)));

    try {
      await fetch('/api/photographers/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          userId: authUser?.id,
          creatorId: creatorProfile?.id,
          isActive: newActiveState,
        }),
      });
    } catch (err) {
      console.error('Failed to toggle active status:', err);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    try {
      await fetch(`/api/photographers/services?id=${encodeURIComponent(deletingId)}`, {
        method: 'DELETE',
      });
      setServices(services.filter((s) => s.id !== deletingId));
      setDeletingId(null);
    } catch (err) {
      console.error('Failed to delete package:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#14B8A6]/10 text-[#14B8A6]">
              Active Packages: {services.length} / {plan.maxServicePackages} ({plan.name})
            </span>
            {isAtQuota && (
              <Link href="/photographer/subscription" className="text-xs text-[#14B8A6] font-bold hover:underline">
                Upgrade Plan for More →
              </Link>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
            Service Packages &amp; Pricing
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Configure photography packages, turnaround hours, and instant booking rates.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="w-4 h-4" />}
          disabled={isAtQuota}
        >
          Add New Package
        </Button>
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#14B8A6] animate-spin mx-auto" />
          <p className="text-xs text-ink-muted">Loading packages...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-[#E7EAEE] rounded-3xl bg-[#F5F7F9]/50 p-8 space-y-3">
          <Package className="w-12 h-12 text-[#14B8A6] mx-auto opacity-70" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-ink-primary">No photography packages configured yet</h3>
            <p className="text-xs text-ink-secondary max-w-md mx-auto">
              Packages define your pricing, shoot duration, deliverables, and appear on search listings for clients to book.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAdd}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add First Package
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv) => (
            <Card
              key={srv.id}
              className={`p-6 space-y-4 border transition-all ${
                srv.isActive
                  ? 'border-contour-subtle bg-white shadow-sm'
                  : 'border-contour-subtle bg-canvas-secondary/50 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant={srv.isActive ? 'brand' : 'neutral'} size="sm">
                    {srv.category}
                  </Badge>
                  <h3 className="text-base font-bold text-ink-primary mt-2">{srv.title}</h3>
                </div>
                <button
                  onClick={() => handleToggleActive(srv.id)}
                  className="text-ink-muted hover:text-ink-primary p-1"
                  title={srv.isActive ? 'Deactivate Package' : 'Activate Package'}
                >
                  {srv.isActive ? (
                    <ToggleRight className="w-6 h-6 text-[#14B8A6]" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-zinc-400" />
                  )}
                </button>
              </div>

              <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
                {srv.description}
              </p>

              <div className="pt-3 border-t border-contour-subtle flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-ink-primary">₹{srv.priceInr.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-ink-muted"> / {srv.durationHours} hrs</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-contour-subtle">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleOpenEdit(srv)}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingId(srv.id)}
                  className="text-red-600 hover:bg-red-50"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-contour-subtle">
            <h3 className="font-bold text-sm text-ink-primary border-b pb-3">Create New Package</h3>
            {formError && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg font-medium">{formError}</p>}
            <form onSubmit={handleSaveAdd} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-ink-primary mb-1">Package Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Standard Portrait Session"
                  className="w-full p-2.5 text-xs font-medium border rounded-xl outline-none focus:ring-2 focus:ring-[#14B8A6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-ink-primary mb-1">Price (₹ INR) *</label>
                  <input
                    type="number"
                    min={500}
                    step={500}
                    value={formData.priceInr}
                    onChange={(e) => setFormData({ ...formData, priceInr: Number(e.target.value) })}
                    className="w-full p-2.5 text-xs font-medium border rounded-xl outline-none focus:ring-2 focus:ring-[#14B8A6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-ink-primary mb-1">Duration (Hours) *</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={formData.durationHours}
                    onChange={(e) => setFormData({ ...formData, durationHours: Number(e.target.value) })}
                    className="w-full p-2.5 text-xs font-medium border rounded-xl outline-none focus:ring-2 focus:ring-[#14B8A6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-ink-primary mb-1">Description *</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what is covered during this photography session..."
                  className="w-full p-2.5 text-xs font-medium border rounded-xl outline-none focus:ring-2 focus:ring-[#14B8A6]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving Package...' : 'Save Package'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-contour-subtle">
            <h3 className="font-bold text-sm text-ink-primary border-b pb-3">Edit Package</h3>
            {formError && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg font-medium">{formError}</p>}
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-ink-primary mb-1">Package Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 text-xs font-medium border rounded-xl outline-none focus:ring-2 focus:ring-[#14B8A6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-ink-primary mb-1">Price (₹ INR) *</label>
                  <input
                    type="number"
                    min={500}
                    step={500}
                    value={formData.priceInr}
                    onChange={(e) => setFormData({ ...formData, priceInr: Number(e.target.value) })}
                    className="w-full p-2.5 text-xs font-medium border rounded-xl outline-none focus:ring-2 focus:ring-[#14B8A6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-ink-primary mb-1">Duration (Hours) *</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={formData.durationHours}
                    onChange={(e) => setFormData({ ...formData, durationHours: Number(e.target.value) })}
                    className="w-full p-2.5 text-xs font-medium border rounded-xl outline-none focus:ring-2 focus:ring-[#14B8A6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-ink-primary mb-1">Description *</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 text-xs font-medium border rounded-xl outline-none focus:ring-2 focus:ring-[#14B8A6]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button variant="secondary" size="sm" type="button" onClick={() => setEditingService(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSaving}>
                  {isSaving ? 'Updating...' : 'Update Package'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-ink-primary">Delete Package</h3>
            <p className="text-xs text-ink-secondary">
              Are you sure you want to delete this photography package? Clients will no longer be able to select it for bookings.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="secondary" size="sm" onClick={() => setDeletingId(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>
                Delete Package
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
