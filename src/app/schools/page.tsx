'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { schoolsApi, School } from '@/api';
import { Building2, Plus, Key, Info, Loader2, AlertCircle, CheckCircle2, RefreshCw, Video, AlertTriangle } from 'lucide-react';

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
      const res = await schoolsApi.generateLicense(selectedSchool.id, {
        totalSeats: Number(seatCount),
        prefix: codePrefix ? `TOPPER-${codePrefix.toUpperCase()}` : `TOPPER-${selectedSchool.code.toUpperCase()}`,
        validUntil: '2026-12-31T23:59:59.000Z',
      });

      if (res && res.success && res.data) {
        setGeneratedCode(res.data.licenseCode);
        setToastMsg(`License generated for ${selectedSchool.name}!`);
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

  const handleToggleStatus = async (school: School) => {
    const nextStatus = school.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await schoolsApi.updateSchoolStatus(school.id, nextStatus);
      setToastMsg(`School status updated to ${nextStatus}.`);
      fetchSchools();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update school status.');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-6 flex-1 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional School Licenses</h1>
              <p className="text-slate-500 text-xs mt-0.5">Manage partner school accounts, generate bulk seat access codes, and monitor missing video content.</p>
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

              <button
                onClick={() => setShowAddSchoolModal(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-orange-500" />
                Register New School
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
              <p className="font-bold text-slate-900">Institutional Licensing & Mobile App Integration:</p>
              <p className="text-slate-600">
                When students redeem access codes on the Topper Mantra app, the backend verifies active license status, allocates available seats, and automatically grants access to school-assigned video curriculum.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-36 skeleton"></div>
              <div className="h-36 skeleton"></div>
            </div>
          ) : schools.length === 0 ? (
            <div className="p-12 bg-white rounded-xl border border-slate-200 text-center text-slate-400 space-y-2">
              <Building2 className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No schools registered yet.</p>
              <p className="text-xs text-slate-500">Click "Register New School" to create an institutional profile.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {schools.map((s) => {
                const totalSeats = s.totalSeats || s.licenses?.reduce((acc, l) => acc + l.totalSeats, 0) || 0;
                const allocatedSeats = s.allocatedSeats || s.licenses?.reduce((acc, l) => acc + l.allocatedSeats, 0) || 0;
                const remainingSeats = totalSeats - allocatedSeats;
                const percentRedeemed = totalSeats > 0 ? Math.round((allocatedSeats / totalSeats) * 100) : 0;
                const assignedVideos = s.assignedVideosCount ?? 0;
                const missingVideos = s.missingVideosCount ?? 0;

                return (
                  <div key={s.id} className="mnc-card p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                          <Building2 className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">{s.name}</h3>
                            <button
                              onClick={() => handleToggleStatus(s)}
                              className={`px-2.5 py-0.5 text-xs rounded-full font-bold uppercase cursor-pointer border ${
                                s.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-emerald-50 hover:text-emerald-700'
                              }`}
                              title="Click to toggle school status"
                            >
                              {s.status || 'ACTIVE'}
                            </button>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            School Code: <span className="font-mono font-bold text-slate-800">{s.code}</span>
                            {s.city ? ` • ${s.city}${s.state ? `, ${s.state}` : ''}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Top School Metric Pills */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Video Content Flag */}
                        {missingVideos > 0 ? (
                          <div className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-semibold flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>{assignedVideos} / {assignedVideos + missingVideos} videos ({missingVideos} missing)</span>
                          </div>
                        ) : assignedVideos > 0 ? (
                          <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{assignedVideos} / {assignedVideos} videos (Complete)</span>
                          </div>
                        ) : (
                          <div className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-xs font-semibold flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5 text-slate-400" />
                            <span>No videos assigned</span>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setSelectedSchool(s);
                            setCodePrefix(s.code);
                            setShowLicenseModal(true);
                          }}
                          className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                          <Key className="w-3.5 h-3.5" />
                          Generate Code
                        </button>
                      </div>
                    </div>

                    {/* Seat Overview Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-slate-500 font-medium">Total License Seats:</span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">{totalSeats.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Allocated / Redeemed:</span>
                        <p className="font-bold text-emerald-600 text-sm mt-0.5">{allocatedSeats.toLocaleString()} ({percentRedeemed}%)</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Remaining Seats:</span>
                        <p className="font-bold text-slate-700 text-sm mt-0.5">{remainingSeats > 0 ? remainingSeats.toLocaleString() : 0}</p>
                      </div>
                    </div>

                    {/* Active Licenses List */}
                    {s.licenses && s.licenses.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Active Access Licenses ({s.licenses.length})</p>
                        {s.licenses.map((lic, idx) => {
                          const pct = lic.totalSeats > 0 ? Math.round((lic.allocatedSeats / lic.totalSeats) * 100) : 0;
                          return (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-mono text-slate-900 font-bold tracking-wider">{lic.licenseCode}</span>
                                <span className="text-slate-600 font-medium">{lic.allocatedSeats} / {lic.totalSeats} seats redeemed ({pct}%)</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                <div className="h-full bg-orange-600 rounded-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No access codes generated yet. Click "Generate Code" above.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* REGISTER NEW SCHOOL MODAL */}
          {showAddSchoolModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
              <div className="bg-white p-6 rounded-xl border border-slate-200 w-full max-w-md space-y-4 shadow-xl">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                    <Building2 className="w-4 h-4 text-orange-600" />
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-400"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono font-semibold focus:outline-none focus:border-slate-400"
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">State</label>
                      <input
                        type="text"
                        placeholder="e.g. Delhi"
                        value={newSchoolState}
                        onChange={(e) => setNewSchoolState(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAddSchoolModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addingSchool}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-60"
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
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
              <div className="bg-white p-6 rounded-xl border border-slate-200 w-full max-w-md space-y-4 shadow-xl">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                    <Key className="w-4 h-4 text-orange-600" />
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
                      <span className="px-2.5 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-mono font-bold">TOPPER-</span>
                      <input
                        type="text"
                        value={codePrefix}
                        onChange={(e) => setCodePrefix(e.target.value.toUpperCase())}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono font-semibold focus:outline-none"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none"
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
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={generatingLicense}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-60"
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
