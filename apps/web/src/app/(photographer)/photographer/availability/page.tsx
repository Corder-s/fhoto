'use client';

import React, { useState } from 'react';
import {
  Clock,
  Radio,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  RotateCcw,
  Globe,
  ShieldAlert,
  Info
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { DemoNoticeBanner } from '../../../../components/photographer/DemoNoticeBanner';
import { INITIAL_AVAILABILITY } from '../../../../data/photographerDashboardData';

export default function PhotographerAvailabilityPage() {
  const [isOnlineRadar, setIsOnlineRadar] = useState(INITIAL_AVAILABILITY.isOnlineRadar);
  const [weeklySlots, setWeeklySlots] = useState(INITIAL_AVAILABILITY.weeklySlots);
  const [blackoutDates, setBlackoutDates] = useState(INITIAL_AVAILABILITY.blackoutDates);
  const [newBlackoutDate, setNewBlackoutDate] = useState('');
  const [bufferHours, setBufferHours] = useState(INITIAL_AVAILABILITY.bufferHoursBetweenShoots);
  const [maxBookings, setMaxBookings] = useState(INITIAL_AVAILABILITY.maxBookingsPerDay);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  const toggleDay = (index: number) => {
    const updated = [...weeklySlots];
    updated[index].enabled = !updated[index].enabled;
    setWeeklySlots(updated);
  };

  const updateTime = (index: number, field: 'start' | 'end', val: string) => {
    const updated = [...weeklySlots];
    updated[index][field] = val;
    setWeeklySlots(updated);
  };

  const handleAddBlackout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlackoutDate) return;
    if (blackoutDates.includes(newBlackoutDate)) return;
    setBlackoutDates([...blackoutDates, newBlackoutDate].sort());
    setNewBlackoutDate('');
  };

  const handleRemoveBlackout = (dateStr: string) => {
    setBlackoutDates(blackoutDates.filter((d) => d !== dateStr));
  };

  const handleSave = () => {
    setSaveSuccessMessage('Availability calendar preferences saved successfully.');
    setTimeout(() => {
      setSaveSuccessMessage('');
    }, 4000);
  };

  const handleReset = () => {
    setIsOnlineRadar(INITIAL_AVAILABILITY.isOnlineRadar);
    setWeeklySlots(INITIAL_AVAILABILITY.weeklySlots);
    setBlackoutDates(INITIAL_AVAILABILITY.blackoutDates);
    setBufferHours(INITIAL_AVAILABILITY.bufferHoursBetweenShoots);
    setMaxBookings(INITIAL_AVAILABILITY.maxBookingsPerDay);
    setSaveSuccessMessage('Reset to initial default availability settings.');
    setTimeout(() => {
      setSaveSuccessMessage('');
    }, 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <DemoNoticeBanner moduleName="Availability & Radar Dispatch" />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
          Availability & Working Hours
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Set weekly working windows, manage vacation blackouts, and control instant radar dispatch.
        </p>
      </div>

      {/* Timezone Badge & Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-canvas-secondary/70 border border-contour-subtle rounded-card-sm text-xs">
        <div className="flex items-center gap-2 text-ink-primary font-bold">
          <Globe className="w-4 h-4 text-brand" />
          <span>Marketplace Time Zone: Asia/Kolkata (IST - UTC+05:30)</span>
        </div>
        <span className="text-ink-muted">
          All slots automatically convert to Indian Standard Time.
        </span>
      </div>

      {saveSuccessMessage && (
        <div className="p-3.5 bg-green-50 border border-green-200 rounded-card-sm text-xs font-bold text-green-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* INSTANT RADAR DISPATCH TOGGLE */}
      <Card className="p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-ink-primary">
                Instant Radar Dispatch (Live Availability)
              </h2>
              <Badge variant={isOnlineRadar ? 'success' : 'neutral'} size="sm">
                {isOnlineRadar ? 'Radar Active' : 'Radar Off'}
              </Badge>
            </div>
            <p className="text-xs text-ink-secondary max-w-xl">
              When online, you appear on nearby clients&apos; instant radar search within your Delhi NCR service areas. When toggled off, you only receive bookings scheduled at least 24 hours in advance.
            </p>
          </div>

          <button
            onClick={() => setIsOnlineRadar(!isOnlineRadar)}
            className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all shadow-sm flex items-center gap-2 shrink-0 ${
              isOnlineRadar
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-800'
            }`}
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>{isOnlineRadar ? 'Online: Ready for Shoots' : 'Offline: Take a Break'}</span>
          </button>
        </div>
      </Card>

      {/* WEEKLY RECURRING SCHEDULE */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="border-b border-contour-subtle pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-ink-primary">Weekly Working Schedule</h2>
            <p className="text-xs text-ink-secondary mt-0.5">Clients can only select booking slots during your active working hours.</p>
          </div>
          <span className="text-xs font-mono text-ink-muted">7-Day Recurring</span>
        </div>

        <div className="space-y-3">
          {weeklySlots.map((slot, idx) => (
            <div
              key={slot.day}
              className={`p-3.5 rounded-card-sm border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                slot.enabled
                  ? 'bg-white border-contour-subtle'
                  : 'bg-canvas-secondary/50 border-dashed border-contour-strong opacity-70'
              }`}
            >
              {/* Day Toggle */}
              <div className="flex items-center gap-3 w-40">
                <input
                  type="checkbox"
                  id={`day-${slot.day}`}
                  checked={slot.enabled}
                  onChange={() => toggleDay(idx)}
                  className="w-4 h-4 text-brand rounded focus:ring-brand border-contour-strong"
                />
                <label
                  htmlFor={`day-${slot.day}`}
                  className="text-sm font-bold text-ink-primary cursor-pointer"
                >
                  {slot.day}
                </label>
              </div>

              {/* Working Hours Time Selectors */}
              {slot.enabled ? (
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-ink-muted">From:</span>
                    <input
                      type="time"
                      value={slot.start}
                      onChange={(e) => updateTime(idx, 'start', e.target.value)}
                      className="bg-canvas-primary border border-contour-strong rounded p-1.5 text-xs font-mono font-bold text-ink-primary outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                  <span className="text-ink-muted">to</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-ink-muted">Until:</span>
                    <input
                      type="time"
                      value={slot.end}
                      onChange={(e) => updateTime(idx, 'end', e.target.value)}
                      className="bg-canvas-primary border border-contour-strong rounded p-1.5 text-xs font-mono font-bold text-ink-primary outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                </div>
              ) : (
                <span className="text-xs font-bold text-ink-muted italic">
                  Unavailable / Day Off
                </span>
              )}

              {/* Existing Bookings Marker */}
              <div className="text-right text-xs shrink-0">
                {slot.day === 'Monday' && (
                  <Badge variant="brand" size="sm">1 Shoot Booked (4:00 PM)</Badge>
                )}
                {slot.day === 'Saturday' && (
                  <Badge variant="neutral" size="sm">1 Shoot Booked (6:30 AM)</Badge>
                )}
                {slot.day !== 'Monday' && slot.day !== 'Saturday' && slot.enabled && (
                  <span className="text-[11px] text-green-700 font-semibold">All slots open</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* VACATION & BLACKOUT DATES */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="border-b border-contour-subtle pb-4">
          <h2 className="text-lg font-bold text-ink-primary">Unavailable / Blackout Dates</h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Block specific calendar days for travel, festivals, or private shoots.
          </p>
        </div>

        <form onSubmit={handleAddBlackout} className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="date"
            value={newBlackoutDate}
            onChange={(e) => setNewBlackoutDate(e.target.value)}
            className="w-full sm:w-auto bg-white border border-contour-strong rounded-card-sm p-2 text-xs font-bold text-ink-primary outline-none focus:ring-2 focus:ring-brand"
          />
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Block Date
          </Button>
        </form>

        <div className="flex flex-wrap gap-2 pt-2">
          {blackoutDates.map((dateStr) => (
            <div
              key={dateStr}
              className="flex items-center gap-2 bg-canvas-secondary border border-contour-subtle px-3 py-1.5 rounded-card-sm text-xs font-bold text-ink-primary"
            >
              <Calendar className="w-3.5 h-3.5 text-brand" />
              <span>{dateStr}</span>
              <button
                type="button"
                onClick={() => handleRemoveBlackout(dateStr)}
                className="text-ink-muted hover:text-red-600 transition-colors ml-1"
                title="Remove Block"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* TRAVEL BUFFER & CAPACITY CONTROLS */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="border-b border-contour-subtle pb-4">
          <h2 className="text-lg font-bold text-ink-primary">Buffer & Daily Capacity Rules</h2>
          <p className="text-xs text-ink-secondary mt-0.5">Avoid scheduling conflicts between consecutive shoots across Delhi NCR.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-ink-primary">
              Travel Buffer Between Shoots
            </label>
            <select
              value={bufferHours}
              onChange={(e) => setBufferHours(Number(e.target.value))}
              className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
            >
              <option value={1}>1 Hour Transit Buffer (Recommended)</option>
              <option value={1.5}>1.5 Hours Transit Buffer</option>
              <option value={2}>2 Hours Transit Buffer (Large Area)</option>
            </select>
            <p className="text-[11px] text-ink-muted">
              Guarantees time for equipment packing, metro transit, or Delhi traffic.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-ink-primary">
              Maximum Shoots Per Day
            </label>
            <select
              value={maxBookings}
              onChange={(e) => setMaxBookings(Number(e.target.value))}
              className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
            >
              <option value={1}>1 Shoot Maximum (Exclusive Focus)</option>
              <option value={2}>2 Shoots Maximum</option>
              <option value={3}>3 Shoots Maximum (Standard)</option>
              <option value={4}>4 Shoots Maximum (Peak Capacity)</option>
            </select>
            <p className="text-[11px] text-ink-muted">
              Once reached, remaining hours on that day are automatically blocked.
            </p>
          </div>
        </div>
      </Card>

      {/* BOTTOM SAVE ACTIONS */}
      <div className="flex items-center justify-between pt-4 border-t border-contour-subtle">
        <Button
          variant="secondary"
          size="md"
          onClick={handleReset}
          leftIcon={<RotateCcw className="w-4 h-4" />}
        >
          Reset to Defaults
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          leftIcon={<CheckCircle2 className="w-4 h-4" />}
        >
          Save Availability Settings
        </Button>
      </div>
    </div>
  );
}
