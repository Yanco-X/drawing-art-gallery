import { useAsync } from '../hooks';
import { tally } from '../lib/tally';
import {
  fetchAllCollections,
  fetchPieces,
  fetchSketchbook,
  fetchWaivedPieces,
} from '../services';
import { StatTile } from './StatTile';

const loadGallery = () =>
  Promise.all([
    fetchPieces(),
    fetchSketchbook(),
    fetchWaivedPieces(),
    fetchAllCollections(),
  ]);

export const GalleryCounts = () => {
  const load = useAsync(loadGallery);

  if (load.status === 'error') {
    return <p className="text-[12px] text-faint">{load.message}</p>;
  }
  if (load.status === 'loading') return null;

  const [pieces, sketchbook, waived, collections] = load.data;
  const shown = [...pieces, ...sketchbook];
  const drafts = collections.filter((collection) => !collection.isPublic).length;
  const tags = tally(shown.flatMap((piece) => piece.tags.map((tag) => tag.name)));
  const media = tally(shown.flatMap((piece) => (piece.medium ? [piece.medium] : [])));

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-6 lg:grid-cols-4">
      <StatTile
        label="Pieces"
        value={String(pieces.length)}
        note={`${sketchbook.length} in the sketchbook, ${waived.length} waived`}
      />
      <StatTile
        label="Collections"
        value={String(collections.length)}
        note={drafts === 0 ? 'all public' : `${drafts} private`}
      />
      <StatTile
        label="Tags"
        value={String(tags.length)}
        note={tags[0] ? `most used: ${tags[0].value}, on ${tags[0].count}` : 'none yet'}
      />
      <StatTile
        label="Mediums"
        value={String(media.length)}
        note={
          media[0]
            ? `${media[0].value} on ${media[0].count} of ${shown.length}`
            : 'none given yet'
        }
      />
    </div>
  );
};
