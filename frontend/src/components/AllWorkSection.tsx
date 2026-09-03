import { useGridDensity } from '../hooks/useGridDensity';
import type { Piece } from '../types';
import { DensityControl } from './DensityControl';
import { MasonryGrid } from './MasonryGrid';
import { SectionHeader } from './SectionHeader';
import { SectionState } from './SectionState';

/*
 * Tag filtering is deliberately not wired up yet — every piece is shown.
 * Pieces still carry their `tags`, so filtering this grid by one is where
 * tags will earn their keep: a criterion applied here, not a page of their
 * own.
 */
export const AllWorkSection = ({
  pieces,
  loading = false,
  error,
  title = 'All work',
  emptyMessage = 'No work here yet.',
}: {
  pieces: Piece[];
  loading?: boolean;
  /** Set when the fetch failed; takes precedence over the empty state. */
  error?: string;
  title?: string;
  emptyMessage?: string;
}) => {
  const [density, setDensity] = useGridDensity();

  return (
    <section className="mx-auto w-full max-w-content px-gutter pb-section-lg">
      <SectionHeader title={title}>
        {/* Hidden until there is something to arrange. */}
        {pieces.length > 0 && (
          <DensityControl value={density} onChange={setDensity} />
        )}
      </SectionHeader>

      {error ? (
        <SectionState message={error} />
      ) : loading ? (
        <SectionState message="Loading work…" />
      ) : pieces.length === 0 ? (
        <SectionState message={emptyMessage} />
      ) : (
        <MasonryGrid pieces={pieces} density={density} />
      )}
    </section>
  );
};
