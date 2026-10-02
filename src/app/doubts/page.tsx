'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { doubtsApi, DoubtTicket } from '@/api';
import {
  MessageSquare, CheckCircle, CheckCircle2, Clock, Send, Image as ImageIcon,
  X, ExternalLink, Upload, Loader2, AlertCircle, RefreshCw, User, Calendar,
  BookOpen, FileText, Pencil,
} from 'lucide-react';
import { uploadImageToBunnyStorage, compressImageToBlob } from '@/lib/bunnyStorage';

type TabKey = 'available' | 'my' | 'in_progress' | 'resolved' | 'history';

export default function DoubtsPage() {
  // ── Tab & data ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabKey>('available');
  const [poolDoubts, setPoolDoubts] = useState<DoubtTicket[]>([]);
  const [myDoubts, setMyDoubts] = useState<DoubtTicket[]>([]);
  const [resolvedDoubts, setResolvedDoubts] = useState<DoubtTicket[]>([]);
  const [historyDoubts, setHistoryDoubts] = useState<DoubtTicket[]>([]);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [loadingPool, setLoadingPool] = useState(true);
  const [loadingTab, setLoadingTab] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ── Solution editor ──────────────────────────────────────────────────────────
  const [selectedDoubt, setSelectedDoubt] = useState<DoubtTicket | null>(null);
  const [solutionText, setSolutionText] = useState('');
  const [solutionImageFiles, setSolutionImageFiles] = useState<File[]>([]);
  const [solutionImagePreviews, setSolutionImagePreviews] = useState<string[]>([]);
  const [existingSolutionImages, setExistingSolutionImages] = useState<string[]>([]);
  const [isEditingSolution, setIsEditingSolution] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadStage, setUploadStage] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch open pool ──────────────────────────────────────────────────────────
  const fetchPool = useCallback(async () => {
    setLoadingPool(true);
    setErrorMsg('');
    try {
      const res = await doubtsApi.getDoubtsPool();
      if (res?.success) setPoolDoubts(res.data.items || []);
      else setErrorMsg('Failed to load pending doubts pool from backend API.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to connect to doubts pool API.');
    } finally {
      setLoadingPool(false);
    }
  }, []);

  // ── Fetch mentor's own doubts (per tab) ──────────────────────────────────────
  const fetchMyTab = useCallback(async (tab: TabKey) => {
    if (tab === 'available') { fetchPool(); return; }
    setLoadingTab(true);
    try {
      if (tab === 'my' || tab === 'in_progress') {
        const res = await doubtsApi.getMyDoubts('CLAIMED');
        setMyDoubts(res.data.items || []);
      } else if (tab === 'resolved') {
        const res = await doubtsApi.getMyDoubts('RESOLVED');
        setResolvedDoubts(res.data.items || []);
      } else if (tab === 'history') {
        // All: claimed + resolved combined
        const [clRes, resRes] = await Promise.allSettled([
          doubtsApi.getMyDoubts('CLAIMED'),
          doubtsApi.getMyDoubts('RESOLVED'),
        ]);
        const claimed = clRes.status === 'fulfilled' ? clRes.value.data.items : [];
        const resolved = resRes.status === 'fulfilled' ? resRes.value.data.items : [];
        setHistoryDoubts([...claimed, ...resolved]);
      }
    } catch (_) {
    } finally {
      setLoadingTab(false);
    }
  }, [fetchPool]);

  useEffect(() => {
    fetchPool();
    doubtsApi.getMyDoubts('RESOLVED').then((res) => setResolvedDoubts(res.data?.items || []));
    doubtsApi.getMyDoubts('CLAIMED').then((res) => setMyDoubts(res.data?.items || []));
  }, [fetchPool]);

  useEffect(() => {
    fetchMyTab(activeTab);
  }, [activeTab, fetchMyTab]);

  // ── Claim a ticket ────────────────────────────────────────────────────────────
  const handleClaim = async (doubt: DoubtTicket) => {
    try {
      await doubtsApi.claimDoubt(doubt.id);
      // Optimistically update pool + add to my
      setPoolDoubts((prev) => prev.filter((d) => d.id !== doubt.id));
      setMyDoubts((prev) => [...prev, { ...doubt, status: 'CLAIMED' }]);
    } catch (e: any) {
      console.warn('Claim error:', e.message);
    }
    setSelectedDoubt({ ...doubt, status: 'CLAIMED' });
    setIsEditingSolution(false);
    setSolutionText('');
    setSolutionImageFiles([]);
    setSolutionImagePreviews([]);
    setExistingSolutionImages([]);
    setStatusMsg(`Claimed ticket "${doubt.subject}". Write your step-by-step solution below.`);
    setActiveTab('my');
  };

  const handleStartEdit = (doubt: DoubtTicket) => {
    setSelectedDoubt(doubt);
    setIsEditingSolution(true);
    setSolutionText(doubt.solutionText || '');
    setExistingSolutionImages(doubt.solutionImages || []);
    setSolutionImageFiles([]);
    setSolutionImagePreviews([]);
    setErrorMsg('');
  };

  const handleCancelEdit = () => {
    setIsEditingSolution(false);
    if (selectedDoubt) {
      setSolutionText(selectedDoubt.solutionText || '');
      setExistingSolutionImages(selectedDoubt.solutionImages || []);
    }
    setSolutionImageFiles([]);
    setSolutionImagePreviews([]);
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingSolutionImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Image file picker ─────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setSolutionImageFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result)
          setSolutionImagePreviews((prev) => [...prev, ev.target!.result as string]);
      };
      reader.readAsDataURL(file);
    });
    // Reset input so same file can be re-added
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setSolutionImageFiles((prev) => prev.filter((_, i) => i !== index));
    setSolutionImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Submit or Update solution ─────────────────────────────────────────────────
  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoubt) return;

    setSubmitting(true);
    setErrorMsg('');
    setUploadProgress(null);
    setUploadStage('');

    try {
      let uploadedUrls: string[] = [];

      // Upload each image to Bunny CDN
      for (let i = 0; i < solutionImageFiles.length; i++) {
        setUploadStage(`Uploading image ${i + 1}/${solutionImageFiles.length} to Bunny CDN...`);
        const compressed = await compressImageToBlob(solutionImageFiles[i], 1600, 1600, 0.85);
        const cdnUrl = await uploadImageToBunnyStorage(compressed, 'doubt-solutions', (pct) => {
          setUploadProgress(pct);
        });
        uploadedUrls.push(cdnUrl);
      }

      const finalSolutionImages = isEditingSolution
        ? [...existingSolutionImages, ...uploadedUrls]
        : uploadedUrls;

      if (isEditingSolution) {
        setUploadStage('Updating solution and syncing with student discussion...');
        const mentorComment = selectedDoubt.comments?.find(
          (c) => c.author?.role === 'MENTOR' || c.author?.role === 'ADMIN'
        );

        await doubtsApi.updateSolution(selectedDoubt.id, {
          solutionText,
          solutionImages: finalSolutionImages,
          commentId: mentorComment?.id,
        });

        const updatedTicket: DoubtTicket = {
          ...selectedDoubt,
          status: 'RESOLVED',
          solutionText,
          solutionImages: finalSolutionImages,
          updatedAt: new Date().toISOString(),
        };

        setSelectedDoubt(updatedTicket);
        setResolvedDoubts((prev) => prev.map((d) => (d.id === selectedDoubt.id ? updatedTicket : d)));
        setMyDoubts((prev) => prev.map((d) => (d.id === selectedDoubt.id ? updatedTicket : d)));
        setHistoryDoubts((prev) => prev.map((d) => (d.id === selectedDoubt.id ? updatedTicket : d)));
        setIsEditingSolution(false);
        setExistingSolutionImages(finalSolutionImages);
        setSolutionImageFiles([]);
        setSolutionImagePreviews([]);
        setStatusMsg('🎉 Solution updated successfully! Changes pushed to student discussion.');
      } else {
        setUploadStage('Posting mentor solution to student app & discussion...');
        await doubtsApi.resolveDoubt(selectedDoubt.id, {
          solutionText,
          solutionImages: finalSolutionImages,
        });

        // Optimistically move ticket to resolved
        setMyDoubts((prev) => prev.filter((d) => d.id !== selectedDoubt.id));
        setResolvedDoubts((prev) => [
          { ...selectedDoubt, status: 'RESOLVED', solutionText, solutionImages: finalSolutionImages, resolvedAt: new Date().toISOString() },
          ...prev.filter((d) => d.id !== selectedDoubt.id),
        ]);

        setStatusMsg(`🎉 Solution posted to student discussion! Marked as resolved.`);
        setSelectedDoubt(null);
        setSolutionText('');
        setSolutionImageFiles([]);
        setSolutionImagePreviews([]);
        setExistingSolutionImages([]);
        setIsEditingSolution(false);
      }

      // Refresh both tabs in background
      fetchPool();
      doubtsApi.getMyDoubts('RESOLVED').then((res) => setResolvedDoubts(res.data?.items || []));
      doubtsApi.getMyDoubts('CLAIMED').then((res) => setMyDoubts(res.data?.items || []));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit doubt resolution.');
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
      setUploadStage('');
    }
  };

  // ── Derived display data per tab ──────────────────────────────────────────────
  const displayDoubts: DoubtTicket[] = (() => {
    switch (activeTab) {
      case 'available': return poolDoubts;
      case 'my':
      case 'in_progress': return myDoubts;
      case 'resolved': return resolvedDoubts;
      case 'history': return historyDoubts;
      default: return [];
    }
  })();

  const isLoading = activeTab === 'available' ? loadingPool : loadingTab;
  const openCount = poolDoubts.filter((d) => d.status === 'OPEN' || !d.status).length;
  const resolvedCount = resolvedDoubts.length;

  const tabConfig: { key: TabKey; label: string; badge?: number | string }[] = [
    { key: 'available', label: 'New / Available', badge: openCount },
    { key: 'my', label: 'My Doubts', badge: myDoubts.length || undefined },
    { key: 'in_progress', label: 'In Progress', badge: myDoubts.filter(d => d.status === 'CLAIMED').length || undefined },
    { key: 'resolved', label: 'Resolved', badge: resolvedCount || undefined },
    { key: 'history', label: 'History' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-6 flex-1 animate-in fade-in duration-300">

          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Doubt Resolution Queue</h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Browse pending student doubt tickets, claim tickets, and upload step-by-step solutions.
              </p>
            </div>
            <button
              onClick={() => {
                fetchPool();
                if (activeTab !== 'available') fetchMyTab(activeTab);
              }}
              disabled={isLoading}
              className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg shadow-2xs cursor-pointer"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          </div>

          {/* Tab Bar */}
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs flex-wrap">
            {tabConfig.map(({ key, label, badge }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === key
                    ? 'bg-orange-600 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {label}
                {badge !== undefined && badge !== 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={fetchPool} className="px-3 py-1 bg-rose-600 text-white rounded-md text-xs font-semibold hover:bg-rose-700">
                Retry
              </button>
            </div>
          )}

          {/* Status Toast */}
          {statusMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium animate-in fade-in flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {statusMsg}
            </div>
          )}

          {/* Main Layout: Two-column */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── LEFT: Doubts List ─────────────────────────────────────────── */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  {activeTab === 'resolved' ? `Resolved Doubts (${resolvedCount})` :
                   activeTab === 'history' ? `History (${displayDoubts.length})` :
                   activeTab === 'my' || activeTab === 'in_progress' ? `Claimed by Me (${displayDoubts.length})` :
                   `Pending Doubts Pool (${displayDoubts.length})`}
                </span>
                {isLoading && <Loader2 className="w-4 h-4 animate-spin text-orange-600" />}
              </h3>

              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-28 skeleton" />
                  <div className="h-28 skeleton" />
                </div>
              ) : displayDoubts.length === 0 ? (
                <div className="mnc-card-flat p-10 text-center text-slate-400 space-y-1">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-medium text-slate-500">
                    {activeTab === 'available' && 'No pending doubts in queue. Excellent work!'}
                    {activeTab === 'my' && "You haven't claimed any doubts yet."}
                    {activeTab === 'in_progress' && 'No doubts in progress.'}
                    {activeTab === 'resolved' && 'No resolved doubts yet. Claim and resolve doubts to see them here.'}
                    {activeTab === 'history' && 'No doubt history found.'}
                  </p>
                </div>
              ) : (
                displayDoubts.map((d) => (
                  <DoubtCard
                    key={d.id}
                    doubt={d}
                    isSelected={selectedDoubt?.id === d.id}
                    onClaim={handleClaim}
                    onPreviewImage={setPreviewImage}
                    onSelect={() => {
                      setSelectedDoubt(d);
                      setIsEditingSolution(false);
                      setSolutionText(d.solutionText || '');
                      setExistingSolutionImages(d.solutionImages || []);
                      setSolutionImageFiles([]);
                      setSolutionImagePreviews([]);
                    }}
                    onEdit={handleStartEdit}
                  />
                ))
              )}
            </div>

            {/* ── RIGHT: Solution Editor ────────────────────────────────────── */}
            <div className="mnc-card-flat p-5 h-fit space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                {isEditingSolution ? 'Edit Solution Workspace' : 'Solution Editor Workspace'}
              </h3>

              {selectedDoubt ? (
                selectedDoubt.status === 'RESOLVED' && !isEditingSolution ? (
                  /* Show resolved solution read-only */
                  <ResolvedSolutionView
                    doubt={selectedDoubt}
                    onPreviewImage={setPreviewImage}
                    onEdit={() => handleStartEdit(selectedDoubt)}
                  />
                ) : (
                  <form onSubmit={handleResolve} className="space-y-4">
                    {/* Editing mode banner */}
                    {isEditingSolution && (
                      <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <Pencil className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Editing Previously Submitted Answer</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="text-amber-700 hover:text-amber-900 underline text-xs font-bold cursor-pointer"
                        >
                          Cancel Edit
                        </button>
                      </div>
                    )}

                    {/* Question Preview */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{selectedDoubt.subject}</span>
                        {selectedDoubt.topic && (
                          <span className="text-[10px] text-slate-400">• {selectedDoubt.topic}</span>
                        )}
                        <span className={`ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                          isEditingSolution
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : selectedDoubt.status === 'CLAIMED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {isEditingSolution ? 'EDITING ANSWER' : selectedDoubt.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-900 font-medium">{selectedDoubt.questionText}</p>
                      {selectedDoubt.images && selectedDoubt.images.length > 0 && (
                        <div className="flex gap-2 pt-1">
                          {selectedDoubt.images.map((img, i) => (
                            <img
                              key={i} src={img} onClick={() => setPreviewImage(img)}
                              alt="Student question"
                              className="w-12 h-12 rounded object-cover border border-slate-200 cursor-pointer hover:border-orange-400"
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Solution Text */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Step-by-Step Explanation (Markdown Supported)
                      </label>
                      <textarea
                        rows={6}
                        value={solutionText}
                        onChange={(e) => setSolutionText(e.target.value)}
                        placeholder="Write formulas, step 1, step 2, and detailed explanation for the student..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white text-xs font-mono font-medium"
                        required
                      />
                    </div>

                    {/* Existing Images (When Editing) */}
                    {isEditingSolution && existingSolutionImages.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                          <span>Attached Diagrams ({existingSolutionImages.length})</span>
                          <span className="text-[10px] text-slate-400 font-normal">Click ✕ to remove diagram</span>
                        </label>
                        <div className="flex items-center gap-2 flex-wrap bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          {existingSolutionImages.map((img, i) => (
                            <div key={i} className="relative group w-14 h-14 rounded overflow-hidden border border-slate-200 bg-white">
                              <img src={img} alt="Existing diagram" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemoveExistingImage(i)}
                                className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5 hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
                                title="Remove diagram"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Image Upload → Bunny CDN */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>{isEditingSolution ? 'Add More Handwritten Diagrams / Photos' : 'Upload Handwritten Diagram / Photo'}</span>
                        <span className="text-[10px] text-slate-400 font-normal">Uploaded to Bunny CDN</span>
                      </label>

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        multiple
                        className="hidden"
                      />

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-4 border-2 border-dashed border-slate-200 hover:border-orange-400 bg-slate-50 hover:bg-orange-50/30 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-700">Click to upload handwritten diagram photos</span>
                        <span className="text-[10px] text-slate-400">Images compressed & uploaded to Bunny CDN</span>
                      </div>

                      {solutionImagePreviews.length > 0 && (
                        <div className="flex items-center gap-2 pt-3 flex-wrap">
                          {solutionImagePreviews.map((preview, i) => (
                            <div key={i} className="relative group w-14 h-14 rounded overflow-hidden border border-slate-200">
                              <img src={preview} alt="Solution attachment" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(i)}
                                className="absolute top-0.5 right-0.5 bg-slate-900/80 text-white rounded-full p-0.5 hover:bg-rose-600 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Upload Progress */}
                    {submitting && uploadStage && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 text-orange-600 animate-spin shrink-0" />
                          <span className="text-[11px] font-semibold text-orange-700">{uploadStage}</span>
                        </div>
                        {uploadProgress !== null && (
                          <div className="w-full bg-orange-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-1.5 bg-orange-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Submit / Update Buttons */}
                    {isEditingSolution ? (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={handleCancelEdit}
                          className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold rounded-lg shadow-2xs flex items-center justify-center gap-2 text-xs transition-all disabled:opacity-60 cursor-pointer"
                        >
                          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          {submitting ? 'Updating Solution...' : 'Save & Update Solution'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white font-semibold rounded-lg shadow-2xs flex items-center justify-center gap-2 text-xs transition-all disabled:opacity-60 cursor-pointer"
                      >
                        {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        {submitting ? 'Uploading & Submitting...' : 'Submit Solution & Push to Student'}
                      </button>
                    )}
                  </form>
                )
              ) : (
                <div className="p-10 text-center text-slate-400 space-y-1.5">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium text-slate-500">
                    Select a doubt ticket from the left to begin writing your solution.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Image Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white p-2 rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-1.5 bg-slate-900/80 text-white rounded-full hover:bg-rose-600 z-10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={previewImage} alt="Enlarged Preview" className="max-w-full max-h-[80vh] rounded-lg object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-component: Doubt Card ────────────────────────────────────────────────
function DoubtCard({
  doubt,
  isSelected,
  onClaim,
  onSelect,
  onEdit,
  onPreviewImage,
}: {
  doubt: DoubtTicket;
  isSelected: boolean;
  onClaim: (d: DoubtTicket) => void;
  onSelect: () => void;
  onEdit?: (d: DoubtTicket) => void;
  onPreviewImage: (url: string) => void;
}) {
  const isResolved = doubt.status === 'RESOLVED';
  const isClaimed = doubt.status === 'CLAIMED';
  const isOpen = doubt.status === 'OPEN' || !doubt.status;

  return (
    <div
      className={`mnc-card p-4 space-y-3 transition-all cursor-pointer ${
        isSelected ? 'border-orange-400 ring-2 ring-orange-100' : ''
      }`}
      onClick={onSelect}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold rounded">
            {doubt.subject}{doubt.topic ? ` • ${doubt.topic}` : ''}
          </span>
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
            isResolved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            isClaimed  ? 'bg-amber-50 text-amber-700 border-amber-200' :
                         'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            {doubt.status || 'OPEN'}
          </span>
        </div>
        <span className="text-xs text-slate-500 font-medium whitespace-nowrap shrink-0">
          {doubt.student?.profile?.fullName || 'Student'}
        </span>
      </div>

      {/* Question text */}
      <p className="text-xs text-slate-800 font-medium leading-relaxed line-clamp-3">
        {doubt.questionText}
      </p>

      {/* Question image thumbnails */}
      {doubt.images && doubt.images.length > 0 && (
        <div className="flex items-center gap-2">
          {doubt.images.map((imgUrl, idx) => (
            <div
              key={idx}
              onClick={(e) => { e.stopPropagation(); onPreviewImage(imgUrl); }}
              className="w-12 h-12 rounded border border-slate-200 overflow-hidden cursor-pointer relative group bg-slate-100"
            >
              <img src={imgUrl} alt="Question Attachment" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Mentor reply section (CLAIMED / RESOLVED) ── */}
      {isClaimed && doubt.mentor && (
        <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
          <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="text-[11px] font-semibold text-amber-800">
            Claimed by {doubt.mentor.name || 'Mentor'}
            {doubt.claimedAt && ` · ${new Date(doubt.claimedAt).toLocaleDateString()}`}
          </span>
        </div>
      )}

      {isResolved && (
        <div className="space-y-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-[11px] font-bold text-emerald-800">
              Solved by {doubt.mentor?.name || 'Mentor'}
              {doubt.resolvedAt && ` · ${new Date(doubt.resolvedAt).toLocaleDateString()}`}
            </span>
          </div>
          {doubt.solutionText && (
            <p className="text-[11px] text-emerald-900 line-clamp-3 font-medium">
              {doubt.solutionText}
            </p>
          )}
          {doubt.solutionImages && doubt.solutionImages.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              {doubt.solutionImages.map((img, i) => (
                <div
                  key={i}
                  onClick={(e) => { e.stopPropagation(); onPreviewImage(img); }}
                  className="w-10 h-10 rounded border border-emerald-200 overflow-hidden cursor-pointer group"
                >
                  <img src={img} alt="Solution" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
              ))}
              <span className="text-[10px] text-emerald-600 font-semibold">
                {doubt.solutionImages.length} image{doubt.solutionImages.length > 1 ? 's' : ''} attached
              </span>
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      {isOpen && (
        <div className="flex justify-end pt-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onClaim(doubt)}
            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white rounded-md text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Claim Ticket
          </button>
        </div>
      )}

      {isClaimed && (
        <div className="flex justify-end pt-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onSelect}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white rounded-md text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Write Solution
          </button>
        </div>
      )}

      {isResolved && (
        <div className="flex justify-end pt-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit?.(doubt)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-md text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Answer
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sub-component: Resolved Solution Read-only View ──────────────────────────
function ResolvedSolutionView({
  doubt,
  onPreviewImage,
  onEdit,
}: {
  doubt: DoubtTicket;
  onPreviewImage: (url: string) => void;
  onEdit?: () => void;
}) {
  const isEdited = doubt.updatedAt && doubt.resolvedAt && new Date(doubt.updatedAt).getTime() > new Date(doubt.resolvedAt).getTime() + 1000;

  return (
    <div className="space-y-4">
      {/* Question */}
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
        <p className="text-[10px] text-slate-500 font-bold uppercase">{doubt.subject} Question</p>
        <p className="text-xs text-slate-900 font-medium">{doubt.questionText}</p>
      </div>

      {/* Resolution */}
      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-emerald-800">
              Solved by {doubt.mentor?.name || 'You'}
              {doubt.resolvedAt && ` on ${new Date(doubt.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
              {isEdited && ' (Edited)'}
            </span>
          </div>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-emerald-700" />
              Edit Answer
            </button>
          )}
        </div>
        {doubt.solutionText && (
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Solution</p>
            <p className="text-xs text-emerald-900 font-medium whitespace-pre-wrap leading-relaxed">
              {doubt.solutionText}
            </p>
          </div>
        )}
        {doubt.solutionImages && doubt.solutionImages.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">
              Attached Diagrams ({doubt.solutionImages.length})
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {doubt.solutionImages.map((img, i) => (
                <div
                  key={i}
                  onClick={() => onPreviewImage(img)}
                  className="w-16 h-16 rounded-lg border border-emerald-200 overflow-hidden cursor-pointer group relative"
                >
                  <img src={img} alt="Solution diagram" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-emerald-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ExternalLink className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
