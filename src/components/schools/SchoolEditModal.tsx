'use client';
import React, { useEffect, useState } from 'react';
import { schoolsApi, type School, type SchoolBranding, type UpdateSchoolPayload } from '@/api/schools';
import { FileUploader } from '@/components/FileUploader';
import { Alert, Button, Field, Input, Modal, Select } from '@/components/ui';

type Editable = Pick<School, 'id' | 'name' | 'code' | 'city' | 'state' | 'contactEmail' | 'contactPhone' | 'status' | 'totalSeats'> & {
  branding?: SchoolBranding | null;
};

const HEX = /^#[0-9a-fA-F]{6}$/;
const CODE = /^[A-Za-z0-9_-]{2,40}$/;

/** Edit a school's name, code, location, contacts, status and app branding. Only changed fields are sent. */
export function SchoolEditModal({
  school,
  open,
  onClose,
  onSaved,
}: {
  school: Editable | null;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: School) => void;
}) {
  const [form, setForm] = useState({
    name: '',
    code: '',
    city: '',
    state: '',
    contactEmail: '',
    contactPhone: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
    appTitle: '',
    primaryColor: '',
    accentColor: '',
    logoUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!school || !open) return;
    const b = school.branding || {};
    setForm({
      name: school.name || '',
      code: school.code || '',
      city: school.city || '',
      state: school.state || '',
      contactEmail: school.contactEmail || '',
      contactPhone: school.contactPhone || '',
      status: (school.status as any) || 'ACTIVE',
      appTitle: b.appTitle || '',
      primaryColor: b.primaryColor || '',
      accentColor: b.accentColor || '',
      logoUrl: b.logoUrl || '',
    });
    setError(null);
  }, [school, open]);

  if (!school) return null;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const codeChanged = form.code.trim().toUpperCase() !== school.code.toUpperCase();
  const nameError = form.name.trim().length < 2 ? 'Enter the school name' : null;
  const codeError = !CODE.test(form.code.trim()) ? 'Letters, numbers, _ and - only (2–40 characters)' : null;
  const primaryError = form.primaryColor && !HEX.test(form.primaryColor) ? 'Use a hex colour like #0A58CA' : null;
  const accentError = form.accentColor && !HEX.test(form.accentColor) ? 'Use a hex colour like #FFD700' : null;
  const invalid = !!(nameError || codeError || primaryError || accentError);

  const save = async () => {
    if (invalid) return;
    setSaving(true);
    setError(null);
    try {
      const b = school.branding || {};
      const payload: UpdateSchoolPayload = {};
      const diff = <K extends keyof UpdateSchoolPayload>(k: K, next: UpdateSchoolPayload[K], prev: unknown) => {
        if ((next ?? '') !== (prev ?? '')) payload[k] = next;
      };
      diff('name', form.name.trim(), school.name);
      if (codeChanged) payload.code = form.code.trim().toUpperCase();
      diff('city', form.city.trim(), school.city || '');
      diff('state', form.state.trim(), school.state || '');
      diff('contactEmail', form.contactEmail.trim(), school.contactEmail || '');
      diff('contactPhone', form.contactPhone.trim(), school.contactPhone || '');
      diff('status', form.status, school.status);
      const branding: SchoolBranding = {};
      if (form.appTitle.trim() !== (b.appTitle || '')) branding.appTitle = form.appTitle.trim();
      if (form.primaryColor.trim() !== (b.primaryColor || '') && form.primaryColor.trim()) branding.primaryColor = form.primaryColor.trim();
      if (form.accentColor.trim() !== (b.accentColor || '') && form.accentColor.trim()) branding.accentColor = form.accentColor.trim();
      if (form.logoUrl.trim() !== (b.logoUrl || '')) branding.logoUrl = form.logoUrl.trim();
      if (Object.keys(branding).length) payload.branding = branding;

      if (!Object.keys(payload).length) {
        onClose();
        return;
      }
      const updated = await schoolsApi.updateSchool(school.id, payload);
      onSaved(updated);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Could not save the school.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? () => undefined : onClose}
      title="Edit school"
      description={`${school.name} · ${school.code}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} loading={saving} disabled={invalid || uploading}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}

        <section className="grid gap-4 sm:grid-cols-2">
          <Field label="School name" required error={nameError} className="sm:col-span-2">
            <Input value={form.name} onChange={set('name')} maxLength={160} />
          </Field>
          <Field
            label="School code"
            required
            error={codeError}
            hint={codeChanged ? undefined : 'The code the school app is built with (SCHOOL_CODE).'}
          >
            <Input value={form.code} onChange={set('code')} className="font-mono uppercase" maxLength={40} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={set('status')}>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive (hidden, codes stop working)</option>
            </Select>
          </Field>
          {codeChanged && (
            <Alert tone="warning" className="sm:col-span-2">
              Changing the code breaks any school app already built with <span className="font-mono">{school.code}</span>: it
              will stop showing this school&apos;s branding. Only change it before the app is published, or ship an app update
              with the new code. Student license codes are not affected.
            </Alert>
          )}
          <Field label="City">
            <Input value={form.city} onChange={set('city')} maxLength={80} />
          </Field>
          <Field label="State">
            <Input value={form.state} onChange={set('state')} maxLength={80} />
          </Field>
          <Field label="Contact email">
            <Input type="email" value={form.contactEmail} onChange={set('contactEmail')} maxLength={160} />
          </Field>
          <Field label="Contact phone">
            <Input value={form.contactPhone} onChange={set('contactPhone')} maxLength={20} />
          </Field>
        </section>

        <section className="space-y-4 border-t border-slate-100 pt-4">
          <div>
            <h3 className="text-sm font-medium text-slate-900">School app branding</h3>
            <p className="text-xs text-slate-500">Shown in the school&apos;s own app (from /tenant/bootstrap) right after it opens.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="App title" className="sm:col-span-2">
              <Input value={form.appTitle} onChange={set('appTitle')} maxLength={120} placeholder={`${form.name} Learning`} />
            </Field>
            <Field label="Primary colour" error={primaryError}>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Pick primary colour"
                  value={HEX.test(form.primaryColor) ? form.primaryColor : '#0A58CA'}
                  onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value.toUpperCase() }))}
                  className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-slate-200 bg-white p-1"
                />
                <Input value={form.primaryColor} onChange={set('primaryColor')} placeholder="#0A58CA" className="font-mono" />
              </div>
            </Field>
            <Field label="Accent colour" error={accentError}>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Pick accent colour"
                  value={HEX.test(form.accentColor) ? form.accentColor : '#FFD700'}
                  onChange={(e) => setForm((f) => ({ ...f, accentColor: e.target.value.toUpperCase() }))}
                  className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-slate-200 bg-white p-1"
                />
                <Input value={form.accentColor} onChange={set('accentColor')} placeholder="#FFD700" className="font-mono" />
              </div>
            </Field>
          </div>
          <FileUploader
            label="Logo"
            folder="images"
            kind="image"
            value={form.logoUrl || null}
            onChange={(url) => setForm((f) => ({ ...f, logoUrl: url || '' }))}
            onUploadingChange={setUploading}
            maxImageSize={{ width: 512, height: 512 }}
            hint="Square PNG or JPG works best."
          />
        </section>
      </div>
    </Modal>
  );
}
