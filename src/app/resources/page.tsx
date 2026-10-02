'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { mediaApi, MediaItem, schoolsApi, School } from '@/api';
import { exportToCSV } from '@/lib/exportUtils';
import {
  BookOpen,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  School as SchoolIcon,
  Tag,
  Loader2,
  Upload,
  ExternalLink,
  Download,
  Filter,
  FileText,
  Sparkles,
} from 'lucide-react';
import { uploadImageToBunnyStorage } from '@/lib/bunnyStorage';

const CATEGORIES = ['All', 'Academics', 'Hackathon', 'Entrepreneurship', 'Drone Aviation', 'Notes', 'Formula Sheet', 'Question Bank'];
const EXAMS = ['All', 'JEE', 'NEET', 'CUET', 'Boards', 'Other'];

export default function ResourcesPage() {
  const [resources, setResources] = useState<MediaItem[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [examFilter, setExamFilter] = useState('All');

  // Add Resource Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState('Academics');
  const [newExam, setNewExam] = useState('JEE');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [mRes, sRes] = await Promise.all([
        mediaApi.getMedia({ limit: 100 }),
        schoolsApi.getSchools(),
      ]);
      if (mRes.success) setResources(mRes.data.items || []);
      if (sRes.success) setSchools(sRes.data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch curriculum resources.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageToBunnyStorage(file, `doc_${Date.now()}_${file.name}`);
      setNewFileUrl(url);
      setToastMsg('✓ File uploaded to Bunny CDN storage.');
    } catch (e: any) {
      alert(e.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await mediaApi.createMedia({
        title: newTitle,
        description: newDesc,
        category: newCat,
        exam: newExam,
        type: 'PDF',
        fileUrl: newFileUrl || 'https://cdn.toppermantra.com/docs/sample.pdf',
      });
      if (res.success) {
        setToastMsg(`✓ Resource "${newTitle}" created successfully!`);
        setShowAddModal(false);
        setNewTitle('');
        setNewDesc('');
        setNewFileUrl('');
        await fetchResources();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save resource.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete resource "${title}"?`)) return;
    try {
      await mediaApi.deleteMedia(id);
      setToastMsg('✓ Resource deleted.');
      await fetchResources();
    } catch (err: any) {
      alert(err.message || 'Failed to delete resource.');
    }
  };

  const handleExportCSV = () => {
    if (resources.length === 0) return;
    const exportData = filtered.map((r) => ({
      ID: r.id,
      Title: r.title,
      Category: r.category,
      Exam: r.exam || 'ALL',
      Type: r.type,
      DownloadUrl: r.fileUrl,
      CreatedDate: r.createdAt || '',
    }));
    exportToCSV(exportData, 'TopperMantra_Curriculum_Resources');
  };

  const filtered = resources.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch = r.title.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q);
    const matchesCat = catFilter === 'All' || r.category.toLowerCase() === catFilter.toLowerCase();
    const matchesExam = examFilter === 'All' || (r.exam || '').toLowerCase() === examFilter.toLowerCase();
    return matchesSearch && matchesCat && matchesExam;
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
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <BookOpen className="w-4.5 h-4.5" />
                </div>
                <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                  Explore Resources & Curriculum Materials
                </h1>
              </div>
              <p className="text-zinc-400 text-xs mt-1">
                Manage handwritten Topper notes, chapter formula mindmaps, PYQs, and institutional study modules.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={fetchResources}
                disabled={loading}
                className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Refresh Resources"
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
                <Plus className="w-4 h-4" /> Add Document
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2 w-full sm:w-80 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 focus-within:border-zinc-700 transition-colors">
              <Search className="w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search resources by title or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-xs text-slate-100 placeholder:text-zinc-500 focus:outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1">
                <span className="text-zinc-500 text-[11px] uppercase tracking-wider">Category:</span>
                <select
                  value={catFilter}
                  onChange={(e) => setCatFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-zinc-500 text-[11px] uppercase tracking-wider">Exam:</span>
                <select
                  value={examFilter}
                  onChange={(e) => setExamFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none"
                >
                  {EXAMS.map((e) => (
                    <option key={e} value={e}>
                      {e}
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
              <button onClick={fetchResources} className="px-3 py-1 bg-rose-600 text-white rounded-md text-xs font-semibold hover:bg-rose-500">
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

          {/* Resources Table */}
          <div className="exec-card overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">
                <div className="h-10 skeleton"></div>
                <div className="h-10 skeleton"></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 space-y-2">
                <FileText className="w-10 h-10 mx-auto text-zinc-600" />
                <p className="text-sm font-semibold text-slate-300">No resources found.</p>
              </div>
            ) : (
              <table className="exec-table">
                <thead>
                  <tr>
                    <th>Title & Synopsis</th>
                    <th>Category</th>
                    <th>Target Exam</th>
                    <th>Type</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td className="font-semibold text-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-100">{item.title}</p>
                            {item.description && <p className="text-[10px] text-zinc-400 line-clamp-1">{item.description}</p>}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold uppercase">
                          {item.category}
                        </span>
                      </td>

                      <td className="text-xs text-zinc-300 font-medium">{item.exam || 'ALL'}</td>

                      <td className="text-xs text-zinc-400 font-mono">{item.type || 'DOCUMENT'}</td>

                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.fileUrl && (
                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-zinc-400 hover:text-orange-400 hover:bg-zinc-800 rounded-md transition-colors"
                              title="Download Resource"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            onClick={() => handleDelete(item.id, item.title)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                            title="Delete Resource"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Add Resource Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-400" />
                    <h3 className="text-base font-bold text-slate-100">Upload Study Document</h3>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-slate-100 p-1">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-zinc-300 block mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Physics Formula Sheet — Mechanics & Optics"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-300 block mb-1">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Notes overview..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-zinc-300 block mb-1">Category</label>
                      <select
                        value={newCat}
                        onChange={(e) => setNewCat(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-slate-100"
                      >
                        {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                          <option key={c} value={c}>
                            {c}
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
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-300 block mb-1">PDF / Document File</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg"
                        onChange={handleFileUpload}
                        className="text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-slate-200 hover:file:bg-zinc-700 cursor-pointer"
                      />
                      {uploading && <Loader2 className="w-4 h-4 animate-spin text-orange-400" />}
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
                      disabled={adding}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl font-semibold shadow-lg shadow-orange-600/20"
                    >
                      {adding ? 'Saving...' : 'Save Document'}
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
