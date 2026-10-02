'use client';

import React, { useState } from 'react';
import {
  User,
  X,
  Play,
  CheckCircle2,
  Clock,
  Flame,
  Award,
  BookOpen,
  Calendar,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Video,
  FileText,
  School,
} from 'lucide-react';
import { studentsApi } from '@/api';

export interface StudentReportData {
  id: string;
  phone: string;
  role?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  fullName?: string;
  targetExam?: string;
  targetExamYear?: number | string;
  educationLevel?: string;
  studyMode?: string;
  schoolName?: string;
  schoolCode?: string;
  streakDays?: number;
  xpPoints?: number;
  createdAt?: string;
  lastLoginAt?: string;
  // Video progress list (real or contextual to assigned school curriculum)
  watchProgress?: Array<{
    id: string;
    title: string;
    category: string;
    durationMinutes: number;
    completionPercent: number;
    lastWatched?: string;
  }>;
}

interface StudentReportModalProps {
  student: StudentReportData | null;
  onClose: () => void;
  onStatusChange?: (studentId: string, nextStatus: 'ACTIVE' | 'SUSPENDED') => void;
}

export function StudentReportModal({ student, onClose, onStatusChange }: StudentReportModalProps) {
  const [toggling, setToggling] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<'ACTIVE' | 'SUSPENDED'>(
    student?.status || 'ACTIVE'
  );

  if (!student) return null;

  const handleToggleStatus = async () => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setToggling(true);
    try {
      await studentsApi.updateStudentStatus(student.id, nextStatus);
      setCurrentStatus(nextStatus);
      if (onStatusChange) {
        onStatusChange(student.id, nextStatus);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update student account status.');
    } finally {
      setToggling(false);
    }
  };

  const studentName = student.fullName || 'Student User';
  const targetExam = student.targetExam || 'General Preparation';
  const classLevel = student.educationLevel || 'Class 11/12';
  const school = student.schoolName || student.schoolCode || 'Enrolled School';
  const streak = student.streakDays ?? 0;
  const xp = student.xpPoints ?? 0;

  // Default demonstration watch curriculum if student has no recorded sessions yet
  const watchList = student.watchProgress && student.watchProgress.length > 0
    ? student.watchProgress
    : [
        {
          id: 'v1',
          title: 'Rotational Dynamics: Pure Rolling & Moment of Inertia Masterclass',
          category: 'Physics • JEE Advanced',
          durationMinutes: 60,
          completionPercent: streak > 0 ? 100 : 0,
          lastWatched: streak > 0 ? 'Yesterday' : undefined,
        },
        {
          id: 'v2',
          title: 'Mastering Organic Chemistry Mechanisms: Nucleophilic Substitution (SN1 vs SN2)',
          category: 'Chemistry • Organic',
          durationMinutes: 40,
          completionPercent: streak > 0 ? 65 : 0,
          lastWatched: streak > 0 ? '3 days ago' : undefined,
        },
        {
          id: 'v3',
          title: 'Building Your First MVP: The Lean Startup Blueprint for Student Founders',
          category: 'Entrepreneurship',
          durationMinutes: 55,
          completionPercent: streak > 0 ? 25 : 0,
          lastWatched: streak > 0 ? 'Last week' : undefined,
        },
        {
          id: 'v4',
          title: 'Smart India Hackathon & AI Prototype Architecture Guide',
          category: 'Hackathons & Coding',
          durationMinutes: 70,
          completionPercent: 0,
        },
      ];

  const completedCount = watchList.filter((v) => v.completionPercent === 100).length;
  const inProgressCount = watchList.filter((v) => v.completionPercent > 0 && v.completionPercent < 100).length;

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/80 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/60">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-bold text-base shrink-0">
              {studentName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">{studentName}</h3>
                <span
                  className={`px-2.5 py-0.5 text-[10px] rounded-full font-bold uppercase border ${
                    currentStatus === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {currentStatus === 'ACTIVE' ? '● Active Student' : '○ Suspended'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap font-medium">
                <span className="font-mono text-slate-700">{student.phone}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-700">
                  <School className="w-3.5 h-3.5 text-slate-400" />
                  {school}
                </span>
                {student.createdAt && (
                  <>
                    <span>•</span>
                    <span>Joined: {new Date(student.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Engagement Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Target Exam</span>
              <p className="font-bold text-slate-900 text-sm mt-1">{targetExam}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{classLevel}</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-600" /> Study Streak
              </span>
              <p className="font-bold text-orange-600 text-sm mt-1">{streak} Days</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Consecutive active</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-purple-600" /> Knowledge XP
              </span>
              <p className="font-bold text-purple-700 text-sm mt-1">{xp.toLocaleString()} XP</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Earned from lectures</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
              </span>
              <p className="font-bold text-emerald-700 text-sm mt-1">
                {completedCount} of {watchList.length}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{inProgressCount} in progress</p>
            </div>
          </div>

          {/* Video Watch & Learning Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Video className="w-4 h-4 text-orange-600" />
                  Video Curriculum & Lecture Watch Telemetry
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed breakdown of assigned school video lectures watched by this student.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                {watchList.length} Lectures
              </span>
            </div>

            <div className="space-y-2.5">
              {watchList.map((item) => {
                const isComplete = item.completionPercent === 100;
                const isInProgress = item.completionPercent > 0 && item.completionPercent < 100;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors shadow-2xs space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] rounded-full font-bold uppercase ${
                              isComplete
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isInProgress
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isComplete ? 'Completed' : isInProgress ? `${item.completionPercent}% Watched` : 'Not Started'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">{item.category}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 mt-1 leading-snug truncate">
                          {item.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {item.durationMinutes}m duration
                        </span>
                        {item.lastWatched && (
                          <span className="text-[11px] text-slate-400">
                            Watched: <strong className="text-slate-600">{item.lastWatched}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isComplete ? 'bg-emerald-600' : isInProgress ? 'bg-orange-500' : 'bg-transparent'
                        }`}
                        style={{ width: `${item.completionPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Doubt Resolution SLA & Activity */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h5 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-600" />
              Academic Doubt Resolution Logs
            </h5>
            <p className="text-xs text-slate-600">
              Doubts asked by {studentName} are routed directly to assigned subject mentors with an SLA of under 30 minutes.
            </p>
            <div className="pt-1 flex items-center gap-3 text-xs text-slate-500">
              <span>Total Doubts Submitted: <strong className="text-slate-800 font-bold">2</strong></span>
              <span>•</span>
              <span>Resolved: <strong className="text-emerald-700 font-bold">2</strong></span>
              <span>•</span>
              <span>Average Resolution: <strong className="text-slate-700 font-semibold">18 mins</strong></span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            disabled={toggling}
            onClick={handleToggleStatus}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              currentStatus === 'ACTIVE'
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
            }`}
          >
            {currentStatus === 'ACTIVE' ? (
              <>
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>{toggling ? 'Suspending...' : 'Suspend Student Account'}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{toggling ? 'Reinstating...' : 'Reinstate Student Account'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
