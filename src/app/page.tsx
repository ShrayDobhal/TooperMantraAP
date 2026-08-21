'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ShieldCheck, Phone, KeyRound, ArrowRight, AlertCircle, CheckCircle2, UserCheck, GraduationCap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'MENTOR'>('ADMIN');
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
      setInfo(`Verification code sent to ${phone}`);
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
        const user = res.data.user || {};
        const userRole = user.role || 'ADMIN';

        // Mentor role enforcement check against backend database
        if (selectedRole === 'MENTOR' && userRole === 'STUDENT') {
          setError(`Access Denied: Mobile number ${phone} is registered as a Student. Only verified Mentors can log in here.`);
          setLoading(false);
          return;
        }

        const effectiveRole = selectedRole === 'MENTOR' ? 'MENTOR' : 'ADMIN';
        localStorage.setItem('tm_token', res.data.tokens.accessToken);
        localStorage.setItem('tm_user', JSON.stringify({ ...user, role: effectiveRole }));
        localStorage.setItem('tm_role', effectiveRole);

        if (effectiveRole === 'MENTOR') {
          router.push('/doubts');
        } else {
          router.push('/dashboard');
        }
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl p-8 border border-slate-200 shadow-2xs">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-3 shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-orange-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase">TOPPER MANTRA SIGN IN</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Select your portal role to authenticate</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('ADMIN');
              setError('');
            }}
            className={`py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-all ${
              selectedRole === 'ADMIN'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-orange-600" />
            Admin
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedRole('MENTOR');
              setError('');
            }}
            className={`py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-all ${
              selectedRole === 'MENTOR'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-orange-600" />
            Mentor
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-rose-50 border border-rose-200/80 rounded-lg text-rose-700 text-xs font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="mb-5 p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{info}</span>
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {selectedRole === 'ADMIN' ? 'Admin Mobile Number' : 'Mentor Mobile Number'}
              </label>
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus-within:border-slate-400 focus-within:bg-white transition-all">
                <Phone className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className="bg-transparent text-slate-900 font-semibold focus:outline-none w-full text-sm placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg text-sm shadow-2xs flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {loading ? 'Sending OTP...' : `Sign In as ${selectedRole === 'ADMIN' ? 'Admin' : 'Mentor'}`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                6-Digit Verification OTP
              </label>
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus-within:border-slate-400 focus-within:bg-white transition-all">
                <KeyRound className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="bg-transparent text-slate-900 font-mono font-bold text-base tracking-widest focus:outline-none w-full placeholder:text-slate-300"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg text-sm shadow-2xs flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {loading ? 'Verifying Credentials...' : `Enter ${selectedRole === 'ADMIN' ? 'Admin Portal' : 'Mentor Workspace'}`}
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors pt-1"
            >
              ← Change Mobile Number
            </button>
          </form>
        )}

        <div className="mt-8 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 font-medium">Topper Mantra Security Verified © 2026</p>
        </div>
      </div>
    </div>
  );
}
