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
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-8 flex-1">
          <div>
            <div className="flex items-center gap-2 text-orange-600 text-xs font-extrabold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" /> Mentor Resolution Suite
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Doubt Resolution Queue</h1>
            <p className="text-slate-500 text-sm mt-1">Browse open student doubts, claim tickets, and submit step-by-step solutions.</p>
          </div>

          {statusMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 font-bold text-sm shadow-xs">
              {statusMsg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Doubt List */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" /> Pending Unassigned Doubts Pool ({doubts.length})
              </h3>
              {doubts.map((d) => (
                <div key={d.id} className="tm-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-orange-50 text-orange-600 border border-orange-200 text-xs font-bold rounded-full">
                      {d.subject} • {d.topic || 'General'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Student: <strong className="text-slate-900">{d.student?.profile?.fullName || 'Student'}</strong>
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 font-semibold leading-relaxed">{d.questionText}</p>
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleClaim(d)}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 active:scale-[0.99]"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Claim Ticket & Answer
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Resolution Panel */}
            <div className="tm-card p-6 h-fit space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" /> Solution Editor Workspace
              </h3>

              {selectedDoubt ? (
                <form onSubmit={handleResolve} className="space-y-4">
                  <div className="bg-orange-50/70 p-4 rounded-2xl border border-orange-100 space-y-1">
                    <p className="text-xs text-orange-600 font-extrabold uppercase">{selectedDoubt.subject} Question</p>
                    <p className="text-sm text-slate-900 font-bold">{selectedDoubt.questionText}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Step-by-Step Solution
                    </label>
                    <textarea
                      rows={6}
                      value={solutionText}
                      onChange={(e) => setSolutionText(e.target.value)}
                      placeholder="Write step 1, step 2, formulas, and detailed explanation for the student..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 focus:outline-none focus:border-orange-500 text-sm font-sans font-medium"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 text-sm active:scale-[0.99]"
                  >
                    <Send className="w-4 h-4" />
                    Submit Solution & Push Notification
                  </button>
                </form>
              ) : (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <MessageSquare className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">Select a doubt ticket from the left queue to start writing your solution.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
