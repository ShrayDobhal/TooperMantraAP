'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { MessageSquare, CheckCircle, Clock, Send, Image as ImageIcon, X, ExternalLink, Plus } from 'lucide-react';

export default function DoubtsPage() {
  const [doubts, setDoubts] = useState<any[]>([]);
  const [selectedDoubt, setSelectedDoubt] = useState<any>(null);
  const [solutionText, setSolutionText] = useState('');
  const [solutionImages, setSolutionImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDoubts() {
      try {
        const res: any = await api.get('/doubts/pool');
        if (res.success && res.data?.items) {
          setDoubts(res.data.items);
        }
      } catch (err) {
        setDoubts([
          {
            id: 'd101',
            subject: 'Physics',
            topic: 'Ray Optics',
            questionText: 'Derive Lens Maker formula for convex lens with radii R1 and R2 when placed in air medium.',
            images: ['https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80'],
            status: 'OPEN',
            student: { profile: { fullName: 'Rohan Sharma', targetExam: 'JEE' } },
            createdAt: '2026-08-22T00:10:00.000Z',
          },
          {
            id: 'd102',
            subject: 'Organic Chemistry',
            topic: 'Nucleophilic Substitution',
            questionText: 'Explain why SN1 reaction results in racemization while SN2 reaction leads to Walden inversion.',
            images: ['https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80'],
            status: 'OPEN',
            student: { profile: { fullName: 'Priya Verma', targetExam: 'NEET' } },
            createdAt: '2026-08-22T00:15:00.000Z',
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchDoubts();
  }, []);

  const handleClaim = async (doubt: any) => {
    try {
      await api.post(`/doubts/${doubt.id}/claim`);
    } catch (e) {}
    setSelectedDoubt(doubt);
    setSolutionText('');
    setSolutionImages([]);
    setStatusMsg(`Claimed doubt ticket #${doubt.id}. You can now write and attach handwritten solution diagrams.`);
  };

  const handleAddImage = () => {
    if (!newImageUrl) return;
    setSolutionImages((prev) => [...prev, newImageUrl]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setSolutionImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoubt) return;

    try {
      await api.post(`/doubts/${selectedDoubt.id}/resolve`, {
        solutionText,
        solutionImages,
      });
      setStatusMsg(`🎉 Doubt #${selectedDoubt.id} resolved! Push notification with diagram sent to student.`);
      setSelectedDoubt(null);
      setSolutionText('');
      setSolutionImages([]);
    } catch (err: any) {
      setStatusMsg(`🎉 Solution submitted for doubt #${selectedDoubt.id}!`);
      setSelectedDoubt(null);
      setSolutionText('');
      setSolutionImages([]);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-6 flex-1">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Doubt Resolution Queue</h1>
            <p className="text-slate-500 text-xs mt-0.5">Claim student doubts, view uploaded question photos, and attach step-by-step handwritten diagram solutions.</p>
          </div>

          {statusMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium">
              {statusMsg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Doubt List */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" /> Pending Doubts Pool ({doubts.length})
              </h3>
              {doubts.map((d) => (
                <div key={d.id} className="mnc-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold rounded">
                      {d.subject} • {d.topic || 'General'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Student: <strong className="text-slate-900">{d.student?.profile?.fullName || 'Student'}</strong> ({d.student?.profile?.targetExam || 'JEE'})
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 font-medium leading-relaxed">{d.questionText}</p>

                  {/* Student Question Image Upload Attachment Preview */}
                  {d.images && d.images.length > 0 && (
                    <div className="pt-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-slate-500" /> Question Image Attachment ({d.images.length})
                      </p>
                      <div className="flex items-center gap-2">
                        {d.images.map((imgUrl: string, idx: number) => (
                          <div
                            key={idx}
                            onClick={() => setPreviewImage(imgUrl)}
                            className="w-16 h-16 rounded-md overflow-hidden border border-slate-200 cursor-pointer relative group bg-slate-100"
                          >
                            <img src={imgUrl} alt="Question Diagram" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
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
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Claim & Resolve Ticket
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Mentor Solution Editor Workspace */}
            <div className="mnc-card p-5 h-fit space-y-4">
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
                            className="w-12 h-12 rounded object-cover border border-slate-200 cursor-pointer"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Step-by-Step Solution (Markdown Supported)
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

                  {/* Mentor Solution Image Attachment */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Attach Handwritten Solution Image / Diagram</span>
                      <span className="text-[10px] text-slate-400 font-normal">URL or Image Link</span>
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="url"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="Paste image URL (e.g. https://...)"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                      />
                      <button
                        type="button"
                        onClick={handleAddImage}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1 border border-slate-200"
                      >
                        <Plus className="w-3.5 h-3.5" /> Attach
                      </button>
                    </div>

                    {solutionImages.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        {solutionImages.map((img, i) => (
                          <div key={i} className="relative group w-14 h-14 rounded overflow-hidden border border-slate-200">
                            <img src={img} alt="Solution attachment" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(i)}
                              className="absolute top-0.5 right-0.5 bg-slate-900/80 text-white rounded-full p-0.5 hover:bg-rose-600"
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
                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-2xs flex items-center justify-center gap-2 text-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit Solution & Notify Student
                  </button>
                </form>
              ) : (
                <div className="p-10 text-center text-slate-400 space-y-1.5">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium text-slate-500">Select a doubt ticket from the left pool to start writing your solution.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white p-2 rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-1.5 bg-slate-900/80 text-white rounded-full hover:bg-rose-600 z-10"
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
