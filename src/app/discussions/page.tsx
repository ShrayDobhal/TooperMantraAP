'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { discussionsApi, FlaggedItem, FlagReason } from '@/api';
import { exportToCSV } from '@/lib/exportUtils';
import {
  MessageSquare,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Ban,
  UserX,
  Search,
  Filter,
  RefreshCw,
  Download,
  AlertCircle,
  Eye,
  Check,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export default function DiscussionsModerationPage() {
  const [flags, setFlags] = useState<FlaggedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [search, setSearch] = useState('');
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');

  // Selected item for drawer
  const [selectedFlag, setSelectedFlag] = useState<FlaggedItem | null>(null);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const res = await discussionsApi.getFlaggedItems();
      if (res.success) setFlags(res.data);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleDismiss = async (id: string) => {
    await discussionsApi.dismissFlag(id);
    setToastMsg('✓ Flag dismissed as false report.');
    setSelectedFlag(null);
    await fetchFlags();
  };

  const handleDeleteAndWarn = async (id: string) => {
    await discussionsApi.deleteAndWarn(id);
    setToastMsg('✓ Inappropriate content removed and warning issued to user.');
    setSelectedFlag(null);
    await fetchFlags();
  };

  const handleSuspend = async (id: string) => {
    await discussionsApi.suspendAuthorAccount(id);
    setToastMsg('✓ Offending user account suspended.');
    setSelectedFlag(null);
    await fetchFlags();
  };

  const handleExportCSV = () => {
    if (flags.length === 0) return;
    const exportData = filtered.map((f) => ({
      ID: f.id,
      ContentType: f.contentType,
      Reason: f.reason,
      ReportedByCount: f.flaggedByCount,
      AuthorName: f.author.name,
      AuthorPhone: f.author.phone,
      AuthorSchool: f.author.schoolName || 'General',
      ViolationsCount: f.author.previousViolationsCount,
      Status: f.moderationStatus,
      Snippet: f.contentSnippet,
    }));
    exportToCSV(exportData, 'Community_Moderation_Queue');
  };

  const filtered = flags.filter((f) => {
    const q = search.toLowerCase();
    const matchesSearch =
      f.contentSnippet.toLowerCase().includes(q) ||
      f.author.name.toLowerCase().includes(q) ||
      f.channelOrSubject.toLowerCase().includes(q);

    const matchesReason = reasonFilter === 'ALL' || f.reason === reasonFilter;
    return matchesSearch && matchesReason;
  });

  return (
    <div className="flex min-h-screen bg-zinc-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-6 flex-1 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="w-4.5 h-4.5" />
                </div>
                <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                  Trust, Safety & Community Moderation
                </h1>
              </div>
              <p className="text-zinc-400 text-xs mt-1">
                Real-time review pipeline for flagged forum questions, abusive comments, and community guideline enforcement.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={fetchFlags}
                disabled={loading}
                className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Refresh Queue"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-400' : ''}`} />
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-zinc-400" /> Export CSV
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="exec-card p-4.5">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase">Pending Review</span>
              <p className="text-2xl font-bold text-rose-400 mt-1">
                {flags.filter((f) => f.moderationStatus === 'PENDING').length} Reports
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">Requires Administrator Action</p>
            </div>
            <div className="exec-card p-4.5">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase">Spam & Abuse Ratio</span>
              <p className="text-2xl font-bold text-amber-400 mt-1">87.5%</p>
              <p className="text-[11px] text-zinc-500 mt-1">High Accuracy Auto-Triage</p>
            </div>
            <div className="exec-card p-4.5">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase">Average Turnaround</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">&lt; 15 mins</p>
              <p className="text-[11px] text-zinc-500 mt-1">Trust & Safety SLA</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2 w-full sm:w-80 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 focus-within:border-zinc-700 transition-colors">
              <Search className="w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search flagged content or author..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-xs text-slate-100 placeholder:text-zinc-500 focus:outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-zinc-500 text-[11px] uppercase tracking-wider">Reason:</span>
              <select
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none"
              >
                <option value="ALL">All Reasons</option>
                <option value="SPAM">Spam</option>
                <option value="ABUSIVE_LANGUAGE">Abusive Language</option>
                <option value="HARASSMENT">Harassment</option>
                <option value="INAPPROPRIATE_CONTENT">Inappropriate Content</option>
              </select>
            </div>
          </div>

          {toastMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Queue Table */}
          <div className="exec-card overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">
                <div className="h-10 skeleton"></div>
                <div className="h-10 skeleton"></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 space-y-2">
                <ShieldCheck className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                <p className="text-sm font-semibold text-slate-200">Moderation queue is empty!</p>
                <p className="text-xs text-zinc-500">All community discussion threads are healthy.</p>
              </div>
            ) : (
              <table className="exec-table">
                <thead>
                  <tr>
                    <th>Content Snippet</th>
                    <th>Reason</th>
                    <th>Channel / Topic</th>
                    <th>Author Profile</th>
                    <th>Status</th>
                    <th className="text-right">Enforcement</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td className="font-medium text-slate-200 max-w-sm">
                        <p className="text-xs line-clamp-2">"{item.contentSnippet}"</p>
                        <span className="text-[10px] text-zinc-500">Reported by {item.flaggedByCount} users</span>
                      </td>

                      <td>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                            item.reason === 'SPAM'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : item.reason === 'ABUSIVE_LANGUAGE'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          }`}
                        >
                          {item.reason}
                        </span>
                      </td>

                      <td className="text-xs text-zinc-400">{item.channelOrSubject}</td>

                      <td className="text-xs">
                        <p className="font-semibold text-slate-200">{item.author.name}</p>
                        <span className="text-[10px] text-zinc-500 font-mono">{item.author.phone}</span>
                        {item.author.previousViolationsCount > 0 && (
                          <span className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold">
                            {item.author.previousViolationsCount} Strike(s)
                          </span>
                        )}
                      </td>

                      <td>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                            item.moderationStatus === 'PENDING'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {item.moderationStatus}
                        </span>
                      </td>

                      <td className="text-right">
                        <button
                          onClick={() => setSelectedFlag(item)}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-orange-400" /> Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Action Drawer */}
          {selectedFlag && (
            <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
              <div className="w-full max-w-lg bg-zinc-950 border-l border-zinc-800 h-full p-6 space-y-6 shadow-2xl flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-rose-400" />
                      <h3 className="text-base font-bold text-slate-100">Inspect Flagged Snippet</h3>
                    </div>
                    <button onClick={() => setSelectedFlag(null)} className="text-zinc-400 hover:text-slate-100 p-1">
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1.5">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Offending Message Snippet:</span>
                      <p className="text-sm font-medium text-slate-100 italic bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                        "{selectedFlag.contentSnippet}"
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                        <span>Reason: <strong className="text-rose-400">{selectedFlag.reason}</strong></span>
                        <span>Channel: {selectedFlag.channelOrSubject}</span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Author Dossier:</span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-zinc-500 text-[11px]">Full Name:</span>
                          <p className="font-semibold text-slate-200">{selectedFlag.author.name}</p>
                        </div>
                        <div>
                          <span className="text-zinc-500 text-[11px]">Phone:</span>
                          <p className="font-mono text-slate-200">{selectedFlag.author.phone}</p>
                        </div>
                        <div>
                          <span className="text-zinc-500 text-[11px]">School / College:</span>
                          <p className="text-orange-400">{selectedFlag.author.schoolName || 'Self Study'}</p>
                        </div>
                        <div>
                          <span className="text-zinc-500 text-[11px]">Past Guideline Strikes:</span>
                          <p className="font-bold text-rose-400">{selectedFlag.author.previousViolationsCount} Strikes</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enforcement Buttons */}
                <div className="pt-4 border-t border-zinc-800 space-y-2 text-xs">
                  <button
                    onClick={() => handleDismiss(selectedFlag.id)}
                    className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-semibold transition-colors cursor-pointer"
                  >
                    Dismiss Report (No Violation)
                  </button>

                  <button
                    onClick={() => handleDeleteAndWarn(selectedFlag.id)}
                    className="w-full py-2.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Content & Warn User
                  </button>

                  <button
                    onClick={() => handleSuspend(selectedFlag.id)}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
                  >
                    <Ban className="w-4 h-4" /> Suspend Student Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
