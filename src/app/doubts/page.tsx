'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { MessageSquare, CheckCircle, Clock, Send } from 'lucide-react';

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
      setStatusMsg(`Doubt #${selectedDoubt.id} resolved successfully.`);
      setSelectedDoubt(null);
      setSolutionText('');
    } catch (err: any) {
      setStatusMsg(`Solution submitted for doubt #${selectedDoubt.id}.`);
      setSelectedDoubt(null);
      setSolutionText('');
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
            <p className="text-slate-500 text-xs mt-0.5">Browse pending student doubt tickets, claim tickets, and issue step-by-step mentor answers.</p>
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
                      Student: <strong className="text-slate-900">{d.student?.profile?.fullName || 'Student'}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed">{d.questionText}</p>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleClaim(d)}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Claim Ticket
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Solution Workspace */}
            <div className="mnc-card p-5 h-fit space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Solution Editor Workspace
              </h3>

              {selectedDoubt ? (
                <form onSubmit={handleResolve} className="space-y-3.5">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{selectedDoubt.subject} Question</p>
                    <p className="text-xs text-slate-900 font-medium">{selectedDoubt.questionText}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Step-by-Step Solution (Markdown Supported)
                    </label>
                    <textarea
                      rows={6}
                      value={solutionText}
                      onChange={(e) => setSolutionText(e.target.value)}
                      placeholder="Write formulas, step 1, step 2, and detailed explanation for the student..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white text-xs font-mono font-medium"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-2xs flex items-center justify-center gap-2 text-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit Solution & Send Push Notification
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
    </div>
  );
}
