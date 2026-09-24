'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { eventsApi, LiveEvent } from '@/api';
import {
  Calendar,
  Clock,
  Video,
  User,
  Plus,
  Search,
  ExternalLink,
  Trash2,
  Edit3,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Radio,
  Image as ImageIcon,
} from 'lucide-react';

export default function MasterclassesPage() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Create Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('JEE');
  const [speakerName, setSpeakerName] = useState('');
  const [speakerDesignation, setSpeakerDesignation] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [status, setStatus] = useState<'UPCOMING' | 'LIVE' | 'COMPLETED'>('UPCOMING');
  const [submitting, setSubmitting] = useState(false);

  // Edit State
  const [editingEvent, setEditingEvent] = useState<LiveEvent | null>(null);

  // Delete State
  const [eventToDelete, setEventToDelete] = useState<LiveEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await eventsApi.getEvents();
      if (res && res.success) {
        setEvents(res.data.items || []);
      } else {
        setErrorMsg('Failed to load masterclasses from backend API.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to connect to masterclasses API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('JEE');
    setSpeakerName('');
    setSpeakerDesignation('');
    setBannerUrl('');
    setLiveUrl('');
    setEventDate('');
    setStatus('UPCOMING');
    setEditingEvent(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (evt: LiveEvent) => {
    setEditingEvent(evt);
    setTitle(evt.title);
    setDescription(evt.description);
    setCategory(evt.category);
    setSpeakerName(evt.speakerName || '');
    setSpeakerDesignation(evt.speakerDesignation || '');
    setBannerUrl(evt.bannerUrl || '');
    setLiveUrl(evt.liveUrl || '');
    // format date for datetime-local
    try {
      const d = new Date(evt.eventDate);
      const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setEventDate(iso);
    } catch {
      setEventDate('');
    }
    setStatus(evt.status as any || 'UPCOMING');
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const isoDate = new Date(eventDate).toISOString();
      const payload = {
        title,
        description,
        category,
        speakerName: speakerName || undefined,
        speakerDesignation: speakerDesignation || undefined,
        bannerUrl: bannerUrl || undefined,
        liveUrl: liveUrl || undefined,
        eventDate: isoDate,
        status,
        isFeatured: true,
      };

      if (editingEvent) {
        await eventsApi.updateEvent(editingEvent.id, payload);
        setToastMsg(`✓ Masterclass "${title}" updated successfully.`);
      } else {
        await eventsApi.createEvent(payload);
        setToastMsg(`✓ Live Masterclass "${title}" scheduled and live on student app!`);
      }

      setShowAddModal(false);
      resetForm();
      await fetchEvents();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save masterclass.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;
    setDeleting(true);
    setErrorMsg('');
    try {
      await eventsApi.deleteEvent(eventToDelete.id);
      setToastMsg(`✓ Masterclass "${eventToDelete.title}" removed.`);
      setEventToDelete(null);
      await fetchEvents();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete masterclass.');
    } finally {
      setDeleting(false);
    }
  };

  const formatEventDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.speakerName && e.speakerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || e.category.toUpperCase() === categoryFilter.toUpperCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-6 flex-1 animate-in fade-in duration-300">
          {/* Header Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Radio className="w-6 h-6 text-orange-600 animate-pulse" />
                Live Masterclasses & Workshops
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Schedule and stream interactive masterclasses. Published masterclasses display instantly on the student mobile app home screen.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchEvents}
                disabled={loading}
                className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg shadow-2xs cursor-pointer"
                title="Refresh masterclasses"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
              </button>

              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-orange-500" />
                Schedule Masterclass
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:bg-white focus-within:border-slate-400 transition-all">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search masterclasses, speakers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none w-full font-medium"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap text-xs font-semibold">
              <span className="text-slate-400 text-[11px] uppercase tracking-wider mr-1">Filter:</span>
              {['ALL', 'JEE', 'NEET', 'HACKATHON', 'DRONE', 'ENTREPRENEURSHIP'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Banners */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={fetchEvents} className="px-3 py-1 bg-rose-600 text-white rounded-md text-xs font-semibold hover:bg-rose-700">
                Retry
              </button>
            </div>
          )}

          {toastMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Masterclasses Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="h-64 skeleton rounded-2xl" />
              <div className="h-64 skeleton rounded-2xl" />
              <div className="h-64 skeleton rounded-2xl" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
              <Calendar className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No scheduled masterclasses found.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click "Schedule Masterclass" above to publish a live session. It will immediately appear on the student mobile app.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEvents.map((evt) => {
                const isLive = evt.status === 'LIVE';
                const isUpcoming = evt.status === 'UPCOMING';

                return (
                  <div key={evt.id} className="mnc-card overflow-hidden flex flex-col justify-between group">
                    {/* Banner Image */}
                    <div className="relative h-44 w-full bg-slate-100 overflow-hidden border-b border-slate-100">
                      {evt.bannerUrl ? (
                        <img
                          src={evt.bannerUrl}
                          alt={evt.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 bg-gradient-to-br from-slate-100 to-slate-200">
                          <ImageIcon className="w-8 h-8 opacity-40" />
                          <span className="text-[10px] font-semibold">No Banner</span>
                        </div>
                      )}

                      {/* Floating Status Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-xs">
                          {evt.category}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-xs flex items-center gap-1 ${
                            isLive
                              ? 'bg-rose-600 text-white animate-pulse'
                              : isUpcoming
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-600 text-white'
                          }`}
                        >
                          {isLive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                          {evt.status}
                        </span>
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        {/* Event Date & Time */}
                        <div className="flex items-center gap-1.5 text-xs text-orange-600 font-bold">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatEventDate(evt.eventDate)}</span>
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                          {evt.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {evt.description}
                        </p>

                        {/* Speaker details */}
                        {evt.speakerName && (
                          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                            <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate text-[11px]">{evt.speakerName}</p>
                              {evt.speakerDesignation && (
                                <p className="text-[10px] text-slate-500 truncate">{evt.speakerDesignation}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        {evt.liveUrl ? (
                          <a
                            href={evt.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                          >
                            <Video className="w-3.5 h-3.5 text-orange-600" />
                            <span>Join Stream</span>
                            <ExternalLink className="w-3 h-3 text-orange-500" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No stream link</span>
                        )}

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(evt)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-md transition-colors"
                            title="Edit masterclass"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEventToDelete(evt)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                            title="Delete masterclass"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SCHEDULE / EDIT MODAL */}
          {showAddModal && (
            <div className="fixed inset-0 z-[100] bg-slate-950/80 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 w-full max-w-lg space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {editingEvent ? 'Edit Live Masterclass' : 'Schedule New Masterclass'}
                    </h3>
                    <p className="text-xs text-slate-500">Live sessions sync with the student mobile app in real-time</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Masterclass Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. JEE Advanced Physics: Electromagnetism Shortcuts"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Category *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-500"
                      >
                        <option value="JEE">JEE</option>
                        <option value="NEET">NEET</option>
                        <option value="CUET">CUET</option>
                        <option value="HACKATHON">HACKATHON</option>
                        <option value="DRONE">DRONE AVIATION</option>
                        <option value="ENTREPRENEURSHIP">ENTREPRENEURSHIP</option>
                        <option value="INSPIRE">INSPIRE / MOTIVATION</option>
                        <option value="GENERAL">GENERAL</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Status *
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-500"
                      >
                        <option value="UPCOMING">UPCOMING</option>
                        <option value="LIVE">LIVE NOW</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Date & Time (IST) *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Speaker Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Aayush Kumar"
                        value={speakerName}
                        onChange={(e) => setSpeakerName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Speaker Designation
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. IIT Bombay AIR 17"
                        value={speakerDesignation}
                        onChange={(e) => setSpeakerDesignation(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Live Stream / Meeting URL (Google Meet / Zoom / YouTube)
                    </label>
                    <input
                      type="url"
                      placeholder="https://meet.google.com/xyz-abc-def"
                      value={liveUrl}
                      onChange={(e) => setLiveUrl(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Banner Image URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-500"
                    />
                    {bannerUrl && (
                      <div className="mt-2 h-24 rounded-lg overflow-hidden border border-slate-200">
                        <img src={bannerUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Description / Learning Outcomes *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Write what students will learn in this session..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer"
                    >
                      {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {submitting ? 'Saving...' : editingEvent ? 'Update Masterclass' : 'Publish Masterclass'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* DELETE CONFIRMATION MODAL */}
          {eventToDelete && (
            <div className="fixed inset-0 z-[100] bg-slate-950/80 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-2xl border border-rose-200 w-full max-w-md space-y-4 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Delete Masterclass</h3>
                    <p className="text-xs text-slate-500">Remove from student mobile app</p>
                  </div>
                </div>

                <p className="text-xs text-slate-700">
                  Are you sure you want to delete masterclass <strong>"{eventToDelete.title}"</strong>? Students will no longer see this session in their upcoming list.
                </p>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => setEventToDelete(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={handleDelete}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {deleting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
