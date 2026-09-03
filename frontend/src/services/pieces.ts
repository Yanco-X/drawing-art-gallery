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
} from '../types';

/** An error the API reported, carrying its status and per-field details. */
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

/*
 * A lapsed session has to reach the interface from here, because this is
 * where it is discovered. The provider registers a handler on mount; until
 * it does, a 401 is just an error like any other.
 */
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
  // Sent with the upload rather than as a follow-up PUT: the API joins them
  // in the same transaction, so a piece never lands in the gallery having
  // silently missed the collections it was uploaded into.
  input.collectionIds.forEach((id) => form.append('collectionIds', id));

  const response = await fetch('/api/pieces', {
    method: 'POST',
    body: form,
  });

  if (!response.ok) await raise(response);
  return response.json();
};

/**
 * One piece by id, with the collections it appears in.
 *
 * Three answers, not two. A piece that never existed and a piece taken off
 * the wall are different facts, and the API says so — 410 carries the title
 * of something the caller may well have seen hanging. Neither is a failure,
 * so neither rejects.
 */
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

/** Gallery order, newest first — the same order the grid renders. */
export const fetchPieces = async (): Promise<Piece[]> => {
  const response = await fetch('/api/pieces');
  if (!response.ok) await raise(response);
  return response.json();
};

/** What a visitor sees: published collections only. */
export const fetchCollections = async (): Promise<CollectionSummary[]> => {
  const response = await fetch('/api/collections');
  if (!response.ok) await raise(response);
  return response.json();
};

/**
 * One collection by slug, with its pieces in curated order.
 *
 * Returns null on 404 for the same reason `fetchPiece` does: a collection
 * that does not exist — or is a draft while the caller is not the owner —
 * is an expected answer here, not a failure.
 */
export const fetchCollection = async (
  slug: string,
): Promise<Collection | null> => {
  const response = await fetch('/api/collections/' + encodeURIComponent(slug));
  if (response.status === 404) return null;
  if (!response.ok) await raise(response);
  return response.json();
};

/**
 * Every collection, published or not. Used by the restore picker: a piece
 * coming back may well belong in a set that has not been published yet.
 */
export const fetchAllCollections = async (): Promise<CollectionSummary[]> => {
  const response = await fetch('/api/collections?includePrivate=1');
  if (!response.ok) await raise(response);
  return response.json();
};

/**
 * Whatever this caller is entitled to see — drafts included for the owner.
 *
 * Returns the loader rather than calling it: the role is a runtime answer
 * now, so the choice belongs to the pages, and handing `useAsync` a
 * function that is stable for as long as the role is keeps its dependency
 * stable too.
 */
export const collectionsFor = (role: Role) =>
  role === 'owner' ? fetchAllCollections : fetchCollections;

/**
 * Corrects a piece's wall label. The image is not replaceable — that would
 * mean re-deriving both renditions behind an id people already hold.
 *
 * Returns the detail shape, collections included, so the piece page can use
 * the response directly instead of refetching.
 */
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

/**
 * Removes the row and every stored object for a piece. Irreversible: the
 * original is deleted along with the derivatives, so the only copy left is
 * whatever the owner still has on disk.
 */
export const deletePiece = async (id: string): Promise<void> => {
  const response = await fetch('/api/pieces/' + encodeURIComponent(id), {
    method: 'DELETE',
  });
  // 204, so there is no body to read.
  if (!response.ok) await raise(response);
};

/** The reserve: pieces withdrawn from the gallery. Owner only. */
export const fetchWaivedPieces = async (): Promise<Piece[]> => {
  const response = await fetch('/api/pieces?waived=true');
  if (!response.ok) await raise(response);
  return response.json();
};

/**
 * Withdraws a piece from the gallery. Reversible, but it also drops the
 * piece out of every collection it belongs to, which restoring does not
 * undo on its own.
 */
export const waivePiece = async (id: string): Promise<Piece> => {
  const response = await fetch('/api/pieces/' + encodeURIComponent(id) + '/waive', {
    method: 'POST',
  });
  if (!response.ok) await raise(response);
  return response.json();
};

/**
 * Returns a piece to the gallery, optionally adding it to collections. One
 * request: the restore and the membership land together or not at all.
 */
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

/**
 * Creates a collection, with its members in one request.
 *
 * `pieceIds` order becomes the display order, so the order pieces were
 * picked in is the order they hang in.
 */
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

/**
 * Renames, re-describes, publishes or covers a collection.
 *
 * Never sends `slug`. The API only re-slugs when it is present, so a
 * collection keeps its URL when the owner changes their mind about a name.
 */
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

/**
 * Replaces a collection's membership, order and cover in one write.
 *
 * The array is the curation: position in it becomes `display_order`. Sent
 * whole rather than as a sequence of add/remove calls, so a curation
 * session cannot half-apply. Omit `coverPieceId` to leave the cover to the
 * API's own rules; pass null to clear it back to the first member.
 */
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

/** Removes the grouping. Every piece in it survives, untouched. */
export const deleteCollection = async (id: string): Promise<void> => {
  const response = await fetch('/api/collections/' + encodeURIComponent(id), {
    method: 'DELETE',
  });
  // 204, so there is no body to read.
  if (!response.ok) await raise(response);
};

/**
 * Sets which collections a piece belongs to — the whole list, so leaving one
 * out removes it. Returns the updated piece with its memberships.
 */
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


/**
 * Ending the session, and asking who we are.
 *
 * Starting one lives in `keyhole.ts` instead: it is the only call that
 * carries a password, and this module ships to everyone.
 */
export const signOut = async (): Promise<void> => {
  await fetch('/api/session', { method: 'DELETE' });
};

/** Who the API thinks we are. Asked only when this browser has signed in. */
export const fetchRole = async (): Promise<Role> => {
  const response = await fetch('/api/session/me');
  if (!response.ok) return 'visitor';
  const body = await response.json();
  return body?.role === 'owner' ? 'owner' : 'visitor';
};
