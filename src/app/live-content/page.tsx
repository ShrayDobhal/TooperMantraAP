
import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import {
  Video,
  Radio,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Search,
  Filter,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

const CATEGORIES = [
  'ACADEMIC',
  'JEE',
  'NEET',
  'CUET',
  'NDA',
  'BOARDS',
  'HACKATHON',
  'ENTREPRENEURSHIP',
  'DRONE',
];

export default function LiveContentPage() {
  const [activeTab, setActiveTab] = useState<'EVENTS' | 'VIDEOS'>('EVENTS');
  const [events, setEvents] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal State
  const [showEventModal, setShowEventModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Event Form State
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    category: 'JEE',
    speakerName: '',
    speakerDesignation: '',
    bannerUrl: '',
    liveUrl: '',
    targetSchool: '',
    eventDate: new Date().toISOString().slice(0, 16),
    registrationLink: '',
    isFeatured: false,
    status: 'UPCOMING',
  });

  // Video Form State
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    youtubeId: '',
    videoUrl: '',
    thumbnailUrl: '',
    durationSeconds: 1200,
    category: 'JEE',
    targetSchool: '',
    isFeatured: false,
  });

  const fetchContent = async () => {
    setLoading(true);
    try {
      // Fetch events
      const eventsRes: any = await api.get('/inspire/events');
      if (eventsRes.success && eventsRes.data?.items) {
        setEvents(eventsRes.data.items);
      }

      // Fetch videos
      const videosRes: any = await api.get('/inspire/videos');
      if (videosRes.success && videosRes.data?.items) {
        setVideos(videosRes.data.items);
      }
    } catch (err: any) {
      console.error('Failed to load content:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (selectedItem) {
        await api.patch(`/admin/events/${selectedItem.id}`, {
          ...eventForm,
          eventDate: new Date(eventForm.eventDate).toISOString(),
        });
        setToastMessage('Live Session updated successfully!');
      } else {
        await api.post('/admin/events', {
          ...eventForm,
          eventDate: new Date(eventForm.eventDate).toISOString(),
        });
        setToastMessage('Live Session scheduled successfully!');
      }
      setShowEventModal(false);
      setSelectedItem(null);
      fetchContent();
    } catch (err: any) {
      alert(err.message || 'Failed to save live session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this live session?')) return;
    try {
      await api.delete(`/admin/events/${id}`);
      setToastMessage('Live Session deleted');
      fetchContent();
    } catch (err: any) {
      alert(err.message || 'Failed to delete event');
    }
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (selectedItem) {
        await api.patch(`/admin/videos/${selectedItem.id}`, videoForm);
        setToastMessage('Video & Thumbnail updated successfully!');
      } else {
        await api.post('/admin/videos', videoForm);
        setToastMessage('Video uploaded & created successfully!');
      }
      setShowVideoModal(false);
      setSelectedItem(null);
      fetchContent();
    } catch (err: any) {
      alert(err.message || 'Failed to save video');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      await api.delete(`/admin/videos/${id}`);
      setToastMessage('Video deleted');
      fetchContent();
    } catch (err: any) {
      alert(err.message || 'Failed to delete video');
    }
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.speakerName && e.speakerName.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = !categoryFilter || e.category?.toUpperCase() === categoryFilter.toUpperCase();
    return matchesSearch && matchesCat;
  });

  const filteredVideos = videos.filter((v) => {
    const matchesSearch = v.title.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !categoryFilter || v.category?.toUpperCase() === categoryFilter.toUpperCase();
    return matchesSearch && matchesCat;
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-6 flex-1 animate-in fade-in duration-300">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Video className="w-6 h-6 text-orange-600" />
                Live Sessions & Video Control
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Upload videos, schedule live webinars, set thumbnail images, and target specific categories or partner schools.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setEventForm({
                    title: '',
                    description: '',
                    category: 'JEE',
                    speakerName: '',
                    speakerDesignation: '',
                    bannerUrl: '',
                    liveUrl: '',
                    targetSchool: '',
                    eventDate: new Date().toISOString().slice(0, 16),
                    registrationLink: '',
                    isFeatured: false,
                    status: 'UPCOMING',
                  });
                  setShowEventModal(true);
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Radio className="w-4 h-4" />
                Schedule Live Session
              </button>

              <button
                onClick={() => {
                  setSelectedItem(null);
                  setVideoForm({
                    title: '',
                    description: '',
                    youtubeId: '',
                    videoUrl: '',
                    thumbnailUrl: '',
                    durationSeconds: 1200,
                    category: 'JEE',
                    targetSchool: '',
                    isFeatured: false,
                  });
                  setShowVideoModal(true);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-orange-500" />
                Upload Video
              </button>
            </div>
          </div>

          {toastMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Navigation & Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('EVENTS')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'EVENTS'
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Radio className="w-4 h-4" />
                Live Sessions ({events.length})
              </button>

              <button
                onClick={() => setActiveTab('VIDEOS')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'VIDEOS'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Video className="w-4 h-4 text-orange-500" />
                Uploaded Videos ({videos.length})
              </button>
            </div>

            {/* Filters & Search */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 w-44"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <button
                onClick={fetchContent}
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 shadow-2xs cursor-pointer"
                title="Refresh List"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* EVENTS TAB CONTENT */}
          {activeTab === 'EVENTS' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Scheduled Live Webinars & Stream Sessions
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3.5">Thumbnail Banner</th>
                      <th className="p-3.5">Session Details</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Target School</th>
                      <th className="p-3.5">Date & Time</th>
                      <th className="p-3.5">Stream Link</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          No live sessions found. Click "Schedule Live Session" to create one.
                        </td>
                      </tr>
                    ) : (
                      filteredEvents.map((evt) => (
                        <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5">
                            {evt.bannerUrl ? (
                              <img
                                src={evt.bannerUrl}
                                alt={evt.title}
                                className="w-20 h-12 object-cover rounded-md border border-slate-200"
                              />
                            ) : (
                              <div className="w-20 h-12 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center text-slate-400">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            )}
                          </td>
                          <td className="p-3.5">
                            <p className="font-bold text-slate-900 text-xs">{evt.title}</p>
                            {evt.speakerName && (
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Speaker: <span className="font-semibold text-slate-700">{evt.speakerName}</span> ({evt.speakerDesignation || 'Mentor'})
                              </p>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 bg-orange-50 border border-orange-200 text-orange-700 rounded-full font-bold text-[10px]">
                              {evt.category}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {evt.targetSchool ? (
                              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md font-semibold text-[11px]">
                                {evt.targetSchool}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">All Schools</span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-600 text-[11px]">
                            {new Date(evt.eventDate).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </td>
                          <td className="p-3.5">
                            {evt.liveUrl ? (
                              <a
                                href={evt.liveUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-orange-600 hover:underline font-semibold text-[11px] flex items-center gap-1"
                              >
                                Join Link <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-slate-400 text-[11px]">None</span>
                            )}
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              onClick={() => {
                                setSelectedItem(evt);
                                setEventForm({
                                  title: evt.title,
                                  description: evt.description || '',
                                  category: evt.category || 'JEE',
                                  speakerName: evt.speakerName || '',
                                  speakerDesignation: evt.speakerDesignation || '',
                                  bannerUrl: evt.bannerUrl || '',
                                  liveUrl: evt.liveUrl || '',
                                  targetSchool: evt.targetSchool || '',
                                  eventDate: new Date(evt.eventDate).toISOString().slice(0, 16),
                                  registrationLink: evt.registrationLink || '',
                                  isFeatured: evt.isFeatured || false,
                                  status: evt.status || 'UPCOMING',
                                });
                                setShowEventModal(true);
                              }}
                              className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                              title="Edit Session & Thumbnail"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(evt.id)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-md cursor-pointer"
                              title="Delete Session"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIDEOS TAB CONTENT */}
          {activeTab === 'VIDEOS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredVideos.length === 0 ? (
                <div className="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">
                  No videos found. Click "Upload Video" to add video content.
                </div>
              ) : (
                filteredVideos.map((v) => (
                  <div key={v.id} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
                    <div>
                      {/* Video Thumbnail */}
                      <div className="relative h-44 bg-slate-900 group">
                        {v.thumbnailUrl ? (
                          <img
                            src={v.thumbnailUrl}
                            alt={v.title}
                            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-1">
                            <ImageIcon className="w-8 h-8" />
                            <span className="text-[11px]">No Thumbnail Set</span>
                          </div>
                        )}

                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 text-white font-bold text-[10px] rounded-full backdrop-blur-xs">
                          {v.category}
                        </span>

                        {v.targetSchool && (
                          <span className="absolute top-2 right-2 px-2 py-0.5 bg-orange-600 text-white font-bold text-[10px] rounded-md shadow-2xs">
                            {v.targetSchool}
                          </span>
                        )}
                      </div>

                      {/* Video Info */}
                      <div className="p-4 space-y-2">
                        <h4 className="font-bold text-slate-900 text-xs line-clamp-2">{v.title}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{v.description || 'No description provided.'}</p>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 font-medium">
                        YouTube ID: <code className="font-mono text-slate-700">{v.youtubeId}</code>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedItem(v);
                            setVideoForm({
                              title: v.title,
                              description: v.description || '',
                              youtubeId: v.youtubeId || '',
                              videoUrl: v.videoUrl || '',
                              thumbnailUrl: v.thumbnailUrl || '',
                              durationSeconds: v.durationSeconds || 1200,
                              category: v.category || 'JEE',
                              targetSchool: v.targetSchool || '',
                              isFeatured: v.isFeatured || false,
                            });
                            setShowVideoModal(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                          title="Edit Thumbnail & Info"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteVideo(v.id)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-md cursor-pointer"
                          title="Delete Video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </main>
      </div>

      {/* SCHEDULE LIVE SESSION MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 border border-slate-200 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Radio className="w-4 h-4 text-orange-600" />
                {selectedItem ? 'Edit Live Session & Thumbnail' : 'Schedule Live Session'}
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Session Title *</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="e.g. JEE Advanced Organic Chemistry Live Q&A"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target School (Optional)</label>
                  <input
                    type="text"
                    value={eventForm.targetSchool}
                    onChange={(e) => setEventForm({ ...eventForm, targetSchool: e.target.value })}
                    placeholder="e.g. DPS R.K. Puram (Blank for all)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Thumbnail Banner Image URL *</label>
                <input
                  type="url"
                  value={eventForm.bannerUrl}
                  onChange={(e) => setEventForm({ ...eventForm, bannerUrl: e.target.value })}
                  placeholder="https://cdn.toppermantra.com/banners/banner1.jpg"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Live Stream / Meeting Link (URL)</label>
                <input
                  type="url"
                  value={eventForm.liveUrl}
                  onChange={(e) => setEventForm({ ...eventForm, liveUrl: e.target.value })}
                  placeholder="https://live.toppermantra.com/stream/session-101"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Speaker Name</label>
                  <input
                    type="text"
                    value={eventForm.speakerName}
                    onChange={(e) => setEventForm({ ...eventForm, speakerName: e.target.value })}
                    placeholder="e.g. Aman Sharma"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scheduled Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventForm.eventDate}
                    onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Session objectives and roadmap..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg text-xs shadow-2xs disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Live Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD VIDEO MODAL */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 border border-slate-200 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Video className="w-4 h-4 text-orange-600" />
                {selectedItem ? 'Edit Video & Custom Thumbnail' : 'Upload Video Content'}
              </h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVideo} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Video Title *</label>
                <input
                  type="text"
                  required
                  value={videoForm.title}
                  onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                  placeholder="e.g. Complete Organic Reactions Formula Sheet"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={videoForm.category}
                    onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">YouTube Video ID *</label>
                  <input
                    type="text"
                    required
                    value={videoForm.youtubeId}
                    onChange={(e) => setVideoForm({ ...videoForm, youtubeId: e.target.value })}
                    placeholder="e.g. dQw4w9WgXcQ"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Custom Thumbnail Image URL (Admin Set)</label>
                <input
                  type="url"
                  value={videoForm.thumbnailUrl}
                  onChange={(e) => setVideoForm({ ...videoForm, thumbnailUrl: e.target.value })}
                  placeholder="https://cdn.toppermantra.com/thumbnails/v1.jpg"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target School Filter (Optional)</label>
                <input
                  type="text"
                  value={videoForm.targetSchool}
                  onChange={(e) => setVideoForm({ ...videoForm, targetSchool: e.target.value })}
                  placeholder="e.g. DPS R.K. Puram (Blank for all schools)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={videoForm.description}
                  onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                  placeholder="Video overview and topics covered..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs shadow-2xs disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}