'use client';
import React, { useEffect, useState } from 'react';
import { schoolsApi, type SchoolDeleteResult } from '@/api/schools';
import { Alert, Button, Field, Input, Modal } from '@/components/ui';

/**
 * Permanently deletes a school. The admin must type the school code. Students are never deleted:
 * they are unlinked from the school and keep their accounts and any Pro pass they already have.
 */
export function SchoolDeleteModal({
  school,
  studentCount,
  open,
  onClose,
  onDeleted,
}: {
  school: { id: string; name: string; code: string } | null;
  studentCount?: number;
  open: boolean;
  onClose: () => void;
  onDeleted: (result: SchoolDeleteResult) => void;
}) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTyped('');
      setError(null);
    }
  }, [open]);

  if (!school) return null;
  const matches = typed.trim().toUpperCase() === school.code.toUpperCase();

  const remove = async () => {
    if (!matches) return;
    setBusy(true);
    setError(null);
    try {
      const result = await schoolsApi.deleteSchoolPermanently(school.id, typed.trim());
      onDeleted(result);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Could not delete the school.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={busy ? () => undefined : onClose}
      title="Delete school permanently"
      description={school.name}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="border-red-600 bg-red-600 hover:bg-red-700"
            onClick={remove}
            loading={busy}
            disabled={!matches}
          >
            Delete school
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm text-slate-700">
        {error && <Alert tone="error">{error}</Alert>}
        <p>This can&apos;t be undone. Deleting the school:</p>
        <ul className="list-disc space-y-1 pl-5 text-slate-600">
          <li>removes it from the admin panel and its school app stops getting its branding,</li>
          <li>removes all its student license codes, so nobody new can join with them,</li>
          <li>removes its school-only video assignments (those videos become visible to everyone).</li>
        </ul>
        <Alert tone="info">
          Students are not deleted.
          {typeof studentCount === 'number' && studentCount > 0 ? ` Its ${studentCount} students` : ' Its students'} keep their
          accounts, history and any Pro pass they already have; they are just no longer linked to this school.
        </Alert>
        <p className="text-xs text-slate-500">
          Only want to pause it? Use <strong>Edit → Status → Inactive</strong> instead; that keeps everything and can be undone.
        </p>
        <Field label={`Type the school code ${school.code} to confirm`}>
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={school.code}
            className="font-mono uppercase"
            autoComplete="off"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && matches) void remove();
            }}
          />
        </Field>
      </div>
    </Modal>
  );
}
