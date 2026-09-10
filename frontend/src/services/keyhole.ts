import { ApiError } from './pieces';

/*
 * Kept out of `pieces.ts` on purpose: this is the only request carrying a
 * password field, so it lives in a module imported by nothing but the lazy
 * dialog, which keeps it out of the chunk every visitor downloads.
 *
 * A refusal is thrown rather than routed through the lapsed-session handler --
 * the dialog it would open is already open.
 */
export const signIn = async (password: string): Promise<void> => {
  const response = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      body?.error ?? `Request failed (${response.status}).`,
      response.status,
    );
  }
};
