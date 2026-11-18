'use client';
import React, { useEffect, useState } from 'react';
import { KeyRound, Trash2, UserPlus } from 'lucide-react';
import { mentorAccessApi, type Mentor, type MentorAccess } from '@/api/mentors';
import { Alert, Badge, Button, Card, CardHeader, EmptyState, Field, Input, Modal, Select, Skeleton } from '@/components/ui';
import { fmtRelative } from '@/lib/format';

/**
 * Who can sign in to this panel as a mentor. A mentor signs in with phone OTP; the number must be given access here,
 * and linked to their Mentors-directory profile so they can claim and answer doubts.
 */
export function MentorAccessCard({ mentors }: { mentors: Mentor[] }) {
  const [items, setItems] = useState<MentorAccess[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [mentorId, setMentorId] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [removing, setRemoving] = useState<MentorAccess | null>(null);
  const [busyRemove, setBusyRemove] = useState(false);

  const load = async () => {
    setError(null);
    try {
      setItems(await mentorAccessApi.list());
    } catch (e: any) {
      setError(e?.message || 'Could not load mentor logins.');
      setItems([]);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const linkedIds = new Set((items || []).map((i) => i.mentor?.id).filter(Boolean) as string[]);
  const digits = phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  const phoneOk = /^[6-9]\d{9}$/.test(digits);

  const grant = async () => {
    if (!phoneOk) return;
    setSaving(true);
    setFormError(null);
    try {
      const r = await mentorAccessApi.grant(digits, mentorId || undefined);
      setNotice(`+91 ${digits} can now sign in as a mentor${r?.mentor ? ` (${r.mentor.name})` : ''}.`);
      setOpen(false);
      setPhone('');
      setMentorId('');
      await load();
    } catch (e: any) {
      setFormError(e?.message || 'Could not give access.');
    } finally {
      setSaving(false);
    }
  };

  const revoke = async () => {
    if (!removing) return;
    setBusyRemove(true);
    try {
      await mentorAccessApi.revoke(removing.userId);
      setNotice(`${removing.phone} can no longer sign in as a mentor.`);
      setRemoving(null);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Could not remove access.');
    } finally {
      setBusyRemove(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Mentor logins"
        description="Phone numbers that can sign in to this panel as a mentor (Mentor tab, OTP). Link each to a profile so they can answer doubts."
        actions={
          <Button size="sm" variant="primary" icon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => setOpen(true)}>
            Give access
          </Button>
        }
      />
      {notice && (
        <Alert tone="success" className="mx-5 mt-4">
          {notice}
        </Alert>
      )}
      {error && (
        <Alert tone="error" className="mx-5 mt-4">
          {error}
        </Alert>
      )}
      {items === null ? (
        <div className="space-y-2 p-5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<KeyRound className="h-5 w-5" />}
          title="No mentor logins yet"
          description="Give a mentor's mobile number access, then they sign in on the Mentor tab with an OTP."
        />
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((m) => (
            <li key={m.userId} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{m.name || 'Not linked to a profile'}</p>
                <p className="text-xs text-slate-500">
                  {m.phone} · {m.lastLoginAt ? `last signed in ${fmtRelative(m.lastLoginAt)}` : 'never signed in'}
                </p>
              </div>
              {m.mentor ? (
                <Badge tone="success">Linked: {m.mentor.designation || m.mentor.name}</Badge>
              ) : (
                <Badge tone="warning">No profile: can&apos;t answer doubts</Badge>
              )}
              <Button size="sm" variant="danger" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setRemoving(m)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        onClose={saving ? () => undefined : () => setOpen(false)}
        title="Give mentor access"
        description="They sign in on the panel's Mentor tab with this number and an SMS OTP."
        footer={
          <>
            <Button onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={grant} loading={saving} disabled={!phoneOk}>
              Give access
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <Alert tone="error">{formError}</Alert>}
          <Field label="Mobile number" required error={phone && !phoneOk ? 'Enter a 10-digit Indian mobile number' : null}>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">+91</span>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" placeholder="98765 43210" autoFocus />
            </div>
          </Field>
          <Field label="Mentor profile" hint="Needed to claim and answer doubts. Pick the mentor this number belongs to.">
            <Select value={mentorId} onChange={(e) => setMentorId(e.target.value)}>
              <option value="">Don&apos;t link yet</option>
              {mentors.map((m) => (
                <option key={m.id} value={m.id} disabled={linkedIds.has(m.id)}>
                  {m.name}
                  {m.designation ? ` · ${m.designation}` : ''}
                  {linkedIds.has(m.id) ? ' (already linked)' : ''}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!removing}
        onClose={busyRemove ? () => undefined : () => setRemoving(null)}
        title="Remove mentor access?"
        size="sm"
        footer={
          <>
            <Button onClick={() => setRemoving(null)} disabled={busyRemove}>
              Cancel
            </Button>
            <Button variant="danger" onClick={revoke} loading={busyRemove}>
              Remove access
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          {removing?.phone} won&apos;t be able to sign in to the panel any more. Their account stays as a normal student account, and
          doubts they already answered are kept.
        </p>
      </Modal>
    </Card>
  );
}
