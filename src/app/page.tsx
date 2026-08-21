'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ShieldCheck, Phone, KeyRound, ArrowRight, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('9560722002');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');

    try {
      await api.post('/auth/send-otp', { phone });
      setStep('otp');
      setInfo('Fresh OTP dispatched to your mobile number!');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please check connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res: any = await api.post('/auth/verify-otp', { phone, otp });
      if (res.success && res.data?.tokens?.accessToken) {
        localStorage.setItem('tm_token', res.data.tokens.accessToken);
        localStorage.setItem('tm_user', JSON.stringify(res.data.user));
        router.push('/dashboard');
      } else {
        setError(res.error?.message || 'Invalid verification response from server.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code. Please check your SMS.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white rounded-3xl p-8 relative z-10 shadow-xl shadow-orange-950/5 border border-slate-200/80">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-orange-500/25 mx-auto mb-4">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">TOPPER MANTRA</h1>
          <p className="text-xs text-orange-600 font-bold uppercase tracking-wider mt-1">Admin & Mentor Control Center</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-medium flex items-start gap-3 shadow-sm animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-2xl text-orange-800 text-sm font-medium flex items-center gap-3 shadow-sm animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
            <span>{info}</span>
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Mobile Number
              </label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 transition-all">
                <Phone className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className="bg-transparent text-slate-900 font-semibold focus:outline-none w-full text-base placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-70 text-base"
            >
              {loading ? 'Sending OTP...' : 'Send Login OTP'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                6-Digit Verification Code
              </label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 transition-all">
                <KeyRound className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="bg-transparent text-slate-900 font-mono font-bold text-xl tracking-widest focus:outline-none w-full placeholder:text-slate-300"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-70 text-base"
            >
              {loading ? 'Verifying...' : 'Verify & Enter Dashboard'}
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors py-1"
            >
              ← Change Mobile Number
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-medium">Topper Mantra Platform © 2026</p>
        </div>
      </div>
    </div>
  );
}
