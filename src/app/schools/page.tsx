'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { schoolsApi, School, SchoolLicense, videosApi, VideoItem } from '@/api';
import { StudentReportModal, StudentReportData } from '@/components/StudentReportModal';
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
  Users,
  CheckSquare,
  Square,
  Award,
  ArrowRight,
  ArrowLeft,
  Flame,
  BookOpen,
  Sparkles,
} from 'lucide-react';

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Main Tabs: 'licenses' | 'analytics'
  const [activeMainTab, setActiveMainTab] = useState<'licenses' | 'analytics'>('licenses');
  const [analyticsSelectedSchool, setAnalyticsSelectedSchool] = useState<School | null>(null);

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

  // Delete School & License Confirmation States
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [deletingSchool, setDeletingSchool] = useState(false);
  const [licenseToDelete, setLicenseToDelete] = useState<{ schoolId: string; schoolName: string; license: SchoolLicense } | null>(null);
  const [deletingLicense, setDeletingLicense] = useState(false);

  // Video Curriculum Allocation State
  const [videoSchool, setVideoSchool] = useState<School | null>(null);
  const [catalogVideos, setCatalogVideos] = useState<VideoItem[]>([]);
  const [assignedVideoIds, setAssignedVideoIds] = useState<string[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [savingVideos, setSavingVideos] = useState(false);
  const [videoCategoryFilter, setVideoCategoryFilter] = useState('ALL');
  const [videoSearch, setVideoSearch] = useState('');

  // Students Roster Modal State
  const [studentsSchool, setStudentsSchool] = useState<School | null>(null);
  const [schoolStudentsList, setSchoolStudentsList] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Student Report Modal State
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<StudentReportData | null>(null);

  const [isMentor, setIsMentor] = useState(false);

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

  const handleDeleteLicense = async () => {
    if (!licenseToDelete) return;
    setDeletingLicense(true);
    setErrorMsg('');
    try {
      await schoolsApi.deleteSchoolLicense(
        licenseToDelete.schoolId,
        licenseToDelete.license.licenseCode,
        licenseToDelete.license.id
      );
      setToastMsg(`✓ Access coupon batch "${licenseToDelete.license.licenseCode}" deleted successfully.`);
      setLicenseToDelete(null);
      await fetchSchools();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete license batch.');
    } finally {
      setDeletingLicense(false);
    }
  };

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

  // Video Allocation Handlers
  const handleOpenVideoAllocation = async (school: School) => {
    setVideoSchool(school);
    setLoadingVideos(true);
    try {
      const [allVideosRes, assignedVideosRes] = await Promise.all([
        videosApi.getVideos({ limit: 100 }),
        schoolsApi.getVideosForSchool(school.id).catch(() => ({ success: true, data: [] })),
      ]);
      if (allVideosRes?.success) {
        setCatalogVideos(allVideosRes.data.items || []);
      }
      if (assignedVideosRes?.success) {
        const assigned = Array.isArray(assignedVideosRes.data)
          ? assignedVideosRes.data.map((v: any) => v.id || v.videoId)
          : [];
        setAssignedVideoIds(assigned);
      }
    } catch {
      setErrorMsg('Failed to load video catalog.');
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleSaveVideoAllocation = async () => {
    if (!videoSchool) return;
    setSavingVideos(true);
    try {
      await schoolsApi.assignVideosToSchool(videoSchool.id, assignedVideoIds);
      setToastMsg(`✓ Curriculum videos updated for "${videoSchool.name}"!`);
      setVideoSchool(null);
      await fetchSchools();
    } catch (err: any) {
      alert(err.message || 'Failed to update video assignments.');
    } finally {
      setSavingVideos(false);
    }
  };

  // School Students Handler
  const handleOpenStudents = async (school: School) => {
    setStudentsSchool(school);
    setLoadingStudents(true);
    try {
      const res = await schoolsApi.getSchoolStudents(school.id);
      if (res?.success && res.data) {
        setSchoolStudentsList(res.data.students || []);
      } else {
        setSchoolStudentsList([]);
      }
    } catch {
      setSchoolStudentsList([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleOpenStudentReport = (stu: any, schoolName: string) => {
    setSelectedStudentForReport({
      id: stu.id || `stu_${Date.now()}`,
      phone: stu.phone || '',
      status: stu.status || 'ACTIVE',
      fullName: stu.profile?.fullName || stu.fullName || 'Student User',
      targetExam: stu.profile?.targetExam || 'JEE Main',
      targetExamYear: stu.profile?.targetExamYear || 2027,
      educationLevel: stu.profile?.educationLevel || 'Class 11/12',
      studyMode: stu.profile?.studyMode || 'Online',
      schoolName: schoolName,
      streakDays: stu.profile?.streakDays ?? 8,
      xpPoints: stu.profile?.xpPoints ?? 320,
      createdAt: stu.createdAt,
    });
  };

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'INDIRAPURAM' | 'ACTIVE' | 'INACTIVE'>('ALL');
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

  const isIndirapuramSchool = (s: School) => {
    const n = s.name.toLowerCase();
    const c = s.code.toLowerCase();
    return n.includes('indirapuram') || c.includes('indirapuram') || c.includes('ips');
  };

  const filteredSchools = schools.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.city && s.city.toLowerCase().includes(q)) ||
      (s.state && s.state.toLowerCase().includes(q));

    if (statusFilter === 'INDIRAPURAM') return matchesSearch && isIndirapuramSchool(s);
    if (statusFilter === 'ACTIVE') return matchesSearch && s.status === 'ACTIVE';
    if (statusFilter === 'INACTIVE') return matchesSearch && s.status !== 'ACTIVE';
    return matchesSearch;
  });

  // Analytics Aggregates
  const totalAllSeats = schools.reduce((acc, s) => acc + (s.totalSeats || s.licenses?.reduce((lacc, l) => lacc + l.totalSeats, 0) || 0), 0);
  const totalAllAllocated = schools.reduce((acc, s) => acc + (s.allocatedSeats || s.licenses?.reduce((lacc, l) => lacc + l.allocatedSeats, 0) || 0), 0);
  const totalAllRemaining = Math.max(0, totalAllSeats - totalAllAllocated);
  const totalAllBatches = schools.reduce((acc, s) => acc + (s.licenses?.length || 0), 0);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-6 flex-1 animate-in fade-in duration-300">
          {/* Page Title & Main Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Schools</h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Manage partner school portals, license coupon batches, and institutional student analytics.
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

          {/* Sub-Tabs: School Licenses vs School Analytics */}
          <div className="flex items-center gap-2 border-b border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveMainTab('licenses');
                setAnalyticsSelectedSchool(null);
              }}
              className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                activeMainTab === 'licenses'
                  ? 'border-orange-600 text-orange-600 bg-orange-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>School Licenses</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('analytics')}
              className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                activeMainTab === 'analytics'
                  ? 'border-orange-600 text-orange-600 bg-orange-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>School Analytics</span>
            </button>
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

          {/* ========================================================================= */}
          {/* TAB 1: SCHOOL LICENSES */}
          {/* ========================================================================= */}
          {activeMainTab === 'licenses' && (
            <div className="space-y-6">
              {/* Search & Filter Bar */}
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

                <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-semibold flex-wrap">
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
                    onClick={() => setStatusFilter('INDIRAPURAM')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                      statusFilter === 'INDIRAPURAM'
                        ? 'bg-orange-600 text-white font-bold shadow-2xs'
                        : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                    }`}
                  >
                    <span>Indirapuram (Ayodhya)</span>
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

              {/* Banner */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-start gap-3 shadow-2xs">
                <Info className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-slate-900">Institutional Licensing, Video Curriculum & Batch Seat Allocation:</p>
                  <p className="text-slate-600">
                    Each school card displays the <strong>Activation Date</strong>, <strong>Expiry Date</strong>, video catalog allocation, and all generated <strong>Access License Batches</strong>. When students redeem any batch code on the Topper Mantra app, the backend automatically validates remaining seats and activates school curriculum access.
                  </p>
                </div>
              </div>

              {/* Schools List */}
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
                    const isIndirapuram = isIndirapuramSchool(s);

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
                      <div
                        key={s.id}
                        className={`mnc-card p-5 space-y-4 ${
                          isIndirapuram ? 'border-orange-200 ring-1 ring-orange-500/10' : ''
                        }`}
                      >
                        {/* School Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                              <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-bold text-slate-900">{s.name}</h3>

                                {isIndirapuram && (
                                  <span className="px-2 py-0.5 text-[10px] rounded-full font-bold bg-orange-100 text-orange-800 border border-orange-200">
                                    Indirapuram Public School
                                  </span>
                                )}

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

                              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 mt-1">
                                {!isMentor && <span>Code: <strong className="font-mono text-slate-800">{s.code}</strong></span>}
                                {s.city && <span>{!isMentor && '• '}{s.city}{s.state ? `, ${s.state}` : ''}</span>}
                                <span>• Partner Since: <strong className="text-slate-700">{formatDate(s.createdAt)}</strong></span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 flex-wrap">
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

                            {!isMentor && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  onClick={() => handleOpenVideoAllocation(s)}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                                  title="Assign & Manage Video Curriculum"
                                >
                                  <Video className="w-3.5 h-3.5 text-orange-400" />
                                  <span>Assign Videos</span>
                                </button>

                                <button
                                  onClick={() => handleOpenStudents(s)}
                                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                                  title="View Enrolled Students"
                                >
                                  <Users className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Students</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedSchool(s);
                                    setCodePrefix(s.code);
                                    setShowLicenseModal(true);
                                  }}
                                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                  Generate Code
                                </button>

                                <button
                                  onClick={() => setSchoolToDelete(s)}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                  title="Delete School Profile"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
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

                        {/* Active Licenses List */}
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
                                        <div className="flex items-center gap-2 flex-wrap">
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

                                          <button
                                            type="button"
                                            onClick={() => setLicenseToDelete({ schoolId: s.id, schoolName: s.name, license: lic })}
                                            className="px-2 py-1 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-md text-[11px] font-semibold text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-all cursor-pointer"
                                            title="Delete license coupon batch"
                                          >
                                            <Trash2 className="w-3 h-3 text-rose-500" />
                                            <span>Delete</span>
                                          </button>
                                        </div>

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
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: SCHOOL ANALYTICS & INSTITUTIONAL DRILL-DOWN */}
          {/* ========================================================================= */}
          {activeMainTab === 'analytics' && (
            <div className="space-y-6">
              {!analyticsSelectedSchool ? (
                <>
                  {/* Institutional Summary KPIs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Partner Schools</span>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{schools.length}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Active institutional portals</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Licensed Capacity</span>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{totalAllSeats.toLocaleString()}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Contracted seats</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Redeemed Seats</span>
                      <p className="text-2xl font-bold text-emerald-600 mt-1">
                        {totalAllAllocated.toLocaleString()} ({totalAllSeats > 0 ? Math.round((totalAllAllocated / totalAllSeats) * 100) : 0}%)
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Active student accounts</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Unclaimed Seats</span>
                      <p className="text-2xl font-bold text-orange-600 mt-1">{totalAllRemaining.toLocaleString()}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Available for distribution</p>
                    </div>
                  </div>

                  {/* School Analytics Table */}
                  <div className="mnc-card overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Partner School Institutional Telemetry</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Click any school to drill down into student rosters, watch percentages, and video allocations.</p>
                      </div>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                        {schools.length} Campuses Listed
                      </span>
                    </div>

                    <table className="mnc-table">
                      <thead>
                        <tr>
                          <th>School Name & Campus</th>
                          <th>Code</th>
                          <th>Seat Capacity & Utilization</th>
                          <th>Enrolled Students</th>
                          <th>Status</th>
                          <th className="text-right">Analytics</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schools.map((school) => {
                          const seats = school.totalSeats || school.licenses?.reduce((acc, l) => acc + l.totalSeats, 0) || 0;
                          const alloc = school.allocatedSeats || school.licenses?.reduce((acc, l) => acc + l.allocatedSeats, 0) || 0;
                          const pct = seats > 0 ? Math.round((alloc / seats) * 100) : 0;
                          const isIndirapuram = isIndirapuramSchool(school);

                          return (
                            <tr key={school.id} className="hover:bg-slate-50/80 transition-colors">
                              <td>
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-bold text-xs shrink-0">
                                    <Building2 className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-bold text-slate-900 text-xs">{school.name}</span>
                                      {isIndirapuram && (
                                        <span className="px-2 py-0.2 bg-orange-100 text-orange-800 border border-orange-200 rounded-full text-[10px] font-bold">
                                          ★ Indirapuram
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-500">{school.city || 'Campus'}{school.state ? `, ${school.state}` : ''}</p>
                                  </div>
                                </div>
                              </td>

                              <td className="font-mono text-xs font-semibold text-slate-700">{school.code}</td>

                              <td>
                                <div className="space-y-1 max-w-[180px]">
                                  <div className="flex justify-between text-[11px] text-slate-600">
                                    <span className="font-bold text-slate-900">{alloc}</span>
                                    <span>/ {seats} ({pct}%)</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                    <div className="h-full bg-orange-600 rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              </td>

                              <td className="text-xs font-semibold text-slate-700">
                                {alloc > 0 ? `${alloc} Students` : 'Awaiting Redemption'}
                              </td>

                              <td>
                                <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold uppercase border ${
                                  school.status === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                  {school.status}
                                </span>
                              </td>

                              <td className="text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAnalyticsSelectedSchool(school);
                                    handleOpenStudents(school);
                                  }}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                                >
                                  <span>View Telemetry</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                /* Drill-Down Single School Analytics */
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setAnalyticsSelectedSchool(null)}
                      className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to All Schools</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenVideoAllocation(analyticsSelectedSchool)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5 text-orange-400" />
                        <span>Manage Video Allocation</span>
                      </button>
                    </div>
                  </div>

                  {/* School Overview Card */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-bold">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-900">{analyticsSelectedSchool.name}</h2>
                            {isIndirapuramSchool(analyticsSelectedSchool) && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                                Indirapuram Public School
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Code: <strong className="font-mono text-slate-700">{analyticsSelectedSchool.code}</strong> • {analyticsSelectedSchool.city || 'Campus'} • Joined {formatDate(analyticsSelectedSchool.createdAt)}
                          </p>
                        </div>
                      </div>

                      <span className="px-3 py-1 text-xs rounded-full font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ● Active Institutional Partner
                      </span>
                    </div>

                    {/* School Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Seat Utilization</span>
                        <p className="text-xl font-bold text-slate-900 mt-1">
                          {analyticsSelectedSchool.allocatedSeats || 0} / {analyticsSelectedSchool.totalSeats || 0}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Redeemed license coupons</p>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Assigned Curriculum</span>
                        <p className="text-xl font-bold text-orange-600 mt-1">
                          {analyticsSelectedSchool.assignedVideosCount || 1} / 22 Videos
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Active catalog release</p>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">License Batches</span>
                        <p className="text-xl font-bold text-purple-700 mt-1">
                          {analyticsSelectedSchool.licenses?.length || 0} Batches
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Configured coupon prefixes</p>
                      </div>
                    </div>
                  </div>

                  {/* Student Directory for this School */}
                  <div className="mnc-card overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Users className="w-4 h-4 text-orange-600" />
                          Enrolled Students Roster ({analyticsSelectedSchool.name})
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Click on any student name to inspect their complete video watch telemetry and learning progress.
                        </p>
                      </div>

                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {schoolStudentsList.length} Students
                      </span>
                    </div>

                    {loadingStudents ? (
                      <div className="p-8 text-center space-y-2">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-600 mx-auto" />
                        <p className="text-xs text-slate-500">Loading student roster from database...</p>
                      </div>
                    ) : schoolStudentsList.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 space-y-2">
                        <Users className="w-10 h-10 mx-auto text-slate-300" />
                        <p className="text-sm font-semibold text-slate-700">No students enrolled yet under this school code</p>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          When students from {analyticsSelectedSchool.name} redeem access code <strong className="text-slate-700 font-mono">{analyticsSelectedSchool.licenses?.[0]?.licenseCode || analyticsSelectedSchool.code}</strong> on the Topper Mantra mobile app, their accounts will appear here automatically.
                        </p>
                      </div>
                    ) : (
                      <table className="mnc-table">
                        <thead>
                          <tr>
                            <th>Student Name</th>
                            <th>Phone</th>
                            <th>Target Exam</th>
                            <th>Education Level</th>
                            <th>Status</th>
                            <th className="text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schoolStudentsList.map((stu: any, idx: number) => (
                            <tr key={idx}>
                              <td>
                                <button
                                  type="button"
                                  onClick={() => handleOpenStudentReport(stu, analyticsSelectedSchool.name)}
                                  className="text-left font-bold text-slate-900 hover:text-orange-600 transition-colors flex items-center gap-1.5 cursor-pointer group"
                                >
                                  <span>{stu.profile?.fullName || stu.fullName || 'Registered Student'}</span>
                                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all" />
                                </button>
                              </td>
                              <td className="font-mono text-xs text-slate-700">{stu.phone}</td>
                              <td className="text-slate-700 font-medium text-xs">{stu.profile?.targetExam || 'General'}</td>
                              <td className="text-slate-600 text-xs">{stu.profile?.educationLevel || 'Class 11/12'}</td>
                              <td>
                                <span className="px-2 py-0.5 text-[10px] rounded-full font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {stu.status || 'ACTIVE'}
                                </span>
                              </td>
                              <td className="text-right">
                                <button
                                  type="button"
                                  onClick={() => handleOpenStudentReport(stu, analyticsSelectedSchool.name)}
                                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-xs font-semibold cursor-pointer"
                                >
                                  View Progress
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODALS */}
          {/* ========================================================================= */}

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
                      placeholder="e.g. Indirapuram Public School, Ayodhya"
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
                      placeholder="e.g. INDIRAPURAM_AYODHYA"
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
                        placeholder="e.g. Ayodhya"
                        value={newSchoolCity}
                        onChange={(e) => setNewSchoolCity(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-500 placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">State</label>
                      <input
                        type="text"
                        placeholder="e.g. Uttar Pradesh"
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

          {/* VIDEO CURRICULUM ALLOCATION MODAL */}
          {videoSchool && (
            <div className="fixed inset-0 z-[100] bg-slate-950/80 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Video Curriculum Allocation</h3>
                      <p className="text-xs text-slate-500 font-medium">{videoSchool.name} ({videoSchool.code})</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVideoSchool(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-600">Assigned to School:</span>
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {assignedVideoIds.length} of {catalogVideos.length} videos
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAssignedVideoIds(catalogVideos.map((v) => v.id))}
                        className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => setAssignedVideoIds([])}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="relative flex-1 w-full">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search video titles or topics..."
                        value={videoSearch}
                        onChange={(e) => setVideoSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-medium"
                      />
                    </div>

                    <select
                      value={videoCategoryFilter}
                      onChange={(e) => setVideoCategoryFilter(e.target.value)}
                      className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
                    >
                      <option value="ALL">All Pillars</option>
                      <option value="ACADEMIC">Academics (JEE/NEET)</option>
                      <option value="HACKATHON">Hackathon & Coding</option>
                      <option value="ENTREPRENEURSHIP">Entrepreneurship</option>
                      <option value="DRONE_AVIATION">Drone Aviation</option>
                      <option value="INSPIRE">Inspire</option>
                    </select>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
                  {loadingVideos ? (
                    <div className="py-12 text-center space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin text-orange-600 mx-auto" />
                      <p className="text-xs text-slate-500">Loading catalog videos and assignments...</p>
                    </div>
                  ) : catalogVideos.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No video assets found in the central catalog.
                    </div>
                  ) : (
                    catalogVideos
                      .filter((v) => {
                        const matchesQ = v.title.toLowerCase().includes(videoSearch.toLowerCase());
                        const matchesCat =
                          videoCategoryFilter === 'ALL' ||
                          v.category.toUpperCase().includes(videoCategoryFilter) ||
                          (v.exam && v.exam.toUpperCase().includes(videoCategoryFilter));
                        return matchesQ && matchesCat;
                      })
                      .map((video) => {
                        const isChecked = assignedVideoIds.includes(video.id);
                        return (
                          <div
                            key={video.id}
                            onClick={() => {
                              if (isChecked) {
                                setAssignedVideoIds((prev) => prev.filter((id) => id !== video.id));
                              } else {
                                setAssignedVideoIds((prev) => [...prev, video.id]);
                              }
                            }}
                            className={`py-3 px-3 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-50 transition cursor-pointer ${
                              isChecked ? 'bg-orange-50/40' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-0 cursor-pointer shrink-0"
                              />

                              {video.thumbnailUrl ? (
                                <img
                                  src={video.thumbnailUrl}
                                  alt=""
                                  className="w-16 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-16 h-10 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                  <Video className="w-4 h-4" />
                                </div>
                              )}

                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate leading-snug">
                                  {video.title}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                  <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">
                                    {video.category || 'ACADEMIC'}
                                  </span>
                                  {video.durationSeconds ? (
                                    <span>{Math.round(video.durationSeconds / 60)} mins</span>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            <span className={`text-xs font-semibold shrink-0 ${isChecked ? 'text-orange-600' : 'text-slate-400'}`}>
                              {isChecked ? 'Assigned' : 'Unassigned'}
                            </span>
                          </div>
                        );
                      })
                  )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    <strong>{assignedVideoIds.length}</strong> videos selected for release to {videoSchool.name}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVideoSchool(null)}
                      className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveVideoAllocation}
                      disabled={savingVideos}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer"
                    >
                      {savingVideos && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {savingVideos ? 'Saving...' : 'Save Video Allocations'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCHOOL STUDENTS ROSTER MODAL */}
          {studentsSchool && (
            <div className="fixed inset-0 z-[100] bg-slate-950/80 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Enrolled Students Roster</h3>
                      <p className="text-xs text-slate-500 font-medium">{studentsSchool.name} • Code: {studentsSchool.code}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStudentsSchool(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {loadingStudents ? (
                    <div className="py-12 text-center space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin text-orange-600 mx-auto" />
                      <p className="text-xs text-slate-500">Querying school student roster from database...</p>
                    </div>
                  ) : schoolStudentsList.length === 0 ? (
                    <div className="py-12 text-center space-y-2">
                      <Users className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-sm font-semibold text-slate-700">No students enrolled yet</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        When students from {studentsSchool.name} enter one of this school's license codes on the Topper Mantra app, they will automatically be linked and listed here.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {schoolStudentsList.map((stu: any, idx: number) => (
                        <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <button
                              type="button"
                              onClick={() => handleOpenStudentReport(stu, studentsSchool.name)}
                              className="font-bold text-slate-900 hover:text-orange-600 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                            >
                              <span>{stu.profile?.fullName || stu.fullName || 'Student User'}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600" />
                            </button>
                            <p className="text-slate-500 font-mono text-[11px] mt-0.5">{stu.phone}</p>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {stu.status || 'ACTIVE'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenStudentReport(stu, studentsSchool.name)}
                              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 text-xs font-semibold cursor-pointer"
                            >
                              View Report
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStudentsSchool(null)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DELETE SCHOOL CONFIRMATION MODAL */}
          {schoolToDelete && (
            <div className="fixed inset-0 z-[100] bg-slate-950/80 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-2xl border border-rose-200 w-full max-w-md space-y-4 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Delete School Profile</h3>
                    <p className="text-xs text-slate-500">This action will remove the partner school.</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <p>
                    Are you sure you want to delete school <strong>"{schoolToDelete.name}"</strong>?
                  </p>
                  <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                    <div>• Code: <strong className="font-mono text-slate-800">{schoolToDelete.code}</strong></div>
                    <div>• Total License Batches: <strong>{schoolToDelete.licenses?.length || 0}</strong></div>
                    <div>• Location: {schoolToDelete.city || 'N/A'}{schoolToDelete.state ? `, ${schoolToDelete.state}` : ''}</div>
                  </div>
                </div>

                <p className="text-[11px] text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200 font-medium">
                  Warning: Deleting this school profile will remove all its issued license batches and student associations.
                </p>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={deletingSchool}
                    onClick={() => setSchoolToDelete(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deletingSchool}
                    onClick={handleDeleteSchool}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {deletingSchool && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {deletingSchool ? 'Deleting...' : 'Confirm Delete School'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DELETE LICENSE BATCH CONFIRMATION MODAL */}
          {licenseToDelete && (
            <div className="fixed inset-0 z-[100] bg-slate-950/80 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-2xl border border-rose-200 w-full max-w-md space-y-4 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Delete License Batch</h3>
                    <p className="text-xs text-slate-500">{licenseToDelete.schoolName}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <p>
                    Are you sure you want to revoke and delete this access coupon batch?
                  </p>
                  <div className="text-[11px] text-slate-600 space-y-1 pt-1 font-mono">
                    <div className="p-2 bg-white rounded border border-slate-200 font-bold text-slate-900 text-center">
                      {licenseToDelete.license.licenseCode}
                    </div>
                    <div className="flex items-center justify-between font-sans text-xs pt-1">
                      <span>Total Seats: <strong>{licenseToDelete.license.totalSeats}</strong></span>
                      <span>Allocated: <strong>{licenseToDelete.license.allocatedSeats}</strong></span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-medium">
                  Notice: Revoking this license batch will prevent new redemptions with this code.
                </p>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={deletingLicense}
                    onClick={() => setLicenseToDelete(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deletingLicense}
                    onClick={handleDeleteLicense}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {deletingLicense && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {deletingLicense ? 'Deleting...' : 'Confirm Delete Batch'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STUDENT PROGRESS REPORT MODAL */}
          {selectedStudentForReport && (
            <StudentReportModal
              student={selectedStudentForReport}
              onClose={() => setSelectedStudentForReport(null)}
              onStatusChange={(stuId, nextStatus) => {
                setSchoolStudentsList((prev) =>
                  prev.map((s) => (s.id === stuId ? { ...s, status: nextStatus } : s))
                );
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
