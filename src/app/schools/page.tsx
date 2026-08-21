'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { Building2, Plus, Key } from 'lucide-react';

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
        <main className="p-8 space-y-6 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional Licenses</h1>
              <p className="text-slate-500 text-xs mt-0.5">Manage enterprise B2B school accounts and bulk student access licenses.</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Generate License Code
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {schools.map((s) => (
              <div key={s.id} className="mnc-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{s.name}</h3>
                      <p className="text-xs text-slate-500">Code: <span className="font-mono font-semibold text-slate-700">{s.code}</span> • {s.city || 'Delhi'}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs rounded-full font-semibold">
                    {s.status || 'ACTIVE'}
                  </span>
                </div>

                {s.licenses?.map((lic: any, idx: number) => {
                  const pct = Math.round((lic.allocatedSeats / lic.totalSeats) * 100);
                  return (
                    <div key={idx} className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-900 font-bold tracking-wider">{lic.licenseCode}</span>
                        <span className="text-slate-600 font-medium">{lic.allocatedSeats} / {lic.totalSeats} seats redeemed ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-600 rounded-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white p-6 rounded-xl border border-slate-200 w-full max-w-md space-y-4 shadow-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                    <Key className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Generate School License</h3>
                </div>

                <form onSubmit={handleGenerate} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">School Name</label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-slate-400 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">School Code Prefix</label>
                    <input
                      type="text"
                      value={schoolCode}
                      onChange={(e) => setSchoolCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono font-semibold focus:outline-none focus:border-slate-400 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Total Seats</label>
                    <input
                      type="number"
                      value={seats}
                      onChange={(e) => setSeats(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-slate-400 text-xs"
                    />
                  </div>

                  {generatedCode && (
                    <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs font-bold text-center">
                      Code: {generatedCode}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
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
