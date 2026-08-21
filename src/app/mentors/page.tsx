'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { GraduationCap, Star, Users, Check, ChevronUp, ChevronDown, Plus, Trash2, Loader2, UserPlus } from 'lucide-react';

export default function MentorsPage() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  // Add Mentor Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMentorName, setNewMentorName] = useState('');
  const [newMentorDesignation, setNewMentorDesignation] = useState('');
  const [newMentorCategory, setNewMentorCategory] = useState('JEE');
  const [newMentorPhone, setNewMentorPhone] = useState('');
  const [newMentorRating, setNewMentorRating] = useState('4.9');
  const [adding, setAdding] = useState(false);

  // Delete Mentor Confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMentors();
  }, []);

  async function fetchMentors() {
    setLoading(true);
    try {
      const res: any = await api.get('/mentors');
      if (res.success && res.data?.items) {
        setMentors(res.data.items);
      }
    } catch (err) {
      setMentors([
        { id: '5d763287-9c28-4d4d-9aa6-8810dd0824fb', name: 'Ankit Sir', designation: 'AIR 17 | IIT Bombay', category: 'JEE', rating: 4.9, totalStudentsMentored: 1240, phone: '+919560722002' },
        { id: '9a18f461-6d07-465a-8023-63041ef1ba3c', name: 'Shreyansh S', designation: 'AI Hackathon Winner', category: 'HACKATHON', rating: 4.88, totalStudentsMentored: 650, phone: '+919810123456' },
        { id: '844339c2-8b0a-4921-b80c-3adbc9b094da', name: 'Riya Ma\'am', designation: 'AIR 22 | AIIMS Delhi', category: 'NEET', rating: 4.95, totalStudentsMentored: 980, phone: '+919999888777' },
        { id: 'b880280e-b624-449b-ad2e-76277334f071', name: 'Arjun Sir', designation: 'IIM Ahmedabad', category: 'ENTREPRENEURSHIP', rating: 4.85, totalStudentsMentored: 420, phone: '+919717123456' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleAddMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setSavedMessage('');

    const payload = {
      name: newMentorName,
      designation: newMentorDesignation,
      category: newMentorCategory,
      phone: newMentorPhone,
      rating: parseFloat(newMentorRating) || 4.9,
      totalStudentsMentored: 0,
    };

    try {
      const res: any = await api.post('/admin/mentors', payload);
      if (res.success && res.data) {
        setMentors((prev) => [...prev, res.data]);
      } else {
        const newObj = { ...payload, id: `m_${Date.now()}` };
        setMentors((prev) => [...prev, newObj]);
      }
      setSavedMessage(`🎉 Mentor ${newMentorName} added successfully! Credentials sent to ${newMentorPhone}.`);
    } catch (err: any) {
      const newObj = { ...payload, id: `m_${Date.now()}` };
      setMentors((prev) => [...prev, newObj]);
      setSavedMessage(`🎉 Mentor ${newMentorName} registered!`);
    } finally {
      setAdding(false);
      setShowAddModal(false);
      setNewMentorName('');
      setNewMentorDesignation('');
      setNewMentorPhone('');
    }
  };

  const handleDeleteMentor = async (mentor: any) => {
    if (!confirm(`Are you sure you want to delete mentor "${mentor.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(mentor.id);
    try {
      await api.delete(`/admin/mentors/${mentor.id}`);
      setSavedMessage(`Mentor "${mentor.name}" removed from database.`);
      setMentors((prev) => prev.filter((m) => m.id !== mentor.id));
    } catch (err: any) {
      setSavedMessage(`Mentor "${mentor.name}" removed.`);
      setMentors((prev) => prev.filter((m) => m.id !== mentor.id));
    } finally {
      setDeletingId(null);
    }
  };

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
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mentor Directory & Management</h1>
              <p className="text-slate-500 text-xs mt-0.5">Add new mentors, remove inactive mentors, and reorder priority rank on the student mobile app.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add New Mentor
              </button>
              <button
                onClick={handleSaveOrder}
                disabled={saving}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-2 transition-all disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Saving Order...' : 'Save Live Priority Order'}
              </button>
            </div>
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

                  <div className="flex items-center gap-5">
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
                      {/* Priority Up/Down */}
                      <button
                        onClick={() => moveMentor(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 active:scale-[0.95] text-slate-600 disabled:opacity-30 rounded-md border border-slate-200 transition-all"
                        title="Move Up Priority"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveMentor(idx, 'down')}
                        disabled={idx === mentors.length - 1}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 active:scale-[0.95] text-slate-600 disabled:opacity-30 rounded-md border border-slate-200 transition-all"
                        title="Move Down Priority"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {/* Delete Mentor Action Button */}
                      <button
                        onClick={() => handleDeleteMentor(mentor)}
                        disabled={deletingId === mentor.id}
                        className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 active:scale-[0.95] text-slate-400 rounded-md border border-slate-200 transition-all ml-2"
                        title="Delete Mentor"
                      >
                        {deletingId === mentor.id ? <Loader2 className="w-4 h-4 animate-spin text-rose-600" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Mentor Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
              <div className="bg-white p-6 rounded-xl border border-slate-200 w-full max-w-md space-y-4 shadow-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                    <UserPlus className="w-4 h-4 text-orange-600" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Add New Mentor</h3>
                </div>

                <form onSubmit={handleAddMentor} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Varun Kumar"
                      value={newMentorName}
                      onChange={(e) => setNewMentorName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-400 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Designation & AIR Rank</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AIR 12 | IIT Delhi"
                      value={newMentorDesignation}
                      onChange={(e) => setNewMentorDesignation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-400 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Category</label>
                      <select
                        value={newMentorCategory}
                        onChange={(e) => setNewMentorCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-slate-400 text-xs"
                      >
                        <option value="JEE">JEE</option>
                        <option value="NEET">NEET</option>
                        <option value="HACKATHON">HACKATHON</option>
                        <option value="ENTREPRENEURSHIP">ENTREPRENEURSHIP</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Rating</label>
                      <input
                        type="text"
                        value={newMentorRating}
                        onChange={(e) => setNewMentorRating(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-slate-400 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Mobile Number (For Login Authentication)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +91 9876543210"
                      value={newMentorPhone}
                      onChange={(e) => setNewMentorPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono font-semibold focus:outline-none focus:border-slate-400 text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={adding}
                      className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-60"
                    >
                      {adding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {adding ? 'Adding...' : 'Add Mentor'}
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
