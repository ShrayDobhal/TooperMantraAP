'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { schoolsApi, School, SchoolLicense } from '@/api';
import { exportToCSV } from '@/lib/exportUtils';
import {
  Building2,
  Plus,
  Key,
  Info,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Video,
  AlertTriangle,
  Search,
  Copy,
  Calendar,
  Clock,
  Trash2,
  Download,
  Users,
  Eye,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

export default function SchoolsPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');

  // Add School Modal
  const [showAddSchoolModal, setShowAddSchoolModal] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolCode, setNewSchoolCode] = useState('');
  const [newSchoolCity, setNewSchoolCity] = useState('');
  const [newSchoolState, setNewSchoolState] = useState('');
  const [newSchoolSeats, setNewSchoolSeats] = useState(500);
  const [addingSchool, setAddingSchool] = useState(false);

  // License Modal
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [seatCount, setSeatCount] = useState(500);
  const [codePrefix, setCodePrefix] = useState('');
  const [generatingLicense, setGeneratingLicense] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  // Delete School & License Confirmation
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [deletingSchool, setDeletingSchool] = useState(false);

  const fetchSchools = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await schoolsApi.getSchools();
      if (res && res.success) {
        setSchools(res.data || []);
      } else {
        setErrorMsg('Failed to load school accounts from backend API.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to communicate with Topper Mantra backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingSchool(true);
    setErrorMsg('');
    try {
      const res = await schoolsApi.createSchool({
        name: newSchoolName,
        code: newSchoolCode.toUpperCase().replace(/\s+/g, '_'),
        city: newSchoolCity,
        state: newSchoolState,
        totalSeats: Number(newSchoolSeats),
      });

      if (res && res.success) {
        setToastMsg(`✓ School "${newSchoolName}" created successfully!`);
        setShowAddSchoolModal(false);
        setNewSchoolName('');
        setNewSchoolCode('');
        setNewSchoolCity('');
        setNewSchoolState('');
        await fetchSchools();
      } else {
        setErrorMsg('Failed to register school on backend.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'School creation failed.');
    } finally {
      setAddingSchool(false);
    }
  };

  const handleGenerateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;

    setGeneratingLicense(true);
    setGeneratedCode('');
    setErrorMsg('');

    try {
      const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const res = await schoolsApi.generateLicense(selectedSchool.id, {
        totalSeats: Number(seatCount),
        prefix: codePrefix ? codePrefix.toUpperCase().replace(/^TOPPER-/, '') : undefined,
        validUntil,
      });

      if (res && res.success && res.data) {
        setGeneratedCode(res.data.licenseCode);
        setToastMsg(`✓ Access code ${res.data.licenseCode} generated with ${seatCount} seats!`);
        await fetchSchools();
      } else {
        setErrorMsg('Failed to generate license from backend API.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'License generation failed.');
    } finally {
      setGeneratingLicense(false);
    }
  };

  const handleDeleteSchool = async () => {
    if (!schoolToDelete) return;
    setDeletingSchool(true);
    setErrorMsg('');
    try {
      await schoolsApi.deleteSchool(schoolToDelete.id);
      setToastMsg(`✓ School "${schoolToDelete.name}" deleted successfully.`);
      setSchoolToDelete(null);
      await fetchSchools();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete school.');
    } finally {
      setDeletingSchool(false);
    }
  };

  const handleExportCSV = () => {
    if (schools.length === 0) {
      alert('No schools to export.');
      return;
    }
    const exportData = filteredSchools.map((s) => ({
      SchoolName: s.name,
      SchoolCode: s.code,
      City: s.city || '',
      State: s.state || '',
      TotalSeats: s.totalSeats || 0,
      AllocatedSeats: s.allocatedSeats || 0,
      RemainingSeats: s.remainingSeats || 0,
      Status: s.status,
      BatchesIssued: s.licenses?.length || 0,
      PartnerSince: s.createdAt || '',
    }));
    exportToCSV(exportData, 'TopperMantra_School_Catalog');
  };

  const uniqueStates = Array.from(
    new Set(schools.map((s) => s.state).filter((st): st is string => Boolean(st)))
  );

  const filteredSchools = schools.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.city && s.city.toLowerCase().includes(q)) ||
      (s.state && s.state.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && s.status === 'ACTIVE') ||
      (statusFilter === 'INACTIVE' && s.status !== 'ACTIVE');

    const matchesState = stateFilter === 'ALL' || s.state === stateFilter;

    return matchesSearch && matchesStatus && matchesState;
  });

  // Calculate platform institutional aggregations
  const totalPartnerSchools = schools.length;
  const activeSchoolsCount = schools.filter((s) => s.status === 'ACTIVE').length;
  const totalAllocatedSeats = schools.reduce((acc, s) => acc + (s.totalSeats || 0), 0);
  const totalClaimedSeats = schools.reduce((acc, s) => acc + (s.allocatedSeats || 0), 0);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-6 flex-1 animate-in fade-in duration-300">
          {/* Header Title Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Building2 className="w-4.5 h-4.5" />
                </div>
                <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                  Multi-Tenant School Management & License Hub
                </h1>
              </div>
              <p className="text-zinc-400 text-xs mt-1">
                Central control center for onboarding partner schools, generating seat coupons, provisioning custom video curriculum, and auditing 24h student activity.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={fetchSchools}
                disabled={loading}
                className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Refresh Schools"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-400' : ''}`} />
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-zinc-400" /> Export CSV
              </button>

              <button
                onClick={() => setShowAddSchoolModal(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-orange-600/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Onboard New School
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="exec-card p-4.5">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Partner Schools</span>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-bold text-slate-100">{totalPartnerSchools}</h3>
                <span className="text-xs text-emerald-400">({activeSchoolsCount} Active)</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Institutions Onboarded</p>
            </div>

            <div className="exec-card p-4.5">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Total Allocated Quota</span>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-bold text-slate-100">{totalAllocatedSeats.toLocaleString()}</h3>
                <span className="text-xs text-zinc-400">Seats</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Institutional Student Seats</p>
            </div>

            <div className="exec-card p-4.5">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Redeemed Licenses</span>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-bold text-emerald-400">{totalClaimedSeats.toLocaleString()}</h3>
                <span className="text-xs text-zinc-400">
                  ({totalAllocatedSeats > 0 ? Math.round((totalClaimedSeats / totalAllocatedSeats) * 100) : 0}%)
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Active Enrolled Students</p>
            </div>

            <div className="exec-card p-4.5">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">License Availability</span>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-bold text-amber-400">{(totalAllocatedSeats - totalClaimedSeats).toLocaleString()}</h3>
                <span className="text-xs text-zinc-400">Remaining</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Seats Open For Activation</p>
            </div>
          </div>

          {/* Search, Filter & State Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2 w-full sm:w-80 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 focus-within:border-zinc-700 transition-colors">
              <Search className="w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search school name, code, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-slate-100 placeholder:text-zinc-500 focus:outline-none w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-xs text-zinc-400 hover:text-slate-100">
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* State Filter */}
              <div className="flex items-center gap-1">
                <span className="text-zinc-500 text-[11px] uppercase tracking-wider">State:</span>
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none"
                >
                  <option value="ALL">All States ({schools.length})</option>
                  {uniqueStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-zinc-800 text-slate-100 font-semibold'
                      : 'text-zinc-400 hover:text-slate-200'
                  }`}
                >
                  All ({schools.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-slate-200'
                  }`}
                >
                  Active ({activeSchoolsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('INACTIVE')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'INACTIVE'
                      ? 'bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/30'
                      : 'text-zinc-400 hover:text-slate-200'
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={fetchSchools} className="px-3 py-1 bg-rose-600 text-white rounded-md text-xs font-semibold hover:bg-rose-500">
                Retry
              </button>
            </div>
          )}

          {toastMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* School Catalog Table */}
          <div className="exec-card overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">
                <div className="h-12 skeleton"></div>
                <div className="h-12 skeleton"></div>
                <div className="h-12 skeleton"></div>
              </div>
            ) : filteredSchools.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 space-y-2">
                <Building2 className="w-10 h-10 mx-auto text-zinc-600" />
                <p className="text-sm font-semibold text-slate-300">No schools matching your search criteria.</p>
                <p className="text-xs text-zinc-500">Try modifying filters or onboard a new partner institution.</p>
              </div>
            ) : (
              <table className="exec-table">
                <thead>
                  <tr>
                    <th>School Name</th>
                    <th>Code</th>
                    <th>City / State</th>
                    <th>Total Seats</th>
                    <th>Claimed / Remaining</th>
                    <th>Active (24h)</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchools.map((s) => {
                    const totalS = s.totalSeats || 500;
                    const allocatedS = s.allocatedSeats || 0;
                    const remainingS = Math.max(0, totalS - allocatedS);
                    const pct = totalS > 0 ? Math.round((allocatedS / totalS) * 100) : 0;

                    return (
                      <tr
                        key={s.id}
                        onClick={() => router.push(`/schools/${s.id}`)}
                        className="hover:bg-zinc-800/40 cursor-pointer transition-colors"
                      >
                        <td className="font-semibold text-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold shrink-0">
                              <Building2 className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-100 line-clamp-1">{s.name}</p>
                              <span className="text-[10px] text-zinc-400">
                                {s.licenses?.length || 0} coupon batch(es) issued
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="text-xs font-mono font-bold text-orange-400 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                            {s.code}
                          </span>
                        </td>

                        <td className="text-xs text-zinc-300">
                          {s.city ? `${s.city}${s.state ? `, ${s.state}` : ''}` : '—'}
                        </td>

                        <td className="text-xs font-bold text-slate-100">
                          {totalS.toLocaleString()}
                        </td>

                        <td>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-emerald-400">{allocatedS}</span>
                              <span className="text-zinc-500">/</span>
                              <span className="text-zinc-400">{remainingS} left</span>
                              <span className="text-[10px] text-zinc-500">({pct}%)</span>
                            </div>
                            <div className="w-24 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="flex items-center gap-1.5 text-xs text-blue-400 font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                            <span>{s.activeStudents24h || 12} active</span>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`px-2 py-0.5 text-[10px] rounded-full font-bold uppercase border ${
                              s.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            ● {s.status}
                          </span>
                        </td>

                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <Link
                              href={`/schools/${s.id}`}
                              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                              title="Deep-Dive Telemetry"
                            >
                              <Eye className="w-3.5 h-3.5 text-orange-400" /> Deep Dive
                            </Link>

                            <button
                              onClick={() => {
                                setSelectedSchool(s);
                                setCodePrefix(s.code);
                                setShowLicenseModal(true);
                              }}
                              className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Generate License Batch"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setSchoolToDelete(s)}
                              className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-md border border-rose-500/30 transition-colors cursor-pointer"
                              title="Delete School Profile"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Onboard New School Modal */}
          {showAddSchoolModal && (
            <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-orange-400" />
                    <h3 className="text-base font-bold text-slate-100">Onboard Partner School</h3>
                  </div>
                  <button onClick={() => setShowAddSchoolModal(false)} className="text-zinc-400 hover:text-slate-100 p-1">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateSchool} className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-zinc-300 block mb-1">School Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Indirapuram Public School, Ayodhya"
                      value={newSchoolName}
                      onChange={(e) => {
                        setNewSchoolName(e.target.value);
                        if (!newSchoolCode) {
                          setNewSchoolCode(
                            e.target.value
                              .split(' ')
                              .map((w) => w[0])
                              .join('')
                              .toUpperCase()
                          );
                        }
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-300 block mb-1">School Code (Unique Tenant Identifier) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. IPS-AYODHYA"
                      value={newSchoolCode}
                      onChange={(e) => setNewSchoolCode(e.target.value.toUpperCase())}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 font-mono text-orange-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-zinc-300 block mb-1">City</label>
                      <input
                        type="text"
                        placeholder="e.g. Ayodhya"
                        value={newSchoolCity}
                        onChange={(e) => setNewSchoolCity(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-zinc-300 block mb-1">State</label>
                      <input
                        type="text"
                        placeholder="e.g. Uttar Pradesh"
                        value={newSchoolState}
                        onChange={(e) => setNewSchoolState(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-300 block mb-1">Initial Total Seat Quota</label>
                    <input
                      type="number"
                      min={10}
                      max={10000}
                      value={newSchoolSeats}
                      onChange={(e) => setNewSchoolSeats(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setShowAddSchoolModal(false)}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addingSchool}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl font-semibold shadow-lg shadow-orange-600/20"
                    >
                      {addingSchool ? 'Provisioning...' : 'Provision School'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Bulk License Generator Modal */}
          {showLicenseModal && selectedSchool && (
            <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-orange-400" />
                    <div>
                      <h3 className="text-base font-bold text-slate-100">Generate Access License Coupon</h3>
                      <p className="text-[11px] text-zinc-400">{selectedSchool.name}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowLicenseModal(false)} className="text-zinc-400 hover:text-slate-100 p-1">
                    ✕
                  </button>
                </div>

                {generatedCode ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3 text-center">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                    <p className="text-xs font-semibold text-emerald-400">License Code Batch Ready for Distribution</p>
                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-orange-400">{generatedCode}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedCode);
                          alert('Access code copied!');
                        }}
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs"
                      >
                        Copy
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setShowLicenseModal(false);
                        setGeneratedCode('');
                      }}
                      className="w-full py-2 bg-zinc-800 text-slate-100 rounded-xl text-xs font-semibold"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleGenerateLicense} className="space-y-4 text-xs">
                    <div>
                      <label className="font-semibold text-zinc-300 block mb-1">Coupon Prefix</label>
                      <input
                        type="text"
                        value={codePrefix}
                        onChange={(e) => setCodePrefix(e.target.value.toUpperCase())}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 font-mono text-orange-400"
                        placeholder="e.g. IPS-2026"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-300 block mb-1">Batch Seat Quantity</label>
                      <input
                        type="number"
                        min={1}
                        max={5000}
                        value={seatCount}
                        onChange={(e) => setSeatCount(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-slate-100"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setShowLicenseModal(false)}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={generatingLicense}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl font-semibold shadow-lg shadow-orange-600/20"
                      >
                        {generatingLicense ? 'Generating...' : 'Generate Coupon'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Delete School Confirm Modal */}
          {schoolToDelete && (
            <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-base font-bold text-slate-100">Delete School Profile</h3>
                  <p className="text-xs text-zinc-400">
                    Are you sure you want to remove <strong>{schoolToDelete.name}</strong> ({schoolToDelete.code})?
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setSchoolToDelete(null)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteSchool}
                    disabled={deletingSchool}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold"
                  >
                    {deletingSchool ? 'Deleting...' : 'Confirm Delete'}
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
