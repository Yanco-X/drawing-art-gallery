import { ApiError } from './pieces';

/**
 * The sign-in call, kept out of `pieces.ts` on purpose.
 *
 * Everything in the services layer that the pages touch ends up in the
 * bundle every visitor downloads. This is the only request that carries a
 * password field, so it lives in a module imported by nothing but the lazy
 * dialog -- which is what keeps the word out of the main chunk.
 *
 * A refusal is thrown rather than routed through the lapsed-session
 * handler: it is this form's own business, and the dialog it would open is
 * already open.
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
