'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  videosApi,
  VideoItem,
  schoolsApi,
  School,
  PILLAR_SECTIONS,
  matchesPillar,
  getPillarMeta,
  VideoPillar,
  playlistsApi,
  PlaylistItem,
  eventsApi,
} from '@/api';
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
  Layers,
  Star,
  ListVideo,
  FolderPlus,
  ExternalLink,
  Eye,
  Check,
  Play,
  ArrowRight,
  BookOpen,
  Filter,
} from 'lucide-react';
import {
  uploadImageToBunnyStorage,
  compressImageToBlob,
  createLocalPreview,
} from '@/lib/bunnyStorage';

const PILLAR_OPTIONS = [
  {
    value: 'ACADEMIC',
    label: 'Academics',
    subtitle: 'JEE, NEET, CUET & Boards',
    emoji: '🎓',
  },
  {
    value: 'HACKATHON',
    label: 'Hackathon',
    subtitle: 'Coding, AI & Robotics Prototypes',
    emoji: '💻',
  },
  {
    value: 'ENTREPRENEURSHIP',
    label: 'Entrepreneurship',
    subtitle: 'Startups, Venture Pitching & Grants',
    emoji: '🚀',
  },
  {
    value: 'DRONE_AVIATION',
    label: 'Drone Aviation',
    subtitle: 'DGCA UAV, Aerospace & Flight Sim',
    emoji: '🛩️',
  },
  {
    value: 'INSPIRE',
    label: 'Inspire',
    subtitle: 'Masterclasses & Motivational Talks',
    emoji: '✨',
  },
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

const INSPIRE_CATEGORIES = [
  { id: 'ALL', label: 'All Videos', emoji: '✨' },
  { id: 'JEE', label: 'JEE', emoji: '📖' },
  { id: 'NEET', label: 'NEET', emoji: '🔬' },
  { id: 'HACKATHON', label: 'Hackathon', emoji: '💻' },
  { id: 'ENTREPRENEURSHIP', label: 'Entrepreneurship', emoji: '🚀' },
  { id: 'DRONE', label: 'Drone Aviation', emoji: '🛩️' },
  { id: 'INSPIRE', label: 'Masterclasses & Talks', emoji: '🎙️' },
];

function LiveContentPageContent() {
  const searchParams = useSearchParams();
  const initialView = searchParams?.get('view') === 'inspire' ? 'INSPIRE' : 'COMMUNITY';
  const [viewMode, setViewMode] = useState<'COMMUNITY' | 'INSPIRE'>(initialView);

  useEffect(() => {
    const v = searchParams?.get('view');
    if (v === 'inspire') setViewMode('INSPIRE');
    else if (v === 'community') setViewMode('COMMUNITY');
  }, [searchParams]);

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Inspire Sub-Tabs: Explore Videos | Curated Playlists | Featured Learning
  const [inspireSubTab, setInspireSubTab] = useState<'VIDEOS' | 'PLAYLISTS' | 'FEATURED'>('VIDEOS');
  const [inspireCategoryFilter, setInspireCategoryFilter] = useState('ALL');
  const [activePlaylistFilter, setActivePlaylistFilter] = useState<PlaylistItem | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedPillar, setSelectedPillar] = useState('ALL');
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
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [modalSelectedSchoolIds, setModalSelectedSchoolIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form State with Target Destination
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    targetSection: 'COMMUNITY' as 'COMMUNITY' | 'INSPIRE',
    category: 'ACADEMIC',
    exam: 'JEE',
    classLevel: 'CLASS_12',
    tagsInput: '',
    youtubeId: '',
    bunnyVideoId: '',
    videoUrl: '',
    thumbnailUrl: '',
    durationMinutes: 30,
    speakerName: '',
    speakerTag: '',
    format: 'VIDEO' as 'VIDEO' | 'PODCAST' | 'SHORT',
    playlistId: '',
    isFeatured: false,
  });

  // Curated Playlist Modal State
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistItem | null>(null);
  const [playlistForm, setPlaylistForm] = useState({
    title: '',
    description: '',
    category: 'JEE',
    thumbnailUrl: '',
    displayOrder: 0,
    isFeatured: true,
  });
  const [playlistThumbMode, setPlaylistThumbMode] = useState<'file' | 'url'>('url');
  const [playlistThumbFile, setPlaylistThumbFile] = useState<File | null>(null);
  const [playlistThumbPreview, setPlaylistThumbPreview] = useState<string>('');

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

  const handleThumbnailFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      alert('Image file size must be under 25MB.');
      return;
    }

    try {
      setSelectedThumbnailFile(file);
      const preview = await createLocalPreview(file);
      setThumbnailPreview(preview);
    } catch {
      alert('Failed to process image preview.');
    }
  };

  const handlePlaylistThumbFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPlaylistThumbFile(file);
      const preview = await createLocalPreview(file);
      setPlaylistThumbPreview(preview);
    } catch {
      alert('Failed to process thumbnail file');
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
      const [vRes, sRes, pRes] = await Promise.allSettled([
        videosApi.getVideos({
          limit: 200,
          schoolId: schoolFilter || undefined,
        }),
        schoolsApi.getSchools(),
        playlistsApi.getPlaylists(),
      ]);

      if (vRes.status === 'fulfilled' && vRes.value.success) {
        setVideos(vRes.value.data.items || []);
      } else if (vRes.status === 'rejected') {
        setErrorMsg(vRes.reason?.message || 'Failed to fetch videos catalog.');
      }

      if (sRes.status === 'fulfilled' && sRes.value.success) {
        setSchools(sRes.value.data || []);
      }

      if (pRes.status === 'fulfilled' && pRes.value.success) {
        setPlaylists(pRes.value.data.items || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load content catalog from backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideosAndSchools();
  }, [schoolFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVideosAndSchools();
  };

  // Real-time filtered videos matching destination mode, pillar tab, sub-tab and active filters
  const filteredVideos = videos.filter((v) => {
    const isInspire = v.category === 'INSPIRE';

    // 0. App Destination Section filtering
    if (viewMode === 'INSPIRE') {
      // If user clicked into a specific playlist
      if (activePlaylistFilter && v.playlistId !== activePlaylistFilter.id) {
        return false;
      }

      // If filtering by Inspire category pills (matching mobile app screen 2)
      if (inspireCategoryFilter !== 'ALL') {
        const cat = (v.category || '').toUpperCase();
        const exam = (v.exam || '').toUpperCase();
        const title = (v.title || '').toLowerCase();
        const tags = (v.tags || []).map((t) => (t || '').toLowerCase());

        if (inspireCategoryFilter === 'JEE') {
          if (exam !== 'JEE' && !tags.some((t) => t.includes('jee')) && !title.includes('jee')) return false;
        } else if (inspireCategoryFilter === 'NEET') {
          if (exam !== 'NEET' && !tags.some((t) => t.includes('neet') || t.includes('biology')) && !title.includes('neet')) return false;
        } else if (inspireCategoryFilter === 'HACKATHON') {
          if (cat !== 'HACKATHON' && !tags.some((t) => t.includes('hackathon') || t.includes('code') || t.includes('coding')) && !title.includes('hackathon')) return false;
        } else if (inspireCategoryFilter === 'ENTREPRENEURSHIP') {
          if (cat !== 'ENTREPRENEURSHIP' && !tags.some((t) => t.includes('startup') || t.includes('pitch') || t.includes('founder')) && !title.includes('startup') && !title.includes('pitch')) return false;
        } else if (inspireCategoryFilter === 'DRONE') {
          if (!['DRONE', 'DRONE_TECHNOLOGY', 'DRONE_AVIATION'].includes(cat) && !tags.some((t) => t.includes('drone')) && !title.includes('drone')) return false;
        } else if (inspireCategoryFilter === 'INSPIRE') {
          if (cat !== 'INSPIRE') return false;
        }
      }
    } else {
      if (isInspire) return false;
      // 1. Pillar section tab matching for Community using enhanced multi-field matcher
      if (selectedPillar !== 'ALL' && !matchesPillar(v, selectedPillar)) {
        return false;
      }
    }

    // 2. Search query matching
    if (search.trim()) {
      const q = search.toLowerCase();
      const titleMatch = v.title?.toLowerCase().includes(q);
      const descMatch = v.description?.toLowerCase().includes(q);
      const tagsMatch = v.tags?.some((t) => t.toLowerCase().includes(q));
      if (!titleMatch && !descMatch && !tagsMatch) return false;
    }

    // 3. Target Exam matching (only in Community view and only for Academic or All view)
    if (viewMode === 'COMMUNITY' && examFilter !== 'All') {
      if (selectedPillar === 'ALL' || selectedPillar === 'ACADEMIC') {
        if (!v.exam || v.exam.toUpperCase() !== examFilter.toUpperCase()) {
          return false;
        }
      }
    }

    // 4. Target Class Level matching (only in Community view)
    if (viewMode === 'COMMUNITY' && classFilter !== 'ALL') {
      const target = (v.classLevel || v.targetClass || '').toUpperCase();
      if (target && target !== 'ALL' && target !== classFilter) {
        return false;
      }
    }

    // 5. School matching
    if (schoolFilter) {
      const isAssigned =
        v.assignedSchools?.includes(schoolFilter) ||
        v.schoolAssignments?.some((sa) => sa.schoolId === schoolFilter);
      if (!isAssigned) return false;
    }
    return true;
  });

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setUploadProgress(null);
    setUploadStage('');

    const isInspire = videoForm.targetSection === 'INSPIRE' || videoForm.category === 'INSPIRE';

    let tagsArr = videoForm.tagsInput
      ? videoForm.tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    if (isInspire) {
      if (!tagsArr.includes('INSPIRE')) tagsArr.push('INSPIRE');
      if (videoForm.format && !tagsArr.includes(videoForm.format)) tagsArr.push(videoForm.format);
      if (videoForm.speakerName?.trim() && !tagsArr.includes(videoForm.speakerName.trim())) {
        tagsArr.push(videoForm.speakerName.trim());
      }
      if (videoForm.speakerTag?.trim() && !tagsArr.includes(videoForm.speakerTag.trim())) {
        tagsArr.push(videoForm.speakerTag.trim());
      }
    }

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
          setUploadStage('Video binary uploaded! Finalizing...');
        } else {
          throw new Error('Failed to initialize Bunny Stream video entry on backend.');
        }
      }

      // Step 2: If uploading a custom thumbnail file to Bunny CDN Storage
      if (thumbnailUploadMode === 'file' && selectedThumbnailFile) {
        try {
          setUploadStage('Uploading video poster to Bunny CDN...');
          const compressedBlob = await compressImageToBlob(selectedThumbnailFile, 1280, 720, 0.85);
          finalThumbnailUrl = await uploadImageToBunnyStorage(compressedBlob, 'thumbnails', (pct) => {
            setUploadProgress(pct);
            setUploadStage(`Uploading poster to Bunny CDN (${pct}%)...`);
          });
        } catch (thumbErr: any) {
          console.warn('Bunny CDN thumbnail upload issue:', thumbErr.message);
        }
      }

      let finalCategory = isInspire ? 'INSPIRE' : videoForm.category.toUpperCase();
      if (finalCategory === 'DRONE_AVIATION') {
        finalCategory = 'DRONE_TECHNOLOGY';
        if (!tagsArr.includes('Drone Aviation')) tagsArr.push('Drone Aviation');
      }

      const payload = {
        title: videoForm.title.trim(),
        description: videoForm.description.trim() || undefined,
        category: finalCategory,
        exam: isInspire ? 'ALL' : videoForm.exam.toUpperCase(),
        classLevel: isInspire ? 'ALL' : (videoForm.classLevel || 'ALL'),
        tags: tagsArr,
        youtubeId: videoForm.youtubeId.trim() || undefined,
        bunnyVideoId: finalBunnyId,
        videoUrl: finalVideoUrl,
        thumbnailUrl: finalThumbnailUrl,
        durationSeconds: durationSec,
        playlistId: videoForm.playlistId ? videoForm.playlistId : undefined,
        isFeatured: videoForm.isFeatured,
        status: 'READY',
      };

      let targetVideoId = selectedVideo?.id;
      if (selectedVideo) {
        await videosApi.updateVideo(selectedVideo.id, payload);
        setToastMsg(`🎉 Video "${videoForm.title}" updated successfully!`);
      } else {
        const createRes = await videosApi.createVideo(payload);
        targetVideoId = createRes?.data?.id;
        setToastMsg(`🎉 ${isInspire ? 'Inspire video' : 'Community video'} "${videoForm.title}" published successfully!`);
      }

      // Automatically sync to Event table if this is a COMMUNITY live/video session so it reflects in the mobile app Live Sessions tab
      if (!isInspire) {
        try {
          const cleanTitle = videoForm.title.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim() || videoForm.title.trim();
          let speakerName = videoForm.speakerName?.trim() || 'Topper Mantra Academic Faculty';
          let speakerDesignation = videoForm.speakerTag?.trim() || 'Senior Faculty & IIT Mentor';
          if (finalCategory === 'HACKATHON') {
            if (!videoForm.speakerName) speakerName = 'Global AI Hackathon Grand Finalist';
            if (!videoForm.speakerTag) speakerDesignation = 'Fullstack & Systems Architect';
          } else if (finalCategory === 'ENTREPRENEURSHIP') {
            if (!videoForm.speakerName) speakerName = 'Y Combinator & Angel Venture Mentor';
            if (!videoForm.speakerTag) speakerDesignation = 'Student Founder Mentor';
          } else if (finalCategory === 'DRONE_TECHNOLOGY') {
            if (!videoForm.speakerName) speakerName = 'DGCA Certified UAV Pilot';
            if (!videoForm.speakerTag) speakerDesignation = 'Aerospace & Avionics Engineer';
          }

          await eventsApi.createEvent({
            title: cleanTitle,
            description: videoForm.description.trim() || `Recorded community live session covering ${cleanTitle}`,
            category: finalCategory,
            speakerName,
            speakerDesignation,
            liveUrl: finalVideoUrl,
            bannerUrl: finalThumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
            eventDate: new Date().toISOString(),
            status: 'COMPLETED',
          });
        } catch (eventSyncErr: any) {
          console.warn('Auto live session event sync notice:', eventSyncErr?.message);
        }
      }

      // Automatically sync partner school assignments if selected in modal
      if (targetVideoId && modalSelectedSchoolIds.length > 0) {
        try {
          await videosApi.assignVideoToSchools(targetVideoId, modalSelectedSchoolIds);
        } catch (assignErr: any) {
          console.warn('Auto school assignment notice:', assignErr?.message);
        }
      }

      setShowVideoModal(false);
      setSelectedVideo(null);
      setModalSelectedSchoolIds([]);
      setSelectedVideoFile(null);
      setSelectedThumbnailFile(null);
      setThumbnailPreview('');

      // Auto-switch to the uploaded video's pillar so it immediately displays in front of the admin
      if (!isInspire && videoForm.category) {
        if (selectedPillar !== 'ALL' && !matchesPillar(videoForm.category, selectedPillar)) {
          setSelectedPillar(videoForm.category);
        }
      }
      setExamFilter('All');
      setClassFilter('ALL');
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

  const handleToggleFeaturedVideo = async (v: VideoItem) => {
    try {
      const nextFeatured = !v.isFeatured;
      await videosApi.updateVideo(v.id, { isFeatured: nextFeatured });
      setToastMsg(`✓ Video "${v.title}" is now ${nextFeatured ? '⭐ Featured on Mobile App' : 'removed from Featured'}.`);
      setVideos((prev) =>
        prev.map((vid) => (vid.id === v.id ? { ...vid, isFeatured: nextFeatured } : vid))
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to toggle video featured status');
    }
  };

  // Curated Playlist Handlers
  const openCreatePlaylistModal = () => {
    setSelectedPlaylist(null);
    setPlaylistForm({
      title: '',
      description: '',
      category: 'JEE',
      thumbnailUrl: '',
      displayOrder: playlists.length + 1,
      isFeatured: true,
    });
    setPlaylistThumbFile(null);
    setPlaylistThumbPreview('');
    setPlaylistThumbMode('url');
    setShowPlaylistModal(true);
  };

  const openEditPlaylistModal = (pl: PlaylistItem) => {
    setSelectedPlaylist(pl);
    setPlaylistForm({
      title: pl.title,
      description: pl.description || '',
      category: pl.category || 'JEE',
      thumbnailUrl: pl.thumbnailUrl || '',
      displayOrder: pl.displayOrder ?? 0,
      isFeatured: pl.isFeatured ?? true,
    });
    setPlaylistThumbFile(null);
    setPlaylistThumbPreview(pl.thumbnailUrl || '');
    setPlaylistThumbMode(pl.thumbnailUrl ? 'url' : 'file');
    setShowPlaylistModal(true);
  };

  const handleSavePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistForm.title.trim()) {
      alert('Playlist title is required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      let finalThumb = playlistForm.thumbnailUrl.trim();
      if (playlistThumbMode === 'file' && playlistThumbFile) {
        const compressed = await compressImageToBlob(playlistThumbFile, 1280, 720, 0.85);
        finalThumb = await uploadImageToBunnyStorage(compressed, 'playlists');
      }

      const payload = {
        title: playlistForm.title.trim(),
        description: playlistForm.description.trim() || undefined,
        category: playlistForm.category,
        thumbnailUrl: finalThumb || undefined,
        displayOrder: Number(playlistForm.displayOrder) || 0,
        isFeatured: playlistForm.isFeatured,
      };

      if (selectedPlaylist) {
        await playlistsApi.updatePlaylist(selectedPlaylist.id, payload);
        setToastMsg(`✓ Curated playlist "${playlistForm.title}" updated!`);
      } else {
        await playlistsApi.createPlaylist(payload);
        setToastMsg(`🎉 Curated playlist "${playlistForm.title}" created successfully!`);
      }

      setShowPlaylistModal(false);
      setSelectedPlaylist(null);
      setPlaylistThumbFile(null);
      setPlaylistThumbPreview('');

      // Refresh playlists
      const pRes = await playlistsApi.getPlaylists();
      if (pRes.success) setPlaylists(pRes.data.items);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save curated playlist');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlaylist = async (id: string, title: string) => {
    if (
      !confirm(
        `Are you sure you want to delete playlist "${title}"?\nVideos assigned to this playlist will remain available in the central library.`
      )
    ) {
      return;
    }

    try {
      await playlistsApi.deletePlaylist(id);
      setToastMsg(`✓ Playlist "${title}" deleted.`);
      const pRes = await playlistsApi.getPlaylists();
      if (pRes.success) setPlaylists(pRes.data.items);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete playlist');
    }
  };

  const handleToggleFeaturedPlaylist = async (pl: PlaylistItem) => {
    try {
      const nextFeatured = !pl.isFeatured;
      await playlistsApi.updatePlaylist(pl.id, { isFeatured: nextFeatured });
      setToastMsg(
        `✓ Playlist "${pl.title}" is now ${nextFeatured ? '⭐ Featured on Mobile App' : 'removed from Featured'}.`
      );
      setPlaylists((prev) =>
        prev.map((p) => (p.id === pl.id ? { ...p, isFeatured: nextFeatured } : p))
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to toggle playlist featured status');
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

  // Helper counts
  const featuredPlaylists = playlists.filter((p) => p.isFeatured);
  const featuredVideos = videos.filter((v) => v.isFeatured);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-6 flex-1 animate-in fade-in duration-300">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-orange-100 text-orange-700 border border-orange-200 inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                  Target: Student Mobile App → {viewMode === 'INSPIRE' ? 'Inspire Tab (Explore & Playlists)' : 'My Space → Community'}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                {viewMode === 'INSPIRE' ? (
                  <>
                    <Sparkles className="w-6 h-6 text-amber-500" />
                    Inspire Hub — Masterclasses, Playlists &amp; Feed
                  </>
                ) : (
                  <>
                    <Video className="w-6 h-6 text-orange-600" />
                    Community Live Sessions &amp; Recorded Video Clips
                  </>
                )}
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                {viewMode === 'INSPIRE'
                  ? 'Manage Explore Videos, Curated Playlists, and Featured Learning displayed in the student mobile app.'
                  : 'Live mentorship sessions and recorded video lectures categorized by school communities and core program pillars.'}
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

              {viewMode === 'INSPIRE' && inspireSubTab === 'PLAYLISTS' ? (
                <button
                  onClick={openCreatePlaylistModal}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" />
                  + Create Curated Playlist
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedVideo(null);
                    const isInsp = viewMode === 'INSPIRE';
                    let defaultCat = 'ACADEMIC';
                    let defaultExam = 'JEE';
                    if (isInsp) {
                      defaultCat = 'INSPIRE';
                      defaultExam = 'ALL';
                    } else if (selectedPillar !== 'ALL') {
                      defaultCat = selectedPillar;
                      if (selectedPillar === 'HACKATHON') defaultExam = 'OTHER';
                      else if (selectedPillar === 'ENTREPRENEURSHIP') defaultExam = 'OTHER';
                      else if (selectedPillar === 'DRONE_AVIATION') defaultExam = 'OTHER';
                      else defaultExam = 'JEE';
                    }
                    setVideoForm({
                      title: '',
                      description: '',
                      targetSection: isInsp ? 'INSPIRE' : 'COMMUNITY',
                      category: defaultCat,
                      exam: defaultExam,
                      classLevel: 'ALL',
                      tagsInput: '',
                      youtubeId: '',
                      bunnyVideoId: '',
                      videoUrl: '',
                      thumbnailUrl: '',
                      durationMinutes: 30,
                      speakerName: '',
                      speakerTag: '',
                      format: 'VIDEO',
                      playlistId: activePlaylistFilter ? activePlaylistFilter.id : '',
                      isFeatured: isInsp,
                    });
                    setModalSelectedSchoolIds(schoolFilter ? [schoolFilter] : []);
                    setSelectedVideoFile(null);
                    setSelectedThumbnailFile(null);
                    setThumbnailPreview('');
                    setShowVideoModal(true);
                  }}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {viewMode === 'INSPIRE' ? 'Upload Inspire Masterclass' : 'Upload Video Session'}
                </button>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                onClick={fetchVideosAndSchools}
                className="px-3 py-1 bg-rose-600 text-white rounded-md text-xs font-semibold hover:bg-rose-700 cursor-pointer"
              >
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

          {/* App Destination Primary Segmented Switcher */}
          <div className="flex items-center gap-2 bg-slate-200/70 p-1.5 rounded-2xl w-fit border border-slate-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setViewMode('COMMUNITY');
                setSelectedPillar('ALL');
                setExamFilter('All');
                setClassFilter('ALL');
                setActivePlaylistFilter(null);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'COMMUNITY'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Video className="w-4 h-4 text-orange-600" />
              <span>Community Sessions &amp; Clips</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-black">
                {videos.filter((v) => v.category !== 'INSPIRE').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('INSPIRE');
                setSelectedPillar('INSPIRE');
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'INSPIRE'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Inspire Hub (Explore &amp; Playlists)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black">
                {playlists.length} Playlists • {videos.length} Videos
              </span>
            </button>
          </div>

          {/* SECTION 1: COMMUNITY VIEW */}
          {viewMode === 'COMMUNITY' ? (
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-orange-600" />
                  <span>Community Pillar Navigation</span>
                </div>
                <span className="text-[11px] text-slate-500 hidden md:inline">
                  Assigned to student partner school communities under these four pillars
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {PILLAR_SECTIONS.filter((p) => p.code !== 'INSPIRE').map((pillar) => {
                  const isActive = selectedPillar === pillar.code;
                  const count =
                    pillar.code === 'ALL'
                      ? videos.filter((v) => v.category !== 'INSPIRE').length
                      : videos.filter((v) => v.category !== 'INSPIRE' && matchesPillar(v, pillar.code)).length;

                  return (
                    <button
                      key={pillar.id}
                      type="button"
                      onClick={() => {
                        setSelectedPillar(pillar.code);
                        if (pillar.code !== 'ACADEMIC' && pillar.code !== 'ALL') {
                          setExamFilter('All');
                        }
                      }}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 bg-slate-50 border border-slate-200/70'
                      }`}
                    >
                      <span className="text-base leading-none">{pillar.emoji}</span>
                      <span>{pillar.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedPillar !== 'ALL' && (
                <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {PILLAR_SECTIONS.find((p) => p.code === selectedPillar)?.emoji}{' '}
                      {PILLAR_SECTIONS.find((p) => p.code === selectedPillar)?.name}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">
                      {PILLAR_SECTIONS.find((p) => p.code === selectedPillar)?.description}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1.5 self-start sm:self-auto">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Syncs to Student App → Academic Community → Live Sessions
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* SECTION 2: INSPIRE HUB SUB-NAVIGATION */
            <div className="space-y-4">
              {/* Inspire Sub-Tabs Switcher */}
              <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInspireSubTab('VIDEOS');
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      inspireSubTab === 'VIDEOS'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>Explore Videos</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                        inspireSubTab === 'VIDEOS' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {videos.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInspireSubTab('PLAYLISTS');
                      setActivePlaylistFilter(null);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      inspireSubTab === 'PLAYLISTS'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <ListVideo className="w-4 h-4" />
                    <span>Curated Playlists</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                        inspireSubTab === 'PLAYLISTS' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {playlists.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInspireSubTab('FEATURED');
                      setActivePlaylistFilter(null);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      inspireSubTab === 'FEATURED'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>Featured Learning &amp; Feed</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                        inspireSubTab === 'FEATURED' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {featuredPlaylists.length + featuredVideos.length}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Syncs Live with Student App Inspire Tab
                  </span>
                </div>
              </div>

              {/* Category Pills Bar (Explore Videos mode - exact replica of Screenshot 2) */}
              {inspireSubTab === 'VIDEOS' && (
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-amber-600" />
                      Inspire Video Categories
                    </span>
                    {activePlaylistFilter && (
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-xs">
                        <span className="text-amber-900 font-semibold truncate max-w-[220px]">
                          Playlist: {activePlaylistFilter.title}
                        </span>
                        <button
                          onClick={() => setActivePlaylistFilter(null)}
                          className="text-amber-700 hover:text-amber-900 font-bold"
                          title="Clear Playlist Filter"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {INSPIRE_CATEGORIES.map((cat) => {
                      const isActive = inspireCategoryFilter === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setInspireCategoryFilter(cat.id)}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                            isActive
                              ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                              : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          <span>{cat.emoji}</span>
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filters Bar (Only in Videos mode or Community mode) */}
          {(viewMode === 'COMMUNITY' || inspireSubTab === 'VIDEOS') && (
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-center"
            >
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search title, description or tags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 font-medium"
                />
              </div>

              <div>
                <select
                  value={examFilter}
                  onChange={(e) => setExamFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  {EXAMS.map((ex) => (
                    <option key={ex} value={ex}>
                      {ex === 'All' ? 'All Target Exams' : ex}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  {CLASSES.map((cl) => (
                    <option key={cl.value} value={cl.value}>
                      {cl.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={schoolFilter}
                  onChange={(e) => setSchoolFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="">All Partner Schools ({schools.length})</option>
                  {schools.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.name}
                    </option>
                  ))}
                </select>
              </div>
            </form>
          )}

          {/* VIEW TAB 1: CURATED PLAYLISTS VIEW */}
          {viewMode === 'INSPIRE' && inspireSubTab === 'PLAYLISTS' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ListVideo className="w-5 h-5 text-amber-500" />
                    Curated Playlists ({playlists.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Organized roadmaps and multi-episode series shown prominently on the student mobile app.
                  </p>
                </div>
                <button
                  onClick={openCreatePlaylistModal}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Playlist</span>
                </button>
              </div>

              {playlists.length === 0 ? (
                <div className="p-12 bg-white rounded-xl border border-slate-200 text-center text-slate-400 space-y-2">
                  <ListVideo className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">No Curated Playlists yet.</p>
                  <p className="text-xs text-slate-500">Click &quot;New Playlist&quot; to build your first roadmap.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {playlists.map((pl) => {
                    const assignedVideos = videos.filter((v) => v.playlistId === pl.id);
                    const videoCount = pl.videosCount || assignedVideos.length;

                    return (
                      <div
                        key={pl.id}
                        className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all group"
                      >
                        <div>
                          {/* Playlist Cover Header */}
                          <div className="relative h-44 bg-slate-900 overflow-hidden">
                            {pl.thumbnailUrl ? (
                              <img
                                src={pl.thumbnailUrl}
                                alt={pl.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 bg-gradient-to-br from-amber-950 via-slate-900 to-slate-900">
                                <ListVideo className="w-8 h-8 text-amber-500/70" />
                                <span className="text-[11px] font-semibold text-slate-300">Curated Playlist</span>
                              </div>
                            )}

                            {/* Category Pill */}
                            <span className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-slate-900/85 text-white font-bold text-[10px] rounded-md shadow-xs backdrop-blur-sm border border-white/10 uppercase tracking-wider">
                              {pl.category}
                            </span>

                            {/* Featured Star Badge */}
                            {pl.isFeatured && (
                              <span className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-amber-500 text-slate-950 font-black text-[10px] rounded-md shadow-xs flex items-center gap-1">
                                <Star className="w-3 h-3 fill-slate-950" />
                                Featured on App Feed
                              </span>
                            )}

                            {/* Video Count Badge */}
                            <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 bg-black/75 text-white font-semibold text-[11px] rounded-md flex items-center gap-1.5 backdrop-blur-xs">
                              <Play className="w-3 h-3 fill-white" />
                              {videoCount} {videoCount === 1 ? 'Video' : 'Videos'}
                            </span>
                          </div>

                          {/* Playlist Info */}
                          <div className="p-4 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm line-clamp-1 leading-snug">
                              {pl.title}
                            </h3>
                            <p className="text-xs text-slate-500 line-clamp-2">
                              {pl.description || 'Comprehensive curated learning series for students.'}
                            </p>

                            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
                                Order: {pl.displayOrder ?? 0}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-600">
                                Category: <strong className="text-slate-800">{pl.category}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActivePlaylistFilter(pl);
                              setInspireSubTab('VIDEOS');
                            }}
                            className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                          >
                            <span>View {videoCount} Videos</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleFeaturedPlaylist(pl)}
                              className={`p-1.5 rounded-md border text-xs font-semibold transition-all cursor-pointer ${
                                pl.isFeatured
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-white text-slate-500 border-slate-200 hover:text-amber-600'
                              }`}
                              title={pl.isFeatured ? 'Featured on Mobile App Feed' : 'Click to feature on Mobile App Feed'}
                            >
                              <Star className={`w-3.5 h-3.5 ${pl.isFeatured ? 'fill-amber-500 text-amber-600' : ''}`} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditPlaylistModal(pl)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-md shadow-2xs cursor-pointer"
                              title="Edit Playlist"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeletePlaylist(pl.id, pl.title)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 border border-rose-200 rounded-md shadow-2xs cursor-pointer"
                              title="Delete Playlist"
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
            </div>
          )}

          {/* VIEW TAB 2: FEATURED LEARNING & FEED MANAGER */}
          {viewMode === 'INSPIRE' && inspireSubTab === 'FEATURED' && (
            <div className="space-y-6">
              {/* Feed Header Explainer */}
              <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent p-5 rounded-2xl border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-600" />
                    <span>Mobile App Inspire Tab — Hero Carousel &amp; Featured Feeds</span>
                  </div>
                  <p className="text-xs text-slate-600 max-w-2xl">
                    Items marked with ⭐ Featured appear directly at the top carousel and high-yield collections of the student mobile app Inspire screen.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="px-3 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-900 shadow-2xs">
                    {featuredPlaylists.length} Playlists Active
                  </span>
                  <span className="px-3 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-900 shadow-2xs">
                    {featuredVideos.length} Videos Active
                  </span>
                </div>
              </div>

              {/* Sub-section: Featured Curated Playlists */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ListVideo className="w-4 h-4 text-amber-500" />
                    Featured Playlists ({featuredPlaylists.length})
                  </h3>
                  <button
                    onClick={() => setInspireSubTab('PLAYLISTS')}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
                  >
                    Manage all playlists →
                  </button>
                </div>

                {featuredPlaylists.length === 0 ? (
                  <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                    No playlists are currently featured on the mobile app feed. Go to Curated Playlists and click the star icon to feature.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {featuredPlaylists.map((pl) => (
                      <div
                        key={pl.id}
                        className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 overflow-hidden">
                            {pl.thumbnailUrl ? (
                              <img src={pl.thumbnailUrl} alt={pl.title} className="w-full h-full object-cover" />
                            ) : (
                              <ListVideo className="w-5 h-5 text-amber-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate">{pl.title}</p>
                            <p className="text-[11px] text-slate-500">Category: {pl.category}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleFeaturedPlaylist(pl)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-[11px] font-semibold shrink-0 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sub-section: Featured Masterclasses */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Film className="w-4 h-4 text-orange-500" />
                    Featured Video Masterclasses ({featuredVideos.length})
                  </h3>
                  <button
                    onClick={() => setInspireSubTab('VIDEOS')}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
                  >
                    Browse all videos →
                  </button>
                </div>

                {featuredVideos.length === 0 ? (
                  <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                    No individual videos are marked as Featured yet. You can feature any video by clicking the star icon on its card.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {featuredVideos.map((v) => (
                      <div
                        key={v.id}
                        className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0 overflow-hidden">
                            {v.thumbnailUrl ? (
                              <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                            ) : (
                              <Video className="w-5 h-5 text-orange-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate">{v.title}</p>
                            <p className="text-[11px] text-slate-500">
                              {v.category} • {Math.round((v.durationSeconds || 600) / 60)} min
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleFeaturedVideo(v)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-[11px] font-semibold shrink-0 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW TAB 3: VIDEOS GRID (COMMUNITY or INSPIRE EXPLORE VIDEOS) */}
          {(viewMode === 'COMMUNITY' || inspireSubTab === 'VIDEOS') && (
            <div>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="h-64 skeleton"></div>
                  <div className="h-64 skeleton"></div>
                  <div className="h-64 skeleton"></div>
                </div>
              ) : filteredVideos.length === 0 ? (
                <div className="p-12 bg-white rounded-xl border border-slate-200 text-center text-slate-400 space-y-2">
                  <Video className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">No videos found matching filters.</p>
                  <p className="text-xs text-slate-500">
                    Click &quot;Upload Video Session&quot; to add learning content to this section.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredVideos.map((v) => {
                    const assignedCount = v.assignedSchools?.length || 0;
                    const pMeta = getPillarMeta(v);
                    const assignedPlaylist = playlists.find((p) => p.id === v.playlistId);

                    return (
                      <div
                        key={v.id}
                        className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all"
                      >
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

                            {/* Pillar Badge */}
                            <span
                              className={`absolute top-2.5 left-2.5 px-2.5 py-1 font-bold text-[10px] rounded-md shadow-xs backdrop-blur-sm flex items-center gap-1 border ${pMeta.badgeBg} ${pMeta.badgeText} ${pMeta.badgeBorder}`}
                            >
                              <span>{pMeta.emoji}</span>
                              <span>{pMeta.name}</span>
                            </span>

                            {/* Exam / Class badge */}
                            {v.exam && (
                              <span className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-slate-900/85 text-white font-bold text-[10px] rounded-md shadow-xs backdrop-blur-sm border border-white/10">
                                {v.exam}{' '}
                                {v.classLevel && v.classLevel !== 'ALL'
                                  ? `• ${v.classLevel.replace('CLASS_', 'Cl ')}`
                                  : ''}
                              </span>
                            )}

                            {/* Duration Badge */}
                            {v.durationSeconds && v.durationSeconds > 0 ? (
                              <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/70 text-white font-mono text-[10px] rounded flex items-center gap-1 backdrop-blur-xs">
                                <Clock className="w-2.5 h-2.5" />
                                {Math.round(v.durationSeconds / 60)} min
                              </span>
                            ) : null}
                          </div>

                          {/* Video Info Content */}
                          <div className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug flex-1">
                                {v.title}
                              </h4>
                              {/* Star Feature button */}
                              <button
                                type="button"
                                onClick={() => handleToggleFeaturedVideo(v)}
                                className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors shrink-0 ${
                                  v.isFeatured
                                    ? 'bg-amber-100 border-amber-300 text-amber-700'
                                    : 'bg-white border-slate-200 text-slate-400 hover:text-amber-600'
                                }`}
                                title={v.isFeatured ? 'Featured on Mobile App Feed' : 'Feature on Mobile App Feed'}
                              >
                                <Star className={`w-3.5 h-3.5 ${v.isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
                              </button>
                            </div>

                            <p className="text-xs text-slate-500 line-clamp-2">
                              {v.description || 'No description provided.'}
                            </p>

                            {/* Curated Playlist Indicator */}
                            {assignedPlaylist && (
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-1 rounded-md">
                                <ListVideo className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span className="truncate">Playlist: {assignedPlaylist.title}</span>
                              </div>
                            )}

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
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded border border-slate-200 flex items-center gap-0.5"
                                  >
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
                                  <span
                                    key={sch.id}
                                    className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-medium truncate max-w-[120px]"
                                  >
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
                              <span>
                                Assigned Schools: <strong className="text-slate-900">{assignedCount}</strong>
                              </span>
                            </button>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedVideo(v);
                                  setModalSelectedSchoolIds(v.assignedSchools || []);
                                  const isInsp = v.category === 'INSPIRE';
                                  let editCat = v.category || (isInsp ? 'INSPIRE' : 'ACADEMIC');
                                  if (editCat === 'DRONE_TECHNOLOGY') editCat = 'DRONE_AVIATION';
                                  setVideoForm({
                                    title: v.title,
                                    description: v.description || '',
                                    targetSection: isInsp ? 'INSPIRE' : 'COMMUNITY',
                                    category: editCat,
                                    exam: v.exam || 'JEE',
                                    classLevel: v.classLevel || v.targetClass || 'ALL',
                                    tagsInput: v.tags?.join(', ') || '',
                                    youtubeId: v.youtubeId || '',
                                    bunnyVideoId: v.bunnyVideoId || '',
                                    videoUrl: v.videoUrl || '',
                                    thumbnailUrl: v.thumbnailUrl || '',
                                    durationMinutes: Math.round((v.durationSeconds || 1200) / 60),
                                    speakerName: '',
                                    speakerTag: '',
                                    format: 'VIDEO',
                                    playlistId: v.playlistId || '',
                                    isFeatured: v.isFeatured || false,
                                  });
                                  setSelectedVideoFile(null);
                                  setSelectedThumbnailFile(null);
                                  setThumbnailPreview(v.thumbnailUrl || '');
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
            </div>
          )}

          {/* CURATED PLAYLIST CREATE / EDIT MODAL */}
          {showPlaylistModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                  <div className="flex items-center gap-2">
                    <ListVideo className="w-5 h-5 text-amber-500" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        {selectedPlaylist ? 'Edit Curated Playlist' : 'Create Curated Playlist'}
                      </h3>
                      <p className="text-slate-500 text-xs">
                        Displayed in mobile app Inspire tab roadmaps &amp; series
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPlaylistModal(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSavePlaylist} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                  <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Playlist Title *</label>
                      <input
                        type="text"
                        required
                        value={playlistForm.title}
                        onChange={(e) => setPlaylistForm({ ...playlistForm, title: e.target.value })}
                        placeholder="e.g. JEE Physics: Complete Mechanics Masterclass"
                        className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-medium focus:border-slate-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={playlistForm.description}
                        onChange={(e) => setPlaylistForm({ ...playlistForm, description: e.target.value })}
                        placeholder="Comprehensive series covering all fundamental concepts..."
                        className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-medium focus:border-slate-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Category / Vertical *</label>
                        <select
                          value={playlistForm.category}
                          onChange={(e) => setPlaylistForm({ ...playlistForm, category: e.target.value })}
                          className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-semibold focus:border-slate-500 focus:outline-none cursor-pointer"
                        >
                          <option value="JEE">JEE Physics / Chemistry / Math</option>
                          <option value="NEET">NEET Biology &amp; Medicine</option>
                          <option value="ACADEMIC">Academic Mentorship</option>
                          <option value="HACKATHON">Hackathon &amp; Coding</option>
                          <option value="ENTREPRENEURSHIP">Entrepreneurship &amp; Startups</option>
                          <option value="DRONE_TECHNOLOGY">Drone Technology &amp; UAV</option>
                          <option value="INSPIRE">Topper Mantra Inspire Series</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Display Order</label>
                        <input
                          type="number"
                          value={playlistForm.displayOrder}
                          onChange={(e) =>
                            setPlaylistForm({ ...playlistForm, displayOrder: parseInt(e.target.value, 10) || 0 })
                          }
                          className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-semibold focus:border-slate-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Playlist Cover Poster */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Playlist Cover Poster
                        </label>
                        <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-lg text-[11px] font-semibold">
                          <button
                            type="button"
                            onClick={() => setPlaylistThumbMode('file')}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              playlistThumbMode === 'file'
                                ? 'bg-amber-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Upload File
                          </button>
                          <button
                            type="button"
                            onClick={() => setPlaylistThumbMode('url')}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              playlistThumbMode === 'url'
                                ? 'bg-amber-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Paste URL
                          </button>
                        </div>
                      </div>

                      {playlistThumbMode === 'file' ? (
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePlaylistThumbFileSelect}
                            className="w-full p-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-xs"
                          />
                          {playlistThumbPreview && (
                            <img
                              src={playlistThumbPreview}
                              alt="Playlist Thumbnail"
                              className="mt-2 h-24 w-44 object-cover rounded-lg border border-slate-300"
                            />
                          )}
                        </div>
                      ) : (
                        <div>
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/..."
                            value={playlistForm.thumbnailUrl}
                            onChange={(e) => setPlaylistForm({ ...playlistForm, thumbnailUrl: e.target.value })}
                            className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-xs font-mono"
                          />
                          {playlistForm.thumbnailUrl && (
                            <img
                              src={playlistForm.thumbnailUrl}
                              alt="Playlist Preview"
                              className="mt-2 h-24 w-44 object-cover rounded-lg border border-slate-300"
                            />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Feature on App Feed Toggle */}
                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-amber-200 bg-amber-50/60 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={playlistForm.isFeatured}
                        onChange={(e) => setPlaylistForm({ ...playlistForm, isFeatured: e.target.checked })}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <div>
                        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>⭐</span> Feature on Mobile App Feed (Inspire Carousel)
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Highlights this curated playlist on the student app&apos;s Inspire feed header.
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0 bg-white">
                    <button
                      type="button"
                      onClick={() => setShowPlaylistModal(false)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-semibold rounded-lg shadow-2xs disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
                    >
                      {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {submitting ? 'Saving...' : selectedPlaylist ? 'Update Playlist' : 'Create Playlist'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* UPLOAD / EDIT VIDEO MODAL */}
          {showVideoModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Fixed Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                  <div className="flex items-center gap-2">
                    <Film className="w-5 h-5 text-orange-600" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        {selectedVideo
                          ? 'Edit Video Metadata'
                          : videoForm.targetSection === 'INSPIRE'
                          ? 'Upload Inspire Hub Masterclass'
                          : 'Upload Video to Community Pillar'}
                      </h3>
                      <p className="text-slate-500 text-xs">
                        Target: {videoForm.targetSection === 'INSPIRE' ? 'Inspire Tab (Explore)' : 'Community Live Sessions'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowVideoModal(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
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
                          {thumbnailUploadMode === 'file' ? (
                            thumbnailPreview ? (
                              <>
                                <img
                                  src={thumbnailPreview}
                                  alt="Poster Preview"
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedThumbnailFile(null);
                                    setThumbnailPreview('');
                                  }}
                                  className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-semibold transition-opacity cursor-pointer"
                                  title="Remove Poster"
                                >
                                  Remove
                                </button>
                              </>
                            ) : (
                              <ImageIcon className="w-6 h-6 text-slate-300" />
                            )
                          ) : videoForm.thumbnailUrl ? (
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
                                {selectedThumbnailFile
                                  ? `✓ Poster selected: ${selectedThumbnailFile.name} (${(selectedThumbnailFile.size / 1024).toFixed(0)} KB)`
                                  : 'Select PNG, JPG, or WEBP poster from your computer (uploaded to Bunny CDN)'}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <input
                                type="url"
                                placeholder="Paste image URL (https://...)"
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

                    {/* Target App Destination Selector */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <label className="block font-bold text-slate-700 text-xs uppercase tracking-wider">
                        Target App Destination *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setVideoForm((prev) => ({
                              ...prev,
                              targetSection: 'COMMUNITY',
                              category: prev.category === 'INSPIRE' ? 'ACADEMIC' : prev.category,
                            }))
                          }
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            videoForm.targetSection === 'COMMUNITY'
                              ? 'bg-orange-50/80 border-orange-400 ring-2 ring-orange-400/20 shadow-2xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                            <Video className="w-4 h-4 text-orange-600" />
                            <span>Community Live Sessions</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            School Communities (Academics, Hackathons, Startups, Drones)
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setVideoForm((prev) => ({
                              ...prev,
                              targetSection: 'INSPIRE',
                              category: 'INSPIRE',
                              isFeatured: true,
                            }))
                          }
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            videoForm.targetSection === 'INSPIRE'
                              ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/20 shadow-2xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span>Inspire Hub</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Podcasts, AIR Topper masterclasses &amp; motivational talks
                          </p>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        {videoForm.targetSection === 'INSPIRE' ? 'Masterclass / Podcast Title *' : 'Video Title *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={videoForm.title}
                        onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                        placeholder={
                          videoForm.targetSection === 'INSPIRE'
                            ? 'e.g. How I Cracked AIR 1 in JEE Advanced — Strategy & Mindset'
                            : "e.g. JEE Physics — Newton's Laws of Motion Masterclass"
                        }
                        className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-medium focus:border-slate-500 focus:outline-none placeholder:text-slate-400"
                      />
                    </div>

                    {/* Curated Playlist Dropdown */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <label className="block font-semibold text-slate-700">
                        Assign to Curated Playlist (Optional)
                      </label>
                      <select
                        value={videoForm.playlistId}
                        onChange={(e) => setVideoForm({ ...videoForm, playlistId: e.target.value })}
                        className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-semibold focus:border-slate-500 focus:outline-none cursor-pointer"
                      >
                        <option value="">None (Standalone Video)</option>
                        {playlists.map((pl) => (
                          <option key={pl.id} value={pl.id}>
                            📑 {pl.title} ({pl.category})
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-400">
                        Links this video inside an organized roadmap on the mobile app.
                      </p>
                    </div>

                    {videoForm.targetSection === 'INSPIRE' ? (
                      /* Inspire Hub Specific Fields: Speaker, Tagline & Format */
                      <div className="p-4 bg-amber-50/50 border border-amber-200/70 rounded-xl space-y-3">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Inspire Speaker &amp; Format Details</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Format *</label>
                            <select
                              value={videoForm.format}
                              onChange={(e: any) => setVideoForm({ ...videoForm, format: e.target.value })}
                              className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-semibold focus:border-slate-500 focus:outline-none cursor-pointer"
                            >
                              <option value="VIDEO">🎬 Video Masterclass</option>
                              <option value="PODCAST">🎙️ Podcast Episode</option>
                              <option value="SHORT">⚡ Short / Insight Clip</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Speaker / Mentor Name</label>
                            <input
                              type="text"
                              value={videoForm.speakerName}
                              onChange={(e) => setVideoForm({ ...videoForm, speakerName: e.target.value })}
                              placeholder="e.g. Aditya Srivastava (AIR 1)"
                              className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-medium focus:border-slate-500 focus:outline-none placeholder:text-slate-400"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Speaker Tag / Credential</label>
                            <input
                              type="text"
                              value={videoForm.speakerTag}
                              onChange={(e) => setVideoForm({ ...videoForm, speakerTag: e.target.value })}
                              placeholder="e.g. IIT Kanpur Alum & Tech Lead"
                              className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-medium focus:border-slate-500 focus:outline-none placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Community Pillar Fields */
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Community Pillar *</label>
                            <select
                              value={videoForm.category}
                              onChange={(e) => {
                                const newCat = e.target.value;
                                let newExam = videoForm.exam;
                                if (
                                  newCat === 'HACKATHON' ||
                                  newCat === 'ENTREPRENEURSHIP' ||
                                  newCat === 'DRONE_AVIATION'
                                ) {
                                  if (
                                    newExam === 'JEE' ||
                                    newExam === 'NEET' ||
                                    newExam === 'CUET' ||
                                    newExam === 'Boards'
                                  ) {
                                    newExam = 'OTHER';
                                  }
                                } else if (newCat === 'ACADEMIC' && newExam === 'OTHER') {
                                  newExam = 'JEE';
                                }
                                setVideoForm({ ...videoForm, category: newCat, exam: newExam });
                              }}
                              className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-semibold focus:border-slate-500 focus:outline-none cursor-pointer"
                            >
                              {PILLAR_OPTIONS.filter((p) => p.value !== 'INSPIRE').map((p) => (
                                <option key={p.value} value={p.value} className="text-slate-900 bg-white">
                                  {p.emoji} {p.label} — {p.subtitle}
                                </option>
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
                                <option key={ex} value={ex} className="text-slate-900 bg-white">
                                  {ex}
                                </option>
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
                                <option key={cl.value} value={cl.value} className="text-slate-900 bg-white">
                                  {cl.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Speaker details for Community Live Sessions */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Speaker / Mentor Name</label>
                            <input
                              type="text"
                              value={videoForm.speakerName}
                              onChange={(e) => setVideoForm({ ...videoForm, speakerName: e.target.value })}
                              placeholder="e.g. Dr. Rohit Gupta (AIIMS New Delhi)"
                              className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-medium focus:border-slate-500 focus:outline-none placeholder:text-slate-400"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Speaker Designation / Tag</label>
                            <input
                              type="text"
                              value={videoForm.speakerTag}
                              onChange={(e) => setVideoForm({ ...videoForm, speakerTag: e.target.value })}
                              placeholder="e.g. Senior Faculty & AIR Ranker"
                              className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-medium focus:border-slate-500 focus:outline-none placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Feature on App Feed Toggle */}
                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-amber-200 bg-amber-50/60 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={videoForm.isFeatured}
                        onChange={(e) => setVideoForm({ ...videoForm, isFeatured: e.target.checked })}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <div>
                        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>⭐</span> Feature on Mobile App Feed &amp; Inspire Carousel
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Highlights this masterclass prominently in the mobile app&apos;s Featured Learning feed.
                        </p>
                      </div>
                    </label>

                    {/* Video Source Selection (Direct File Upload to Bunny CDN vs Manual Video ID) */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 uppercase tracking-wider text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                          <span>Video Source &amp; Playback</span>
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
                          onChange={(e) =>
                            setVideoForm({ ...videoForm, durationMinutes: parseInt(e.target.value, 10) || 30 })
                          }
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

                    {/* Partner School Assignment in Upload Modal */}
                    {videoForm.targetSection === 'INSPIRE' ? (
                      <div className="p-4 bg-amber-50/60 border border-amber-200/70 rounded-xl space-y-1.5">
                        <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          <span>Global App Access — Inspire Tab</span>
                        </div>
                        <p className="text-[11px] text-amber-800">
                          Inspire Hub masterclasses and playlists are accessible to students across partner schools via the Inspire Tab feed.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <SchoolIcon className="w-4 h-4 text-orange-600" />
                            <span>Assign to Partner Schools</span>
                          </div>
                          <span className="text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                            {modalSelectedSchoolIds.length} Selected
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Choose which partner school apps will receive this video lecture under this community pillar.
                        </p>
                        {schools.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">No partner schools registered yet.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                            {schools.map((s) => {
                              const isChecked = modalSelectedSchoolIds.includes(s.id);
                              return (
                                <label
                                  key={s.id}
                                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                    isChecked
                                      ? 'bg-orange-50/80 border-orange-300 text-slate-900 font-semibold'
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/60'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      setModalSelectedSchoolIds((prev) =>
                                        prev.includes(s.id)
                                          ? prev.filter((id) => id !== s.id)
                                          : [...prev, s.id]
                                      );
                                    }}
                                    className="rounded text-orange-600 focus:ring-orange-500 w-3.5 h-3.5"
                                  />
                                  <span className="truncate">{s.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Fixed Footer Buttons */}
                  <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white">
                    <p className="text-[11px] text-slate-400">
                      {submitting ? 'Streaming video &amp; publishing metadata...' : 'Video will be published with instant playback.'}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowVideoModal(false)}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg cursor-pointer"
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
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                  >
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

export default function LiveContentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 text-xs font-semibold">
          Loading Content Studio...
        </div>
      }
    >
      <LiveContentPageContent />
    </Suspense>
  );
}