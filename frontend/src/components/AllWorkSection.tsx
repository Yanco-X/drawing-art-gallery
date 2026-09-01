import { useGridDensity } from '../hooks/useGridDensity';
import type { ReactNode } from 'react';
import type { Piece } from '../types';
import { DensityControl } from './DensityControl';
import { MasonryGrid } from './MasonryGrid';
import { SectionHeader } from './SectionHeader';
import { SectionState } from './SectionState';

/*
 * Tag filtering is deliberately not wired up yet — every piece is shown.
 * Pieces still carry their `tags`, so restoring the chip row is a UI-only
 * change when we come back to it.
 */
export const AllWorkSection = ({
  pieces,
  loading = false,
  error,
  title = 'All work',
  emptyMessage = 'No work here yet.',
  banner,
  selection,
}: {
  pieces: Piece[];
  loading?: boolean;
  /** Set when the fetch failed; takes precedence over the empty state. */
  error?: string;
  title?: string;
  emptyMessage?: string;
  /** Rendered between the header and the grid, for transient modes. */
  banner?: ReactNode;
  /** Present while picking pieces for a collection. */
  selection?: { ids: string[]; onToggle: (id: string) => void };
}) => {
  const [density, setDensity] = useGridDensity();

  return (
    <section className="mx-auto w-full max-w-content px-gutter pb-section-lg">
      <SectionHeader title={title}>
        {/* Hidden until there is something to arrange, and while picking:
            changing the column count mid-selection is noise. */}
        {pieces.length > 0 && !selection && (
          <DensityControl value={density} onChange={setDensity} />
        )}
      </SectionHeader>

      {banner}

      {error ? (
        <SectionState message={error} />
      ) : loading ? (
        <SectionState message="Loading work…" />
      ) : pieces.length === 0 ? (
        <SectionState message={emptyMessage} />
      ) : (
        <MasonryGrid pieces={pieces} density={density} selection={selection} />
      )}
    </section>
  );
};
