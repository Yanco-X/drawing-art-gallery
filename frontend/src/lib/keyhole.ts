/**
 * The spare way in.
 *
 * A path that is in no menu and no route table. Only its hash is here: the
 * literal would ship in the bundle and be found by anyone reading it, which
 * is the one thing an unlinked address cannot survive.
 *
 * Read at module load, before the router's catch-all redirects an unknown
 * path to /home.
 */
const ENTRY_PATH = window.location.pathname;

const SPARE_PATH_HASH =
  '78ea3d54b326bfd5bcfe123944c60c2b7d46c722ada4ca405deb93e76281da7b';

const sha256 = async (value: string): Promise<string> => {
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

export const cameThroughSparePath = async (): Promise<boolean> => {
  // subtle is absent outside a secure context. localhost counts as one, so
  // this only bites on a plain-http deployment -- where the gesture still
  // works and the cookie should not be travelling anyway.
  if (!crypto?.subtle || ENTRY_PATH === '/') return false;
  try {
    return (await sha256(ENTRY_PATH)) === SPARE_PATH_HASH;
  } catch {
    return false;
  }
};
