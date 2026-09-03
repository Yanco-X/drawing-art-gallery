import { useEffect, useId, useRef, useState } from 'react';
import { useSession } from '../hooks';
import { ApiError } from '../services';
import { signIn } from '../services/keyhole';
import { FIELD, GHOST_BUTTON, LABEL, PRIMARY_BUTTON } from './form-styles';
import { EyeHiddenIcon, EyeIcon } from './icons';

/*
 * The way in.
 *
 * Loaded on demand, so the one field on the site that asks for a secret is
 * not in the bundle every visitor downloads. Nothing links here: it opens
 * on five clicks of the footer mark, on the spare path, or when a session
 * lapses mid-action.
 *
 * Dismissing is always allowed. A session that lapsed while something was
 * being edited leaves the page exactly as it was, so whatever was typed
 * survives being sent away.
 */
const Keyhole = () => {
  const { keyholeOpen, closeKeyhole, signedIn } = useSession();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fieldRef = useRef<HTMLInputElement>(null);
  const fieldId = useId();

  const [secret, setSecret] = useState('');
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (keyholeOpen && !dialog.open) {
      dialog.showModal();
      fieldRef.current?.focus();
    } else if (!keyholeOpen && dialog.open) {
      dialog.close();
    }
  }, [keyholeOpen]);

  const dismiss = () => {
    if (busy) return;
    setSecret('');
    setShown(false);
    setError(null);
    closeKeyhole();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(secret);
      setSecret('');
      signedIn();
    } catch (failure) {
      setError(
        failure instanceof ApiError
          ? failure.message
          : 'Could not reach the API.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label="Access"
      onCancel={(event) => {
        if (busy) event.preventDefault();
      }}
      onClose={dismiss}
      onClick={(event) => {
        if (event.target === dialogRef.current) dismiss();
      }}
      className="m-auto w-[min(92vw,360px)] overflow-hidden border border-line bg-surface p-0 text-text backdrop:bg-black/70 backdrop:backdrop-blur-[3px]"
    >
      <form onSubmit={submit} className="flex flex-col gap-4 p-6">
        <label htmlFor={fieldId} className={LABEL}>
          Key
        </label>

        {/* The toggle sits inside the field rather than beside it, so the
            control and the thing it controls are one object. The input keeps
            room for it on the right; the button is the field's own height,
            which makes it a comfortable target on a phone. */}
        <div className="relative">
          <input
            ref={fieldRef}
            id={fieldId}
            type={shown ? 'text' : 'password'}
            autoComplete="current-password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            disabled={busy}
            className={`${FIELD} pr-11`}
          />
          <button
            type="button"
            onClick={() => {
              setShown((was) => !was);
              // Toggling is a glance at what was typed, not a step away
              // from typing it.
              fieldRef.current?.focus();
            }}
            disabled={busy}
            aria-pressed={shown}
            aria-controls={fieldId}
            aria-label={shown ? 'Hide the key' : 'Show the key'}
            className="absolute inset-y-0 right-0 flex cursor-pointer items-center border-none bg-transparent px-3 text-faint transition-colors duration-200 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            {shown ? <EyeHiddenIcon /> : <EyeIcon />}
          </button>
        </div>

        {error && (
          <p role="alert" className="text-[13px] text-danger">
            {error}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={dismiss}
            disabled={busy}
            className={GHOST_BUTTON}
          >
            Cancel
          </button>
          <button type="submit" disabled={busy} className={PRIMARY_BUTTON}>
            {busy ? 'Checking…' : 'Enter'}
          </button>
        </div>
      </form>
    </dialog>
  );
};

export default Keyhole;
