import { useMemo, useState } from 'react';
import type { CollectionSummary, Piece } from '../types';

export const useGalleryFilter = (
  pieces: Piece[],
  collections: CollectionSummary[],
  initial?: { query: string; years: number[]; collectionIds: string[] },
) => {
  const [query, setQuery] = useState(initial?.query ?? '');
  const [years, setYears] = useState<number[]>(initial?.years ?? []);
  const [collectionIds, setCollectionIds] = useState<string[]>(
    initial?.collectionIds ?? [],
  );

  const availableYears = useMemo(() => {
    const present = new Set<number>();
    for (const piece of pieces) {
      if (piece.year !== null) present.add(piece.year);
    }
    return [...present].sort((a, b) => b - a);
  }, [pieces]);

  const namesByPiece = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const collection of collections) {
      for (const id of collection.pieceIds) {
        const held = map.get(id);
        if (held) held.push(collection.name);
        else map.set(id, [collection.name]);
      }
    }
    return map;
  }, [collections]);

  const haystacks = useMemo(() => {
    const map = new Map<string, string>();
    for (const piece of pieces) {
      map.set(
        piece.id,
        [
          piece.title,
          piece.description,
          piece.medium,
          piece.year,
          ...piece.tags.map((tag) => tag.name),
          ...(namesByPiece.get(piece.id) ?? []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase(),
      );
    }
    return map;
  }, [pieces, namesByPiece]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const wanted = new Set(years);
    // Null rather than an empty set: no collection ticked means no
    // membership test at all, where an empty set would match nothing.
    const members =
      collectionIds.length === 0
        ? null
        : new Set(
            collections
              .filter((collection) => collectionIds.includes(collection.id))
              .flatMap((collection) => collection.pieceIds),
          );

    return pieces.filter((piece) => {
      if (wanted.size > 0 && (piece.year === null || !wanted.has(piece.year)))
        return false;
      if (members && !members.has(piece.id)) return false;
      if (needle && !haystacks.get(piece.id)?.includes(needle)) return false;
      return true;
    });
  }, [pieces, collections, query, years, collectionIds, haystacks]);

  const toggleYear = (year: number) =>
    setYears((held) =>
      held.includes(year) ? held.filter((one) => one !== year) : [...held, year],
    );

  const toggleCollection = (id: string) =>
    setCollectionIds((held) =>
      held.includes(id) ? held.filter((one) => one !== id) : [...held, id],
    );

  const active =
    query.trim() !== '' || years.length > 0 || collectionIds.length > 0;

  const clear = () => {
    setQuery('');
    setYears([]);
    setCollectionIds([]);
  };

  return {
    query,
    setQuery,
    years,
    toggleYear,
    availableYears,
    collectionIds,
    toggleCollection,
    filtered,
    active,
    clear,
  };
};
