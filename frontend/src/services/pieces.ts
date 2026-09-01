import { CURRENT_ROLE, OWNER_TOKEN } from '../lib/session';
import type {
  Collection,
  CollectionSummary,
  NewCollection,
  NewPiece,
  Piece,
} from '../types';

/** An error the API reported, carrying its per-field details when present. */
export class ApiError extends Error {
  details: Record<string, string>;

  constructor(message: string, details: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.details = details;
  }
}

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
  throw new ApiError(message, details);
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

  const response = await fetch('/api/pieces', {
    method: 'POST',
    headers: { 'X-Owner-Token': OWNER_TOKEN },
    body: form,
  });

  if (!response.ok) await raise(response);
  return response.json();
};

/**
 * One piece by id, with the collections it appears in.
 *
 * Returns null on 404 rather than rejecting: a piece that does not exist —
 * or is waived while the caller is not the owner — is an expected answer
 * here, not a failure. Sends the owner token so the reserve is reachable.
 */
export const fetchPiece = async (id: string): Promise<Piece | null> => {
  const response = await fetch('/api/pieces/' + encodeURIComponent(id), {
    headers: OWNER_TOKEN ? { 'X-Owner-Token': OWNER_TOKEN } : {},
  });
  if (response.status === 404) return null;
  if (!response.ok) await raise(response);
  return response.json();
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
  const response = await fetch('/api/collections/' + encodeURIComponent(slug), {
    headers: OWNER_TOKEN ? { 'X-Owner-Token': OWNER_TOKEN } : {},
  });
  if (response.status === 404) return null;
  if (!response.ok) await raise(response);
  return response.json();
};

/**
 * Every collection, published or not. Used by the restore picker: a piece
 * coming back may well belong in a set that has not been published yet.
 */
export const fetchAllCollections = async (): Promise<CollectionSummary[]> => {
  const response = await fetch('/api/collections?includePrivate=1', {
    headers: OWNER_TOKEN ? { 'X-Owner-Token': OWNER_TOKEN } : {},
  });
  if (!response.ok) await raise(response);
  return response.json();
};

/**
 * Whatever this caller is entitled to see — drafts included for the owner.
 *
 * Module-level rather than an inline arrow in each page, so it can be handed
 * straight to `useAsync` without refetching on every render.
 */
export const fetchVisibleCollections = (): Promise<CollectionSummary[]> =>
  CURRENT_ROLE === 'owner' ? fetchAllCollections() : fetchCollections();

/**
 * Removes the row and every stored object for a piece. Irreversible: the
 * original is deleted along with the derivatives, so the only copy left is
 * whatever the owner still has on disk.
 */
export const deletePiece = async (id: string): Promise<void> => {
  const response = await fetch('/api/pieces/' + encodeURIComponent(id), {
    method: 'DELETE',
    headers: { 'X-Owner-Token': OWNER_TOKEN },
  });
  // 204, so there is no body to read.
  if (!response.ok) await raise(response);
};

/** The reserve: pieces withdrawn from the gallery. Owner only. */
export const fetchWaivedPieces = async (): Promise<Piece[]> => {
  const response = await fetch('/api/pieces?waived=true', {
    headers: { 'X-Owner-Token': OWNER_TOKEN },
  });
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
    headers: { 'X-Owner-Token': OWNER_TOKEN },
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
      'X-Owner-Token': OWNER_TOKEN,
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
      'X-Owner-Token': OWNER_TOKEN,
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
        'X-Owner-Token': OWNER_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ collectionIds }),
    },
  );
  if (!response.ok) await raise(response);
  return response.json();
};
