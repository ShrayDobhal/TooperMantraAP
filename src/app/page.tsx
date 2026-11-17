'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminAuthApi, mentorAuthApi } from '@/api/adminAuth';
import { session } from '@/lib/session';
import { Alert, Button, Field, Input, Segmented } from '@/components/ui';

type Mode = 'ADMIN' | 'MENTOR';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('ADMIN');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Mentor
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const u = session.getUser();
    if (session.getToken() && u) router.replace(u.role === 'ADMIN' ? '/dashboard' : '/doubts');
  }, [router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
    setInfo('');
  };

  const adminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminAuthApi.login(email.trim().toLowerCase(), password);
      if (res.admin.role !== 'ADMIN') throw new Error('This account does not have admin access.');
      session.set(res.accessToken, { id: res.admin.id, name: res.admin.name || 'Admin', email: res.admin.email, role: 'ADMIN' });
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const cleanPhone = phone.replace(/\D/g, '').slice(-10);

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setInfo('');
    if (cleanPhone.length !== 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      const res = await mentorAuthApi.sendOtp(cleanPhone);
      setOtpSent(true);
      setCooldown(res?.resendCooldown || 60);
      setInfo(`OTP sent to +91 ${cleanPhone}.`);
    } catch (err: any) {
      setError(err?.message || 'Could not send the OTP.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await mentorAuthApi.verifyOtp(cleanPhone, otp.trim());
      if (res.role !== 'MENTOR' && res.role !== 'ADMIN') {
        throw new Error('This number is not registered as a mentor. Ask an admin to grant mentor access.');
      }
      session.set(res.token, res.user);
      router.replace(res.user.role === 'ADMIN' ? '/dashboard' : '/doubts');
    } catch (err: any) {
      setError(err?.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">TM</div>
          <div>
            <p className="text-base font-semibold text-slate-900">Topper Mantra</p>
            <p className="text-xs text-slate-500">Admin &amp; mentor console</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
          <h1 className="text-lg font-semibold text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === 'ADMIN' ? 'Use your admin email and password.' : 'Mentors sign in with their registered mobile number.'}
          </p>

          <Segmented
            className="mt-4 w-full [&>button]:flex-1"
            value={mode}
            onChange={switchMode}
            options={[
              { value: 'ADMIN', label: 'Admin' },
              { value: 'MENTOR', label: 'Mentor' },
            ]}
          />

          <div className="mt-5 space-y-4">
            {error && <Alert tone="error">{error}</Alert>}
            {info && !error && <Alert tone="success">{info}</Alert>}

            {mode === 'ADMIN' ? (
              <form onSubmit={adminLogin} className="space-y-4">
                <Field label="Email">
                  <Input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@toppermantra.com" />
                </Field>
                <Field label="Password">
                  <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </Field>
                <Button type="submit" variant="primary" className="w-full" loading={loading}>
                  Sign in
                </Button>
              </form>
            ) : !otpSent ? (
              <form onSubmit={sendOtp} className="space-y-4">
                <Field label="Mobile number">
                  <div className="flex">
                    <span className="inline-flex h-9 items-center rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">+91</span>
                    <Input
                      className="rounded-l-none"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98765 43210"
                    />
                  </div>
                </Field>
                <Button type="submit" variant="primary" className="w-full" loading={loading}>
                  Send OTP
                </Button>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="space-y-4">
                <Field label="6-digit OTP">
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="tracking-[0.4em]"
                  />
                </Field>
                <Button type="submit" variant="primary" className="w-full" loading={loading} disabled={otp.length !== 6}>
                  Verify &amp; sign in
                </Button>
                <div className="flex items-center justify-between text-xs">
                  <button type="button" className="text-slate-500 hover:text-slate-800" onClick={() => { setOtpSent(false); setOtp(''); setInfo(''); }}>
                    Change number
                  </button>
                  <button type="button" disabled={cooldown > 0 || loading} className="font-medium text-brand-600 disabled:text-slate-400" onClick={() => sendOtp()}>
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">Authorised staff only. Activity is logged.</p>
      </div>
    </div>
  );
}
