'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { videosApi, VideoItem, schoolsApi, School } from '@/api';
import {
  Video,
  Radio,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Search,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  School as SchoolIcon,
  CheckSquare,
  Square,
  Tag,
  BookOpen,
  GraduationCap,
  Loader2,
} from 'lucide-react';

const CATEGORIES = [
  'Academic',
  'Hackathon',
  'Drone',
  'Workshop',
  'Mentorship',
  'Strategy',
  'Career',
  'Entrepreneurship',
  'Community',
  'Event',
  'Other',
];

const EXAMS = ['JEE', 'NEET', 'CUET', 'Boards', 'Other'];

const CLASSES = ['Class 9', 'Class 10', 'Class 11', 'Class 12', 'Dropper', 'College', 'All'];

export default function LiveContentPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [examFilter, setExamFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');

  // Video Upload / Edit Modal State
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    category: 'Academic',
    exam: 'JEE',
    targetClass: 'Class 12',
    tagsInput: '',
    youtubeId: '',
    videoUrl: '',
    thumbnailUrl: '',
    durationSeconds: 1200,
  });

  // Assign Schools Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningVideo, setAssigningVideo] = useState<VideoItem | null>(null);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  const [savingAssignments, setSavingAssignments] = useState(false);

  const fetchVideosAndSchools = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [vRes, sRes] = await Promise.all([
        videosApi.getVideos({
          search,
          category: categoryFilter,
          exam: examFilter,
          targetClass: classFilter,
          schoolId: schoolFilter,
        }),
        schoolsApi.getSchools(),
      ]);

      if (vRes && vRes.success) {
        setVideos(vRes.data.items || []);
      }
      if (sRes && sRes.success) {
        setSchools(sRes.data || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load video catalog from backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideosAndSchools();
  }, [categoryFilter, examFilter, classFilter, schoolFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVideosAndSchools();
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    const tagsArr = videoForm.tagsInput
      ? videoForm.tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const payload = {
      title: videoForm.title,
      description: videoForm.description,
      category: videoForm.category,
      exam: videoForm.exam,
      targetClass: videoForm.targetClass,
      tags: tagsArr,
      youtubeId: videoForm.youtubeId,
      videoUrl: videoForm.videoUrl,
      thumbnailUrl: videoForm.thumbnailUrl,
      durationSeconds: Number(videoForm.durationSeconds),
    };

    try {
      if (selectedVideo) {
        await videosApi.updateVideo(selectedVideo.id, payload);
        setToastMsg(`Video "${videoForm.title}" updated successfully!`);
      } else {
        await videosApi.createVideo(payload);
        setToastMsg(`Video "${videoForm.title}" uploaded & published successfully!`);
      }
      setShowVideoModal(false);
      setSelectedVideo(null);
      fetchVideosAndSchools();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save video content.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVideo = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete video "${title}"? This cannot be undone.`)) return;

    try {
      await videosApi.deleteVideo(id);
      setToastMsg(`Video deleted.`);
      fetchVideosAndSchools();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete video.');
    }
  };

  const openAssignModal = (v: VideoItem) => {
    setAssigningVideo(v);
    setSelectedSchoolIds(v.assignedSchools || []);
    setShowAssignModal(true);
  };

  const toggleSchoolSelection = (schoolId: string) => {
    setSelectedSchoolIds((prev) =>
      prev.includes(schoolId) ? prev.filter((id) => id !== schoolId) : [...prev, schoolId]
    );
  };

  const handleSaveAssignments = async () => {
    if (!assigningVideo) return;
    setSavingAssignments(true);
    setErrorMsg('');

    try {
      await videosApi.assignVideoToSchools(assigningVideo.id, selectedSchoolIds);
      setToastMsg(`School access updated for "${assigningVideo.title}"!`);
      setShowAssignModal(false);
      setAssigningVideo(null);
      fetchVideosAndSchools();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save school assignments.');
    } finally {
      setSavingAssignments(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-6 flex-1 animate-in fade-in duration-300">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Video className="w-6 h-6 text-orange-600" />
                Central Video Library & School Content Control
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Upload video lectures, set category metadata, target specific exams & classes, and assign videos to partner schools.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchVideosAndSchools}
                disabled={loading}
                className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg shadow-2xs cursor-pointer"
                title="Refresh Catalog"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
              </button>

              <button
                onClick={() => {
                  setSelectedVideo(null);
                  setVideoForm({
                    title: '',
                    description: '',
                    category: 'Academic',
                    exam: 'JEE',
                    targetClass: 'Class 12',
                    tagsInput: 'Physics, Mechanics',
                    youtubeId: '',
                    videoUrl: '',
                    thumbnailUrl: '',
                    durationSeconds: 1200,
                  });
                  setShowVideoModal(true);
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Upload New Video
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={fetchVideosAndSchools} className="px-3 py-1 bg-rose-600 text-white rounded-md text-xs font-semibold hover:bg-rose-700">
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

          {/* Filters Bar */}
          <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-center">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search title or topic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 font-medium"
              />
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={examFilter}
                onChange={(e) => setExamFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="">All Exams</option>
                {EXAMS.map((ex) => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="">All Classes</option>
                {CLASSES.map((cl) => (
                  <option key={cl} value={cl}>{cl}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="">All Schools</option>
                {schools.map((sch) => (
                  <option key={sch.id} value={sch.id}>{sch.name}</option>
                ))}
              </select>
            </div>
          </form>

          {/* Videos Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="h-64 skeleton"></div>
              <div className="h-64 skeleton"></div>
              <div className="h-64 skeleton"></div>
            </div>
          ) : videos.length === 0 ? (
            <div className="p-12 bg-white rounded-xl border border-slate-200 text-center text-slate-400 space-y-2">
              <Video className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No videos found matching filters.</p>
              <p className="text-xs text-slate-500">Click "Upload New Video" to add video lectures to the central library.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {videos.map((v) => {
                const assignedCount = v.assignedSchools?.length || 0;
                return (
                  <div key={v.id} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
                    <div>
                      {/* Video Thumbnail Header */}
                      <div className="relative h-44 bg-slate-900 group">
                        {v.thumbnailUrl ? (
                          <img
                            src={v.thumbnailUrl}
                            alt={v.title}
                            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-1">
                            <ImageIcon className="w-8 h-8" />
                            <span className="text-[11px]">No Thumbnail Set</span>
                          </div>
                        )}

                        <span className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-slate-900/80 text-white font-bold text-[10px] uppercase rounded-md backdrop-blur-xs">
                          {v.category}
                        </span>

                        {v.exam && (
                          <span className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-orange-600 text-white font-bold text-[10px] rounded-md shadow-2xs">
                            {v.exam} • {v.targetClass || 'All'}
                          </span>
                        )}
                      </div>

                      {/* Video Info Content */}
                      <div className="p-4 space-y-2">
                        <h4 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">{v.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{v.description || 'No description provided.'}</p>

                        {/* Tags Badges */}
                        {v.tags && v.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap pt-1">
                            {v.tags.map((tag, i) => (
                              <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded border border-slate-200 flex items-center gap-0.5">
                                <Tag className="w-2.5 h-2.5 text-slate-400" /> {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions & School Assignment Footer */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <button
                          onClick={() => openAssignModal(v)}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:border-orange-400 text-slate-700 font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 hover:text-orange-600 transition-all cursor-pointer"
                        >
                          <SchoolIcon className="w-3.5 h-3.5 text-orange-600" />
                          <span>Assigned Schools: <strong className="text-slate-900">{assignedCount}</strong></span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedVideo(v);
                              setVideoForm({
                                title: v.title,
                                description: v.description || '',
                                category: v.category || 'Academic',
                                exam: v.exam || 'JEE',
                                targetClass: v.targetClass || 'Class 12',
                                tagsInput: v.tags?.join(', ') || '',
                                youtubeId: v.youtubeId || '',
                                videoUrl: v.videoUrl || '',
                                thumbnailUrl: v.thumbnailUrl || '',
                                durationSeconds: v.durationSeconds || 1200,
                              });
                              setShowVideoModal(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-md shadow-2xs cursor-pointer"
                            title="Edit Video Metadata"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteVideo(v.id, v.title)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 border border-rose-200 rounded-md shadow-2xs cursor-pointer"
                            title="Delete Video"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* UPLOAD / EDIT VIDEO MODAL */}
          {showVideoModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl max-w-lg w-full p-6 border border-slate-200 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Video className="w-4 h-4 text-orange-600" />
                    {selectedVideo ? 'Edit Video & Metadata' : 'Upload Video to Library'}
                  </h3>
                  <button
                    onClick={() => setShowVideoModal(false)}
                    className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveVideo} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Video Title *</label>
                    <input
                      type="text"
                      required
                      value={videoForm.title}
                      onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                      placeholder="e.g. JEE Physics — Newton's Laws of Motion"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                      <select
                        value={videoForm.category}
                        onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Target Exam</label>
                      <select
                        value={videoForm.exam}
                        onChange={(e) => setVideoForm({ ...videoForm, exam: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none"
                      >
                        {EXAMS.map((ex) => (
                          <option key={ex} value={ex}>{ex}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Target Class</label>
                      <select
                        value={videoForm.targetClass}
                        onChange={(e) => setVideoForm({ ...videoForm, targetClass: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none"
                      >
                        {CLASSES.map((cl) => (
                          <option key={cl} value={cl}>{cl}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tags (Comma Separated)</label>
                    <input
                      type="text"
                      value={videoForm.tagsInput}
                      onChange={(e) => setVideoForm({ ...videoForm, tagsInput: e.target.value })}
                      placeholder="Physics, Mechanics, JEE Advanced"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">YouTube Video ID (Optional)</label>
                      <input
                        type="text"
                        value={videoForm.youtubeId}
                        onChange={(e) => setVideoForm({ ...videoForm, youtubeId: e.target.value })}
                        placeholder="e.g. dQw4w9WgXcQ"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Stream / MP4 URL</label>
                      <input
                        type="url"
                        value={videoForm.videoUrl}
                        onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value })}
                        placeholder="https://cdn.toppermantra.com/video.mp4"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Thumbnail Poster URL</label>
                    <input
                      type="url"
                      value={videoForm.thumbnailUrl}
                      onChange={(e) => setVideoForm({ ...videoForm, thumbnailUrl: e.target.value })}
                      placeholder="https://cdn.toppermantra.com/thumbnails/v1.jpg"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={videoForm.description}
                      onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                      placeholder="Video overview and chapter concepts..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowVideoModal(false)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-2xs disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
                    >
                      {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {submitting ? 'Saving...' : 'Publish Video'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ASSIGN SCHOOLS MODAL */}
          {showAssignModal && assigningVideo && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <SchoolIcon className="w-5 h-5 text-orange-600" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Assign Schools</h3>
                      <p className="text-xs text-slate-500 truncate max-w-[280px]">{assigningVideo.title}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">
                    ✕
                  </button>
                </div>

                <p className="text-xs text-slate-600 shrink-0">
                  Select institutional partner schools authorized to access this video content on the mobile app:
                </p>

                <div className="space-y-2 overflow-y-auto flex-1 pr-1 border border-slate-100 rounded-lg p-2 bg-slate-50/50">
                  {schools.length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-3">No registered schools found.</p>
                  ) : (
                    schools.map((sch) => {
                      const isSelected = selectedSchoolIds.includes(sch.id);
                      return (
                        <div
                          key={sch.id}
                          onClick={() => toggleSchoolSelection(sch.id)}
                          className={`p-3 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-orange-50/60 border-orange-300 text-slate-900 font-semibold'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <p className="font-bold text-slate-900">{sch.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">Code: {sch.code}</p>
                          </div>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-orange-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAssignments}
                    disabled={savingAssignments}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-2xs disabled:opacity-60 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {savingAssignments && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {savingAssignments ? 'Saving...' : 'Save School Access'}
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