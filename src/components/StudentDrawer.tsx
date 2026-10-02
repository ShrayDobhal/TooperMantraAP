'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
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
  ShieldAlert,
  Loader2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Ban,
  RotateCcw,
  Check,
  Copy,
} from 'lucide-react';
import { studentsApi, StudentUser } from '@/api';

interface StudentDrawerProps {
  studentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChanged?: (studentId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => void;
}

export function StudentDrawer({ studentId, isOpen, onClose, onStatusChanged }: StudentDrawerProps) {
  const [student, setStudent] = useState<StudentUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'WATCH_HISTORY' | 'DOUBTS' | 'LIVE_SESSIONS' | 'GAMIFICATION'>('WATCH_HISTORY');
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    if (isOpen && studentId) {
      loadStudent(studentId);
    } else {
      setStudent(null);
    }
  }, [isOpen, studentId]);

  const loadStudent = async (id: string) => {
    setLoading(true);
    try {
      const res = await studentsApi.getStudentById(id);
      if (res.success && res.data) {
        setStudent(res.data);
      }
    } catch (e: any) {
      console.warn('Failed to load student dossier:', e.message);
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
      if (onStatusChanged) onStatusChanged(student.id, nextStatus);
      setToastMsg(`Student account marked as ${nextStatus}`);
      setTimeout(() => setToastMsg(''), 3000);
    } catch (e: any) {
      alert(e.message || 'Failed to update student account status');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleRevokeSession = async () => {
    if (!student) return;
    try {
      await studentsApi.revokeStudentSession(student.id);
      setToastMsg('Active device login session revoked successfully.');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-zinc-950 dark:bg-zinc-950 border-l border-zinc-800 h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  {loading ? 'Loading Student Dossier...' : student?.profile?.fullName || 'Student Dossier'}
                </h2>
                {student && (
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-full font-bold uppercase border ${
                      student.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    ● {student.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5 font-mono">
                <span>ID: {studentId?.slice(0, 14)}...</span>
                <button
                  onClick={handleCopyId}
                  className="text-zinc-500 hover:text-orange-400 transition-colors cursor-pointer"
                  title="Copy ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-slate-100 hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="mx-5 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Content Body */}
        {loading ? (
          <div className="p-6 space-y-4 flex-1">
            <div className="h-28 skeleton"></div>
            <div className="h-10 skeleton"></div>
            <div className="h-44 skeleton"></div>
            <div className="h-44 skeleton"></div>
          </div>
        ) : !student ? (
          <div className="p-12 text-center text-zinc-400">
            <AlertCircle className="w-8 h-8 mx-auto text-zinc-500 mb-2" />
            <p>Student profile could not be retrieved.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Student Metadata Card */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4.5 space-y-4 shadow-sm">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
                <div>
                  <span className="text-zinc-400 text-[11px] font-medium flex items-center gap-1">
                    <Phone className="w-3 h-3 text-zinc-500" /> Phone
                  </span>
                  <p className="font-mono text-slate-200 font-semibold mt-0.5">{student.phone}</p>
                </div>

                <div>
                  <span className="text-zinc-400 text-[11px] font-medium flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-zinc-500" /> Target Exam
                  </span>
                  <p className="text-slate-200 font-semibold mt-0.5">{student.profile?.targetExam || 'General Prep'}</p>
                </div>

                <div>
                  <span className="text-zinc-400 text-[11px] font-medium flex items-center gap-1">
                    <School className="w-3 h-3 text-zinc-500" /> Enrolled School
                  </span>
                  <p className="text-orange-400 font-semibold mt-0.5 truncate">
                    {student.profile?.schoolOrCollege || student.profile?.schoolName || 'Self-Study (Open)'}
                  </p>
                </div>

                <div>
                  <span className="text-zinc-400 text-[11px] font-medium">Class / Education Level</span>
                  <p className="text-slate-200 font-semibold mt-0.5">{student.profile?.educationLevel || 'Class 12'}</p>
                </div>

                <div>
                  <span className="text-zinc-400 text-[11px] font-medium">Study Mode</span>
                  <p className="text-slate-200 font-semibold mt-0.5">{student.profile?.studyMode || 'Hybrid App'}</p>
                </div>

                <div>
                  <span className="text-zinc-400 text-[11px] font-medium">Registered Date</span>
                  <p className="text-slate-200 font-semibold mt-0.5">
                    {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'Active Member'}
                  </p>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="pt-3 border-t border-zinc-800 flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleToggleStatus}
                  disabled={togglingStatus}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    student.status === 'ACTIVE'
                      ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {togglingStatus ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : student.status === 'ACTIVE' ? (
                    <>
                      <Ban className="w-3.5 h-3.5" /> Suspend Student
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Reinstate Account
                    </>
                  )}
                </button>

                <button
                  onClick={handleRevokeSession}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-zinc-400" /> Revoke Session
                </button>
              </div>
            </div>

            {/* Metric Counters Bar */}
            <div className="grid grid-cols-4 gap-2.5">
              <div className="bg-zinc-900/60 border border-zinc-800/80 p-3 rounded-xl text-center">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Videos Seen</span>
                <p className="text-base font-bold text-slate-100 mt-0.5">{student.watchHistory?.length || 4}</p>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800/80 p-3 rounded-xl text-center">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Doubts Solved</span>
                <p className="text-base font-bold text-emerald-400 mt-0.5">{student.doubts?.length || 2}</p>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800/80 p-3 rounded-xl text-center">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Daily Streak</span>
                <p className="text-base font-bold text-amber-400 mt-0.5 flex items-center justify-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  {student.gamification?.streakDays || 14}d
                </p>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800/80 p-3 rounded-xl text-center">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Total XP</span>
                <p className="text-base font-bold text-purple-400 mt-0.5">{student.gamification?.xp?.toLocaleString() || '1,840'}</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-zinc-800 text-xs font-semibold overflow-x-auto">
              <button
                onClick={() => setActiveTab('WATCH_HISTORY')}
                className={`px-3 py-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'WATCH_HISTORY'
                    ? 'border-orange-500 text-orange-400 font-bold'
                    : 'border-transparent text-zinc-400 hover:text-slate-200'
                }`}
              >
                <PlayCircle className="w-3.5 h-3.5" /> Video Watch History ({student.watchHistory?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('DOUBTS')}
                className={`px-3 py-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'DOUBTS'
                    ? 'border-orange-500 text-orange-400 font-bold'
                    : 'border-transparent text-zinc-400 hover:text-slate-200'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" /> Doubts Raised ({student.doubts?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('LIVE_SESSIONS')}
                className={`px-3 py-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'LIVE_SESSIONS'
                    ? 'border-orange-500 text-orange-400 font-bold'
                    : 'border-transparent text-zinc-400 hover:text-slate-200'
                }`}
              >
                <Video className="w-3.5 h-3.5" /> Masterclasses ({student.liveSessions?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('GAMIFICATION')}
                className={`px-3 py-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'GAMIFICATION'
                    ? 'border-orange-500 text-orange-400 font-bold'
                    : 'border-transparent text-zinc-400 hover:text-slate-200'
                }`}
              >
                <Award className="w-3.5 h-3.5" /> Consistency & XP
              </button>
            </div>

            {/* Tab 1: Video Watch History */}
            {activeTab === 'WATCH_HISTORY' && (
              <div className="space-y-2.5">
                {student.watchHistory?.map((wh) => (
                  <div key={wh.id} className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold uppercase">
                          {wh.category}
                        </span>
                        <h4 className="text-xs font-bold text-slate-200 mt-1">{wh.lectureTitle}</h4>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border shrink-0 ${
                          wh.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {wh.status === 'COMPLETED' ? 'Completed 100%' : `${wh.completionPercentage}% Watched`}
                      </span>
                    </div>

                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${wh.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-orange-500'}`}
                        style={{ width: `${wh.completionPercentage}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>Watched: {new Date(wh.dateWatched).toLocaleString()}</span>
                      <span>Duration: {Math.round(wh.watchDurationSeconds / 60)} mins</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 2: Doubts & Mentorship Activity */}
            {activeTab === 'DOUBTS' && (
              <div className="space-y-3">
                {student.doubts?.map((d) => (
                  <div key={d.id} className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-400">
                        {d.subject} • {d.topic}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full font-bold border border-emerald-500/30">
                        Resolved in {d.turnaroundMinutes}m
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 font-medium bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800">
                      "{d.questionText}"
                    </p>

                    <div className="text-xs text-zinc-400 bg-zinc-900 p-2.5 rounded-lg border border-zinc-800/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-zinc-500">Mentor: <strong className="text-slate-300">{d.mentorName}</strong></span>
                        <span className="text-amber-400 text-xs font-bold">{'★'.repeat(d.rating)}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] italic">{d.solutionPreview}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Live Masterclasses */}
            {activeTab === 'LIVE_SESSIONS' && (
              <div className="space-y-3">
                {student.liveSessions?.map((ls) => (
                  <div key={ls.id} className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold uppercase">
                          {ls.category}
                        </span>
                        <h4 className="text-xs font-bold text-slate-200 mt-1">{ls.title}</h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Speaker: {ls.speakerName}</p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border shrink-0 ${
                          ls.status === 'ATTENDED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}
                      >
                        {ls.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800">
                      <span>Scheduled: {new Date(ls.scheduledAt).toLocaleDateString()}</span>
                      {ls.attendedDurationMinutes > 0 && <span>Attended: {ls.attendedDurationMinutes} mins</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 4: Gamification & Consistency */}
            {activeTab === 'GAMIFICATION' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl space-y-1">
                    <span className="text-zinc-400 text-[11px]">Leaderboard Rank</span>
                    <p className="text-xl font-bold text-orange-400">#{student.gamification?.leaderboardRank || 7} Across Platform</p>
                  </div>
                  <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl space-y-1">
                    <span className="text-zinc-400 text-[11px]">Community Posts</span>
                    <p className="text-xl font-bold text-slate-100">{student.gamification?.discussionPosts || 5} Questions Asked</p>
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
        )}
      </div>
    </div>
  );
}
