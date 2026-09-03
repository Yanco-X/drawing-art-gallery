import type { Social } from '../types';

/*
 * Where the artist can be found.
 *
 * Hard-coded for pass 1, so the menu is real and on screen before there is
 * anywhere to store this. Pass 2 replaces this array with the API and adds
 * the owner's controls for editing it; nothing outside this file knows the
 * difference, because the menu already reads a list rather than a fixed set
 * of links.
 *
 * The URL is a placeholder for the owner to correct.
 */
export const SOCIALS: Social[] = [
  {
    id: 'instagram',
    platform: 'instagram',
    label: 'Instagram',
    url: 'https://instagram.com/yankito_m',
  },
];
