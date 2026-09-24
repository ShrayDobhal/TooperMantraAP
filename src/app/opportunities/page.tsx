'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { opportunitiesApi, Opportunity } from '@/api';
import {
  Trophy,
  Award,
  Briefcase,
  Search,
  Plus,
  ExternalLink,
  Trash2,
  Edit3,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Calendar,
  Building,
  CheckCircle,
  Image as ImageIcon,
  DollarSign,
  GraduationCap,
  Users,
} from 'lucide-react';

const OPPORTUNITY_TYPES: Array<'HACKATHON' | 'SCHOLARSHIP' | 'GRANT' | 'COMPETITION' | 'WORKSHOP'> = [
  'HACKATHON',
  'SCHOLARSHIP',
  'GRANT',
  'COMPETITION',
  'WORKSHOP',
];

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create Modal & Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [type, setType] = useState<'HACKATHON' | 'SCHOLARSHIP' | 'GRANT' | 'COMPETITION' | 'WORKSHOP'>('HACKATHON');
  const [category, setCategory] = useState('STEM & Innovation');
  const [description, setDescription] = useState('');
  const [prizePool, setPrizePool] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [applyUrl, setApplyUrl] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<'ACTIVE' | 'EXPIRED' | 'UPCOMING'>('ACTIVE');
  const [submitting, setSubmitting] = useState(false);

  // Edit State
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);

  // Delete State
  const [itemToDelete, setItemToDelete] = useState<Opportunity | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchOpportunities = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await opportunitiesApi.getOpportunities();
      if (res && res.success) {
        setOpportunities(res.data.items || []);
      } else {
        setErrorMsg('Failed to load opportunities from backend.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to connect to opportunities service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const resetForm = () => {
    setTitle('');
    setOrganizationName('');
    setType('HACKATHON');
    setCategory('STEM & Innovation');
    setDescription('');
    setPrizePool('');
    setEligibility('');
    setBannerUrl('');
    setApplyUrl('');
    setDeadline('');
    setIsFeatured(false);
    setStatus('ACTIVE');
    setEditingOpportunity(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (opp: Opportunity) => {
    setEditingOpportunity(opp);
    setTitle(opp.title);
    setOrganizationName(opp.organizationName);
    setType(opp.type);
    setCategory(opp.category || 'General');
    setDescription(opp.description);
    setPrizePool(opp.prizePool || '');
    setEligibility(opp.eligibility || '');
    setBannerUrl(opp.bannerUrl || '');
    setApplyUrl(opp.applyUrl);
    setDeadline(opp.deadline ? opp.deadline.slice(0, 16) : '');
    setIsFeatured(opp.isFeatured || false);
    setStatus(opp.status);
    setShowAddModal(true);
  };

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !organizationName.trim() || !description.trim() || !applyUrl.trim() || !deadline) {
      alert('Please fill in Title, Organization, Description, Apply URL, and Deadline.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        organizationName: organizationName.trim(),
        type,
        category: category.trim(),
        description: description.trim(),
        prizePool: prizePool.trim() || undefined,
        eligibility: eligibility.trim() || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
        applyUrl: applyUrl.trim(),
        deadline: new Date(deadline).toISOString(),
        isFeatured,
        status,
      };

      if (editingOpportunity) {
        const res = await opportunitiesApi.updateOpportunity(editingOpportunity.id, payload);
        if (res && res.success) {
          showNotification('Opportunity updated successfully! Changes reflect on mobile apps immediately.');
          setShowAddModal(false);
          resetForm();
          fetchOpportunities();
        } else {
          alert('Failed to update opportunity. Check backend logs.');
        }
      } else {
        const res = await opportunitiesApi.createOpportunity(payload);
        if (res && res.success) {
          showNotification('New Opportunity posted successfully! It is now live on the student mobile app.');
          setShowAddModal(false);
          resetForm();
          fetchOpportunities();
        } else {
          alert('Failed to create opportunity. Ensure you have admin privileges.');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred while saving opportunity.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      const res = await opportunitiesApi.deleteOpportunity(itemToDelete.id);
      if (res && res.success) {
        showNotification(`Opportunity "${itemToDelete.title}" removed successfully.`);
        setItemToDelete(null);
        fetchOpportunities();
      } else {
        alert('Failed to delete opportunity.');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting opportunity.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered List
  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch =
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opp.category && opp.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (opp.description && opp.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || opp.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || opp.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeBadgeColor = (t: string) => {
    switch (t) {
      case 'HACKATHON':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'SCHOLARSHIP':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'GRANT':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'COMPETITION':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'WORKSHOP':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const activeCount = opportunities.filter((o) => o.status === 'ACTIVE').length;
  const hackathonsCount = opportunities.filter((o) => o.type === 'HACKATHON').length;
  const scholarshipsCount = opportunities.filter((o) => o.type === 'SCHOLARSHIP').length;

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-8 space-y-6">
          {/* Toast Notification */}
          {toastMsg && (
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-slide-up">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-sm font-medium">{toastMsg}</p>
            </div>
          )}

          {/* Top Banner / Title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                  <Trophy className="w-5 h-5" />
                </span>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Opportunities Hub</h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Mobile Synced
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Curate national hackathons, grants, scholarships, and prestigious competitions for Topper Mantra students.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchOpportunities}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                title="Refresh from server"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition shadow-xs shadow-orange-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Post Opportunity
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Listings</p>
                <Award className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{opportunities.length}</p>
              <p className="text-xs text-slate-500 mt-1">Syncing to student mobile explore feed</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Competitions</p>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-2">{activeCount}</p>
              <p className="text-xs text-slate-500 mt-1">Accepting applications right now</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Hackathons</p>
                <Trophy className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-purple-600 mt-2">{hackathonsCount}</p>
              <p className="text-xs text-slate-500 mt-1">Coding & Innovation contests</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Scholarships & Grants</p>
                <GraduationCap className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-600 mt-2">{scholarshipsCount}</p>
              <p className="text-xs text-slate-500 mt-1">Financial aid & research grants</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by title, organizer, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-stretch md:self-auto overflow-x-auto">
                {['ALL', 'ACTIVE', 'UPCOMING', 'EXPIRED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg transition capitalize cursor-pointer whitespace-nowrap ${
                      statusFilter === st ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Type:</span>
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`px-3 py-1 text-xs font-semibold rounded-full border transition cursor-pointer shrink-0 ${
                  typeFilter === 'ALL'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                All Types
              </button>
              {OPPORTUNITY_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border transition cursor-pointer shrink-0 ${
                    typeFilter === t
                      ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}

          {/* Cards Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-orange-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-600">Loading opportunities...</p>
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No opportunities found</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4">
                {searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'No results match your current filters. Try changing or clearing them.'
                  : 'Start by posting your first national contest, hackathon, or scholarship.'}
              </p>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Post Opportunity
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOpportunities.map((opp) => {
                const deadlineFormatted = opp.deadline
                  ? new Date(opp.deadline).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Open';

                return (
                  <div
                    key={opp.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group"
                  >
                    {/* Banner Image */}
                    <div className="relative h-44 bg-slate-100 overflow-hidden">
                      {opp.bannerUrl ? (
                        <img
                          src={opp.bannerUrl}
                          alt={opp.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-500">
                          <Trophy className="w-10 h-10 text-orange-400/50 mb-1" />
                          <span className="text-xs font-semibold text-slate-400">Topper Mantra Hub</span>
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs bg-white/95 backdrop-blur-xs ${getTypeBadgeColor(
                            opp.type
                          )}`}
                        >
                          {opp.type}
                        </span>
                        {opp.isFeatured && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Featured
                          </span>
                        )}
                      </div>

                      <div className="absolute top-3 right-3">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs backdrop-blur-xs ${
                            opp.status === 'ACTIVE'
                              ? 'bg-emerald-500 text-white border-emerald-400'
                              : opp.status === 'UPCOMING'
                              ? 'bg-blue-500 text-white border-blue-400'
                              : 'bg-slate-600 text-white border-slate-500'
                          }`}
                        >
                          {opp.status}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        {/* Organization & Category */}
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{opp.organizationName}</span>
                          {opp.category && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-orange-600 font-semibold lowercase first-letter:uppercase truncate">
                                {opp.category}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                          {opp.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                          {opp.description}
                        </p>
                      </div>

                      {/* Details Box: Prize & Eligibility & Deadline */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 text-xs">
                        {opp.prizePool && (
                          <div className="flex items-center justify-between text-slate-700">
                            <span className="text-slate-500 font-medium flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Reward / Prize:
                            </span>
                            <span className="font-bold text-emerald-700 truncate max-w-[170px]">{opp.prizePool}</span>
                          </div>
                        )}

                        {opp.eligibility && (
                          <div className="flex items-center justify-between text-slate-700">
                            <span className="text-slate-500 font-medium flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-blue-500" /> Eligibility:
                            </span>
                            <span className="font-semibold text-slate-800 truncate max-w-[170px]">{opp.eligibility}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-slate-200/60">
                          <span className="text-slate-500 font-medium flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-orange-500" /> Deadline:
                          </span>
                          <span className="font-bold text-slate-900">{deadlineFormatted}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <a
                          href={opp.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-2 rounded-xl transition cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Apply Link
                        </a>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(opp)}
                            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                            title="Edit opportunity"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setItemToDelete(opp)}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Delete opportunity"
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
        </main>
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-orange-50 text-orange-600">
                  <Trophy className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingOpportunity ? 'Edit Opportunity' : 'Post New Opportunity'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Syncs to Topper Mantra student mobile app explore feed immediately.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600 p-2 text-xl font-bold cursor-pointer leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Opportunity Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart India Hackathon 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Organizer / Institution *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ministry of Education & AICTE"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  >
                    {OPPORTUNITY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Software & AI, Science, Robotics"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Application Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Prize / Grants / Perks
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹1,00,000 Cash Prize + Direct Mentorship"
                    value={prizePool}
                    onChange={(e) => setPrizePool(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Eligibility
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Class 9-12 & College Undergrads"
                    value={eligibility}
                    onChange={(e) => setEligibility(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Official Apply URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://sih.gov.in"
                  value={applyUrl}
                  onChange={(e) => setApplyUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Banner Image URL (Unsplash or CDN)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                  {bannerUrl && (
                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                      <img src={bannerUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Description & Details *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain eligibility, evaluation criteria, rounds, and what makes this opportunity special for students..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Listing Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="EXPIRED">EXPIRED</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-4 sm:pt-0">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded-md focus:ring-orange-500"
                  />
                  <label htmlFor="isFeatured" className="text-sm font-semibold text-slate-800 cursor-pointer">
                    Feature on Student Home Carousel
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition shadow-xs shadow-orange-600/20 cursor-pointer disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingOpportunity ? 'Save Changes' : 'Publish Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Delete Opportunity?</h3>
            <p className="text-sm text-slate-500 mt-1">
              Are you sure you want to remove <span className="font-semibold text-slate-800">"{itemToDelete.title}"</span>?
              It will be permanently removed from the mobile app opportunities directory.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setItemToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
