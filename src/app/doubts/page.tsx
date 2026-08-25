'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { doubtsApi, DoubtTicket } from '@/api';
import { MessageSquare, CheckCircle, Clock, Send, Image as ImageIcon, X, ExternalLink, Upload, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function DoubtsPage() {
  const [doubts, setDoubts] = useState<DoubtTicket[]>([]);
  const [selectedDoubt, setSelectedDoubt] = useState<DoubtTicket | null>(null);
  const [solutionText, setSolutionText] = useState('');
  const [solutionImages, setSolutionImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDoubts = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await doubtsApi.getDoubtsPool();
      if (res && res.success) {
        setDoubts(res.data.items || []);
      } else {
        setErrorMsg('Failed to load pending doubts pool from backend API.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to communication with doubts pool API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoubts();
  }, []);

  const handleClaim = async (doubt: DoubtTicket) => {
    try {
      await doubtsApi.claimDoubt(doubt.id);
    } catch (e: any) {
      console.warn('Claim error:', e);
    }
    setSelectedDoubt(doubt);
    setSolutionText('');
    setSolutionImages([]);
    setStatusMsg(`Claimed ticket #${doubt.id}. Write step-by-step solution below.`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSolutionImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setSolutionImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoubt) return;

    setSubmitting(true);
    setErrorMsg('');
    try {
      await doubtsApi.resolveDoubt(selectedDoubt.id, {
        solutionText,
        solutionImages,
      });
      setStatusMsg(`🎉 Doubt #${selectedDoubt.id} resolved! Solution pushed to student.`);
      setDoubts((prev) => prev.filter((d) => d.id !== selectedDoubt.id));
      setSelectedDoubt(null);
      setSolutionText('');
      setSolutionImages([]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit doubt resolution.');
    } finally {
      setSubmitting(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'available' | 'my' | 'in_progress' | 'resolved' | 'history'>('available');

  const filteredDoubts = doubts.filter((d) => {
    if (activeTab === 'available') return d.status === 'OPEN' || !d.status;
    if (activeTab === 'my') return selectedDoubt?.id === d.id;
    if (activeTab === 'in_progress') return d.status === 'CLAIMED';
    if (activeTab === 'resolved') return d.status === 'RESOLVED';
    if (activeTab === 'history') return true;
    return true;
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-6 flex-1 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Doubt Resolution Queue</h1>
              <p className="text-slate-500 text-xs mt-0.5">Browse pending student doubt tickets, claim tickets, and upload step-by-step handwritten diagram solutions.</p>
            </div>
            <button
              onClick={fetchDoubts}
              disabled={loading}
              className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg shadow-2xs cursor-pointer"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          </div>

          {/* Sub-Tabs Bar */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('available')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'available'
                  ? 'bg-orange-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              New / Available ({doubts.filter(d => d.status === 'OPEN' || !d.status).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('my')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'my'
                  ? 'bg-orange-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              My Doubts
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('in_progress')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'in_progress'
                  ? 'bg-orange-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              In Progress
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('resolved')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'resolved'
                  ? 'bg-orange-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Resolved
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'history'
                  ? 'bg-orange-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              History
            </button>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={fetchDoubts} className="px-3 py-1 bg-rose-600 text-white rounded-md text-xs font-semibold hover:bg-rose-700">
                Retry
              </button>
            </div>
          )}

          {statusMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium animate-in fade-in">
              {statusMsg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Doubt List */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" /> Pending Doubts Pool ({filteredDoubts.length})
                </span>
                {loading && <Loader2 className="w-4 h-4 animate-spin text-orange-600" />}
              </h3>

              {loading ? (
                <div className="space-y-3">
                  <div className="h-28 skeleton"></div>
                  <div className="h-28 skeleton"></div>
                </div>
              ) : doubts.length === 0 ? (
                <div className="mnc-card-flat p-8 text-center text-slate-400">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-medium">No pending doubts in queue. Excellent work!</p>
                </div>
              ) : (
                doubts.map((d) => (
                  <div key={d.id} className="mnc-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold rounded">
                        {d.subject} • {d.topic || 'General'}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Student: <strong className="text-slate-900">{d.student?.profile?.fullName || 'Student'}</strong>
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 font-medium leading-relaxed">{d.questionText}</p>

                    {/* Question Image Attachment Thumbnails */}
                    {d.images && d.images.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-slate-500" /> Question Image Attachment ({d.images.length})
                        </p>
                        <div className="flex items-center gap-2">
                          {d.images.map((imgUrl: string, idx: number) => (
                            <div
                              key={idx}
                              onClick={() => setPreviewImage(imgUrl)}
                              className="w-14 h-14 rounded border border-slate-200 overflow-hidden cursor-pointer relative group bg-slate-100"
                            >
                              <img src={imgUrl} alt="Question Attachment" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleClaim(d)}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white rounded-md text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Claim Ticket
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Right Column: Solution Editor Workspace */}
            <div className="mnc-card-flat p-5 h-fit space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Solution Editor Workspace
              </h3>

              {selectedDoubt ? (
                <form onSubmit={handleResolve} className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{selectedDoubt.subject} Question</p>
                    <p className="text-xs text-slate-900 font-medium">{selectedDoubt.questionText}</p>
                    {selectedDoubt.images && selectedDoubt.images.length > 0 && (
                      <div className="pt-2 flex gap-2">
                        {selectedDoubt.images.map((img: string, i: number) => (
                          <img
                            key={i}
                            src={img}
                            onClick={() => setPreviewImage(img)}
                            alt="Student question"
                            className="w-12 h-12 rounded object-cover border border-slate-200 cursor-pointer hover:border-slate-400"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Step-by-Step Explanation (Markdown Supported)
                    </label>
                    <textarea
                      rows={5}
                      value={solutionText}
                      onChange={(e) => setSolutionText(e.target.value)}
                      placeholder="Write formulas, step 1, step 2, and detailed explanation for the student..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white text-xs font-mono font-medium"
                      required
                    ></textarea>
                  </div>

                  {/* HTML File Upload Attachment for Solution Images */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Upload Handwritten Answer / Diagram</span>
                      <span className="text-[10px] text-slate-400 font-normal">PNG, JPG, Camera photos</span>
                    </label>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
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
                      <span className="text-[10px] text-slate-400">Select images from your device or camera</span>
                    </div>

                    {solutionImages.length > 0 && (
                      <div className="flex items-center gap-2 pt-3">
                        {solutionImages.map((img, i) => (
                          <div key={i} className="relative group w-14 h-14 rounded overflow-hidden border border-slate-200">
                            <img src={img} alt="Solution attachment" className="w-full h-full object-cover" />
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

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white font-semibold rounded-lg shadow-2xs flex items-center justify-center gap-2 text-xs transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {submitting ? 'Submitting Solution...' : 'Submit Solution & Push Notification'}
                  </button>
                </form>
              ) : (
                <div className="p-10 text-center text-slate-400 space-y-1.5">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium text-slate-500">Select a doubt ticket from the left pool to begin writing your solution.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Image Zoom Lightbox Modal */}
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
            <img src={previewImage} alt="Enlarged Diagram Preview" className="max-w-full max-h-[80vh] rounded-lg object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
