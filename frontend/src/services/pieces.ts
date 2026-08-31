import { OWNER_TOKEN } from '../lib/session';
import type { CollectionSummary, NewPiece, Piece } from '../types';

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

/** One piece by id. Rejects with ApiError when the API has no such row. */
export const fetchPiece = async (id: string): Promise<Piece> => {
  const response = await fetch('/api/pieces/' + encodeURIComponent(id));
  if (!response.ok) await raise(response);
  return response.json();
};

/** Gallery order, newest first — the same order the grid renders. */
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
