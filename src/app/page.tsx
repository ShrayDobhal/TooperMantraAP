'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ShieldCheck, Phone, KeyRound, ArrowRight, Sparkles } from 'lucide-react';

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
      setInfo('Fresh OTP dispatched to your mobile number via RapidSMS!');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
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
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code. Please check your SMS.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-card p-8 relative z-10 shadow-2xl border border-slate-800">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-xl shadow-cyan-500/20 mx-auto mb-4">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">TOPPER MANTRA</h1>
          <p className="text-sm text-cyan-400 font-semibold mt-1">Admin & Mentor Control Center</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        {info && (
          <div className="mb-6 p-3.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-300 text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            {info}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Mobile Number
              </label>
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 focus-within:border-cyan-500 transition-colors">
                <Phone className="w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className="bg-transparent text-white font-medium focus:outline-none w-full text-base"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? 'Sending OTP...' : 'Send Login OTP'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                6-Digit SMS Verification Code
              </label>
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 focus-within:border-cyan-500 transition-colors">
                <KeyRound className="w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="bg-transparent text-white font-mono text-lg tracking-widest focus:outline-none w-full"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? 'Verifying...' : 'Verify & Enter Dashboard'}
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full text-xs text-slate-400 hover:text-white transition-colors"
            >
              ← Change Mobile Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
