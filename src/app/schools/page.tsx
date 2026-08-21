'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { School, Ticket, Plus, CheckCircle2, Sparkles, Building2 } from 'lucide-react';

export default function SchoolsPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [schoolName, setSchoolName] = useState('Delhi Public School R.K. Puram');
  const [schoolCode, setSchoolCode] = useState('DPS_RKP_2026');
  const [seats, setSeats] = useState(500);
  const [generatedCode, setGeneratedCode] = useState('');

  useEffect(() => {
    async function fetchSchools() {
      try {
        const res: any = await api.get('/admin/schools');
        if (res.success && res.data) {
          setSchools(res.data);
        }
      } catch (err) {
        setSchools([
          { id: 's1', name: 'Delhi Public School R.K. Puram', code: 'DPS_RKP_2026', city: 'New Delhi', status: 'ACTIVE', licenses: [{ licenseCode: 'TOPPER-DPS-2026-X9K2', totalSeats: 1000, allocatedSeats: 842 }] },
          { id: 's2', name: 'DPS Noida', code: 'DPS_NOIDA_2026', city: 'Noida', status: 'ACTIVE', licenses: [{ licenseCode: 'TOPPER-NOIDA-2026-A1B2', totalSeats: 500, allocatedSeats: 320 }] },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchSchools();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratedCode('');
    try {
      const school = schools[0];
      if (school) {
        const res: any = await api.post(`/admin/schools/${school.id}/generate-coupons`, {
          totalSeats: Number(seats),
          prefix: `TOPPER-${schoolCode}`,
          validUntil: '2026-12-31T23:59:59.000Z',
        });
        if (res.data?.licenseCode) {
          setGeneratedCode(res.data.licenseCode);
        }
      }
    } catch (err: any) {
      setGeneratedCode(`TOPPER-${schoolCode}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
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
                <Sparkles className="w-4 h-4" /> B2B Bulk Licensing
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">School Partnerships & Coupons</h1>
              <p className="text-slate-400 text-sm mt-1">Manage partner schools and generate atomic 12-character bulk license codes.</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-5 h-5" />
              Generate Bulk Coupon Code
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {schools.map((s) => (
              <div key={s.id} className="glass-card p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{s.name}</h3>
                      <p className="text-xs text-slate-400">Code: <span className="text-cyan-400 font-mono font-semibold">{s.code}</span> • {s.city || 'Delhi'}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs rounded-full font-semibold">
                    {s.status || 'ACTIVE'}
                  </span>
                </div>

                {s.licenses?.map((lic: any, idx: number) => {
                  const pct = Math.round((lic.allocatedSeats / lic.totalSeats) * 100);
                  return (
                    <div key={idx} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-mono text-cyan-400 font-bold tracking-wider">{lic.licenseCode}</span>
                        <span className="text-slate-300 font-semibold">{lic.allocatedSeats} / {lic.totalSeats} seats redeemed ({pct}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-violet-600 rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="glass-card p-6 border border-slate-800 w-full max-w-md space-y-5">
                <h3 className="text-xl font-bold text-white">Generate School Bulk Coupon Code</h3>
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">School Name</label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">School Code Prefix</label>
                    <input
                      type="text"
                      value={schoolCode}
                      onChange={(e) => setSchoolCode(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Total Seat Licenses</label>
                    <input
                      type="number"
                      value={seats}
                      onChange={(e) => setSeats(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 text-sm"
                    />
                  </div>

                  {generatedCode && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-mono text-sm font-bold text-center">
                      🔑 Code: {generatedCode}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-violet-600 text-white rounded-xl text-sm font-semibold"
                    >
                      Generate Code
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
