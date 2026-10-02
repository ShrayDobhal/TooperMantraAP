'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { liveSessionsApi, LiveSessionItem, schoolsApi, School, PILLAR_SECTIONS } from '@/api';
import { exportToCSV } from '@/lib/exportUtils';
import {
  Radio,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Video,
  Users,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  School as SchoolIcon,
  Search,
  Download,
  PlayCircle,
  Eye,
  Sparkles,
} from 'lucide-react';

export default function LiveSessionsPage() {
  const [sessions, setSessions] = useState<LiveSessionItem[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [search, setSearch] = useState('');

  // Create Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [pillar, setPillar] = useState('ACADEMIC');
  const [speakerName, setSpeakerName] = useState('');
  const [speakerDesignation, setSpeakerDesignation] = useState('');
  const [scheduledTime, setScheduledTime] = useState(
    new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16)
  );
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [streamUrl, setStreamUrl] = useState('https://meet.google.com/top-mant-live');
  const [scope, setScope] = useState<'GLOBAL' | 'SCHOOL_RESTRICTED'>('GLOBAL');
  const [targetSchoolIds, setTargetSchoolIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Attach Recording Modal
  const [recordingSession, setRecordingSession] = useState<LiveSessionItem | null>(null);
  const [recordingUrl, setRecordingUrl] = useState('');

  const fetchSessions = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [sRes, schRes] = await Promise.all([
        liveSessionsApi.getSessions(),
        schoolsApi.getSchools(),
      ]);
      if (sRes.success) setSessions(sRes.data || []);
      if (schRes.success) setSchools(schRes.data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch live masterclasses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await liveSessionsApi.createSession({
        title,
        pillar,
        speakerName,
        speakerDesignation,
        scheduledTime,
        durationMinutes: Number(durationMinutes),
        streamUrl,
        targetSchoolScope: scope,
        assignedSchoolIds: scope === 'SCHOOL_RESTRICTED' ? targetSchoolIds : undefined,
        status: new Date(scheduledTime) < new Date() ? 'LIVE' : 'UPCOMING',
      });
      setToastMsg(`✓ Masterclass "${title}" scheduled!`);
      setShowAddModal(false);
      setTitle('');
      setSpeakerName('');
      setSpeakerDesignation('');
      await fetchSessions();
    } catch (err: any) {
      alert(err.message || 'Failed to create session');
    } finally {
      setCreating(false);
    }
  };

  const handleAttachRecording = async () => {
    if (!recordingSession || !recordingUrl) return;
    try {
      await liveSessionsApi.updateSession(recordingSession.id, {
        recordingUrl,
        status: 'COMPLETED',
      });
      setToastMsg('✓ Recording attached and published to students!');
      setRecordingSession(null);
      setRecordingUrl('');
      await fetchSessions();
    } catch (err: any) {
      alert(err.message || 'Failed to attach recording');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Cancel and delete this masterclass?')) return;
    try {
      await liveSessionsApi.deleteSession(id);
      setToastMsg('✓ Session deleted.');
      await fetchSessions();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleExportCSV = () => {
    if (sessions.length === 0) return;
    const exportData = filtered.map((s) => ({
      ID: s.id,
      Title: s.title,
      Pillar: s.pillar,
      Speaker: `${s.speakerName} (${s.speakerDesignation})`,
      ScheduledTime: s.scheduledTime,
      DurationMinutes: s.durationMinutes,
      Status: s.status,
      SchoolScope: s.targetSchoolScope,
      EnrolledStudents: s.enrolledStudentsCount,
    }));
    exportToCSV(exportData, 'TopperMantra_Masterclasses_Schedule');
  };

  const filtered = sessions.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      s.title.toLowerCase().includes(q) ||
      s.speakerName.toLowerCase().includes(q) ||
      s.pillar.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
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
                  <Radio className="w-4.5 h-4.5" />
                </div>
                <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                  Live Masterclasses & Event Dispatcher
                </h1>
              </div>
              <p className="text-zinc-400 text-xs mt-1">
                Schedule interactive webinars, configure Google Meet/Zoom room links, restrict institutional cohorts, and publish post-session lecture recordings.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={fetchSessions}
                disabled={loading}
                className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Refresh Sessions"
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
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-orange-600/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Schedule Masterclass
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2 w-full sm:w-80 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 focus-within:border-zinc-700 transition-colors">
              <Search className="w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search masterclasses by title or speaker..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-xs text-slate-100 placeholder:text-zinc-500 focus:outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-1 text-xs">
              {(['ALL', 'LIVE', 'UPCOMING', 'COMPLETED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-zinc-800 text-slate-100 font-semibold'
                      : 'text-zinc-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
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

          {/* Masterclasses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((s) => (
              <div key={s.id} className="exec-card overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="relative aspect-video bg-zinc-900 overflow-hidden">
                    {s.bannerUrl ? (
                      <img src={s.bannerUrl} alt={s.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <Radio className="w-10 h-10" />
                      </div>
                    )}

                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                          s.status === 'LIVE'
                            ? 'bg-rose-500 text-white animate-pulse'
                            : s.status === 'UPCOMING'
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        }`}
                      >
                        ● {s.status}
                      </span>

                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-black/60 backdrop-blur-md text-slate-200">
                        {s.pillar}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-white text-[10px] font-mono font-semibold">
                      {s.durationMinutes} mins
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="text-sm font-bold text-slate-100 line-clamp-2 leading-snug">{s.title}</h3>
                    <div className="text-xs text-zinc-400 space-y-0.5">
                      <p className="font-semibold text-slate-200">Speaker: {s.speakerName}</p>
                      <p className="text-[11px] text-zinc-500">{s.speakerDesignation}</p>
                    </div>

                    <div className="text-[11px] text-zinc-400 pt-2 flex items-center justify-between border-t border-zinc-800">
                      <span>Scheduled: {new Date(s.scheduledTime).toLocaleString()}</span>
                      <span className="font-semibold text-orange-400">
                        {s.targetSchoolScope === 'GLOBAL' ? 'Open Community' : 'School Exclusive'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-zinc-800/80 mt-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {s.streamUrl && (
                      <a
                        href={s.streamUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        Join Room <ExternalLink className="w-3 h-3 text-orange-400" />
                      </a>
                    )}

                    {s.status === 'COMPLETED' && !s.recordingUrl && (
                      <button
                        onClick={() => setRecordingSession(s)}
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-xs font-semibold transition-colors"
                      >
                        Attach Video
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Schedule Masterclass Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-orange-400" />
                    <h3 className="text-base font-bold text-slate-100">Schedule Live Masterclass</h3>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-slate-100 p-1">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateSession} className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-zinc-300 block mb-1">Session Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Masterclass: Scoring 99+ Percentile in Physics"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-slate-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-zinc-300 block mb-1">Speaker Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Priya Narang"
                        value={speakerName}
                        onChange={(e) => setSpeakerName(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-zinc-300 block mb-1">Speaker Title / College</label>
                      <input
                        type="text"
                        placeholder="e.g. AIR 4 JEE Advanced, IIT Delhi"
                        value={speakerDesignation}
                        onChange={(e) => setSpeakerDesignation(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold text-zinc-300 block mb-1">Pillar</label>
                      <select
                        value={pillar}
                        onChange={(e) => setPillar(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-slate-100"
                      >
                        {PILLAR_SECTIONS.filter((p) => p.code !== 'ALL').map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-300 block mb-1">Date & Time *</label>
                      <input
                        type="datetime-local"
                        required
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-300 block mb-1">Duration (Mins)</label>
                      <input
                        type="number"
                        min={15}
                        max={240}
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-300 block mb-1">Stream / Meeting Room Join URL *</label>
                    <input
                      type="url"
                      required
                      placeholder="e.g. https://meet.google.com/top-mant-live"
                      value={streamUrl}
                      onChange={(e) => setStreamUrl(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-300 block mb-1">Target School Scope</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setScope('GLOBAL')}
                        className={`p-2.5 rounded-xl border text-center transition-colors cursor-pointer ${
                          scope === 'GLOBAL'
                            ? 'bg-orange-500/10 border-orange-500 text-orange-400 font-bold'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        Global (Open Community)
                      </button>
                      <button
                        type="button"
                        onClick={() => setScope('SCHOOL_RESTRICTED')}
                        className={`p-2.5 rounded-xl border text-center transition-colors cursor-pointer ${
                          scope === 'SCHOOL_RESTRICTED'
                            ? 'bg-orange-500/10 border-orange-500 text-orange-400 font-bold'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        Restricted to Selected Schools
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl font-semibold shadow-lg shadow-orange-600/20"
                    >
                      {creating ? 'Scheduling...' : 'Dispatch Session'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Attach Recording Modal */}
          {recordingSession && (
            <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="text-base font-bold text-slate-100">Attach Session Recording</h3>
                  <button onClick={() => setRecordingSession(null)} className="text-zinc-400 hover:text-slate-100 p-1">
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <p className="text-zinc-400">
                    Provide the recorded video URL (Bunny CDN or YouTube) for <strong>{recordingSession.title}</strong>:
                  </p>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={recordingUrl}
                    onChange={(e) => setRecordingUrl(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-slate-100 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    onClick={() => setRecordingSession(null)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAttachRecording}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold"
                  >
                    Attach & Publish
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
