import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';

/*
 * A confirmation step for actions that cannot be undone.
 *
 * Same native <dialog> foundation as the upload modal, so focus trapping,
 * Escape and the inert background come from the platform. Two details are
 * specific to destructive work:
 *
 *  - There is no close ×. The first focusable element is Cancel, so the
 *    dialog opens with focus on the safe choice and Enter does nothing
 *    harmful. Kept for both tones: one dialog, one behaviour.
 *  - At `tone="danger"` the confirming button is outlined rather than
 *    filled. A filled button is an invitation, and deletion is not one.
 */

const GHOST_BUTTON =
  'cursor-pointer border border-line bg-transparent px-5 py-2.5 text-[13px] ' +
  'uppercase tracking-btn text-muted transition-colors duration-200 ' +
  'hover:border-accent hover:text-accent disabled:cursor-not-allowed ' +
  'disabled:opacity-40';

const DANGER_BUTTON =
  'cursor-pointer border border-danger bg-transparent px-5 py-2.5 ' +
  'text-[13px] uppercase tracking-btn text-danger transition-colors ' +
  'duration-200 hover:bg-danger hover:text-bg disabled:cursor-not-allowed ' +
  'disabled:opacity-40';

const CONFIRM_BUTTON =
  'cursor-pointer border-none bg-accent px-5 py-2.5 text-[13px] uppercase ' +
  'tracking-btn text-on-accent transition-opacity duration-200 ' +
  'hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** What will happen, stated plainly. */
  children: ReactNode;
  confirmLabel: string;
  busyLabel?: string;
  /**
   * 'danger' outlines the confirming button in the danger token, for actions
   * with no undo. Everything else fills it with the accent — waiving and
   * restoring are reversible and should not borrow the weight of deletion.
   */
  tone?: 'default' | 'danger';
  busy?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDialog = ({
  open,
  title,
  children,
  confirmLabel,
  busyLabel = 'Working…',
  tone = 'default',
  busy = false,
  error = null,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  const dismiss = () => {
    if (busy) return;
    onCancel();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      onCancel={(event) => {
        // Refuse Escape mid-request rather than leaving the caller unsure
        // whether the work completed.
        if (busy) event.preventDefault();
      }}
      onClose={dismiss}
      onClick={(event) => {
        if (event.target === dialogRef.current) dismiss();
      }}
      className="m-auto w-[min(92vw,480px)] border border-line bg-surface p-0 text-text backdrop:bg-black/70 backdrop:backdrop-blur-[3px]"
    >
      <div className="flex flex-col gap-4 p-6">
        <h2
          id={headingId}
          className="font-serif text-[22px] font-normal text-text"
        >
          {title}
        </h2>

        <div className="flex flex-col gap-2 text-[14px] leading-relaxed text-dim">
          {children}
        </div>

        {error && (
          <p role="alert" className="text-[13px] text-danger">
            {error}
          </p>
        )}

        <div className="mt-2 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={dismiss}
            disabled={busy}
            className={GHOST_BUTTON}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={tone === 'danger' ? DANGER_BUTTON : CONFIRM_BUTTON}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
};
