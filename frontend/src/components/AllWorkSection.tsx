import { useGridDensity } from '../hooks/useGridDensity';
import type { Piece } from '../types';
import { DensityControl } from './DensityControl';
import { MasonryGrid } from './MasonryGrid';
import { SectionHeader } from './SectionHeader';

/*
 * Tag filtering is deliberately not wired up yet — every piece is shown.
 * Pieces still carry their `tags`, so restoring the chip row is a UI-only
 * change when we come back to it.
 */
export const AllWorkSection = ({ pieces }: { pieces: Piece[] }) => {
  const [density, setDensity] = useGridDensity();

  return (
    <section className="mx-auto w-full max-w-content px-gutter pb-section-lg">
      <SectionHeader title="All work">
        <DensityControl value={density} onChange={setDensity} />
      </SectionHeader>

      {pieces.length === 0 ? (
        <p className="text-[13px] text-faint">No work here yet.</p>
      ) : (
        <MasonryGrid pieces={pieces} density={density} />
      )}
    </section>
  );
};
