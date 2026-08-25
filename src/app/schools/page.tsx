'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { schoolsApi, School } from '@/api';
import { Building2, Plus, Key, Info, Loader2, AlertCircle, CheckCircle2, RefreshCw, Video, AlertTriangle, Search, Copy, Calendar, Clock } from 'lucide-react';

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Add School Modal
  const [showAddSchoolModal, setShowAddSchoolModal] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolCode, setNewSchoolCode] = useState('');
  const [newSchoolCity, setNewSchoolCity] = useState('');
  const [newSchoolState, setNewSchoolState] = useState('');
  const [addingSchool, setAddingSchool] = useState(false);

  // License Modal
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [seatCount, setSeatCount] = useState(500);
  const [codePrefix, setCodePrefix] = useState('');
  const [generatingLicense, setGeneratingLicense] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  // Details Modal
  const [detailsSchool, setDetailsSchool] = useState<School | null>(null);

  const [isMentor, setIsMentor] = useState(false);

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
    if (typeof window !== 'undefined') {
      const r = localStorage.getItem('tm_role');
      if (r === 'MENTOR') {
        setIsMentor(true);
      }
    }
  }, []);

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingSchool(true);
    setErrorMsg('');
    try {
      const res = await schoolsApi.createSchool({
        name: newSchoolName,
        code: newSchoolCode,
        city: newSchoolCity,
        state: newSchoolState,
      });

      if (res && res.success) {
        setToastMsg(`School "${newSchoolName}" created successfully!`);
        setShowAddSchoolModal(false);
        setNewSchoolName('');
        setNewSchoolCode('');
        setNewSchoolCity('');
        setNewSchoolState('');
        await fetchSchools();
      } else {
        setErrorMsg(res?.data?.name ? 'Failed to create school.' : 'Failed to register school on backend.');
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
        setToastMsg(`✓ Access code ${res.data.licenseCode} generated with ${seatCount} seats for ${selectedSchool.name}!`);
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

  // School Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setToastMsg(`✓ Access code "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  const getDaysRemaining = (validUntil?: string) => {
    if (!validUntil) return null;
    try {
      const diff = new Date(validUntil).getTime() - Date.now();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days;
    } catch {
      return null;
    }
  };

  const filteredSchools = schools.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.city && s.city.toLowerCase().includes(q)) ||
      (s.state && s.state.toLowerCase().includes(q));

    if (statusFilter === 'ACTIVE') return matchesSearch && s.status === 'ACTIVE';
    if (statusFilter === 'INACTIVE') return matchesSearch && s.status !== 'ACTIVE';
    return matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-6 flex-1 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {isMentor ? 'School Communities' : 'Institutional School Licenses'}
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                {isMentor
                  ? 'Browse partner school communities, assigned video curriculum, and active student membership rosters.'
                  : 'Manage partner school accounts, monitor membership activation & expiry dates, and generate bulk access coupon batches.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchSchools}
                disabled={loading}
                className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg shadow-2xs cursor-pointer"
                title="Refresh Schools"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
              </button>

              {!isMentor && (
                <button
                  onClick={() => setShowAddSchoolModal(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-orange-500" />
                  Register New School
                </button>
              )}
            </div>
          </div>

          {/* School Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:bg-white focus-within:border-slate-400 transition-all">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search school name, code, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none w-full font-medium"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 self-start sm:self-auto text-xs font-semibold">
              <span className="text-slate-400 text-[11px] uppercase tracking-wider mr-1">Filter:</span>
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({schools.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('INACTIVE')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'INACTIVE'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Inactive
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={fetchSchools} className="px-3 py-1 bg-rose-600 text-white rounded-md text-xs font-semibold hover:bg-rose-700">
                Retry
              </button>
            </div>
          )}

          {toastMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* School Community Banner */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-start gap-3 shadow-2xs">
            <Info className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 space-y-1">
              <p className="font-bold text-slate-900">Institutional Licensing & Batch Seat Allocation:</p>
              <p className="text-slate-600">
                Each school card displays the <strong>Activation Date</strong>, <strong>Expiry Date</strong>, and all generated <strong>Access License Batches</strong>. When students redeem any batch code on the Topper Mantra app, the backend automatically validates remaining seats and activates school curriculum access.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-36 skeleton"></div>
              <div className="h-36 skeleton"></div>
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="p-12 bg-white rounded-xl border border-slate-200 text-center text-slate-400 space-y-2">
              <Building2 className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No schools matching your query.</p>
              <p className="text-xs text-slate-500">Try changing the search keyword or register a new institutional profile.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {filteredSchools.map((s) => {
                const totalSeats = s.totalSeats || s.licenses?.reduce((acc, l) => acc + l.totalSeats, 0) || 0;
                const allocatedSeats = s.allocatedSeats || s.licenses?.reduce((acc, l) => acc + l.allocatedSeats, 0) || 0;
                const remainingSeats = totalSeats - allocatedSeats;
                const percentRedeemed = totalSeats > 0 ? Math.round((allocatedSeats / totalSeats) * 100) : 0;
                const assignedVideos = s.assignedVideosCount ?? 0;
                const missingVideos = s.missingVideosCount ?? 0;

                // Find latest expiry date among licenses
                const latestExpiry = s.licenses && s.licenses.length > 0
                  ? s.licenses.reduce((latest, l) => {
                      if (!l.validUntil) return latest;
                      if (!latest) return l.validUntil;
                      return new Date(l.validUntil) > new Date(latest) ? l.validUntil : latest;
                    }, s.licenses[0].validUntil)
                  : undefined;

                const daysRemaining = getDaysRemaining(latestExpiry);
                const isMembershipActive = s.status === 'ACTIVE' && (daysRemaining === null || daysRemaining > 0);

                return (
                  <div key={s.id} className="mnc-card p-5 space-y-4">
                    {/* School Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-slate-900">{s.name}</h3>
                            <span
                              className={`px-2.5 py-0.5 text-[10px] rounded-full font-bold uppercase border ${
                                isMembershipActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {isMembershipActive ? '● Active Membership' : '○ Inactive / Expired'}
                            </span>
                          </div>

                          {/* School Metadata & Dates */}
                          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 mt-1">
                            {!isMentor && <span>Code: <strong className="font-mono text-slate-800">{s.code}</strong></span>}
                            {s.city && <span>{!isMentor && '• '}{s.city}{s.state ? `, ${s.state}` : ''}</span>}
                            <span>• Partner Since: <strong className="text-slate-700">{formatDate(s.createdAt)}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Top School Metric Pills & Action */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Membership Expiry Pill */}
                        {latestExpiry && (
                          <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
                            daysRemaining !== null && daysRemaining > 30
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : daysRemaining !== null && daysRemaining > 0
                              ? 'bg-amber-50 border-amber-200 text-amber-800'
                              : 'bg-rose-50 border-rose-200 text-rose-800'
                          }`}>
                            <span>
                              {daysRemaining !== null && daysRemaining > 0
                                ? `Expires: ${formatDate(latestExpiry)} (${daysRemaining}d left)`
                                : `Expired: ${formatDate(latestExpiry)}`}
                            </span>
                          </div>
                        )}

                        {/* Video Content Flag */}
                        {missingVideos > 0 ? (
                          <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-semibold flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>{assignedVideos} / {assignedVideos + missingVideos} videos</span>
                          </div>
                        ) : assignedVideos > 0 ? (
                          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{assignedVideos} videos</span>
                          </div>
                        ) : null}

                        {!isMentor && (
                          <button
                            onClick={() => {
                              setSelectedSchool(s);
                              setCodePrefix(s.code);
                              setShowLicenseModal(true);
                            }}
                            className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            <Key className="w-3.5 h-3.5" />
                            Generate Code
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Seat Overview Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-slate-500 font-medium">Total License Seats:</span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">{totalSeats.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Allocated / Redeemed:</span>
                        <p className="font-bold text-emerald-600 text-sm mt-0.5">{allocatedSeats.toLocaleString()} ({percentRedeemed}%)</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Remaining Available:</span>
                        <p className="font-bold text-slate-700 text-sm mt-0.5">{remainingSeats > 0 ? remainingSeats.toLocaleString() : 0}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Total Batches Issued:</span>
                        <p className="font-bold text-slate-800 text-sm mt-0.5">{s.licenses?.length || 0} Batches</p>
                      </div>
                    </div>

                    {/* Active Licenses List (Only shown to Admin) */}
                    {!isMentor && (
                      s.licenses && s.licenses.length > 0 ? (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Issued Access Coupon Batches ({s.licenses.length})
                            </p>
                            <span className="text-[11px] text-slate-400">
                              Each coupon grants mobile app access to its batch seat capacity
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-2.5">
                            {s.licenses.map((lic, idx) => {
                              const pct = lic.totalSeats > 0 ? Math.round((lic.allocatedSeats / lic.totalSeats) * 100) : 0;
                              const licDays = getDaysRemaining(lic.validUntil);
                              const isLicActive = lic.isActive !== false && (licDays === null || licDays > 0);

                              return (
                                <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 hover:border-slate-300 transition-colors shadow-2xs">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    {/* Code & Copy Button */}
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-slate-900 font-bold tracking-wider text-xs bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                        {lic.licenseCode}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(lic.licenseCode)}
                                        className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-600 flex items-center gap-1 transition-all cursor-pointer"
                                        title="Copy coupon code"
                                      >
                                        {copiedCode === lic.licenseCode ? (
                                          <>
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            <span className="text-emerald-600 font-bold">Copied!</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3 h-3 text-slate-400" />
                                            <span>Copy</span>
                                          </>
                                        )}
                                      </button>
                                    </div>

                                    {/* Expiry & Seat Breakdown */}
                                    <div className="flex items-center gap-3 text-xs flex-wrap">
                                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                        isLicActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                      }`}>
                                        {isLicActive ? 'Valid Batch' : 'Expired'}
                                      </span>

                                      {lic.validUntil && (
                                        <span className="text-slate-500 text-[11px]">
                                          Expires: <strong>{formatDate(lic.validUntil)}</strong>
                                          {licDays !== null && ` (${licDays > 0 ? `${licDays}d left` : 'Expired'})`}
                                        </span>
                                      )}

                                      <span className="text-slate-700 font-semibold text-xs">
                                        {lic.allocatedSeats} / {lic.totalSeats} seats ({pct}%)
                                      </span>
                                    </div>
                                  </div>

                                  {/* Capacity Bar */}
                                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                    <div
                                      className="h-full bg-orange-600 rounded-full transition-all duration-300"
                                      style={{ width: `${pct}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No access codes generated yet. Click "Generate Code" above.</p>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* REGISTER NEW SCHOOL MODAL */}
          {showAddSchoolModal && (
            <div className="fixed inset-0 z-[100] bg-slate-950/80 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 w-full max-w-md space-y-4 shadow-2xl">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Register Institutional School</h3>
                </div>

                <form onSubmit={handleCreateSchool} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">School Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Delhi Public School R.K. Puram"
                      value={newSchoolName}
                      onChange={(e) => setNewSchoolName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-500 placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">School Unique Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DPS_RKP_2026"
                      value={newSchoolCode}
                      onChange={(e) => setNewSchoolCode(e.target.value.toUpperCase())}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono font-semibold focus:outline-none focus:border-slate-500 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">City</label>
                      <input
                        type="text"
                        placeholder="e.g. New Delhi"
                        value={newSchoolCity}
                        onChange={(e) => setNewSchoolCity(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-500 placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">State</label>
                      <input
                        type="text"
                        placeholder="e.g. Delhi"
                        value={newSchoolState}
                        onChange={(e) => setNewSchoolState(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-500 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAddSchoolModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addingSchool}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer"
                    >
                      {addingSchool && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {addingSchool ? 'Creating...' : 'Create School Profile'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* GENERATE LICENSE MODAL */}
          {showLicenseModal && selectedSchool && (
            <div className="fixed inset-0 z-[100] bg-slate-950/80 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 w-full max-w-md space-y-4 shadow-2xl">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Generate Bulk Access Code</h3>
                    <p className="text-xs text-slate-500">{selectedSchool.name}</p>
                  </div>
                </div>

                <form onSubmit={handleGenerateLicense} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Code Custom Prefix</label>
                    <div className="flex items-center gap-1">
                      <span className="px-2.5 py-2.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-600 font-mono font-bold">TOPPER-</span>
                      <input
                        type="text"
                        value={codePrefix}
                        onChange={(e) => setCodePrefix(e.target.value.toUpperCase())}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono font-semibold focus:outline-none focus:border-slate-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Total Seat Licenses *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={seatCount}
                      onChange={(e) => setSeatCount(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-slate-500"
                    />
                  </div>

                  {generatedCode && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-mono text-xs font-bold text-center">
                      🔑 Generated Code: <span className="text-orange-600 font-black">{generatedCode}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowLicenseModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={generatingLicense}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer"
                    >
                      {generatingLicense && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {generatingLicense ? 'Generating...' : 'Generate License Code'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
