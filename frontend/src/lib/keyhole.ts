// Read at module load, before the router's catch-all redirects an unknown
// path to /home.
const ENTRY_PATH = window.location.pathname;

const SPARE_PATH_HASH =
  '2b23ccb8b7a96267b6e241338111dfe8f5e962298dde0cb84ff2741f875ab20a';

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
  // subtle is absent outside a secure context, which localhost counts as.
  if (!crypto?.subtle || ENTRY_PATH === '/') return false;
  try {
    return (await sha256(ENTRY_PATH)) === SPARE_PATH_HASH;
  } catch {
    return false;
  }
};
