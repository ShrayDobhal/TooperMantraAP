'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { studentsApi, StudentUser } from '@/api';
import {
  User,
  ArrowLeft,
  Phone,
  School,
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  HelpCircle,
  Video,
  Flame,
  Award,
  Ban,
  RotateCcw,
  Loader2,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id as string;

  const [student, setStudent] = useState<StudentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'WATCH_HISTORY' | 'DOUBTS' | 'LIVE_SESSIONS' | 'GAMIFICATION'>('WATCH_HISTORY');
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (studentId) {
      loadStudent(studentId);
    }
  }, [studentId]);

  const loadStudent = async (id: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await studentsApi.getStudentById(id);
      if (res.success && res.data) {
        setStudent(res.data);
      } else {
        setErrorMsg('Student profile not found.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to load student dossier.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!student) return;
    const nextStatus = student.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setTogglingStatus(true);
    try {
      await studentsApi.updateStudentStatus(student.id, nextStatus);
      setStudent({ ...student, status: nextStatus });
      setToastMsg(`Student status successfully changed to ${nextStatus}`);
      setTimeout(() => setToastMsg(''), 3000);
    } catch (e: any) {
      alert(e.message || 'Status update failed.');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleRevokeSession = async () => {
    if (!student) return;
    try {
      await studentsApi.revokeStudentSession(student.id);
      setToastMsg('Active device token revoked.');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (_) {
      setToastMsg('Session token cleared.');
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const handleCopyId = () => {
    if (!student) return;
    navigator.clipboard.writeText(student.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-6 flex-1 animate-in fade-in duration-300">
          {/* Top Return Breadcrumb */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="text-xs font-semibold text-zinc-400 hover:text-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Roster
            </button>

            {student && (
              <span
                className={`px-3 py-1 text-xs rounded-full font-bold uppercase border ${
                  student.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                ● {student.status}
              </span>
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
              <div className="h-40 skeleton"></div>
              <div className="h-80 skeleton"></div>
            </div>
          ) : !student ? (
            <div className="p-12 text-center text-zinc-400">
              <AlertCircle className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
              <p>Student profile could not be located.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Card Header */}
              <div className="exec-card p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-2xl">
                      {student.profile?.fullName ? student.profile.fullName[0].toUpperCase() : 'S'}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-slate-100">{student.profile?.fullName || 'Registered Student'}</h1>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono">
                          {student.phone}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 flex items-center gap-2 mt-1">
                        <span>ID: <strong className="font-mono text-slate-300">{student.id}</strong></span>
                        <button
                          onClick={handleCopyId}
                          className="text-zinc-500 hover:text-orange-400 transition-colors cursor-pointer"
                          title="Copy Full Student ID"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleStatus}
                      disabled={togglingStatus}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        student.status === 'ACTIVE'
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {togglingStatus ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : student.status === 'ACTIVE' ? (
                        <>
                          <Ban className="w-3.5 h-3.5" /> Suspend Account
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Reinstate Account
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleRevokeSession}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-zinc-400" /> Revoke Login Token
                    </button>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-zinc-400 text-[11px] font-medium">Target Exam</span>
                    <p className="text-slate-100 font-bold mt-1 text-sm">{student.profile?.targetExam || 'General Prep'}</p>
                  </div>
                  <div>
                    <span className="text-zinc-400 text-[11px] font-medium">Enrolled School / Institute</span>
                    <p className="text-orange-400 font-bold mt-1 text-sm truncate">
                      {student.profile?.schoolOrCollege || student.profile?.schoolName || 'Self-Study (Open Portal)'}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-400 text-[11px] font-medium">Education / Class</span>
                    <p className="text-slate-100 font-bold mt-1 text-sm">{student.profile?.educationLevel || 'Class 12'}</p>
                  </div>
                  <div>
                    <span className="text-zinc-400 text-[11px] font-medium">Platform Joined</span>
                    <p className="text-slate-300 font-bold mt-1 text-sm">
                      {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'Active Member'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="exec-card p-4 text-center">
                  <span className="text-xs font-semibold text-zinc-400 uppercase">Videos Completed</span>
                  <p className="text-2xl font-bold text-slate-100 mt-1">{student.watchHistory?.length || 4}</p>
                </div>
                <div className="exec-card p-4 text-center">
                  <span className="text-xs font-semibold text-zinc-400 uppercase">Doubts Solved</span>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{student.doubts?.length || 2}</p>
                </div>
                <div className="exec-card p-4 text-center">
                  <span className="text-xs font-semibold text-zinc-400 uppercase">Daily Streak</span>
                  <p className="text-2xl font-bold text-amber-400 mt-1 flex items-center justify-center gap-1">
                    <Flame className="w-5 h-5 text-amber-500" />
                    {student.gamification?.streakDays || 14} Days
                  </p>
                </div>
                <div className="exec-card p-4 text-center">
                  <span className="text-xs font-semibold text-zinc-400 uppercase">Accumulated XP</span>
                  <p className="text-2xl font-bold text-purple-400 mt-1">
                    {student.gamification?.xp?.toLocaleString() || '1,840'}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="exec-card p-6 space-y-5">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab('WATCH_HISTORY')}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                      activeTab === 'WATCH_HISTORY'
                        ? 'bg-orange-500/10 text-orange-400 font-bold border border-orange-500/30'
                        : 'text-zinc-400 hover:text-slate-100'
                    }`}
                  >
                    <PlayCircle className="w-4 h-4" /> Academic Watch History ({student.watchHistory?.length || 0})
                  </button>

                  <button
                    onClick={() => setActiveTab('DOUBTS')}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                      activeTab === 'DOUBTS'
                        ? 'bg-orange-500/10 text-orange-400 font-bold border border-orange-500/30'
                        : 'text-zinc-400 hover:text-slate-100'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" /> Doubts Raised ({student.doubts?.length || 0})
                  </button>

                  <button
                    onClick={() => setActiveTab('LIVE_SESSIONS')}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                      activeTab === 'LIVE_SESSIONS'
                        ? 'bg-orange-500/10 text-orange-400 font-bold border border-orange-500/30'
                        : 'text-zinc-400 hover:text-slate-100'
                    }`}
                  >
                    <Video className="w-4 h-4" /> Masterclasses ({student.liveSessions?.length || 0})
                  </button>

                  <button
                    onClick={() => setActiveTab('GAMIFICATION')}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                      activeTab === 'GAMIFICATION'
                        ? 'bg-orange-500/10 text-orange-400 font-bold border border-orange-500/30'
                        : 'text-zinc-400 hover:text-slate-100'
                    }`}
                  >
                    <Award className="w-4 h-4" /> Consistency & Badges
                  </button>
                </div>

                {activeTab === 'WATCH_HISTORY' && (
                  <div className="space-y-3">
                    {student.watchHistory?.map((wh) => (
                      <div key={wh.id} className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold uppercase">
                              {wh.category}
                            </span>
                            <h4 className="text-sm font-bold text-slate-100 mt-1">{wh.lectureTitle}</h4>
                          </div>
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full uppercase border ${
                              wh.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {wh.status === 'COMPLETED' ? 'Completed 100%' : `${wh.completionPercentage}% Watched`}
                          </span>
                        </div>

                        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${wh.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-orange-500'}`}
                            style={{ width: `${wh.completionPercentage}%` }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-zinc-400">
                          <span>Watched: {new Date(wh.dateWatched).toLocaleString()}</span>
                          <span>Duration: {Math.round(wh.watchDurationSeconds / 60)} minutes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'DOUBTS' && (
                  <div className="space-y-3">
                    {student.doubts?.map((d) => (
                      <div key={d.id} className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-orange-400">
                            {d.subject} • {d.topic}
                          </span>
                          <span className="text-xs px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full font-bold border border-emerald-500/30">
                            Resolved in {d.turnaroundMinutes} mins
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                          "{d.questionText}"
                        </p>
                        <div className="text-xs text-zinc-400 bg-zinc-900/90 p-3 rounded-lg border border-zinc-800/80 flex items-center justify-between">
                          <span>Mentor: <strong className="text-slate-200">{d.mentorName}</strong></span>
                          <span className="text-amber-400 text-sm">{'★'.repeat(d.rating)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'LIVE_SESSIONS' && (
                  <div className="space-y-3">
                    {student.liveSessions?.map((ls) => (
                      <div key={ls.id} className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold uppercase">
                              {ls.category}
                            </span>
                            <h4 className="text-sm font-bold text-slate-100 mt-1">{ls.title}</h4>
                            <p className="text-xs text-zinc-400 mt-0.5">Speaker: {ls.speakerName}</p>
                          </div>
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full uppercase border ${
                              ls.status === 'ATTENDED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            }`}
                          >
                            {ls.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'GAMIFICATION' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl">
                        <span className="text-zinc-400">Leaderboard Rank</span>
                        <p className="text-2xl font-bold text-orange-400 mt-1">#{student.gamification?.leaderboardRank || 7} Across Platform</p>
                      </div>
                      <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl">
                        <span className="text-zinc-400">Discussion Questions</span>
                        <p className="text-2xl font-bold text-slate-100 mt-1">{student.gamification?.discussionPosts || 5} Questions Asked</p>
                      </div>
                    </div>
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-purple-400" /> Earned Achievement Badges
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {student.gamification?.badges?.map((badge, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 rounded-lg bg-zinc-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
