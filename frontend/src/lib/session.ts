import type { Role } from '../types';

/**
 * Stands in for auth. Drives the Upload button vs. the Owner sign in link.
 * Flip to 'owner' to see the owner state; replace with a real session
 * lookup once authentication exists.
 */
export const CURRENT_ROLE: Role = 'visitor';
