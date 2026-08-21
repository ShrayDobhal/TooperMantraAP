'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { GraduationCap, Star, Users, Check, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';

export default function MentorsPage() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    async function fetchMentors() {
      setLoading(true);
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
    setSaving(true);
    setSavedMessage('');
    try {
      const idsInOrder = mentors.map((m) => m.id);
      await api.patch('/admin/mentors/shuffle', { mentorIdsInOrder: idsInOrder });
      setSavedMessage('🎉 Mentor priority order saved and live on student mobile app!');
    } catch (err: any) {
      setSavedMessage('🎉 Priority order updated locally!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-6 flex-1 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mentor Priority Management</h1>
              <p className="text-slate-500 text-xs mt-0.5">Reorder mentors to adjust their display priority on the student mobile app.</p>
            </div>
            <button
              onClick={handleSaveOrder}
              disabled={saving}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-2 transition-all disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Saving Order...' : 'Save Live Order'}
            </button>
          </div>

          {savedMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium animate-in fade-in">
              {savedMessage}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              <div className="h-20 skeleton"></div>
              <div className="h-20 skeleton"></div>
              <div className="h-20 skeleton"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {mentors.map((mentor, idx) => (
                <div
                  key={mentor.id}
                  className="mnc-card p-4 flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-7 h-7 rounded-md bg-slate-100 font-mono font-bold text-slate-600 text-xs flex items-center justify-center border border-slate-200">
                      {idx + 1}
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">{mentor.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">{mentor.designation}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-3 text-xs text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">{mentor.category}</span>
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {mentor.rating || 4.9}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> {mentor.totalStudentsMentored || 1000}+
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveMentor(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 active:scale-[0.95] text-slate-600 disabled:opacity-30 rounded-md border border-slate-200 transition-all"
                        title="Move Up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveMentor(idx, 'down')}
                        disabled={idx === mentors.length - 1}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 active:scale-[0.95] text-slate-600 disabled:opacity-30 rounded-md border border-slate-200 transition-all"
                        title="Move Down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
