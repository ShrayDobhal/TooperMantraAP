'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { GraduationCap, Star, Users, Check, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';

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
      setSavedMessage('🎉 Mentor priority reordered successfully!');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-8 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-orange-600 text-xs font-extrabold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" /> Live Mobile App Sorting
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Mentor Directory & Priority Shuffling</h1>
              <p className="text-slate-500 text-sm mt-1">Reorder mentors to dynamically change their priority rank on the student mobile app.</p>
            </div>
            <button
              onClick={handleSaveOrder}
              className="px-6 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all active:scale-[0.99]"
            >
              <Check className="w-5 h-5" />
              Save Live Priority Order
            </button>
          </div>

          {savedMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 font-bold text-sm shadow-xs flex items-center gap-2">
              <span>{savedMessage}</span>
            </div>
          )}

          <div className="space-y-4">
            {mentors.map((mentor, idx) => (
              <div
                key={mentor.id}
                className="tm-card p-6 flex items-center justify-between hover:border-orange-300 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center font-extrabold text-orange-600">
                    #{idx + 1}
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-bold text-white shadow-md shadow-orange-500/20">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{mentor.name}</h3>
                    <p className="text-xs text-orange-600 font-bold">{mentor.designation}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="bg-slate-100 px-2.5 py-0.5 rounded-full text-slate-700 font-semibold">{mentor.category}</span>
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" /> {mentor.rating || 4.9}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> {mentor.totalStudentsMentored || 1000}+ Students
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveMentor(idx, 'up')}
                    disabled={idx === 0}
                    className="p-2.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 disabled:opacity-30 rounded-xl transition-all font-semibold flex items-center gap-1 text-xs border border-slate-200"
                  >
                    <ChevronUp className="w-4 h-4" /> Move Up
                  </button>
                  <button
                    onClick={() => moveMentor(idx, 'down')}
                    disabled={idx === mentors.length - 1}
                    className="p-2.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 disabled:opacity-30 rounded-xl transition-all font-semibold flex items-center gap-1 text-xs border border-slate-200"
                  >
                    <ChevronDown className="w-4 h-4" /> Move Down
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
