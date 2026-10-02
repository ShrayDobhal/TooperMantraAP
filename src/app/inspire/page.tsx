'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  videosApi,
  schoolsApi,
  VideoItem,
  School,
  PILLAR_SECTIONS,
  matchesPillar,
} from '@/api';
import { exportToCSV } from '@/lib/exportUtils';
import {
  Video,
  Plus,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  School as SchoolIcon,
  Tag,
  Loader2,
  Film,
  Sparkles,
  Clock,
  Upload,
  X,
  Layers,
  Filter,
  Download,
  Calendar,
  Eye,
  Check,
} from 'lucide-react';
import { uploadImageToBunnyStorage, compressImageToBlob } from '@/lib/bunnyStorage';

const EXAMS = ['All', 'JEE', 'NEET', 'CUET', 'Boards', 'Other'];
const CLASSES = [
  { label: 'All Classes', value: 'ALL' },
  { label: 'Class 9', value: 'CLASS_9' },
  { label: 'Class 10', value: 'CLASS_10' },
  { label: 'Class 11', value: 'CLASS_11' },
  { label: 'Class 12', value: 'CLASS_12' },
  { label: 'Dropper', value: 'DROPPER' },
];

export default function InspireHubPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Filters
  const [activePillar, setActivePillar] = useState('ALL');
  const [selectedExam, setSelectedExam] = useState('All');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('ALL');

  // Bulk Selection
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [targetSchoolsForBulk, setTargetSchoolsForBulk] = useState<string[]>([]);
  const [bulkReleaseType, setBulkReleaseType] = useState<'IMMEDIATE' | 'SCHEDULED' | 'EARLY_ACCESS'>('IMMEDIATE');
  const [bulkScheduleDate, setBulkScheduleDate] = useState<string>(
    new Date(Date.now() + 7 * 86400 * 1000).toISOString().slice(0, 10)
  );
  const [bulkAssigning, setBulkAssigning] = useState(false);

  // New Video Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('INSPIRE');
  const [newExam, setNewExam] = useState('JEE');
  const [newClass, setNewClass] = useState('ALL');
  const [newYoutubeId, setNewYoutubeId] = useState('');
  const [newThumbnailUrl, setNewThumbnailUrl] = useState('');
  const [newDurationMins, setNewDurationMins] = useState(25);
  const [newScope, setNewScope] = useState<'GLOBAL' | 'SCHOOL_RESTRICTED'>('GLOBAL');
  const [newSelectedSchools, setNewSelectedSchools] = useState<string[]>([]);
  const [addingVideo, setAddingVideo] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [vRes, sRes] = await Promise.all([
        videosApi.getVideos({ limit: 100 }),
        schoolsApi.getSchools(),
      ]);
      if (vRes.success) setVideos(vRes.data.items || []);
      if (sRes.success) setSchools(sRes.data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch video repository.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumb(true);
    try {
      const compressed = await compressImageToBlob(file, 1280, 720, 0.85);
      const url = await uploadImageToBunnyStorage(compressed, `thumb_${Date.now()}.jpg`);
      setNewThumbnailUrl(url);
      setToastMsg('✓ 16:9 Thumbnail uploaded to Bunny CDN!');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Thumbnail upload failed');
    } finally {
      setUploadingThumb(false);
    }
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingVideo(true);
    try {
      const res = await videosApi.createVideo({
        title: newTitle,
        description: newDescription,
        category: newCategory,
        exam: newExam,
        classLevel: newClass,
        youtubeId: newYoutubeId || undefined,
        videoUrl: newYoutubeId ? `https://www.youtube.com/watch?v=${newYoutubeId}` : undefined,
        thumbnailUrl: newThumbnailUrl || undefined,
        durationSeconds: newDurationMins * 60,
      });

      if (res.success && res.data) {
        if (newScope === 'SCHOOL_RESTRICTED' && newSelectedSchools.length > 0) {
          for (const sId of newSelectedSchools) {
            await schoolsApi.assignVideosToSchool(sId, [res.data.id], { releaseType: 'IMMEDIATE' });
          }
        }

        setToastMsg(`✓ Lecture "${newTitle}" published successfully!`);
        setShowAddModal(false);
        setNewTitle('');
        setNewDescription('');
        setNewYoutubeId('');
        setNewThumbnailUrl('');
        await fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create video.');
    } finally {
      setAddingVideo(false);
    }
  };

  const handleBulkAssign = async () => {
    if (selectedVideoIds.length === 0 || targetSchoolsForBulk.length === 0) return;
    setBulkAssigning(true);
    try {
      for (const sId of targetSchoolsForBulk) {
        await schoolsApi.assignVideosToSchool(sId, selectedVideoIds, {
          releaseType: bulkReleaseType,
          scheduledDate: bulkReleaseType === 'SCHEDULED' ? bulkScheduleDate : undefined,
        });
      }
      setToastMsg(`✓ Batch distribution applied: ${selectedVideoIds.length} lectures provisioned across ${targetSchoolsForBulk.length} schools!`);
      setShowBulkAssignModal(false);
      setSelectedVideoIds([]);
      setTargetSchoolsForBulk([]);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Bulk assignment failed.');
    } finally {
      setBulkAssigning(false);
    }
  };

  const handleDeleteVideo = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await videosApi.deleteVideo(id);
      setToastMsg(`✓ Video removed.`);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete video.');
    }
  };

  const handleExportCSV = () => {
    if (videos.length === 0) return;
    const exportData = filteredVideos.map((v) => ({
      VideoID: v.id,
      Title: v.title,
      Pillar: v.category,
      TargetExam: v.exam || 'ALL',
      ClassLevel: v.classLevel || 'ALL',
      DurationMinutes: Math.round((v.durationSeconds || 0) / 60),
      Status: v.status || 'READY',
      CreatedDate: v.createdAt || '',
    }));
    exportToCSV(exportData, 'TopperMantra_Video_Catalog');
  };

  const filteredVideos = videos.filter((v) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      v.title.toLowerCase().includes(q) ||
      (v.description || '').toLowerCase().includes(q) ||
      (v.tags || []).some((t) => t.toLowerCase().includes(q));

    const matchesPillarCat = activePillar === 'ALL' || matchesPillar(v.category, activePillar);
    const matchesExam = selectedExam === 'All' || (v.exam || '').toUpperCase() === selectedExam.toUpperCase();
    const matchesClass = selectedClass === 'ALL' || (v.classLevel || '') === selectedClass;

    return matchesSearch && matchesPillarCat && matchesExam && matchesClass;
  });

  return (
    <div className="flex min-h-screen bg-zinc-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-6 flex-1 animate-in fade-in duration-300">
          {/* Top Title Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                  Inspire Hub & Granular Video CMS
                </h1>
              </div>
              <p className="text-zinc-400 text-xs mt-1">
                Centralized multi-tenant repository for uploading masterclasses, assigning staged release schedules, and provisioning custom curriculum to partner schools.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={fetchData}
                disabled={loading}
                className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Refresh Repository"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-400' : ''}`} />
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-zinc-400" /> Export CSV
              </button>

              {selectedVideoIds.length > 0 && (
                <button
                  onClick={() => setShowBulkAssignModal(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-purple-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <SchoolIcon className="w-4 h-4" /> Assign Selected ({selectedVideoIds.length})
                </button>
              )}

              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-orange-600/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Upload Lecture
              </button>
            </div>
          </div>

          {/* Pillar Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
            {PILLAR_SECTIONS.map((pillar) => (
              <button
                key={pillar.id}
                onClick={() => setActivePillar(pillar.code)}
                className={`px-3.5 py-2 rounded-xl border transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activePillar === pillar.code
                    ? 'bg-orange-500/10 border-orange-500 text-orange-400 font-bold shadow-xs'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-slate-200'
                }`}
              >
                <span>{pillar.emoji}</span>
                <span>{pillar.name}</span>
              </button>
            ))}
          </div>

          {/* Search & Exam Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2 w-full sm:w-80 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 focus-within:border-zinc-700 transition-colors">
              <Search className="w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search lectures by title, topic, or tags..."
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
              <div className="flex items-center gap-1">
                <span className="text-zinc-500 text-[11px] uppercase tracking-wider">Exam:</span>
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none"
                >
                  {EXAMS.map((ex) => (
                    <option key={ex} value={ex}>
                      {ex}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-zinc-500 text-[11px] uppercase tracking-wider">Class:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none"
                >
                  {CLASSES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={fetchData} className="px-3 py-1 bg-rose-600 text-white rounded-md text-xs font-semibold hover:bg-rose-500">
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

          {/* Videos Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="h-64 skeleton"></div>
              <div className="h-64 skeleton"></div>
              <div className="h-64 skeleton"></div>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="p-16 text-center text-zinc-400 space-y-2 exec-card">
              <Film className="w-10 h-10 mx-auto text-zinc-600" />
              <p className="text-sm font-semibold text-slate-300">No lectures match the active filters.</p>
              <p className="text-xs text-zinc-500">Try switching the pillar tab or clearing search filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredVideos.map((video) => {
                const isSelected = selectedVideoIds.includes(video.id);
                return (
                  <div
                    key={video.id}
                    className={`exec-card overflow-hidden flex flex-col justify-between transition-all ${
                      isSelected ? 'border-orange-500 shadow-orange-500/10' : ''
                    }`}
                  >
                    <div>
                      {/* Video Thumbnail */}
                      <div className="relative aspect-video bg-zinc-900 overflow-hidden group">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            <Video className="w-10 h-10" />
                          </div>
                        )}

                        {/* Top Badges */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-zinc-950/80 backdrop-blur-md text-slate-200 border border-zinc-700">
                            {video.category}
                          </span>
                          {video.exam && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-orange-500/90 text-white">
                              {video.exam}
                            </span>
                          )}
                        </div>

                        {/* Duration Pill */}
                        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-white text-[10px] font-mono font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.round((video.durationSeconds || 0) / 60)} mins
                        </div>

                        {/* Checkbox for batch provisioning */}
                        <div className="absolute top-2.5 right-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedVideoIds([...selectedVideoIds, video.id]);
                              } else {
                                setSelectedVideoIds(selectedVideoIds.filter((id) => id !== video.id));
                              }
                            }}
                            className="w-4 h-4 accent-orange-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-4 space-y-2">
                        <h3 className="text-sm font-bold text-slate-100 line-clamp-2 leading-snug">{video.title}</h3>
                        {video.description && (
                          <p className="text-xs text-zinc-400 line-clamp-2">{video.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 pt-0 border-t border-zinc-800/80 mt-2 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-zinc-500 font-mono">
                        Target: {video.classLevel || 'ALL'}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeleteVideo(video.id, video.title)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete Video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bulk Assign Modal */}
          {showBulkAssignModal && (
            <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Batch Video Allocation</h3>
                    <p className="text-xs text-zinc-400">
                      Provision {selectedVideoIds.length} lectures across partner schools
                    </p>
                  </div>
                  <button onClick={() => setShowBulkAssignModal(false)} className="text-zinc-400 hover:text-slate-100 p-1">
                    ✕
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-zinc-300 block mb-1">Release Rollout Policy</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setBulkReleaseType('IMMEDIATE')}
                        className={`p-2.5 rounded-xl border text-center transition-colors cursor-pointer ${
                          bulkReleaseType === 'IMMEDIATE'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        ● Immediate
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkReleaseType('EARLY_ACCESS')}
                        className={`p-2.5 rounded-xl border text-center transition-colors cursor-pointer ${
                          bulkReleaseType === 'EARLY_ACCESS'
                            ? 'bg-purple-500/10 border-purple-500 text-purple-400 font-bold'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        ★ Early Access
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkReleaseType('SCHEDULED')}
                        className={`p-2.5 rounded-xl border text-center transition-colors cursor-pointer ${
                          bulkReleaseType === 'SCHEDULED'
                            ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        ⏳ Future Date
                      </button>
                    </div>
                  </div>

                  {bulkReleaseType === 'SCHEDULED' && (
                    <div>
                      <label className="font-semibold text-zinc-300 block mb-1">Scheduled Release Date</label>
                      <input
                        type="date"
                        value={bulkScheduleDate}
                        onChange={(e) => setBulkScheduleDate(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-slate-100"
                      />
                    </div>
                  )}

                  <div>
                    <label className="font-semibold text-zinc-300 block mb-1">
                      Select Target Schools ({targetSchoolsForBulk.length} Selected)
                    </label>
                    <div className="max-h-48 overflow-y-auto space-y-1 border border-zinc-800 rounded-xl p-2 bg-zinc-900/40">
                      {schools.map((s) => {
                        const checked = targetSchoolsForBulk.includes(s.id);
                        return (
                          <div
                            key={s.id}
                            onClick={() => {
                              if (checked) {
                                setTargetSchoolsForBulk(targetSchoolsForBulk.filter((id) => id !== s.id));
                              } else {
                                setTargetSchoolsForBulk([...targetSchoolsForBulk, s.id]);
                              }
                            }}
                            className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                              checked ? 'bg-orange-500/10 text-orange-300' : 'hover:bg-zinc-800 text-slate-200'
                            }`}
                          >
                            <span className="font-bold">{s.name} ({s.code})</span>
                            <input type="checkbox" checked={checked} readOnly className="accent-orange-500" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    onClick={() => setShowBulkAssignModal(false)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkAssign}
                    disabled={bulkAssigning || targetSchoolsForBulk.length === 0}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl font-semibold shadow-lg shadow-orange-600/20"
                  >
                    {bulkAssigning ? 'Applying...' : 'Apply Distribution'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upload Video Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-orange-400" />
                    <h3 className="text-base font-bold text-slate-100">Upload & Provision Lecture</h3>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-slate-100 p-1">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateVideo} className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-zinc-300 block mb-1">Lecture Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Definite Integration & Bypass Shortcuts for Advanced"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-300 block mb-1">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Brief synopsis of topics covered..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold text-zinc-300 block mb-1">Pillar</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
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
                      <label className="font-semibold text-zinc-300 block mb-1">Exam</label>
                      <select
                        value={newExam}
                        onChange={(e) => setNewExam(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-slate-100"
                      >
                        {EXAMS.filter((e) => e !== 'All').map((e) => (
                          <option key={e} value={e}>
                            {e}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-300 block mb-1">Class Level</label>
                      <select
                        value={newClass}
                        onChange={(e) => setNewClass(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-slate-100"
                      >
                        {CLASSES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-300 block mb-1">YouTube Video ID (or Bunny GUID)</label>
                    <input
                      type="text"
                      placeholder="e.g. lw2X3PxKlAY"
                      value={newYoutubeId}
                      onChange={(e) => setNewYoutubeId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 font-mono text-orange-400"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-300 block mb-1">16:9 Thumbnail Image</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        className="text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-slate-200 hover:file:bg-zinc-700 cursor-pointer"
                      />
                      {uploadingThumb && <Loader2 className="w-4 h-4 animate-spin text-orange-400" />}
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
                      disabled={addingVideo}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl font-semibold shadow-lg shadow-orange-600/20"
                    >
                      {addingVideo ? 'Publishing...' : 'Publish Lecture'}
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
