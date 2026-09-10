import type {
  Collection,
  CollectionPatch,
  CollectionSummary,
  NewCollection,
  NewPiece,
  Piece,
  PieceResult,
  PiecePatch,
  Role,
  Social,
  SocialDraft,
} from '../types';

export class ApiError extends Error {
  status: number;
  details: Record<string, string>;

  constructor(
    message: string,
    status: number,
    details: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// A lapsed session reaches the interface from here, because this is where it
// is discovered. Until the provider registers a handler, a 401 is an
// ordinary error.
let onLapsed: (() => void) | null = null;

export const whenSessionLapses = (handler: (() => void) | null): void => {
  onLapsed = handler;
};

const raise = async (response: Response): Promise<never> => {
  let message = `Request failed (${response.status}).`;
  let details: Record<string, string> = {};
  try {
    const body = await response.json();
    if (body?.error) message = body.error;
    if (body?.details) details = body.details;
  } catch {
    // A non-JSON body — a proxy error page, or the API being down. The
    // status line is all we have, and it is better than a parse error.
  }
  if (response.status === 401) onLapsed?.();
  throw new ApiError(message, response.status, details);
};

/** Optional fields are omitted rather than sent empty, so the API stores null. */
const appendIf = (form: FormData, key: string, value: string) => {
  const trimmed = value.trim();
  if (trimmed) form.append(key, trimmed);
};

export const createPiece = async (input: NewPiece): Promise<Piece> => {
  const form = new FormData();
  // No Content-Type header: the browser sets multipart/form-data with the
  // boundary, which cannot be written by hand.
  form.append('image', input.file, input.file.name);
  form.append('title', input.title.trim());
  appendIf(form, 'description', input.description);
  appendIf(form, 'medium', input.medium);
  appendIf(form, 'year', input.year);
  appendIf(form, 'createdDate', input.createdDate);
  // Repeated fields, which is how Flask's request.form.getlist reads a list.
  input.tags.forEach((tag) => form.append('tags', tag));
  input.collectionIds.forEach((id) => form.append('collectionIds', id));

  const response = await fetch('/api/pieces', {
    method: 'POST',
    body: form,
  });

  if (!response.ok) await raise(response);
  return response.json();
};

export const fetchPiece = async (id: string): Promise<PieceResult> => {
  const response = await fetch('/api/pieces/' + encodeURIComponent(id));
  if (response.status === 404) return { state: 'missing' };
  if (response.status === 410) {
    const body = await response.json().catch(() => ({}));
    return { state: 'gone', title: body?.title ?? '' };
  }
  if (!response.ok) await raise(response);
  return { state: 'found', piece: await response.json() };
};

export const fetchPieces = async (): Promise<Piece[]> => {
  const response = await fetch('/api/pieces');
  if (!response.ok) await raise(response);
  return response.json();
};

export const fetchCollections = async (): Promise<CollectionSummary[]> => {
  const response = await fetch('/api/collections');
  if (!response.ok) await raise(response);
  return response.json();
};

export const fetchCollection = async (
  slug: string,
): Promise<Collection | null> => {
  const response = await fetch('/api/collections/' + encodeURIComponent(slug));
  if (response.status === 404) return null;
  if (!response.ok) await raise(response);
  return response.json();
};

export const fetchAllCollections = async (): Promise<CollectionSummary[]> => {
  const response = await fetch('/api/collections?includePrivate=1');
  if (!response.ok) await raise(response);
  return response.json();
};

// Returns the loader rather than calling it, so `useAsync` gets a
// dependency that stays stable for as long as the role does.
export const collectionsFor = (role: Role) =>
  role === 'owner' ? fetchAllCollections : fetchCollections;

export const updatePiece = async (
  id: string,
  patch: PiecePatch,
): Promise<Piece> => {
  const response = await fetch('/api/pieces/' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patch),
  });
  if (!response.ok) await raise(response);
  return response.json();
};

// Irreversible: the original is deleted along with the derivatives.
export const deletePiece = async (id: string): Promise<void> => {
  const response = await fetch('/api/pieces/' + encodeURIComponent(id), {
    method: 'DELETE',
  });
  // 204, so there is no body to read.
  if (!response.ok) await raise(response);
};

export const fetchWaivedPieces = async (): Promise<Piece[]> => {
  const response = await fetch('/api/pieces?waived=true');
  if (!response.ok) await raise(response);
  return response.json();
};

// Also drops the piece out of every collection it belongs to, which
// restoring does not undo on its own.
export const waivePiece = async (id: string): Promise<Piece> => {
  const response = await fetch('/api/pieces/' + encodeURIComponent(id) + '/waive', {
    method: 'POST',
  });
  if (!response.ok) await raise(response);
  return response.json();
};

export const restorePiece = async (
  id: string,
  collectionIds: string[] = [],
): Promise<Piece> => {
  const response = await fetch('/api/pieces/' + encodeURIComponent(id) + '/restore', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ collectionIds }),
  });
  if (!response.ok) await raise(response);
  return response.json();
};

export const createCollection = async (
  input: NewCollection,
): Promise<Collection> => {
  const response = await fetch('/api/collections', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: input.name.trim(),
      description: input.description.trim() || undefined,
      isPublic: input.isPublic,
      pieceIds: input.pieceIds,
    }),
  });
  if (!response.ok) await raise(response);
  return response.json();
};

export const updateCollection = async (
  id: string,
  patch: CollectionPatch,
): Promise<Collection> => {
  const response = await fetch('/api/collections/' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patch),
  });
  if (!response.ok) await raise(response);
  return response.json();
};

// Position in the array becomes `display_order`. Omit `coverPieceId` to
// leave the cover to the API's own rules; pass null to clear it.
export const setCollectionPieces = async (
  id: string,
  pieceIds: string[],
  coverPieceId?: string | null,
): Promise<Collection> => {
  const body: { pieceIds: string[]; coverPieceId?: string | null } = {
    pieceIds,
  };
  if (coverPieceId !== undefined) body.coverPieceId = coverPieceId;

  const response = await fetch(
    '/api/collections/' + encodeURIComponent(id) + '/pieces',
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) await raise(response);
  return response.json();
};

export const deleteCollection = async (id: string): Promise<void> => {
  const response = await fetch('/api/collections/' + encodeURIComponent(id), {
    method: 'DELETE',
  });
  // 204, so there is no body to read.
  if (!response.ok) await raise(response);
};

// The whole list, so leaving a collection out removes the piece from it.
export const setPieceCollections = async (
  id: string,
  collectionIds: string[],
): Promise<Piece> => {
  const response = await fetch(
    '/api/pieces/' + encodeURIComponent(id) + '/collections',
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ collectionIds }),
    },
  );
  if (!response.ok) await raise(response);
  return response.json();
};


// Starting a session lives in `keyhole.ts` instead: it is the only call
// carrying a password, and this module ships to everyone.
export const signOut = async (): Promise<void> => {
  await fetch('/api/session', { method: 'DELETE' });
};

export const fetchRole = async (): Promise<Role> => {
  const response = await fetch('/api/session/me');
  if (!response.ok) return 'visitor';
  const body = await response.json();
  return body?.role === 'owner' ? 'owner' : 'visitor';
};

export const fetchSocials = async (): Promise<Social[]> => {
  const response = await fetch('/api/socials');
  if (!response.ok) await raise(response);
  return response.json();
};

// An empty list is how the owner goes back to the default: the newest five,
// which is stored nowhere.
export const setSpotlight = async (pieceIds: string[]): Promise<Piece[]> => {
  const response = await fetch('/api/spotlight', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pieceIds),
  });
  if (!response.ok) await raise(response);
  return response.json();
};

export const saveSocials = async (socials: SocialDraft[]): Promise<Social[]> => {
  const response = await fetch('/api/socials', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(socials),
  });
  if (!response.ok) await raise(response);
  return response.json();
};

