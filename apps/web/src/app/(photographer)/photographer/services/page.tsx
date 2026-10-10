'use client';

import React, { useState } from 'react';
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
  Layers
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Modal } from '../../../../components/ui/Modal';
import { DemoNoticeBanner } from '../../../../components/photographer/DemoNoticeBanner';
import {
  INITIAL_SERVICES,
  PhotographerServicePackage
} from '../../../../data/photographerDashboardData';
import {
  getStoredSubscription,
  getPlanDetails
} from '../../../../lib/subscriptionService';
import Link from 'next/link';

export default function PhotographerServicesPage() {
  const [services, setServices] = useState<PhotographerServicePackage[]>(INITIAL_SERVICES);
  const [subscription, setSubscription] = useState(getStoredSubscription);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<PhotographerServicePackage | null>(null);
  const [previewService, setPreviewService] = useState<PhotographerServicePackage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const plan = getPlanDetails(subscription.tier);
  const isAtQuota = services.length >= plan.maxServicePackages;

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    title: '',
    category: 'Portrait' as PhotographerServicePackage['category'],
    description: '',
    durationHours: 2,
    priceInr: 4000,
    deliverablesText: '30 Edited High-Res Photos\nOnline Gallery Link\n24-Hour Turnaround',
    additionalHourRateInr: 1500,
    isActive: true,
  });
  const [formError, setFormError] = useState('');

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
      priceInr: 4000,
      deliverablesText: '30 Edited High-Res Photos\nOnline Gallery Link\n24-Hour Turnaround',
      additionalHourRateInr: 1500,
      isActive: true,
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (srv: PhotographerServicePackage) => {
    setEditingService(srv);
    setFormData({
      title: srv.title,
      category: srv.category,
      description: srv.description,
      durationHours: srv.durationHours,
      priceInr: srv.priceInr,
      deliverablesText: srv.deliverables.join('\n'),
      additionalHourRateInr: srv.additionalHourRateInr,
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

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const newPackage: PhotographerServicePackage = {
      id: `srv-${Date.now()}`,
      title: formData.title,
      category: formData.category,
      description: formData.description,
      durationHours: formData.durationHours,
      priceInr: formData.priceInr,
      deliverables: formData.deliverablesText.split('\n').filter((d) => d.trim().length > 0),
      additionalHourRateInr: formData.additionalHourRateInr,
      isActive: formData.isActive,
    };

    setServices([newPackage, ...services]);
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !editingService) return;

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
  };

  const handleToggleActive = (id: string) => {
    setServices(
      services.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const confirmDelete = () => {
    if (deletingId) {
      setServices(services.filter((s) => s.id !== deletingId));
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <DemoNoticeBanner moduleName="Service Package & Pricing Manager" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand/10 text-brand">
              Tier Quota: {services.length} / {plan.maxServicePackages} Active Packages ({plan.name})
            </span>
            {isAtQuota && (
              <Link href="/photographer/subscription" className="text-xs text-brand font-bold hover:underline">
                Upgrade Plan for More →
              </Link>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
            Service Packages & Rate Card
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Configure hourly rates, package tiers, and deliverables presented on client booking forms.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create New Package
        </Button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {services.map((srv) => (
          <Card
            key={srv.id}
            className={`p-6 flex flex-col justify-between transition-all ${
              srv.isActive ? 'bg-white' : 'bg-canvas-secondary/50 opacity-75 border-dashed'
            }`}
          >
            <div className="space-y-4">
              {/* Category, Status & Price Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant={srv.isActive ? 'brand' : 'neutral'} size="sm">
                    {srv.category}
                  </Badge>
                  <h3 className="text-lg font-extrabold text-ink-primary mt-1">
                    {srv.title}
                  </h3>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xl font-extrabold text-ink-primary">
                    ₹{srv.priceInr.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-ink-muted">Net 80%: ₹{(srv.priceInr * 0.8).toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-ink-secondary leading-relaxed">
                {srv.description}
              </p>

              {/* Duration & Extra Hour */}
              <div className="flex items-center gap-4 text-xs font-semibold text-ink-primary bg-canvas-primary p-3 rounded-card-sm border border-contour-subtle">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand" />
                  <span>{srv.durationHours} Hours Session</span>
                </span>
                <span>•</span>
                <span>
                  +₹{srv.additionalHourRateInr.toLocaleString('en-IN')}/extra hour
                </span>
              </div>

              {/* Deliverables List */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink-muted">
                  Package Deliverables:
                </p>
                <ul className="text-xs text-ink-secondary space-y-1">
                  {srv.deliverables.map((deliv, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                      <span>{deliv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-5 mt-4 border-t border-contour-subtle">
              {/* Active Toggle */}
              <button
                onClick={() => handleToggleActive(srv.id)}
                className={`flex items-center gap-2 text-xs font-bold transition-colors ${
                  srv.isActive ? 'text-green-700' : 'text-ink-muted'
                }`}
              >
                {srv.isActive ? (
                  <ToggleRight className="w-5 h-5 text-green-600" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-ink-muted" />
                )}
                <span>{srv.isActive ? 'Active on Profile' : 'Paused / Hidden'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewService(srv)}
                  className="p-1.5 text-ink-muted hover:text-ink-primary rounded hover:bg-canvas-secondary"
                  title="Preview Client Card"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenEdit(srv)}
                  className="p-1.5 text-ink-muted hover:text-ink-primary rounded hover:bg-canvas-secondary"
                  title="Edit Package"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeletingId(srv.id)}
                  className="p-1.5 text-red-500 hover:text-red-700 rounded hover:bg-red-50"
                  title="Delete Package"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ADD / EDIT MODAL */}
      {(isAddModalOpen || editingService) && (
        <Modal
          isOpen={isAddModalOpen || !!editingService}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingService(null);
          }}
          title={editingService ? 'Edit Service Package' : 'Create New Service Package'}
          description="Adjust pricing, shooting duration, and deliverables for this photography service."
          maxWidth="lg"
        >
          <form
            onSubmit={editingService ? handleSaveEdit : handleSaveAdd}
            className="space-y-4"
          >
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-card-sm text-xs font-semibold text-red-700">
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Package Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. 2-Hour Street Portrait Special"
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-ink-primary">Photography Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as PhotographerServicePackage['category'],
                    })
                  }
                  className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
                >
                  <option value="Portrait">Portrait</option>
                  <option value="Reels & Creator">Reels & Creator</option>
                  <option value="Couple">Couple</option>
                  <option value="Events">Events</option>
                  <option value="Product & Culinary">Product & Culinary</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-ink-primary">Package Price (INR ₹) *</label>
                <input
                  type="number"
                  required
                  min={500}
                  step={100}
                  value={formData.priceInr}
                  onChange={(e) => setFormData({ ...formData, priceInr: Number(e.target.value) })}
                  className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-ink-primary">Duration (Hours) *</label>
                <input
                  type="number"
                  required
                  min={0.5}
                  step={0.5}
                  value={formData.durationHours}
                  onChange={(e) => setFormData({ ...formData, durationHours: Number(e.target.value) })}
                  className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-ink-primary">Additional Hour Rate (₹)</label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={formData.additionalHourRateInr}
                  onChange={(e) => setFormData({ ...formData, additionalHourRateInr: Number(e.target.value) })}
                  className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Description</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Explain what style, lighting, and mood are included in this shoot..."
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Deliverables (One per line)</label>
              <textarea
                rows={3}
                value={formData.deliverablesText}
                onChange={(e) => setFormData({ ...formData, deliverablesText: e.target.value })}
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium font-mono focus:ring-2 focus:ring-brand outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-contour-subtle">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingService(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                {editingService ? 'Save Package Updates' : 'Publish Package'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* PREVIEW MODAL */}
      {previewService && (
        <Modal
          isOpen={!!previewService}
          onClose={() => setPreviewService(null)}
          title="Client Preview: How it looks to Bookers"
          description="Rendered exactly as seen in the SnapShoot booking modal."
          maxWidth="md"
        >
          <div className="p-5 bg-canvas-primary rounded-card-md border border-contour-subtle space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="brand" size="sm">{previewService.category}</Badge>
              <span className="text-lg font-black text-ink-primary">₹{previewService.priceInr.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <h4 className="text-base font-bold text-ink-primary">{previewService.title}</h4>
              <p className="text-xs text-ink-secondary mt-1">{previewService.description}</p>
            </div>
            <div className="space-y-1 text-xs text-ink-secondary">
              <p className="font-bold text-ink-primary">Deliverables Included:</p>
              {previewService.deliverables.map((d, i) => (
                <p key={i} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  <span>{d}</span>
                </p>
              ))}
            </div>
            <Button
              variant="primary"
              className="w-full"
              size="sm"
              onClick={() => setPreviewService(null)}
            >
              Close Client Preview
            </Button>
          </div>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <Modal
          isOpen={!!deletingId}
          onClose={() => setDeletingId(null)}
          title="Delete Service Package?"
          description="Are you sure you want to remove this service? Existing active bookings will not be affected."
          maxWidth="sm"
        >
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setDeletingId(null)}>
              Keep Package
            </Button>
            <Button variant="danger" size="sm" onClick={confirmDelete}>
              Yes, Delete
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
