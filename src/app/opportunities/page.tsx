'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { opportunitiesApi, Opportunity, schoolsApi, School } from '@/api';
import { exportToCSV } from '@/lib/exportUtils';
import {
  Trophy,
  Award,
  Search,
  Plus,
  ExternalLink,
  Trash2,
  Edit3,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Sparkles,
  Download,
  School as SchoolIcon,
  Globe,
  Clock,
  CheckCircle,
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
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create & Edit Modal
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
  const [scope, setScope] = useState<'GLOBAL' | 'SCHOOL_RESTRICTED'>('GLOBAL');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit & Delete State
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Opportunity | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const [oppRes, schRes] = await Promise.all([
        opportunitiesApi.getOpportunities(),
        schoolsApi.getSchools().catch(() => ({ success: false, data: [] })),
      ]);
      if (oppRes.success) {
        setOpportunities(oppRes.data.items || []);
      }
      if (schRes.success) {
        setSchools(schRes.data || []);
      }
    } catch {
      // handled
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
    setScope('GLOBAL');
    setSelectedSchoolId('');
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
    setScope(opp.targetSchoolScope || 'GLOBAL');
    setSelectedSchoolId(opp.assignedSchoolIds?.[0] || '');
    setShowAddModal(true);
  };

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !organizationName.trim() || !description.trim() || !applyUrl.trim() || !deadline) {
      alert('Please fill in Title, Organization, Description, Apply URL, and Deadline.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
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
        targetSchoolScope: scope,
        assignedSchoolIds: scope === 'SCHOOL_RESTRICTED' && selectedSchoolId ? [selectedSchoolId] : [],
      };

      if (editingOpportunity) {
        await opportunitiesApi.updateOpportunity(editingOpportunity.id, payload);
        showNotification('Opportunity updated successfully! Changes reflect on mobile apps immediately.');
      } else {
        await opportunitiesApi.createOpportunity(payload);
        showNotification('New Opportunity posted successfully! It is now live on the student mobile app.');
      }
      setShowAddModal(false);
      resetForm();
      fetchOpportunities();
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
      await opportunitiesApi.deleteOpportunity(itemToDelete.id);
      showNotification(`Opportunity "${itemToDelete.title}" removed successfully.`);
      setItemToDelete(null);
      fetchOpportunities();
    } catch (err: any) {
      alert(err.message || 'Error deleting opportunity.');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(
      opportunities.map((o) => ({
        Title: o.title,
        Organization: o.organizationName,
        Type: o.type,
        Category: o.category,
        PrizePool: o.prizePool || 'N/A',
        Eligibility: o.eligibility || 'All Students',
        Deadline: o.deadline,
        Status: o.status,
        Scope: o.targetSchoolScope || 'GLOBAL',
        ApplyURL: o.applyUrl,
      })),
      'topper_mantra_opportunities'
    );
  };

  // Filtered List
  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch =
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opp.category && opp.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || opp.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || opp.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeBadgeColor = (t: string) => {
    switch (t) {
      case 'HACKATHON':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'SCHOLARSHIP':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'GRANT':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'COMPETITION':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'WORKSHOP':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="flex bg-zinc-950 min-h-screen text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-8 space-y-6">
          {/* Toast Notification */}
          {toastMsg && (
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-zinc-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-zinc-700 animate-slide-up">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-sm font-medium">{toastMsg}</p>
            </div>
          )}

          {/* Top Banner / Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80 shadow-xs backdrop-blur-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <Trophy className="w-5 h-5" />
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-white">Opportunities Hub</h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Mobile Synced
                </span>
              </div>
              <p className="text-sm text-zinc-400 mt-1">
                Curate national hackathons, grants, scholarships, and prestigious competitions for Topper Mantra students.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-zinc-300 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/80 rounded-xl transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>

              <button
                onClick={fetchOpportunities}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-zinc-300 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/80 rounded-xl transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition shadow-xs shadow-orange-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Post Opportunity
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 font-medium">Total Listed</p>
                <p className="text-2xl font-bold text-white mt-1">{opportunities.length}</p>
              </div>
              <Trophy className="w-6 h-6 text-orange-400/80" />
            </div>
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 font-medium">Active Deadlines</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  {opportunities.filter((o) => o.status === 'ACTIVE').length}
                </p>
              </div>
              <Clock className="w-6 h-6 text-emerald-400/80" />
            </div>
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 font-medium">Hackathons & Grants</p>
                <p className="text-2xl font-bold text-purple-400 mt-1">
                  {opportunities.filter((o) => o.type === 'HACKATHON' || o.type === 'GRANT').length}
                </p>
              </div>
              <Award className="w-6 h-6 text-purple-400/80" />
            </div>
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 font-medium">Institutional Scope</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">
                  {opportunities.filter((o) => o.targetSchoolScope === 'SCHOOL_RESTRICTED').length} Partner
                </p>
              </div>
              <SchoolIcon className="w-6 h-6 text-blue-400/80" />
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
            <div className="flex items-center gap-3 flex-1 min-w-[260px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search opportunities, organizers, or eligibility..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-orange-500/50"
              >
                <option value="ALL">All Categories</option>
                {OPPORTUNITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-orange-500/50"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="p-12 text-center text-zinc-500 text-sm">Loading opportunities directory...</div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="p-12 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800/80 space-y-2">
              <Trophy className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-sm font-semibold text-zinc-300">No opportunities match criteria</p>
              <p className="text-xs text-zinc-500">Post a new competition or reset the active filter queries.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 overflow-hidden flex flex-col justify-between hover:border-zinc-700/80 transition shadow-xs group"
                >
                  <div>
                    {/* Banner Image or Gradient Header */}
                    <div className="h-36 bg-zinc-950 relative overflow-hidden border-b border-zinc-800/80">
                      {opp.bannerUrl ? (
                        <img
                          src={opp.bannerUrl}
                          alt={opp.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-zinc-900 via-zinc-950 to-orange-950/20 flex items-center justify-center">
                          <Trophy className="w-12 h-12 text-zinc-800" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                      <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTypeBadgeColor(opp.type)}`}>
                          {opp.type}
                        </span>
                        {opp.isFeatured && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> Featured
                          </span>
                        )}
                      </div>

                      <div className="absolute top-3 right-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            opp.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : opp.status === 'UPCOMING'
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {opp.status}
                        </span>
                      </div>

                      <div className="absolute bottom-2.5 left-3 right-3">
                        <p className="text-xs text-orange-400 font-semibold truncate">{opp.organizationName}</p>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5 space-y-3">
                      <h3 className="font-bold text-sm text-white line-clamp-2 leading-snug group-hover:text-orange-400 transition-colors">
                        {opp.title}
                      </h3>
                      <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                        {opp.description}
                      </p>

                      <div className="pt-2 border-t border-zinc-800/80 space-y-1.5 text-[11px] text-zinc-400">
                        {opp.prizePool && (
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500">Prize Pool:</span>
                            <span className="font-bold text-emerald-400">{opp.prizePool}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Deadline:</span>
                          <span className="font-medium text-zinc-300 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-zinc-500" />
                            {new Date(opp.deadline).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Audience:</span>
                          <span className="font-medium text-zinc-300 flex items-center gap-1">
                            {opp.targetSchoolScope === 'SCHOOL_RESTRICTED' ? (
                              <span className="text-blue-400 flex items-center gap-1">
                                <SchoolIcon className="w-3 h-3" /> Partner Exclusive
                              </span>
                            ) : (
                              <span className="text-zinc-400 flex items-center gap-1">
                                <Globe className="w-3 h-3" /> All Students
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 bg-zinc-950/60 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <a
                      href={opp.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-semibold transition"
                    >
                      Apply Portal <ExternalLink className="w-3 h-3" />
                    </a>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(opp)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                        title="Edit Opportunity"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setItemToDelete(opp)}
                        className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                        title="Delete Opportunity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-orange-400" />
                {editingOpportunity ? 'Edit Opportunity' : 'Post New Opportunity'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Opportunity Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart India Hackathon 2026 Junior Edition"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Organizing Body *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ministry of Education"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/60"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500/60"
                  >
                    {OPPORTUNITY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Category / Domain</label>
                  <input
                    type="text"
                    placeholder="e.g. STEM, Aerospace, Coding"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/60"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Prize Pool / Grant</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹ 1,00,000 + Trophy"
                    value={prizePool}
                    onChange={(e) => setPrizePool(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Outline eligibility, problem statement, evaluation criteria..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Application URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={applyUrl}
                    onChange={(e) => setApplyUrl(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/60"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Deadline *</label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Banner Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Audience Scope</label>
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500/60"
                  >
                    <option value="GLOBAL">All Topper Mantra Students</option>
                    <option value="SCHOOL_RESTRICTED">Restricted to Specific Partner School</option>
                  </select>
                </div>
                {scope === 'SCHOOL_RESTRICTED' && (
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">Target School</label>
                    <select
                      value={selectedSchoolId}
                      onChange={(e) => setSelectedSchoolId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500/60"
                    >
                      <option value="">Select Partner School</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded-sm border-zinc-700 bg-zinc-950 text-orange-500 focus:ring-0"
                  />
                  <span className="text-zinc-300">Feature on App Home</span>
                </label>

                <div className="flex items-center gap-2">
                  <label className="text-zinc-400">Status:</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-white text-xs"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="EXPIRED">EXPIRED</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingOpportunity ? 'Update Opportunity' : 'Publish Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-white">Delete Opportunity?</h3>
            <p className="text-xs text-zinc-400">
              Are you sure you want to remove <span className="text-white font-semibold">{itemToDelete.title}</span>?
              Students will no longer see this in their opportunities list.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
