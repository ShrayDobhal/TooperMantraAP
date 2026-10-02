'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { StudentDrawer } from '@/components/StudentDrawer';
import {
  schoolsApi,
  videosApi,
  School,
  VideoItem,
  SchoolVideoSchedule,
} from '@/api';
import { exportToCSV } from '@/lib/exportUtils';
import {
  Building2,
  Users,
  Video,
  ArrowLeft,
  Calendar,
  Clock,
  TrendingUp,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Key,
  Download,
  Filter,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Eye,
  Check,
  Flame,
  Radio,
  ExternalLink,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function SchoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params?.id as string;

  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Enrolled Students
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isStudentDrawerOpen, setIsStudentDrawerOpen] = useState(false);

  // Curriculum & Video Matrix
  const [assignedVideos, setAssignedVideos] = useState<any[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [videoSearch, setVideoSearch] = useState('');
  const [allCatalogVideos, setAllCatalogVideos] = useState<VideoItem[]>([]);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocatingVideoIds, setAllocatingVideoIds] = useState<string[]>([]);
  const [allocatingType, setAllocatingType] = useState<'IMMEDIATE' | 'SCHEDULED' | 'EARLY_ACCESS'>('IMMEDIATE');
  const [scheduledReleaseDate, setScheduledReleaseDate] = useState<string>(
    new Date(Date.now() + 7 * 86400 * 1000).toISOString().slice(0, 10)
  );
  const [allocatingLoading, setAllocatingLoading] = useState(false);

  // Engagement Trend Period
  const [trendDays, setTrendDays] = useState<7 | 30 | 90>(30);
  const [engagementCurve, setEngagementCurve] = useState<any[]>([]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CURRICULUM' | 'STUDENTS' | 'LICENSES'>('OVERVIEW');

  useEffect(() => {
    if (schoolId) {
      loadSchoolData();
    }
  }, [schoolId, trendDays]);

  const loadSchoolData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await schoolsApi.getSchoolById(schoolId);
      if (res.success && res.data) {
        setSchool(res.data);
        setEngagementCurve(schoolsApi.getSchoolEngagementCurve(res.data.id, trendDays));
      } else {
        setErrorMsg('School profile could not be retrieved from backend API.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to load school profile.');
    } finally {
      setLoading(false);
    }

    // Load school assigned videos
    loadAssignedVideos();
    // Load enrolled students
    loadEnrolledStudents();
  };

  const loadAssignedVideos = async () => {
    setVideosLoading(true);
    try {
      const res = await schoolsApi.getVideosForSchool(schoolId);
      if (res.success) {
        setAssignedVideos(res.data || []);
      }
    } catch (_) {
    } finally {
      setVideosLoading(false);
    }
  };

  const loadEnrolledStudents = async () => {
    setStudentsLoading(true);
    try {
      const res = await schoolsApi.getSchoolStudents(schoolId);
      if (res.success) {
        setStudents(res.data || []);
      }
    } catch (_) {
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleOpenAllocateModal = async () => {
    setShowAllocateModal(true);
    try {
      const catRes = await videosApi.getVideos({ limit: 100 });
      if (catRes.success) {
        setAllCatalogVideos(catRes.data.items || []);
      }
    } catch (_) {}
  };

  const handleAssignVideos = async () => {
    if (allocatingVideoIds.length === 0 || !school) return;
    setAllocatingLoading(true);
    try {
      await schoolsApi.assignVideosToSchool(school.id, allocatingVideoIds, {
        releaseType: allocatingType,
        scheduledDate: allocatingType === 'SCHEDULED' ? scheduledReleaseDate : undefined,
      });
      setToastMsg(`✓ ${allocatingVideoIds.length} video(s) provisioned to ${school.name}!`);
      setShowAllocateModal(false);
      setAllocatingVideoIds([]);
      await loadAssignedVideos();
      await schoolsApi.getSchoolById(school.id);
    } catch (e: any) {
      alert(e.message || 'Failed to assign videos to school.');
    } finally {
      setAllocatingLoading(false);
    }
  };

  const handleRevokeVideo = async (videoId: string, title: string) => {
    if (!school) return;
    if (!confirm(`Revoke video "${title}" from ${school.name}?`)) return;
    try {
      await schoolsApi.revokeSchoolVideo(school.id, videoId);
      setToastMsg(`✓ Video access revoked.`);
      await loadAssignedVideos();
    } catch (e: any) {
      alert(e.message || 'Failed to revoke video.');
    }
  };

  const handleUpdateSchedule = async (videoId: string, releaseType: 'IMMEDIATE' | 'SCHEDULED' | 'EARLY_ACCESS') => {
    if (!school) return;
    try {
      await schoolsApi.updateVideoSchedule(school.id, videoId, {
        releaseType,
        scheduledDate: releaseType === 'SCHEDULED' ? scheduledReleaseDate : undefined,
      });
      setToastMsg(`✓ Release policy updated to ${releaseType}.`);
      await loadAssignedVideos();
    } catch (e: any) {
      alert(e.message || 'Failed to update video schedule.');
    }
  };

  const handleExportStudents = () => {
    if (!school || students.length === 0) {
      alert('No students to export.');
      return;
    }
    const exportData = students.map((s) => ({
      StudentID: s.id,
      FullName: s.profile?.fullName || 'Student',
      Phone: s.phone,
      TargetExam: s.profile?.targetExam || 'General',
      School: school.name,
      SchoolCode: school.code,
      Status: s.status,
      JoinedDate: s.createdAt || '',
    }));
    exportToCSV(exportData, `${school.code}_Enrolled_Students`);
  };

  const handleExportVideos = () => {
    if (!school || assignedVideos.length === 0) {
      alert('No videos to export.');
      return;
    }
    const exportData = assignedVideos.map((v) => ({
      VideoID: v.id,
      Title: v.title,
      PillarCategory: v.category,
      TargetExam: v.exam || 'ALL',
      ClassLevel: v.classLevel || 'ALL',
      ReleaseType: v.releaseSchedule?.releaseType || 'IMMEDIATE',
      ScheduledDate: v.releaseSchedule?.scheduledDate || 'LIVE',
      DurationSeconds: v.durationSeconds || 0,
    }));
    exportToCSV(exportData, `${school.code}_Allocated_Curriculum`);
  };

  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase();
    return (
      (s.profile?.fullName || '').toLowerCase().includes(q) ||
      (s.phone || '').includes(q) ||
      (s.profile?.targetExam || '').toLowerCase().includes(q)
    );
  });

  const filteredVideos = assignedVideos.filter((v) => {
    const q = videoSearch.toLowerCase();
    return (
      (v.title || '').toLowerCase().includes(q) ||
      (v.category || '').toLowerCase().includes(q) ||
      (v.exam || '').toLowerCase().includes(q)
    );
  });

  const totalSeats = school?.totalSeats || 500;
  const allocatedSeats = school?.allocatedSeats || 0;
  const remainingSeats = Math.max(0, totalSeats - allocatedSeats);
  const seatUtilizationPct = totalSeats > 0 ? Math.round((allocatedSeats / totalSeats) * 100) : 0;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-6 flex-1 animate-in fade-in duration-300">
          {/* Top Breadcrumb & Return Action */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/schools')}
              className="text-xs font-semibold text-zinc-400 hover:text-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to School Directory
            </button>

            {school && (
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 text-xs rounded-full font-bold uppercase border ${
                    school.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}
                >
                  ● {school.status} Institutional License
                </span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {toastMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toastMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              <div className="h-44 skeleton"></div>
              <div className="grid grid-cols-4 gap-4">
                <div className="h-28 skeleton"></div>
                <div className="h-28 skeleton"></div>
                <div className="h-28 skeleton"></div>
                <div className="h-28 skeleton"></div>
              </div>
            </div>
          ) : !school ? (
            <div className="p-12 text-center text-zinc-400">
              <Building2 className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
              <p>School profile could not be located.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Dossier Card */}
              <div className="exec-card p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold shrink-0">
                      <Building2 className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-xl font-bold text-slate-100">{school.name}</h1>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-orange-400 font-mono font-bold">
                          {school.code}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 flex items-center gap-2 mt-1">
                        <span>{school.city ? `${school.city}, ${school.state || 'India'}` : 'Location Unspecified'}</span>
                        <span>•</span>
                        <span>Partner Since: <strong className="text-slate-300">{school.createdAt ? new Date(school.createdAt).toLocaleDateString() : '2026'}</strong></span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenAllocateModal}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-orange-600/20 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Provision Videos
                    </button>

                    <button
                      onClick={handleExportStudents}
                      className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Export Enrolled Students CSV"
                    >
                      <Download className="w-4 h-4" /> Export CSV
                    </button>
                  </div>
                </div>

                {/* Subnav Tabs */}
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab('OVERVIEW')}
                    className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                      activeTab === 'OVERVIEW'
                        ? 'bg-orange-500/10 text-orange-400 font-bold border border-orange-500/30'
                        : 'text-zinc-400 hover:text-slate-100'
                    }`}
                  >
                    Institutional Telemetry & KPIs
                  </button>

                  <button
                    onClick={() => setActiveTab('CURRICULUM')}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'CURRICULUM'
                        ? 'bg-orange-500/10 text-orange-400 font-bold border border-orange-500/30'
                        : 'text-zinc-400 hover:text-slate-100'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" /> Allocated Videos Matrix ({assignedVideos.length})
                  </button>

                  <button
                    onClick={() => setActiveTab('STUDENTS')}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'STUDENTS'
                        ? 'bg-orange-500/10 text-orange-400 font-bold border border-orange-500/30'
                        : 'text-zinc-400 hover:text-slate-100'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" /> Enrolled Students Roster ({students.length})
                  </button>

                  <button
                    onClick={() => setActiveTab('LICENSES')}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'LICENSES'
                        ? 'bg-orange-500/10 text-orange-400 font-bold border border-orange-500/30'
                        : 'text-zinc-400 hover:text-slate-100'
                    }`}
                  >
                    <Key className="w-3.5 h-3.5" /> Access Coupons & Batches ({school.licenses?.length || 0})
                  </button>
                </div>
              </div>

              {/* TAB 1: INSTITUTIONAL TELEMETRY & KPIS */}
              {activeTab === 'OVERVIEW' && (
                <div className="space-y-6">
                  {/* Institutional KPI Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* KPI 1: Seat Utilization */}
                    <div className="exec-card p-5 space-y-3">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span className="font-semibold uppercase tracking-wider">Seat Utilization</span>
                        <Key className="w-4 h-4 text-orange-400" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-extrabold text-slate-100">{seatUtilizationPct}%</h3>
                        <span className="text-xs text-zinc-400">({allocatedSeats} / {totalSeats})</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                          style={{ width: `${Math.min(100, seatUtilizationPct)}%` }}
                        ></div>
                      </div>
                      <p className="text-[11px] text-zinc-400">{remainingSeats} Available Seats Remaining</p>
                    </div>

                    {/* KPI 2: Active Enrolled Students */}
                    <div className="exec-card p-5 space-y-3">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span className="font-semibold uppercase tracking-wider">24h Active Students</span>
                        <Users className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-extrabold text-blue-400">{school.activeStudents24h || 14}</h3>
                        <span className="text-xs text-zinc-400">active today</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <TrendingUp className="w-3.5 h-3.5" /> +18.2% engagement velocity
                      </div>
                      <p className="text-[11px] text-zinc-400">Total {students.length} Registered Accounts</p>
                    </div>

                    {/* KPI 3: Video Completion Velocity */}
                    <div className="exec-card p-5 space-y-3">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span className="font-semibold uppercase tracking-wider">Curriculum Velocity</span>
                        <Video className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-extrabold text-purple-400">{school.avgCompletionRate || 74}%</h3>
                        <span className="text-xs text-zinc-400">avg completion</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                          style={{ width: `${school.avgCompletionRate || 74}%` }}
                        ></div>
                      </div>
                      <p className="text-[11px] text-zinc-400">{assignedVideos.length} Allocated Lectures</p>
                    </div>

                    {/* KPI 4: Doubt SLA & Unresolved */}
                    <div className="exec-card p-5 space-y-3">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span className="font-semibold uppercase tracking-wider">Doubt Resolution SLA</span>
                        <Clock className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-extrabold text-emerald-400">{school.unresolvedDoubtsCount || 1}</h3>
                        <span className="text-xs text-zinc-400">tickets pending</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 94.2% solved within 30m SLA
                      </div>
                      <p className="text-[11px] text-zinc-400">Assigned Expert Subject Mentors</p>
                    </div>
                  </div>

                  {/* Cohort Engagement Curve */}
                  <div className="exec-card p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-100">School Cohort Engagement & Watch-Time Curve</h3>
                        <p className="text-xs text-zinc-400">Daily active students and collective hours spent learning</p>
                      </div>

                      <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs font-semibold">
                        <button
                          onClick={() => setTrendDays(7)}
                          className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                            trendDays === 7 ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-slate-100'
                          }`}
                        >
                          7 Days
                        </button>
                        <button
                          onClick={() => setTrendDays(30)}
                          className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                            trendDays === 30 ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-slate-100'
                          }`}
                        >
                          30 Days
                        </button>
                        <button
                          onClick={() => setTrendDays(90)}
                          className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                            trendDays === 90 ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-slate-100'
                          }`}
                        >
                          90 Days
                        </button>
                      </div>
                    </div>

                    <div className="h-72 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={engagementCurve}>
                          <defs>
                            <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ea580c" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="date" stroke="#71717a" tickLine={false} axisLine={false} fontSize={11} />
                          <YAxis stroke="#71717a" tickLine={false} axisLine={false} fontSize={11} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#09090b',
                              borderColor: '#27272a',
                              borderRadius: '8px',
                              fontSize: '12px',
                              boxShadow: '0 4px 20px -2px rgba(0,0,0,0.5)',
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="activeStudents"
                            name="Active Students"
                            stroke="#ea580c"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorStudents)"
                          />
                          <Area
                            type="monotone"
                            dataKey="watchHours"
                            name="Watch Hours"
                            stroke="#7C3AED"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorHours)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CURRICULUM & VIDEO ACCESS MATRIX */}
              {activeTab === 'CURRICULUM' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 w-72">
                      <Search className="w-3.5 h-3.5 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Search allocated curriculum..."
                        value={videoSearch}
                        onChange={(e) => setVideoSearch(e.target.value)}
                        className="bg-transparent text-xs text-slate-100 placeholder:text-zinc-500 focus:outline-none w-full"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleOpenAllocateModal}
                        className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Allocate New Video
                      </button>

                      <button
                        onClick={handleExportVideos}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Export Matrix
                      </button>
                    </div>
                  </div>

                  <div className="exec-card overflow-hidden">
                    {videosLoading ? (
                      <div className="p-6 space-y-3">
                        <div className="h-10 skeleton"></div>
                        <div className="h-10 skeleton"></div>
                        <div className="h-10 skeleton"></div>
                      </div>
                    ) : filteredVideos.length === 0 ? (
                      <div className="p-12 text-center text-zinc-400 space-y-2">
                        <Video className="w-10 h-10 mx-auto text-zinc-600" />
                        <p className="text-sm font-semibold text-slate-300">No videos currently allocated to this school.</p>
                        <p className="text-xs text-zinc-500">Click "Allocate New Video" to assign curated lectures or playlists.</p>
                      </div>
                    ) : (
                      <table className="exec-table">
                        <thead>
                          <tr>
                            <th>Lecture / Video Title</th>
                            <th>Pillar / Category</th>
                            <th>Target Exam</th>
                            <th>Release Policy</th>
                            <th>Staged Schedule</th>
                            <th className="text-right">Access Control</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredVideos.map((video) => {
                            const sched: SchoolVideoSchedule | undefined = video.releaseSchedule;
                            const isEarly = sched?.releaseType === 'EARLY_ACCESS';
                            const isScheduled = sched?.releaseType === 'SCHEDULED';

                            return (
                              <tr key={video.id}>
                                <td className="font-semibold text-slate-100">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-orange-400 shrink-0">
                                      <Video className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-100 line-clamp-1">{video.title}</p>
                                      <span className="text-[10px] text-zinc-400">Duration: {Math.round((video.durationSeconds || 0) / 60)} mins</span>
                                    </div>
                                  </div>
                                </td>

                                <td>
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold uppercase">
                                    {video.category}
                                  </span>
                                </td>

                                <td className="text-zinc-300 text-xs font-medium">{video.exam || 'ALL EXAMS'}</td>

                                <td>
                                  <span
                                    className={`px-2 py-0.5 text-[10px] rounded-full font-bold uppercase border ${
                                      isEarly
                                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                        : isScheduled
                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    }`}
                                  >
                                    {isEarly ? '★ Early Access' : isScheduled ? '⏳ Staged Release' : '● Immediate'}
                                  </span>
                                </td>

                                <td className="text-xs text-zinc-400">
                                  {isScheduled && sched?.scheduledDate
                                    ? `Releasing: ${new Date(sched.scheduledDate).toLocaleDateString()}`
                                    : 'Live in School App'}
                                </td>

                                <td className="text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {/* Release policy toggle */}
                                    <button
                                      onClick={() =>
                                        handleUpdateSchedule(
                                          video.id,
                                          isEarly ? 'IMMEDIATE' : 'EARLY_ACCESS'
                                        )
                                      }
                                      className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-colors cursor-pointer ${
                                        isEarly
                                          ? 'bg-purple-600 text-white border-purple-500'
                                          : 'bg-zinc-800 text-zinc-400 hover:text-slate-100 border-zinc-700'
                                      }`}
                                      title="Toggle Early Access priority"
                                    >
                                      Early Access
                                    </button>

                                    <button
                                      onClick={() => handleRevokeVideo(video.id, video.title)}
                                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-md border border-rose-500/30 transition-colors cursor-pointer"
                                      title="Revoke School Access"
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
                </div>
              )}

              {/* TAB 3: ENROLLED STUDENTS ROSTER */}
              {activeTab === 'STUDENTS' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 w-72">
                      <Search className="w-3.5 h-3.5 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Search enrolled students..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="bg-transparent text-xs text-slate-100 placeholder:text-zinc-500 focus:outline-none w-full"
                      />
                    </div>

                    <button
                      onClick={handleExportStudents}
                      className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Export Roster CSV
                    </button>
                  </div>

                  <div className="exec-card overflow-hidden">
                    {studentsLoading ? (
                      <div className="p-6 space-y-3">
                        <div className="h-10 skeleton"></div>
                        <div className="h-10 skeleton"></div>
                      </div>
                    ) : filteredStudents.length === 0 ? (
                      <div className="p-12 text-center text-zinc-400 space-y-2">
                        <Users className="w-10 h-10 mx-auto text-zinc-600" />
                        <p className="text-sm font-semibold text-slate-300">No students found for this school.</p>
                        <p className="text-xs text-zinc-500">Students who redeem codes matching prefix {school.code} will appear here.</p>
                      </div>
                    ) : (
                      <table className="exec-table">
                        <thead>
                          <tr>
                            <th>Student Profile</th>
                            <th>Phone</th>
                            <th>Target Exam</th>
                            <th>Watch Activity</th>
                            <th>Account Status</th>
                            <th className="text-right">Dossier Inspection</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((s) => (
                            <tr
                              key={s.id}
                              onClick={() => {
                                setSelectedStudentId(s.id);
                                setIsStudentDrawerOpen(true);
                              }}
                              className="hover:bg-zinc-800/40 cursor-pointer transition-colors"
                            >
                              <td className="font-semibold text-slate-100">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold shrink-0">
                                    {s.profile?.fullName ? s.profile.fullName[0].toUpperCase() : 'S'}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-100">{s.profile?.fullName || 'Student Account'}</p>
                                    <span className="text-[10px] text-zinc-400 font-mono">ID: {s.id.slice(0, 8)}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="font-mono text-xs text-zinc-300">{s.phone}</td>

                              <td className="text-xs text-zinc-300">{s.profile?.targetExam || 'JEE / Boards'}</td>

                              <td className="text-xs text-emerald-400 font-medium">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                  <span>Active Today</span>
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
                                  {s.status}
                                </span>
                              </td>

                              <td className="text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedStudentId(s.id);
                                    setIsStudentDrawerOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3 h-3 text-orange-400" /> 360° Dossier
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

              {/* TAB 4: ACCESS LICENSES & COUPON BATCHES */}
              {activeTab === 'LICENSES' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {school.licenses?.map((lic, idx) => {
                      const pct = lic.totalSeats > 0 ? Math.round((lic.allocatedSeats / lic.totalSeats) * 100) : 0;
                      return (
                        <div key={idx} className="exec-card p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 font-mono font-bold text-orange-400">
                              {lic.licenseCode}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              ● Valid Batch
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                            <div>
                              <span className="text-zinc-500 text-[10px]">Total Seats</span>
                              <p className="font-bold text-slate-100">{lic.totalSeats}</p>
                            </div>
                            <div>
                              <span className="text-zinc-500 text-[10px]">Redeemed</span>
                              <p className="font-bold text-emerald-400">{lic.allocatedSeats} ({pct}%)</p>
                            </div>
                            <div>
                              <span className="text-zinc-500 text-[10px]">Expiry</span>
                              <p className="font-bold text-zinc-300">
                                {lic.validUntil ? new Date(lic.validUntil).toLocaleDateString() : '1 Year'}
                              </p>
                            </div>
                          </div>

                          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Allocate Videos Modal */}
          {showAllocateModal && (
            <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Provision Curriculum to {school?.name}</h3>
                    <p className="text-xs text-zinc-400">Select videos and set the release rollout schedule</p>
                  </div>
                  <button
                    onClick={() => setShowAllocateModal(false)}
                    className="text-zinc-400 hover:text-slate-100 p-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-zinc-300 block mb-1">Release Schedule Policy</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setAllocatingType('IMMEDIATE')}
                        className={`p-2.5 rounded-xl border text-center transition-colors cursor-pointer ${
                          allocatingType === 'IMMEDIATE'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        ● Immediate
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllocatingType('EARLY_ACCESS')}
                        className={`p-2.5 rounded-xl border text-center transition-colors cursor-pointer ${
                          allocatingType === 'EARLY_ACCESS'
                            ? 'bg-purple-500/10 border-purple-500 text-purple-400 font-bold'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        ★ Early Access
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllocatingType('SCHEDULED')}
                        className={`p-2.5 rounded-xl border text-center transition-colors cursor-pointer ${
                          allocatingType === 'SCHEDULED'
                            ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        ⏳ Future Date
                      </button>
                    </div>
                  </div>

                  {allocatingType === 'SCHEDULED' && (
                    <div>
                      <label className="font-semibold text-zinc-300 block mb-1">Target Live Date</label>
                      <input
                        type="date"
                        value={scheduledReleaseDate}
                        onChange={(e) => setScheduledReleaseDate(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-slate-100"
                      />
                    </div>
                  )}

                  <div>
                    <label className="font-semibold text-zinc-300 block mb-1">
                      Select Lectures from Catalog ({allocatingVideoIds.length} Selected)
                    </label>
                    <div className="max-h-56 overflow-y-auto space-y-1.5 border border-zinc-800 rounded-xl p-2 bg-zinc-900/50">
                      {allCatalogVideos.map((vid) => {
                        const isSelected = allocatingVideoIds.includes(vid.id);
                        return (
                          <div
                            key={vid.id}
                            onClick={() => {
                              if (isSelected) {
                                setAllocatingVideoIds(allocatingVideoIds.filter((id) => id !== vid.id));
                              } else {
                                setAllocatingVideoIds([...allocatingVideoIds, vid.id]);
                              }
                            }}
                            className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected ? 'bg-orange-500/10 border border-orange-500/40 text-orange-300' : 'hover:bg-zinc-800 text-slate-200'
                            }`}
                          >
                            <div>
                              <p className="font-bold text-xs">{vid.title}</p>
                              <span className="text-[10px] text-zinc-400">{vid.category} • {vid.exam}</span>
                            </div>
                            <input type="checkbox" checked={isSelected} readOnly className="accent-orange-500" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    onClick={() => setShowAllocateModal(false)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignVideos}
                    disabled={allocatingLoading || allocatingVideoIds.length === 0}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-orange-600/20"
                  >
                    {allocatingLoading ? 'Allocating...' : `Apply Allocation (${allocatingVideoIds.length})`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 360° Student Slide-Over Drawer */}
          <StudentDrawer
            studentId={selectedStudentId}
            isOpen={isStudentDrawerOpen}
            onClose={() => {
              setIsStudentDrawerOpen(false);
              setSelectedStudentId(null);
            }}
            onStatusChanged={() => loadEnrolledStudents()}
          />
        </main>
      </div>
    </div>
  );
}
