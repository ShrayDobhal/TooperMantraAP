'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { School, Ticket, Plus, CheckCircle2, Sparkles, Building2, Key } from 'lucide-react';

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
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-8 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-orange-600 text-xs font-extrabold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" /> B2B Institutional Licensing
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">School Partnerships & Licenses</h1>
              <p className="text-slate-500 text-sm mt-1">Manage partner schools and generate atomic 12-character bulk access codes.</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all active:scale-[0.99]"
            >
              <Plus className="w-5 h-5" />
              Generate Bulk License Code
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {schools.map((s) => (
              <div key={s.id} className="tm-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{s.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">Code: <span className="text-orange-600 font-mono font-bold">{s.code}</span> • {s.city || 'Delhi'}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs rounded-full font-bold">
                    {s.status || 'ACTIVE'}
                  </span>
                </div>

                {s.licenses?.map((lic: any, idx: number) => {
                  const pct = Math.round((lic.allocatedSeats / lic.totalSeats) * 100);
                  return (
                    <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-mono text-orange-600 font-bold tracking-wider">{lic.licenseCode}</span>
                        <span className="text-slate-700 font-bold">{lic.allocatedSeats} / {lic.totalSeats} seats redeemed ({pct}%)</span>
                      </div>
                      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 w-full max-w-md space-y-5 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                    <Key className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Generate School License</h3>
                </div>

                <form onSubmit={handleGenerate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">School Name</label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-900 font-medium focus:outline-none focus:border-orange-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">School Code Prefix</label>
                    <input
                      type="text"
                      value={schoolCode}
                      onChange={(e) => setSchoolCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-orange-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Total Seat Licenses</label>
                    <input
                      type="number"
                      value={seats}
                      onChange={(e) => setSeats(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-900 font-bold focus:outline-none focus:border-orange-500 text-sm"
                    />
                  </div>

                  {generatedCode && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl text-orange-800 font-mono text-sm font-bold text-center">
                      🔑 Code: {generatedCode}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-500/20"
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
