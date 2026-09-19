import { SPOTLIGHT_COUNT, spotlightSlots } from '../lib/spotlight';
import { setSpotlight } from '../services';
import { PiecePicksDialog } from './PiecePicksDialog';
import type { PiecePicksProps } from './PiecePicksDialog';

export const SpotlightDialog = (props: PiecePicksProps) => (
  <PiecePicksDialog
    {...props}
    title="Spotlight"
    listLabel="On the band"
    max={SPOTLIGHT_COUNT}
    save={setSpotlight}
    slotsFor={spotlightSlots}
    emptyHint="Pick up to five, or leave it empty for the first five of the gallery."
    nothingToShow="Nothing in the gallery to show yet."
  />
);

export default SpotlightDialog;
