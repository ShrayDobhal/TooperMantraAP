'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { videosApi, VideoItem, schoolsApi, School } from '@/api';
import {
  Video,
  Plus,
  Trash2,
  Edit3,
  Search,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  School as SchoolIcon,
  CheckSquare,
  Square,
  Tag,
  Loader2,
  Film,
  Sparkles,
  Clock,
  Upload,
  X,
} from 'lucide-react';

const CATEGORIES = [
  'All',
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

const EXAMS = ['All', 'JEE', 'NEET', 'CUET', 'Boards', 'Other'];

const CLASSES = [
  { label: 'All Classes', value: 'ALL' },
  { label: 'Class 9', value: 'CLASS_9' },
  { label: 'Class 10', value: 'CLASS_10' },
  { label: 'Class 11', value: 'CLASS_11' },
  { label: 'Class 12', value: 'CLASS_12' },
  { label: 'Dropper', value: 'DROPPER' },
  { label: 'College', value: 'COLLEGE' },
];

export default function LiveContentPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [examFilter, setExamFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('ALL');
  const [schoolFilter, setSchoolFilter] = useState('');

  // Video Upload / Edit Modal State
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoSourceMode, setVideoSourceMode] = useState<'file' | 'manual'>('file');
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStage, setUploadStage] = useState<string>('');
  const [thumbnailUploadMode, setThumbnailUploadMode] = useState<'file' | 'url'>('file');
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    category: 'Academic',
    exam: 'JEE',
    classLevel: 'CLASS_12',
    tagsInput: '',
    youtubeId: '',
    bunnyVideoId: '',
    videoUrl: '',
    thumbnailUrl: '',
    durationMinutes: 30,
  });

  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedVideoFile(file);

    // Auto-fill title from filename if title is empty
    if (!videoForm.title.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setVideoForm((prev) => ({ ...prev, title: cleanName }));
    }
  };

  const compressImage = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const reader = new FileReader();

      reader.onload = () => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleThumbnailFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image file size must be under 10MB.');
      return;
    }

    try {
      const compressed = await compressImage(file, 800, 0.7);
      setVideoForm((prev) => ({ ...prev, thumbnailUrl: compressed }));
    } catch (err) {
      alert('Failed to process image. Please try a different file.');
    }
  };

  // Assign Schools Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningVideo, setAssigningVideo] = useState<VideoItem | null>(null);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  const [savingAssignments, setSavingAssignments] = useState(false);

  const fetchVideosAndSchools = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [vRes, sRes] = await Promise.allSettled([
        videosApi.getVideos({
          search,
          category: categoryFilter !== 'All' ? categoryFilter : undefined,
          exam: examFilter !== 'All' ? examFilter : undefined,
          classLevel: classFilter !== 'ALL' ? classFilter : undefined,
          schoolId: schoolFilter || undefined,
        }),
        schoolsApi.getSchools(),
      ]);

      if (vRes.status === 'fulfilled' && vRes.value.success) {
        setVideos(vRes.value.data.items || []);
      } else if (vRes.status === 'rejected') {
        setErrorMsg(vRes.reason?.message || 'Failed to fetch videos catalog.');
      }

      if (sRes.status === 'fulfilled' && sRes.value.success) {
        setSchools(sRes.value.data || []);
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
    setUploadProgress(null);
    setUploadStage('');

    const tagsArr = videoForm.tagsInput
      ? videoForm.tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const durationSec = Math.max(60, Number(videoForm.durationMinutes || 30) * 60);

    let finalBunnyId = videoForm.bunnyVideoId.trim() || undefined;
    let finalVideoUrl = videoForm.videoUrl.trim() || undefined;
    let finalThumbnailUrl = videoForm.thumbnailUrl.trim() || undefined;

    try {
      // Step 1: If uploading a video file directly to Bunny Stream
      if (videoSourceMode === 'file' && selectedVideoFile) {
        setUploadStage('Initializing Bunny Stream video entry...');
        const initRes = await videosApi.initVideoUpload(videoForm.title.trim());

        if (initRes.success && initRes.data) {
          finalBunnyId = initRes.data.bunnyVideoId;
          finalVideoUrl = initRes.data.cdnUrl;
          if (!finalThumbnailUrl && initRes.data.thumbnailUrl) {
            finalThumbnailUrl = initRes.data.thumbnailUrl;
          }

          setUploadStage('Uploading video binary directly to Bunny CDN...');
          await videosApi.uploadVideoFileToBunny(
            initRes.data.uploadUrl,
            initRes.data.authorizationHeader,
            selectedVideoFile,
            (pct) => {
              setUploadProgress(pct);
              setUploadStage(`Streaming to Bunny CDN (${pct}%)...`);
            }
          );
          setUploadStage('Upload complete! Publishing video metadata...');
        } else {
          throw new Error('Failed to initialize Bunny Stream video entry on backend.');
        }
      }

      const payload = {
        title: videoForm.title.trim(),
        description: videoForm.description.trim() || undefined,
        category: videoForm.category.toUpperCase(),
        exam: videoForm.exam.toUpperCase(),
        classLevel: videoForm.classLevel,
        tags: tagsArr,
        youtubeId: videoForm.youtubeId.trim() || undefined,
        bunnyVideoId: finalBunnyId,
        videoUrl: finalVideoUrl,
        thumbnailUrl: finalThumbnailUrl,
        durationSeconds: durationSec,
        status: 'READY',
      };

      if (selectedVideo) {
        await videosApi.updateVideo(selectedVideo.id, payload);
        setToastMsg(`🎉 Video "${videoForm.title}" updated successfully!`);
      } else {
        await videosApi.createVideo(payload);
        setToastMsg(`🎉 Video "${videoForm.title}" uploaded directly to Bunny Stream & published!`);
      }

      setShowVideoModal(false);
      setSelectedVideo(null);
      setSelectedVideoFile(null);
      fetchVideosAndSchools();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save and publish video.');
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
      setUploadStage('');
    }
  };

  const handleDeleteVideo = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete video "${title}"? This cannot be undone.`)) return;

    try {
      await videosApi.deleteVideo(id);
      setToastMsg(`✓ Video "${title}" removed.`);
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
      setToastMsg(`✓ School assignments updated for "${assigningVideo.title}"!`);
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
                Upload video lectures with Bunny Stream / CDN streams, manage exam & category metadata, and assign content to partner schools.
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
                    classLevel: 'CLASS_12',
                    tagsInput: '',
                    youtubeId: '',
                    bunnyVideoId: '',
                    videoUrl: '',
                    thumbnailUrl: '',
                    durationMinutes: 30,
                  });
                  setShowVideoModal(true);
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
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
              <button onClick={fetchVideosAndSchools} className="px-3 py-1 bg-rose-600 text-white rounded-md text-xs font-semibold hover:bg-rose-700 cursor-pointer">
                Retry
              </button>
            </div>
          )}

          {toastMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
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
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={examFilter}
                onChange={(e) => setExamFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                {EXAMS.map((ex) => (
                  <option key={ex} value={ex}>{ex === 'All' ? 'All Exams' : ex}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                {CLASSES.map((cl) => (
                  <option key={cl.value} value={cl.value}>{cl.label}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="">All Partner Schools</option>
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
              <p className="text-xs text-slate-500">Click &quot;Upload New Video&quot; to add video lectures to the central library.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {videos.map((v) => {
                const assignedCount = v.assignedSchools?.length || 0;
                return (
                  <div key={v.id} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all">
                    <div>
                      {/* Video Thumbnail Header */}
                      <div className="relative h-44 bg-slate-900 group overflow-hidden">
                        {v.thumbnailUrl ? (
                          <img
                            src={v.thumbnailUrl}
                            alt={v.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-1 bg-gradient-to-br from-slate-900 to-slate-800">
                            <Film className="w-8 h-8 text-slate-600" />
                            <span className="text-[11px] text-slate-400">Topper Mantra Video</span>
                          </div>
                        )}

                        <span className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-slate-900/80 text-white font-bold text-[10px] uppercase rounded-md backdrop-blur-xs">
                          {v.category}
                        </span>

                        {v.exam && (
                          <span className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-orange-600 text-white font-bold text-[10px] rounded-md shadow-2xs">
                            {v.exam} • {v.classLevel || v.targetClass || 'All'}
                          </span>
                        )}

                        {v.durationSeconds && v.durationSeconds > 0 ? (
                          <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/70 text-white font-mono text-[10px] rounded flex items-center gap-1 backdrop-blur-xs">
                            <Clock className="w-2.5 h-2.5" />
                            {Math.round(v.durationSeconds / 60)} min
                          </span>
                        ) : null}
                      </div>

                      {/* Video Info Content */}
                      <div className="p-4 space-y-2">
                        <h4 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">{v.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{v.description || 'No description provided.'}</p>

                        {/* Stream / Provider Badge */}
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          {v.bunnyVideoId && (
                            <span className="text-[10px] bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded font-bold">
                              Bunny Stream
                            </span>
                          )}
                          {v.youtubeId && (
                            <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded font-bold">
                              YouTube
                            </span>
                          )}
                          {v.videoUrl && !v.bunnyVideoId && (
                            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-bold">
                              HLS / CDN Stream
                            </span>
                          )}
                        </div>

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

                        {/* Assigned Schools Pill Preview */}
                        {v.assignedSchoolsDetails && v.assignedSchoolsDetails.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 flex items-center gap-1 flex-wrap">
                            <span className="text-[10px] text-slate-400 font-semibold">Schools:</span>
                            {v.assignedSchoolsDetails.slice(0, 2).map((sch) => (
                              <span key={sch.id} className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-medium truncate max-w-[120px]">
                                {sch.name}
                              </span>
                            ))}
                            {v.assignedSchoolsDetails.length > 2 && (
                              <span className="text-[10px] text-slate-500 font-semibold">
                                +{v.assignedSchoolsDetails.length - 2} more
                              </span>
                            )}
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
                                classLevel: v.classLevel || v.targetClass || 'CLASS_12',
                                tagsInput: v.tags?.join(', ') || '',
                                youtubeId: v.youtubeId || '',
                                bunnyVideoId: v.bunnyVideoId || '',
                                videoUrl: v.videoUrl || '',
                                thumbnailUrl: v.thumbnailUrl || '',
                                durationMinutes: Math.round((v.durationSeconds || 1200) / 60),
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
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Fixed Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {selectedVideo ? 'Edit Video & Metadata' : 'Upload Video to Central Library'}
                      </h3>
                      <p className="text-xs text-slate-500">Configure streaming links, category & exam filters, and thumbnail poster.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowVideoModal(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scrollable Form Body */}
                <form onSubmit={handleSaveVideo} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                  <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
                    {/* Thumbnail Poster with Device File Upload + URL Switcher */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Video Thumbnail Poster
                        </label>
                        <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-lg text-[11px] font-semibold">
                          <button
                            type="button"
                            onClick={() => setThumbnailUploadMode('file')}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              thumbnailUploadMode === 'file'
                                ? 'bg-orange-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Upload File
                          </button>
                          <button
                            type="button"
                            onClick={() => setThumbnailUploadMode('url')}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              thumbnailUploadMode === 'url'
                                ? 'bg-orange-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Paste URL
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-24 h-16 rounded-xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs relative group">
                          {videoForm.thumbnailUrl ? (
                            <>
                              <img
                                src={videoForm.thumbnailUrl}
                                alt="Poster Preview"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => setVideoForm((prev) => ({ ...prev, thumbnailUrl: '' }))}
                                className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-semibold transition-opacity cursor-pointer"
                                title="Remove Poster"
                              >
                                Remove
                              </button>
                            </>
                          ) : (
                            <ImageIcon className="w-6 h-6 text-slate-300" />
                          )}
                        </div>

                        <div className="flex-1 space-y-1.5">
                          {thumbnailUploadMode === 'file' ? (
                            <div>
                              <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:border-orange-500 hover:text-orange-600 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs transition-all">
                                <Upload className="w-4 h-4 text-orange-600" />
                                <span>Choose Image from Device</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleThumbnailFileSelect}
                                  className="hidden"
                                />
                              </label>
                              <p className="text-[11px] text-slate-400 mt-1">
                                {videoForm.thumbnailUrl ? '✓ Poster selected & preview active' : 'Select PNG, JPG, or WEBP poster from your computer'}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <input
                                type="url"
                                placeholder="Paste image URL (https://cdn...)"
                                value={videoForm.thumbnailUrl}
                                onChange={(e) => setVideoForm({ ...videoForm, thumbnailUrl: e.target.value })}
                                className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-500 font-mono"
                              />
                              <p className="text-[11px] text-slate-400 mt-1">
                                {videoForm.thumbnailUrl ? '✓ Live poster thumbnail preview' : 'Enter URL to preview poster'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Video Title *</label>
                      <input
                        type="text"
                        required
                        value={videoForm.title}
                        onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                        placeholder="e.g. JEE Physics — Newton's Laws of Motion"
                        className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-medium focus:border-slate-500 focus:outline-none placeholder:text-slate-400"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                        <select
                          value={videoForm.category}
                          onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })}
                          className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-semibold focus:border-slate-500 focus:outline-none cursor-pointer"
                        >
                          {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                            <option key={c} value={c} className="text-slate-900 bg-white">{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Target Exam</label>
                        <select
                          value={videoForm.exam}
                          onChange={(e) => setVideoForm({ ...videoForm, exam: e.target.value })}
                          className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-semibold focus:border-slate-500 focus:outline-none cursor-pointer"
                        >
                          {EXAMS.filter((ex) => ex !== 'All').map((ex) => (
                            <option key={ex} value={ex} className="text-slate-900 bg-white">{ex}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Target Class</label>
                        <select
                          value={videoForm.classLevel}
                          onChange={(e) => setVideoForm({ ...videoForm, classLevel: e.target.value })}
                          className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-semibold focus:border-slate-500 focus:outline-none cursor-pointer"
                        >
                          {CLASSES.map((cl) => (
                            <option key={cl.value} value={cl.value} className="text-slate-900 bg-white">{cl.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Video Source Selection (Direct File Upload to Bunny CDN vs Manual Video ID) */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 uppercase tracking-wider text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                          <span>Video Source & Playback</span>
                        </div>
                        <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-lg text-[11px] font-semibold">
                          <button
                            type="button"
                            onClick={() => setVideoSourceMode('file')}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              videoSourceMode === 'file'
                                ? 'bg-orange-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Direct Video File
                          </button>
                          <button
                            type="button"
                            onClick={() => setVideoSourceMode('manual')}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              videoSourceMode === 'manual'
                                ? 'bg-orange-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Manual Video ID / URL
                          </button>
                        </div>
                      </div>

                      {videoSourceMode === 'file' ? (
                        <div className="space-y-2.5">
                          {selectedVideoFile ? (
                            <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                                  <Video className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 text-xs truncate max-w-[280px]">
                                    {selectedVideoFile.name}
                                  </p>
                                  <p className="text-[11px] text-slate-500">
                                    {(selectedVideoFile.size / (1024 * 1024)).toFixed(1)} MB • Direct Bunny Stream Upload
                                  </p>
                                </div>
                              </div>
                              <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer transition-colors shrink-0">
                                <span>Change File</span>
                                <input
                                  type="file"
                                  accept="video/mp4,video/quicktime,video/webm,video/x-matroska,.mp4,.mov,.mkv,.webm"
                                  onChange={handleVideoFileSelect}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          ) : (
                            <label className="border-2 border-dashed border-slate-300 hover:border-orange-500 bg-white hover:bg-orange-50/20 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
                              <div className="w-11 h-11 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Upload className="w-5 h-5" />
                              </div>
                              <p className="text-xs font-bold text-slate-800">
                                Click to select Video File from Computer
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Supports .mp4, .mov, .mkv, .webm (Direct high-speed Bunny CDN upload)
                              </p>
                              <input
                                type="file"
                                accept="video/mp4,video/quicktime,video/webm,video/x-matroska,.mp4,.mov,.mkv,.webm"
                                onChange={handleVideoFileSelect}
                                className="hidden"
                              />
                            </label>
                          )}

                          {/* Upload Progress Bar when uploading */}
                          {uploadStage && (
                            <div className="bg-white p-3 rounded-lg border border-orange-200 space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-orange-700 flex items-center gap-1.5">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  {uploadStage}
                                </span>
                                {uploadProgress !== null && (
                                  <span className="font-mono text-orange-800">{uploadProgress}%</span>
                                )}
                              </div>
                              {uploadProgress !== null && (
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                  <div
                                    className="h-full bg-orange-600 rounded-full transition-all duration-200"
                                    style={{ width: `${uploadProgress}%` }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block font-medium text-slate-600 mb-1">Bunny Stream Video ID</label>
                              <input
                                type="text"
                                value={videoForm.bunnyVideoId}
                                onChange={(e) => setVideoForm({ ...videoForm, bunnyVideoId: e.target.value })}
                                placeholder="e.g. b82910fa-1234-5678"
                                className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg font-mono text-xs focus:border-slate-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block font-medium text-slate-600 mb-1">YouTube Video ID (Legacy)</label>
                              <input
                                type="text"
                                value={videoForm.youtubeId}
                                onChange={(e) => setVideoForm({ ...videoForm, youtubeId: e.target.value })}
                                placeholder="e.g. dQw4w9WgXcQ"
                                className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg font-mono text-xs focus:border-slate-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block font-medium text-slate-600 mb-1">Direct HLS / MP4 Stream URL</label>
                            <input
                              type="url"
                              value={videoForm.videoUrl}
                              onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value })}
                              placeholder="https://video.toppermantra.com/stream.m3u8"
                              className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg font-mono text-xs focus:border-slate-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
                        <input
                          type="number"
                          min="1"
                          value={videoForm.durationMinutes}
                          onChange={(e) => setVideoForm({ ...videoForm, durationMinutes: parseInt(e.target.value, 10) || 30 })}
                          className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-semibold focus:border-slate-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Tags (Comma Separated)</label>
                        <input
                          type="text"
                          value={videoForm.tagsInput}
                          onChange={(e) => setVideoForm({ ...videoForm, tagsInput: e.target.value })}
                          placeholder="Physics, Mechanics, JEE"
                          className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-medium focus:border-slate-500 focus:outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={videoForm.description}
                        onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                        placeholder="Video overview and chapter concepts..."
                        className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-medium focus:border-slate-500 focus:outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Fixed Footer */}
                  <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowVideoModal(false)}
                      className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white font-semibold rounded-lg shadow-2xs disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
                    >
                      {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {submitting ? 'Saving...' : selectedVideo ? 'Update Video' : 'Publish Video'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ASSIGN SCHOOLS MODAL */}
          {showAssignModal && assigningVideo && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <SchoolIcon className="w-5 h-5 text-orange-600" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Assign Schools</h3>
                      <p className="text-xs text-slate-500 truncate max-w-[280px]">{assigningVideo.title}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer">
                    ✕
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 shrink-0">
                  <span>Select partner schools:</span>
                  <span className="font-semibold text-orange-600">{selectedSchoolIds.length} Selected</span>
                </div>

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
                              ? 'bg-orange-50/70 border-orange-300 text-slate-900 font-semibold'
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
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs font-semibold rounded-lg shadow-2xs disabled:opacity-60 flex items-center gap-1.5 transition-all cursor-pointer"
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