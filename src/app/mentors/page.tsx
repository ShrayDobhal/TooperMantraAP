'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { mentorsApi, Mentor } from '@/api';
import {
  GraduationCap,
  Star,
  Users,
  Check,
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  Loader2,
  UserPlus,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  Building2,
  Briefcase,
  BookOpen,
  Award,
  Filter,
} from 'lucide-react';

const CATEGORIES = ['All', 'JEE', 'NEET', 'HACKATHON', 'ENTREPRENEURSHIP', 'CUET', 'BOARDS', 'DRONE', 'OTHER'];

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Add Mentor Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMentorName, setNewMentorName] = useState('');
  const [newMentorDesignation, setNewMentorDesignation] = useState('');
  const [newMentorOrganization, setNewMentorOrganization] = useState('');
  const [newMentorCategory, setNewMentorCategory] = useState('JEE');
  const [newMentorAvatarUrl, setNewMentorAvatarUrl] = useState('');
  const [newMentorBio, setNewMentorBio] = useState('');
  const [newMentorExpertise, setNewMentorExpertise] = useState('');
  const [newMentorSubjects, setNewMentorSubjects] = useState('');
  const [newMentorExams, setNewMentorExams] = useState('');
  const [newMentorPhone, setNewMentorPhone] = useState('');
  const [newMentorRating, setNewMentorRating] = useState('4.9');
  const [newMentorExperience, setNewMentorExperience] = useState('3');
  const [newMentorStudentsCount, setNewMentorStudentsCount] = useState('150');
  const [adding, setAdding] = useState(false);

  // Delete Mentor Confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMentors();
  }, [categoryFilter]);

  async function fetchMentors() {
    setLoading(true);
    setErrorMsg('');
    try {
      const cat = categoryFilter !== 'All' ? categoryFilter : undefined;
      const res = await mentorsApi.getMentors(cat);
      if (res && res.success) {
        setMentors(res.data.items || []);
      } else {
        setErrorMsg('Failed to load mentor directory from backend API.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to fetch mentors from backend.');
    } finally {
      setLoading(false);
    }
  }

  const handleAddMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setSavedMessage('');
    setErrorMsg('');

    const expertiseArr = newMentorExpertise
      ? newMentorExpertise.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const subjectsArr = newMentorSubjects
      ? newMentorSubjects.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const examsArr = newMentorExams
      ? newMentorExams.split(',').map((s) => s.trim()).filter(Boolean)
      : [newMentorCategory];

    const payload = {
      name: newMentorName.trim(),
      designation: newMentorDesignation.trim(),
      organizationOrCollege: newMentorOrganization.trim() || 'Topper Mantra Academic Panel',
      category: newMentorCategory,
      avatarUrl: newMentorAvatarUrl.trim() || undefined,
      bio: newMentorBio.trim() || undefined,
      expertise: expertiseArr,
      subjects: subjectsArr,
      exams: examsArr,
      phone: newMentorPhone.trim() || undefined,
      rating: parseFloat(newMentorRating) || 4.9,
      experienceYears: parseInt(newMentorExperience, 10) || 3,
      totalStudentsMentored: parseInt(newMentorStudentsCount, 10) || 150,
      availability: 'AVAILABLE',
      status: 'ACTIVE',
    };

    try {
      const res = await mentorsApi.createMentor(payload);
      if (res && res.success) {
        setSavedMessage(`🎉 Mentor ${newMentorName} onboarded successfully!`);
        fetchMentors();
        setShowAddModal(false);
        resetForm();
      } else {
        setErrorMsg('Failed to register new mentor.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add mentor.');
    } finally {
      setAdding(false);
    }
  };

  const resetForm = () => {
    setNewMentorName('');
    setNewMentorDesignation('');
    setNewMentorOrganization('');
    setNewMentorAvatarUrl('');
    setNewMentorBio('');
    setNewMentorExpertise('');
    setNewMentorSubjects('');
    setNewMentorExams('');
    setNewMentorPhone('');
    setNewMentorRating('4.9');
    setNewMentorExperience('3');
    setNewMentorStudentsCount('150');
  };

  const handleDeleteMentor = async (mentor: Mentor) => {
    if (!confirm(`Are you sure you want to delete mentor "${mentor.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(mentor.id);
    try {
      await mentorsApi.deleteMentor(mentor.id);
      setSavedMessage(`Mentor "${mentor.name}" removed.`);
      fetchMentors();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete mentor.');
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
    setErrorMsg('');
    try {
      const idsInOrder = mentors.map((m) => m.id);
      await mentorsApi.reorderMentors(idsInOrder);
      setSavedMessage('🎉 Mentor priority order saved and live on student mobile app!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save mentor order.');
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mentor Directory & Management</h1>
              <p className="text-slate-500 text-xs mt-0.5">Add new mentors with photographs, manage subject experts, and reorder live priority rank on the student mobile app.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchMentors}
                disabled={loading}
                className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg shadow-2xs cursor-pointer"
                title="Refresh Directory"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-orange-500" />
                Add New Mentor
              </button>

              <button
                onClick={handleSaveOrder}
                disabled={saving || mentors.length === 0}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Saving Order...' : 'Save Live Priority Order'}
              </button>
            </div>
          </div>

          {/* Category Filters Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold pr-2 border-r border-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Category:</span>
            </div>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={fetchMentors} className="px-3 py-1 bg-rose-600 text-white rounded-md text-xs font-semibold hover:bg-rose-700">
                Retry
              </button>
            </div>
          )}

          {savedMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium animate-in fade-in flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{savedMessage}</span>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              <div className="h-20 skeleton"></div>
              <div className="h-20 skeleton"></div>
              <div className="h-20 skeleton"></div>
            </div>
          ) : mentors.length === 0 ? (
            <div className="p-12 bg-white rounded-xl border border-slate-200 text-center text-slate-400 space-y-2">
              <GraduationCap className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No mentors found matching filter.</p>
              <p className="text-xs text-slate-500">Click &quot;Add New Mentor&quot; to onboard expert mentors.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mentors.map((mentor, idx) => (
                <div
                  key={mentor.id}
                  className="mnc-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-slate-300"
                >
                  <div className="flex items-start md:items-center gap-3.5">
                    <div className="w-7 h-7 rounded-md bg-slate-100 font-mono font-bold text-slate-600 text-xs flex items-center justify-center border border-slate-200 shrink-0 mt-1 md:mt-0">
                      {idx + 1}
                    </div>

                    {/* Mentor Photograph / Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs relative">
                      {mentor.avatarUrl ? (
                        <img
                          src={mentor.avatarUrl}
                          alt={mentor.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-500 to-amber-600 text-white font-bold text-sm flex items-center justify-center">
                          {mentor.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900 text-sm">{mentor.name}</h3>
                        <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {mentor.category}
                        </span>
                        {mentor.organizationOrCollege && (
                          <span className="text-slate-500 text-xs font-medium flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {mentor.organizationOrCollege}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">{mentor.designation}</p>
                      {mentor.bio && (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 max-w-xl">{mentor.bio}</p>
                      )}
                      {mentor.expertise && mentor.expertise.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {mentor.expertise.slice(0, 3).map((exp, i) => (
                            <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                              {exp}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 text-slate-700 font-semibold bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {mentor.rating || 4.9}
                      </span>
                      <span className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> {mentor.totalStudentsMentored || 150}+
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Priority Up/Down */}
                      <button
                        onClick={() => moveMentor(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 active:scale-[0.95] text-slate-600 disabled:opacity-30 rounded-md border border-slate-200 transition-all cursor-pointer"
                        title="Move Up Priority"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveMentor(idx, 'down')}
                        disabled={idx === mentors.length - 1}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 active:scale-[0.95] text-slate-600 disabled:opacity-30 rounded-md border border-slate-200 transition-all cursor-pointer"
                        title="Move Down Priority"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {/* Delete Mentor Action Button */}
                      <button
                        onClick={() => handleDeleteMentor(mentor)}
                        disabled={deletingId === mentor.id}
                        className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 active:scale-[0.95] text-slate-400 rounded-md border border-slate-200 transition-all ml-2 cursor-pointer"
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
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
              <div className="bg-white p-6 rounded-xl border border-slate-200 w-full max-w-lg space-y-4 shadow-xl my-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Onboard New Mentor</h3>
                      <p className="text-xs text-slate-500">Add subject expert details, profile photograph, and domain expertise.</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleAddMentor} className="space-y-4">
                  {/* Photo / Avatar Section with Live Preview */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Mentor Photograph / Profile Picture
                    </label>
                    <div className="flex items-center gap-3.5">
                      <div className="w-16 h-16 rounded-xl bg-white border border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                        {newMentorAvatarUrl ? (
                          <img
                            src={newMentorAvatarUrl}
                            alt="Avatar Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <input
                          type="url"
                          placeholder="Paste image URL (e.g. Bunny CDN / Unsplash / S3)"
                          value={newMentorAvatarUrl}
                          onChange={(e) => setNewMentorAvatarUrl(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-slate-400 font-mono"
                        />
                        <p className="text-[11px] text-slate-400">
                          {newMentorAvatarUrl ? '✓ Live photograph preview active' : 'Enter URL to see live photo preview'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Full Name *</label>
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
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Designation & Rank *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. AIR 12 | IIT Delhi"
                        value={newMentorDesignation}
                        onChange={(e) => setNewMentorDesignation(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-400 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">College / Organization *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. IIT Bombay / AIIMS"
                        value={newMentorOrganization}
                        onChange={(e) => setNewMentorOrganization(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-400 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Category *</label>
                      <select
                        value={newMentorCategory}
                        onChange={(e) => setNewMentorCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-slate-400 text-xs"
                      >
                        <option value="JEE">JEE</option>
                        <option value="NEET">NEET</option>
                        <option value="HACKATHON">HACKATHON</option>
                        <option value="ENTREPRENEURSHIP">ENTREPRENEURSHIP</option>
                        <option value="CUET">CUET</option>
                        <option value="BOARDS">BOARDS</option>
                        <option value="DRONE">DRONE</option>
                        <option value="OTHER">OTHER</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Mentor Biography</label>
                    <textarea
                      rows={2}
                      placeholder="Brief background, achievements, and teaching methodology..."
                      value={newMentorBio}
                      onChange={(e) => setNewMentorBio(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-400 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Areas of Expertise (Comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Physical Chemistry, Inorganic Shortcuts, Speed Tricks"
                      value={newMentorExpertise}
                      onChange={(e) => setNewMentorExpertise(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-400 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Rating</label>
                      <input
                        type="text"
                        value={newMentorRating}
                        onChange={(e) => setNewMentorRating(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-slate-400 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Exp (Years)</label>
                      <input
                        type="number"
                        value={newMentorExperience}
                        onChange={(e) => setNewMentorExperience(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-slate-400 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Students</label>
                      <input
                        type="number"
                        value={newMentorStudentsCount}
                        onChange={(e) => setNewMentorStudentsCount(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-slate-400 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Mobile Number (Authentication)</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 9876543210"
                      value={newMentorPhone}
                      onChange={(e) => setNewMentorPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono font-semibold focus:outline-none focus:border-slate-400 text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        resetForm();
                      }}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={adding}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer"
                    >
                      {adding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {adding ? 'Onboarding...' : 'Onboard Mentor'}
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
