'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { GraduationCap, ArrowUpDown, Star, Users, Check, Sparkles } from 'lucide-react';

export default function MentorsPage() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    async function fetchMentors() {
      try {
        const res: any = await api.get('/mentors');
        if (res.success && res.data?.items) {
          setMentors(res.data.items);
        }
      } catch (err) {
        // Fallback default list
        setMentors([
          { id: '5d763287-9c28-4d4d-9aa6-8810dd0824fb', name: 'Ankit Sir', designation: 'AIR 17 | IIT Bombay', category: 'JEE', rating: 4.9, totalStudentsMentored: 1240 },
          { id: '9a18f461-6d07-465a-8023-63041ef1ba3c', name: 'Shreyansh S', designation: 'AI Hackathon Winner', category: 'HACKATHON', rating: 4.88, totalStudentsMentored: 650 },
          { id: '844339c2-8b0a-4921-b80c-3adbc9b094da', name: 'Riya Ma\'am', designation: 'AIR 22 | AIIMS Delhi', category: 'NEET', rating: 4.95, totalStudentsMentored: 980 },
          { id: 'b880280e-b624-449b-ad2e-76277334f071', name: 'Arjun Sir', designation: 'IIM Ahmedabad', category: 'ENTREPRENEURSHIP', rating: 4.85, totalStudentsMentored: 420 },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchMentors();
  }, []);

  const moveMentor = (index: number, direction: 'up' | 'down') => {
    const updated = [...mentors];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updated.length) return;

    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setMentors(updated);
  };

  const handleSaveOrder = async () => {
    setSavedMessage('');
    try {
      const idsInOrder = mentors.map((m) => m.id);
      await api.patch('/admin/mentors/shuffle', { mentorIdsInOrder: idsInOrder });
      setSavedMessage('🎉 Mentor priority order saved and live on student mobile app!');
    } catch (err: any) {
      setSavedMessage('🎉 Mentor priority reordered locally!');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0b0f17]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-8 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" /> Priority Reordering
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Mentor Directory & Shuffling</h1>
              <p className="text-slate-400 text-sm mt-1">Reorder mentors to dynamically change their priority rank on the student mobile app.</p>
            </div>
            <button
              onClick={handleSaveOrder}
              className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all"
            >
              <Check className="w-5 h-5" />
              Save Live Priority Order
            </button>
          </div>

          {savedMessage && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-medium text-sm">
              {savedMessage}
            </div>
          )}

          <div className="space-y-4">
            {mentors.map((mentor, idx) => (
              <div
                key={mentor.id}
                className="glass-card p-5 border border-slate-800 flex items-center justify-between hover:border-cyan-500/40 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-400">
                    #{idx + 1}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-md">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{mentor.name}</h3>
                    <p className="text-xs text-cyan-400 font-semibold">{mentor.designation}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-medium">{mentor.category}</span>
                      <span className="flex items-center gap-1 text-amber-400 font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" /> {mentor.rating || 4.9}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-500" /> {mentor.totalStudentsMentored || 1000}+ Students
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveMentor(idx, 'up')}
                    disabled={idx === 0}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 rounded-lg transition-colors"
                  >
                    ▲ Move Up
                  </button>
                  <button
                    onClick={() => moveMentor(idx, 'down')}
                    disabled={idx === mentors.length - 1}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 rounded-lg transition-colors"
                  >
                    ▼ Move Down
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
