'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { mediaApi, MediaItem, MediaType, schoolsApi, School } from '@/api';
import {
  FileImage,
  FileText,
  Plus,
  Trash2,
  Edit3,
  Search,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  School as SchoolIcon,
  Tag,
  Loader2,
  Upload,
  X,
  ExternalLink,
  Eye,
  Download,
  Filter,
  BookOpen,
  Sparkles,
  Layers,
  Compass,
} from 'lucide-react';
import {
  uploadImageToBunnyStorage,
  compressImageToBlob,
  createLocalPreview,
  BUNNY_CONFIG,
} from '@/lib/bunnyStorage';

const EXPLORE_PILLARS = [
  { code: 'ALL', name: 'All Explore Resources', emoji: '📚', desc: 'All study notes & documents published to the Explore section' },
  { code: 'ACADEMICS', name: 'Academics', emoji: '🎓', desc: 'Topper Notes, Formula Sheets & PYQs for JEE, NEET, CUET & Boards' },
  { code: 'HACKATHON', name: 'Hackathon', emoji: '💻', desc: 'Coding frameworks, SIH playbooks & problem statements' },
  { code: 'ENTREPRENEURSHIP', name: 'Entrepreneurship', emoji: '🚀', desc: 'Startup business models, pitch decks & grant applications' },
  { code: 'DRONE_AVIATION', name: 'Drone Aviation', emoji: '🛩️', desc: 'DGCA UAV regulations, aerodynamics & schematic notes' },
];

const RESOURCE_TYPES = [
  { code: 'TOPPER_NOTES', label: 'Topper Handwritten Notes', emoji: '📝', desc: 'Real notes from AIR rankers' },
  { code: 'FORMULA_SHEET', label: 'Formula Sheets & Mindmaps', emoji: '📐', desc: 'Quick revision cheat sheets' },
  { code: 'PYQ_BANK', label: 'PYQs & Detailed Solutions', emoji: '📖', desc: 'Past 10 years chapterwise questions' },
  { code: 'GUIDE_TEMPLATE', label: 'Playbooks & Templates', emoji: '📑', desc: 'Guides, pitch decks & project templates' },
];

const CATEGORIES = ['All', 'Academics', 'Hackathon', 'Entrepreneurship', 'Drone Aviation', 'Inspire', 'Notes', 'Formula Sheet', 'Question Bank', 'Mock Test', 'Reference', 'Other'];
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
const SUBJECTS = ['', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Other'];

async function uploadPdfToBunny(file: File, onProgress?: (p: number) => void): Promise<string> {
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `pdfs/pdf_${timestamp}_${randomSuffix}_${safeName}`;
  const hosts = ['storage.bunnycdn.com', BUNNY_CONFIG.storageHost, 'uk.storage.bunnycdn.com'];

  let lastError: Error | null = null;
  for (const host of hosts) {
    try {
      const uploadUrl = `https://${host}/${BUNNY_CONFIG.storageZone}/${filename}`;
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('AccessKey', BUNNY_CONFIG.storageKey);
        xhr.setRequestHeader('Content-Type', 'application/pdf');
        if (xhr.upload && onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
          };
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Bunny Storage returned HTTP ${xhr.status}: ${xhr.statusText || xhr.responseText}`));
          }
        };
        xhr.onerror = () => reject(new Error(`Network error uploading PDF to Bunny CDN (${host})`));
        xhr.timeout = 180000;
        xhr.ontimeout = () => reject(new Error('PDF upload to Bunny CDN timed out after 3 minutes'));
        xhr.send(file);
      });
      return `${BUNNY_CONFIG.cdnPullZoneUrl}/${filename}`;
    } catch (err: any) {
      lastError = err;
      console.warn(`PDF upload to ${host} failed:`, err.message);
    }
  }

  // Fallback: If direct browser upload failed, upload via server API route
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'pdfs');

    const res = await fetch('/api/bunny/upload-file', {
      method: 'POST',
      body: formData,
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data?.url) {
        return json.data.url;
      }
    }
  } catch (serverErr: any) {
    console.warn('Server fallback PDF upload failed:', serverErr.message);
  }

  throw lastError || new Error('Failed to upload PDF to Bunny CDN Storage');
}

interface MediaForm {
  title: string;
  description: string;
  type: MediaType;
  pillar: string;
  resourceType: string;
  category: string;
  exam: string;
  classLevel: string;
  subject: string;
  tagsInput: string;
}

const defaultForm: MediaForm = {
  title: '',
  description: '',
  type: 'PDF',
  pillar: 'ACADEMICS',
  resourceType: 'TOPPER_NOTES',
  category: 'Academics',
  exam: 'JEE',
  classLevel: 'CLASS_12',
  subject: '',
  tagsInput: '',
};

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedPillar, setSelectedPillar] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | MediaType>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [examFilter, setExamFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('ALL');
  const [schoolFilter, setSchoolFilter] = useState('');

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [form, setForm] = useState<MediaForm>(defaultForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStage, setUploadStage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  // Assign Schools modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningItem, setAssigningItem] = useState<MediaItem | null>(null);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  const [savingAssignments, setSavingAssignments] = useState(false);

  // Preview lightbox
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<MediaType>('IMAGE');

  const fetchAll = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [mRes, sRes] = await Promise.allSettled([
        mediaApi.getMedia({
          search: search || undefined,
          type: typeFilter !== 'ALL' ? typeFilter : undefined,
          category: categoryFilter !== 'All' ? categoryFilter : undefined,
          exam: examFilter !== 'All' ? examFilter : undefined,
          classLevel: classFilter !== 'ALL' ? classFilter : undefined,
          schoolId: schoolFilter || undefined,
        }),
        schoolsApi.getSchools(),
      ]);

      if (mRes.status === 'fulfilled' && mRes.value.success) {
        setItems(mRes.value.data.items || []);
      } else if (mRes.status === 'rejected') {
        setErrorMsg(mRes.reason?.message || 'Failed to fetch media library.');
      }
      if (sRes.status === 'fulfilled' && sRes.value.success) {
        setSchools(sRes.value.data || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load media library.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, categoryFilter, examFilter, classFilter, schoolFilter]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const openUploadModal = (item?: MediaItem) => {
    if (item) {
      setSelectedItem(item);
      const matchedPillar = EXPLORE_PILLARS.find(p => p.code === item.category?.toUpperCase() || item.category?.toUpperCase().includes(p.code))?.code || 'ACADEMICS';
      const matchedResType = RESOURCE_TYPES.find(r => item.tags?.includes(r.code))?.code || 'TOPPER_NOTES';
      setForm({
        title: item.title,
        description: item.description || '',
        type: item.type,
        pillar: matchedPillar,
        resourceType: matchedResType,
        category: item.category || 'Academics',
        exam: item.exam || 'JEE',
        classLevel: item.classLevel || 'CLASS_12',
        subject: item.subject || '',
        tagsInput: item.tags?.filter(t => t !== matchedResType && t !== 'EXPLORE_SECTION').join(', ') || '',
      });
    } else {
      setSelectedItem(null);
      const defaultPillar = selectedPillar !== 'ALL' ? selectedPillar : 'ACADEMICS';
      setForm({
        ...defaultForm,
        pillar: defaultPillar,
      });
    }
    setSelectedFile(null);
    setSelectedThumbnailFile(null);
    setThumbnailPreview('');
    setUploadProgress(null);
    setUploadStage('');
    setShowUploadModal(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/') || file.name.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
      alert('⚠️ Video files cannot be uploaded here!\n\nThe Explore Section is strictly for study resources: PDF notes, formula sheets, and playbooks.\n\nPlease upload videos under "Community Sessions & Clips" or "Inspire Hub".');
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
      alert('Please select a valid PDF document or study image (PNG, JPG, WEBP).');
      return;
    }

    setSelectedFile(file);

    // Auto-detect type
    const detectedType: MediaType = isPdf ? 'PDF' : 'IMAGE';
    setForm((prev) => ({
      ...prev,
      type: detectedType,
      title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
    }));
  };

  const handleThumbnailSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file for the thumbnail.');
      return;
    }
    setSelectedThumbnailFile(file);
    const preview = await createLocalPreview(file);
    setThumbnailPreview(preview);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem && !selectedFile) {
      alert('Please select a file to upload (PDF document or Image).');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setUploadProgress(null);
    setUploadStage('');

    try {
      let finalFileUrl = selectedItem?.fileUrl || '';
      let finalThumbnailUrl = selectedItem?.thumbnailUrl || '';
      let finalFileSize = selectedItem?.fileSize;

      // Upload the main file to Bunny CDN
      if (selectedFile) {
        const isPdf = form.type === 'PDF';
        if (isPdf) {
          setUploadStage('Uploading PDF to Bunny CDN Storage...');
          finalFileUrl = await uploadPdfToBunny(selectedFile, (pct) => {
            setUploadProgress(pct);
            setUploadStage(`Uploading PDF (${pct}%)...`);
          });
          finalFileSize = selectedFile.size;
        } else {
          setUploadStage('Compressing and uploading image to Bunny CDN...');
          const compressed = await compressImageToBlob(selectedFile, 2000, 2000, 0.88);
          finalFileUrl = await uploadImageToBunnyStorage(compressed, 'media-images', (pct) => {
            setUploadProgress(pct);
            setUploadStage(`Uploading image (${pct}%)...`);
          });
          finalFileSize = selectedFile.size;
          // Use image itself as thumbnail if none selected
          if (!selectedThumbnailFile && !finalThumbnailUrl) {
            finalThumbnailUrl = finalFileUrl;
          }
        }
      }

      // Upload separate thumbnail (for PDFs)
      if (selectedThumbnailFile) {
        setUploadStage('Uploading thumbnail to Bunny CDN...');
        const compThumb = await compressImageToBlob(selectedThumbnailFile, 800, 800, 0.85);
        finalThumbnailUrl = await uploadImageToBunnyStorage(compThumb, 'media-thumbs', (pct) => {
          setUploadProgress(pct);
          setUploadStage(`Uploading thumbnail (${pct}%)...`);
        });
      }

      const tagsArr = form.tagsInput
        ? form.tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        type: form.type,
        fileUrl: finalFileUrl,
        thumbnailUrl: finalThumbnailUrl || undefined,
        fileSize: finalFileSize,
        category: form.pillar,
        exam: form.exam,
        classLevel: form.classLevel,
        subject: form.subject.trim() || undefined,
        tags: [form.resourceType, 'EXPLORE_SECTION', ...tagsArr],
        status: 'ACTIVE',
      };

      setUploadStage('Saving to backend...');

      if (selectedItem) {
        await mediaApi.updateMedia(selectedItem.id, payload);
        showToast(`✓ "${form.title}" updated successfully!`);
      } else {
        await mediaApi.createMedia(payload);
        showToast(`🎉 "${form.title}" uploaded to Bunny CDN & saved!`);
      }

      setShowUploadModal(false);
      fetchAll();
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload failed. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
      setUploadStage('');
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      await mediaApi.deleteMedia(item.id);
      showToast(`✓ "${item.title}" deleted.`);
      fetchAll();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete item.');
    }
  };

  const openAssignModal = (item: MediaItem) => {
    setAssigningItem(item);
    setSelectedSchoolIds(item.assignedSchools || []);
    setShowAssignModal(true);
  };

  const toggleSchoolSelection = (schoolId: string) => {
    setSelectedSchoolIds((prev) =>
      prev.includes(schoolId) ? prev.filter((id) => id !== schoolId) : [...prev, schoolId]
    );
  };

  const handleSaveAssignments = async () => {
    if (!assigningItem) return;
    setSavingAssignments(true);
    try {
      await mediaApi.assignMediaToSchools(assigningItem.id, selectedSchoolIds);
      showToast(`✓ School assignments updated for "${assigningItem.title}"!`);
      setShowAssignModal(false);
      setAssigningItem(null);
      fetchAll();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save school assignments.');
    } finally {
      setSavingAssignments(false);
    }
  };

  const imageItems = items.filter((i) => i.type === 'IMAGE');
  const pdfItems = items.filter((i) => i.type === 'PDF');

  const getPillarCount = (code: string) => {
    if (code === 'ALL') return items.length;
    return items.filter((i) => (i.category || '').toUpperCase().includes(code)).length;
  };

  const filteredItems = items.filter((item) => {
    if (selectedPillar !== 'ALL') {
      const cat = (item.category || '').toUpperCase();
      if (!cat.includes(selectedPillar)) return false;
    }
    if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;
    if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
    if (examFilter !== 'All' && item.exam !== examFilter) return false;
    if (classFilter !== 'ALL' && item.classLevel !== classFilter) return false;
    if (schoolFilter) {
      const isAssigned = item.assignedSchools?.includes(schoolFilter) || item.assignedSchoolsDetails?.some(s => s.id === schoolFilter);
      if (!isAssigned) return false;
    }
    return true;
  });

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-6 flex-1 animate-in fade-in duration-300">

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-amber-100/80 text-amber-900 border border-amber-300/80 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <span>📂</span> Target: Student App → Explore Section
                </span>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-bold">
                  PDFs & Study Notes Only
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-orange-600" />
                Explore Section — Study Resources & Topper Notes
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Upload PDFs, Topper Handwritten Notes, Formula Sheets & Playbooks directly to the Student Mobile App&apos;s Explore section (NO videos).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchAll}
                disabled={loading}
                className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg shadow-2xs cursor-pointer"
                title="Refresh Library"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
              </button>
              <button
                onClick={() => openUploadModal()}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Upload Notes / PDF Resource
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={fetchAll} className="px-3 py-1 bg-rose-600 text-white rounded-md text-xs font-semibold hover:bg-rose-700 cursor-pointer">
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

          {/* Pillar Navigation Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-black text-slate-900 tracking-wider uppercase">
                  Explore Program Pillars
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Pillars sync directly to Explore Programs in the student mobile app
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {EXPLORE_PILLARS.map((pillar) => {
                const isActive = selectedPillar === pillar.code;
                const count = getPillarCount(pillar.code);
                return (
                  <button
                    key={pillar.code}
                    type="button"
                    onClick={() => setSelectedPillar(pillar.code)}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
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
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">
                    {EXPLORE_PILLARS.find((p) => p.code === selectedPillar)?.emoji}{' '}
                    {EXPLORE_PILLARS.find((p) => p.code === selectedPillar)?.name}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">
                    {EXPLORE_PILLARS.find((p) => p.code === selectedPillar)?.desc}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  Active Explore Filter
                </span>
              </div>
            )}
          </div>

          {/* Stats Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Explore Resources', value: items.length, color: 'slate' },
              { label: 'PDF Documents', value: pdfItems.length, color: 'orange' },
              { label: 'Images & Covers', value: imageItems.length, color: 'blue' },
              { label: 'Partner Schools', value: schools.length, color: 'emerald' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className={`text-2xl font-black mt-0.5 text-${stat.color}-600`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Filters Bar */}
          <form
            onSubmit={(e) => { e.preventDefault(); fetchAll(); }}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-center"
          >
            <div className="relative md:col-span-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search title or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 font-medium"
              />
            </div>
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="IMAGE">Images Only</option>
                <option value="PDF">PDFs Only</option>
              </select>
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

          {/* Media Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-56 skeleton" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-16 bg-white rounded-xl border border-slate-200 text-center text-slate-400 space-y-3">
              <FileImage className="w-14 h-14 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No resources found matching filters.</p>
              <p className="text-xs text-slate-500">Click &quot;Upload Notes / PDF Resource&quot; to publish materials to the Explore section.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredItems.map((item) => {
                const assignedCount = item.assignedSchools?.length || 0;
                const isPdf = item.type === 'PDF';
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col hover:border-slate-300 hover:shadow-md transition-all"
                  >
                    {/* Thumbnail / Preview Header */}
                    <div
                      className="relative h-40 overflow-hidden cursor-pointer group"
                      onClick={() => {
                        setPreviewUrl(item.fileUrl);
                        setPreviewType(item.type);
                      }}
                    >
                      {isPdf ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-orange-50 to-amber-50 border-b border-orange-100">
                          <div className="w-14 h-14 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center shadow-2xs">
                            <FileText className="w-7 h-7 text-orange-600" />
                          </div>
                          <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">PDF Document</span>
                        </div>
                      ) : item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-blue-100">
                          <ImageIcon className="w-8 h-8 text-blue-300" />
                          <span className="text-[11px] text-slate-400">Image</span>
                        </div>
                      )}

                      {/* Type Badge */}
                      <span className={`absolute top-2.5 left-2.5 px-2.5 py-1 text-[10px] font-bold uppercase rounded-md backdrop-blur-xs shadow-2xs ${
                        isPdf
                          ? 'bg-orange-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}>
                        {item.type}
                      </span>

                      {/* Exam Badge */}
                      {item.exam && (
                        <span className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-slate-900/80 text-white font-bold text-[10px] rounded-md backdrop-blur-xs">
                          {item.exam}
                        </span>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow">
                          {isPdf ? <ExternalLink className="w-4 h-4 text-slate-700" /> : <Eye className="w-4 h-4 text-slate-700" />}
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 flex-1 space-y-2">
                      <h4 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">{item.title}</h4>
                      {item.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                      )}

                      {/* Meta Chips */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {item.category && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded border border-slate-200">
                            {item.category}
                          </span>
                        )}
                        {item.subject && (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded border border-indigo-200">
                            {item.subject}
                          </span>
                        )}
                        {item.classLevel && item.classLevel !== 'ALL' && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded border border-emerald-200">
                            {item.classLevel.replace('CLASS_', 'Class ')}
                          </span>
                        )}
                        {item.fileSize && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-semibold rounded border border-slate-200">
                            {formatBytes(item.fileSize)}
                          </span>
                        )}
                      </div>

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {item.tags.map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded border border-slate-200 flex items-center gap-0.5">
                              <Tag className="w-2.5 h-2.5 text-slate-400" /> {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Assigned Schools Preview */}
                      {item.assignedSchoolsDetails && item.assignedSchoolsDetails.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] text-slate-400 font-semibold">Schools:</span>
                          {item.assignedSchoolsDetails.slice(0, 2).map((sch) => (
                            <span key={sch.id} className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-medium truncate max-w-[100px]">
                              {sch.name}
                            </span>
                          ))}
                          {item.assignedSchoolsDetails.length > 2 && (
                            <span className="text-[10px] text-slate-500 font-semibold">
                              +{item.assignedSchoolsDetails.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions Footer */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <button
                          onClick={() => openAssignModal(item)}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:border-orange-400 text-slate-700 font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 hover:text-orange-600 transition-all cursor-pointer"
                        >
                          <SchoolIcon className="w-3.5 h-3.5 text-orange-600" />
                          <span>Schools: <strong className="text-slate-900">{assignedCount}</strong></span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-600 hover:text-blue-700 bg-white border border-slate-200 rounded-md shadow-2xs cursor-pointer"
                            title="Open / Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => openUploadModal(item)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-md shadow-2xs cursor-pointer"
                            title="Edit Metadata"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 border border-rose-200 rounded-md shadow-2xs cursor-pointer"
                            title="Delete"
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
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════
          UPLOAD / EDIT MODAL
      ══════════════════════════════════════════════════════ */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedItem ? 'Edit Explore Resource' : 'Publish Notes / PDF to Explore'}
                  </h3>
                  <p className="text-xs text-slate-500">Target: Student Mobile App → Explore Section (PDFs & Documents)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">

                {/* Target App Destination Banner */}
                <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">📂</span>
                    <div>
                      <p className="font-bold text-amber-950 text-xs">Target Destination: Student Mobile App → Explore Section</p>
                      <p className="text-[11px] text-amber-800">Resources uploaded here appear under Explore Programs &amp; Notes. Only PDF documents permitted.</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-200/70 text-amber-900 rounded text-[10px] font-black uppercase tracking-wider shrink-0">
                    Explore Only
                  </span>
                </div>

                {/* Program Pillar Selector */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                    Target Program Pillar *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {EXPLORE_PILLARS.filter(p => p.code !== 'ALL').map((p) => (
                      <button
                        key={p.code}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, pillar: p.code }))}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          form.pillar === p.code
                            ? 'border-orange-500 bg-orange-50/70 text-orange-950 ring-2 ring-orange-500/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <span className="text-lg block mb-1">{p.emoji}</span>
                        <span className="font-bold text-xs block truncate">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resource Category Type Selector */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                    Resource Category Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {RESOURCE_TYPES.map((rt) => (
                      <button
                        key={rt.code}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, resourceType: rt.code }))}
                        className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          form.resourceType === rt.code
                            ? 'border-orange-500 bg-orange-50/70 text-orange-950 font-bold shadow-xs ring-1 ring-orange-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600 font-medium'
                        }`}
                      >
                        <span className="text-base">{rt.emoji}</span>
                        <span className="truncate text-xs">{rt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* File Upload Drop Zone */}
                {!selectedItem && (
                  <div className="space-y-2">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider">
                      Select PDF Document *
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 border-2 border-dashed border-slate-200 hover:border-orange-400 bg-slate-50 hover:bg-orange-50/20 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 group-hover:border-orange-300 flex items-center justify-center shadow-2xs transition-colors">
                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-orange-500" />
                      </div>
                      <p className="font-semibold text-slate-700 group-hover:text-orange-700">
                        {selectedFile ? `✓ ${selectedFile.name}` : 'Click to choose PDF Document'}
                      </p>
                      <p className="text-[11px] text-slate-400">PDF Documents Only · Max 100 MB · Uploaded directly to Bunny Storage</p>
                    </div>
                    {selectedFile && (
                      <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <FileText className="w-4 h-4 text-orange-600 shrink-0" />
                        <span className="text-[11px] font-semibold text-emerald-800 truncate">
                          {selectedFile.name} · {formatBytes(selectedFile.size)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="ml-auto p-0.5 hover:bg-emerald-200 rounded"
                        >
                          <X className="w-3 h-3 text-emerald-600" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Thumbnail Upload (for PDFs) */}
                {form.type === 'PDF' && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider">
                      Cover Thumbnail <span className="text-slate-400 font-normal normal-case">(optional, for PDF)</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-14 rounded-lg bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                        {thumbnailPreview ? (
                          <img src={thumbnailPreview} alt="Thumb" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div>
                        <input
                          ref={thumbInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailSelect}
                          className="hidden"
                        />
                        <label
                          onClick={() => thumbInputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 hover:border-orange-400 text-slate-700 rounded-lg cursor-pointer font-semibold text-[11px] transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-orange-600" />
                          {selectedThumbnailFile ? `✓ ${selectedThumbnailFile.name}` : 'Choose Thumbnail Image'}
                        </label>
                        <p className="text-[10px] text-slate-400 mt-1">PNG, JPG · Uploaded to Bunny CDN</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. JEE Physics — Rotational Motion Formulas"
                    className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-medium focus:border-slate-500 focus:outline-none placeholder:text-slate-400"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Description</label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description of this resource..."
                    className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-medium focus:border-slate-500 focus:outline-none placeholder:text-slate-400 resize-none"
                  />
                </div>

                {/* Exam + Class + Subject */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Target Exam</label>
                    <select
                      value={form.exam}
                      onChange={(e) => setForm({ ...form, exam: e.target.value })}
                      className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-semibold focus:border-slate-500 focus:outline-none cursor-pointer"
                    >
                      {EXAMS.filter((e) => e !== 'All').map((ex) => (
                        <option key={ex} value={ex}>{ex}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Class Level</label>
                    <select
                      value={form.classLevel}
                      onChange={(e) => setForm({ ...form, classLevel: e.target.value })}
                      className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-semibold focus:border-slate-500 focus:outline-none cursor-pointer"
                    >
                      {CLASSES.map((cl) => (
                        <option key={cl.value} value={cl.value}>{cl.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Subject</label>
                    <select
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-semibold focus:border-slate-500 focus:outline-none cursor-pointer"
                    >
                      {SUBJECTS.map((sub) => (
                        <option key={sub} value={sub}>{sub || 'General / All Subjects'}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional Tags */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Additional Tags <span className="text-slate-400 font-normal">(comma-separated)</span></label>
                  <input
                    type="text"
                    value={form.tagsInput}
                    onChange={(e) => setForm({ ...form, tagsInput: e.target.value })}
                    placeholder="e.g. Mechanics, Formula Sheet, Class 12, Handwritten"
                    className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-medium focus:border-slate-500 focus:outline-none placeholder:text-slate-400"
                  />
                </div>

                {/* Upload Progress */}
                {submitting && uploadStage && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-orange-600 animate-spin shrink-0" />
                      <span className="text-[11px] font-semibold text-orange-700">{uploadStage}</span>
                    </div>
                    {uploadProgress !== null && (
                      <div className="w-full bg-orange-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 bg-orange-500 rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-white">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {submitting ? 'Uploading...' : selectedItem ? 'Save Changes' : 'Upload to Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          ASSIGN TO SCHOOLS MODAL
      ══════════════════════════════════════════════════════ */}
      {showAssignModal && assigningItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center">
                  <SchoolIcon className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Assign to Schools</h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[220px]">{assigningItem.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Schools list */}
            <div className="overflow-y-auto flex-1 p-4 space-y-1.5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500">
                  {selectedSchoolIds.length} of {schools.length} schools selected
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedSchoolIds(
                      selectedSchoolIds.length === schools.length
                        ? []
                        : schools.map((s) => s.id)
                    )
                  }
                  className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
                >
                  {selectedSchoolIds.length === schools.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              {schools.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  <SchoolIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs">No partner schools registered yet.</p>
                </div>
              ) : (
                schools.map((school) => {
                  const isSelected = selectedSchoolIds.includes(school.id);
                  return (
                    <button
                      key={school.id}
                      type="button"
                      onClick={() => toggleSchoolSelection(school.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-orange-50 border-orange-300 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                        isSelected ? 'bg-orange-600 border-orange-600' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && (
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M10.28 2.28L4.5 8.06l-2.78-2.78L.3 6.7l4.2 4.2 7.18-7.18z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{school.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {school.code} · {school.city || 'N/A'} · {school.status}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="flex-1 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAssignments}
                disabled={savingAssignments}
                className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
              >
                {savingAssignments ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                {savingAssignments ? 'Saving...' : 'Save Assignments'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          IMAGE PREVIEW LIGHTBOX
      ══════════════════════════════════════════════════════ */}
      {previewUrl && previewType === 'IMAGE' && (
        <div
          className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute top-3 right-3 z-10 p-1.5 bg-slate-900/80 text-white rounded-full hover:bg-rose-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
