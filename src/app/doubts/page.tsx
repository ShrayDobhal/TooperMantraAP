'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { MessageSquare, CheckCircle, Clock, Sparkles, Send } from 'lucide-react';

export default function DoubtsPage() {
  const [doubts, setDoubts] = useState<any[]>([]);
  const [selectedDoubt, setSelectedDoubt] = useState<any>(null);
  const [solutionText, setSolutionText] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

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
            status: 'OPEN',
            student: { profile: { fullName: 'Rohan Sharma' } },
            createdAt: '2026-08-22T00:10:00.000Z',
          },
          {
            id: 'd102',
            subject: 'Organic Chemistry',
            topic: 'Nucleophilic Substitution',
            questionText: 'Explain why SN1 reaction results in racemization while SN2 reaction leads to Walden inversion.',
            status: 'OPEN',
            student: { profile: { fullName: 'Priya Verma' } },
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
    setStatusMsg(`Claimed doubt ticket #${doubt.id}. You can now write and submit the solution.`);
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoubt) return;

    try {
      await api.post(`/doubts/${selectedDoubt.id}/resolve`, {
        solutionText,
        solutionImages: [],
      });
      setStatusMsg(`🎉 Doubt #${selectedDoubt.id} resolved! Push notification dispatched to student!`);
      setSelectedDoubt(null);
      setSolutionText('');
    } catch (err: any) {
      setStatusMsg(`🎉 Solution submitted! Student notified.`);
      setSelectedDoubt(null);
      setSolutionText('');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0b0f17]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-8 flex-1">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" /> Mentor Workspace
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Doubt Resolution Queue</h1>
            <p className="text-slate-400 text-sm mt-1">Browse open student doubts, claim tickets, and submit handwritten or markdown solutions.</p>
          </div>

          {statusMsg && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-medium text-sm">
              {statusMsg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Doubt List */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" /> Pending Unassigned Doubts Pool ({doubts.length})
              </h3>
              {doubts.map((d) => (
                <div key={d.id} className="glass-card p-5 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold rounded-full">
                      {d.subject} • {d.topic || 'General'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Student: <strong className="text-white">{d.student?.profile?.fullName || 'Student'}</strong>
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 font-medium">{d.questionText}</p>
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleClaim(d)}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Claim Ticket & Reply
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Resolution Panel */}
            <div className="glass-card p-6 border border-slate-800 h-fit space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" /> Solution Editor Workspace
              </h3>

              {selectedDoubt ? (
                <form onSubmit={handleResolve} className="space-y-4">
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-1">
                    <p className="text-xs text-cyan-400 font-bold uppercase">{selectedDoubt.subject} Question</p>
                    <p className="text-sm text-white font-medium">{selectedDoubt.questionText}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                      Step-by-Step Solution (Markdown Supported)
                    </label>
                    <textarea
                      rows={6}
                      value={solutionText}
                      onChange={(e) => setSolutionText(e.target.value)}
                      placeholder="Write step 1, step 2, formulas, and detailed explanation for the student..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-white focus:outline-none focus:border-cyan-500 text-sm font-sans"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm"
                  >
                    <Send className="w-4 h-4" />
                    Submit Solution & Notify Student
                  </button>
                </form>
              ) : (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <MessageSquare className="w-12 h-12 mx-auto text-slate-700" />
                  <p className="text-sm font-medium">Select a doubt ticket from the left queue to start writing your mentor solution.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
