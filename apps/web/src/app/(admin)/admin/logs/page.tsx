'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileText,
  Info,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  SlidersHorizontal,
  X,
} from 'lucide-react';

interface SystemLogEntry {
  id: string;
  timestamp: string;
  category: 'BOOKINGS' | 'VERIFICATION' | 'ROLES' | 'AUTH' | 'SYSTEM';
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
  action: string;
  actor: string;
  actorEmail?: string | null;
  target: string;
  details: string;
  metadata?: Record<string, any>;
}

interface SystemMetrics {
  status: string;
  environment: string;
  database: string;
  realtimeHeartbeat: string;
}

export default function AdminSystemLogsPage() {
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<'ALL' | 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'BOOKINGS' | 'VERIFICATION' | 'ROLES' | 'AUTH' | 'SYSTEM'>('ALL');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SystemLogEntry | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (selectedLevel !== 'ALL') params.set('level', selectedLevel);
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/logs?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to fetch system logs (${res.status})`);
      }
      setLogs(data.logs || []);
      setMetrics(data.systemMetrics || null);
    } catch (err: any) {
      console.error('Error fetching logs:', err);
      setError(err?.message || 'Could not load system logs.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedLevel, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const exportLogsAsJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `system_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getLevelBadge = (level: SystemLogEntry['level']) => {
    switch (level) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            SUCCESS
          </span>
        );
      case 'WARN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            WARN
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-50 text-red-700 border border-red-200">
            <ShieldAlert className="w-3 h-3 text-red-600" />
            ERROR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
            <Info className="w-3 h-3 text-blue-500" />
            INFO
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER SECTION */}
      <div className="rounded-3xl bg-[#EFFCF8] border border-[#99F6E4] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#14B8A6] text-white flex items-center justify-center shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-[#14B8A6]">Platform Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#191C22] tracking-tight">System &amp; Audit Logs</h1>
          <p className="text-xs sm:text-sm text-[#64748B] font-medium leading-relaxed">
            Real-time immutable audit trail of state transitions, photographer reviews, dispute arbitration, and access controls.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
              autoRefresh
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-[#64748B] border-[#E7EAEE] hover:bg-[#F5F7F9]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-white animate-ping' : 'bg-stone-300'}`} />
            <span>{autoRefresh ? 'Live Polling Active' : 'Enable Live Polling'}</span>
          </button>

          <button
            type="button"
            onClick={fetchLogs}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white border border-[#E7EAEE] text-[#191C22] hover:bg-[#F5F7F9] transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#14B8A6]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={exportLogsAsJson}
            disabled={logs.length === 0}
            className="px-4 py-2 rounded-xl bg-[#191C22] hover:bg-black text-white text-xs font-black transition-colors flex items-center gap-2 disabled:opacity-40 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E7EAEE] p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-[#94A3B8]">System Health</p>
            <p className="text-sm font-black text-[#191C22] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {metrics?.status || 'OPERATIONAL'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E7EAEE] p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-[#94A3B8]">Database Connection</p>
            <p className="text-sm font-black text-[#191C22] truncate">Cloud PostgreSQL</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E7EAEE] p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-[#94A3B8]">Audited Records</p>
            <p className="text-sm font-black text-[#191C22]">{logs.length} Log Entries</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E7EAEE] p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-[#14B8A6] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-[#94A3B8]">Heartbeat Synced</p>
            <p className="text-sm font-black text-[#191C22]">
              {metrics?.realtimeHeartbeat ? new Date(metrics.realtimeHeartbeat).toLocaleTimeString() : 'Just now'}
            </p>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="bg-white rounded-3xl border border-[#E7EAEE] p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search action, actor, target or notes..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F5F7F9] border border-[#E7EAEE] text-xs text-[#191C22] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#14B8A6] transition-colors"
            />
          </div>

          {/* Level Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['ALL', 'INFO', 'SUCCESS', 'WARN', 'ERROR'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedLevel === lvl
                    ? 'bg-[#191C22] text-white shadow-2xs'
                    : 'text-[#64748B] hover:text-[#191C22] hover:bg-[#F5F7F9]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 border-t border-[#F1F3F5] pt-3 overflow-x-auto pb-1 text-xs">
          <span className="text-[10px] font-bold uppercase text-[#94A3B8] shrink-0 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" />
            Scope:
          </span>
          {(['ALL', 'BOOKINGS', 'VERIFICATION', 'ROLES', 'SYSTEM'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat as any)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#14B8A6] text-white font-bold'
                  : 'bg-[#F5F7F9] text-[#64748B] hover:text-[#191C22]'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* LOGS TABLE / FEED */}
      <div className="bg-white rounded-3xl border border-[#E7EAEE] shadow-2xs overflow-hidden">
        {isLoading && logs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#14B8A6] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-[#94A3B8]">Fetching system audit trail...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <FileText className="w-10 h-10 text-[#94A3B8] mx-auto opacity-50" />
            <h3 className="text-sm font-black text-[#191C22]">No log records match your filter</h3>
            <p className="text-xs text-[#94A3B8]">Try clearing search parameters or selecting &quot;ALL&quot; scopes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E7EAEE] bg-[#F5F7F9] text-[10px] font-black uppercase text-[#94A3B8] tracking-wider">
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Details / Notes</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F5] text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FFFDFB] transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">{getLevelBadge(log.level)}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-[#64748B] font-medium text-[11px]">
                      {new Date(log.timestamp).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-black text-[#191C22]">
                      <span className="px-2 py-0.5 rounded-md bg-[#F5F7F9] border border-[#E7EAEE] text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="font-bold text-[#191C22]">{log.actor}</p>
                      {log.actorEmail && <p className="text-[10px] text-[#94A3B8]">{log.actorEmail}</p>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-semibold text-[#64748B]">{log.target}</td>
                    <td className="py-3 px-4 text-[#64748B] max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-black text-[#14B8A6] bg-[#EFFCF8] hover:bg-[#FFE6D3] transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INSPECT LOG MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E7EAEE] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7EAEE]">
              <div className="flex items-center gap-2">
                {getLevelBadge(selectedLog.level)}
                <h3 className="text-sm font-black text-[#191C22]">Log Entry Detail</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-[#94A3B8] hover:bg-[#F5F7F9] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F5F7F9] rounded-2xl space-y-1.5 border border-[#E7EAEE]">
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Action</span>
                  <span className="font-bold text-[#191C22]">{selectedLog.action}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Category</span>
                  <span className="font-bold text-[#14B8A6]">{selectedLog.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Timestamp</span>
                  <span className="text-[#64748B]">{new Date(selectedLog.timestamp).toISOString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Actor</span>
                  <span className="font-bold text-[#191C22]">
                    {selectedLog.actor} {selectedLog.actorEmail ? `(${selectedLog.actorEmail})` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Target</span>
                  <span className="font-semibold text-[#191C22]">{selectedLog.target}</span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase text-[#94A3B8] mb-1">Narrative / Reason</p>
                <p className="p-3 rounded-xl bg-white border border-[#E7EAEE] text-[#191C22] leading-relaxed">
                  {selectedLog.details}
                </p>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#94A3B8] mb-1">Metadata Payload</p>
                  <pre className="p-3 rounded-xl bg-[#191C22] text-[#F5F7F9] text-[10px] overflow-x-auto font-mono">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E7EAEE]">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#191C22] hover:bg-black transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
