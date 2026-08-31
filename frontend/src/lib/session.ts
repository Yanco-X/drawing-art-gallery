import type { Role } from '../types';

/**
 * Stands in for auth.
 *
 * The backend guards owner-only endpoints with a shared secret sent as
 * `X-Owner-Token`; until real sessions exist, the UI treats "we hold that
 * secret" as "we are the owner". Set `VITE_OWNER_TOKEN` in
 * `frontend/.env.local` to match `OWNER_API_TOKEN` in `backend/.env`.
 *
 * Deriving the role from the token rather than hardcoding it means the
 * Upload button appears exactly when uploading would actually succeed.
 */
export const OWNER_TOKEN: string = import.meta.env.VITE_OWNER_TOKEN ?? '';

export const CURRENT_ROLE: Role = OWNER_TOKEN ? 'owner' : 'visitor';
