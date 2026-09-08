/**
 * The year a piece was made, and where it comes from.
 *
 * The data model carries two precisions: `year` is the coarse fact and
 * `created_date` the fine one. The fine one implies the coarse, so where
 * there is a date the year is read off it rather than asked for again --
 * two controls for one fact is two ways to disagree, and nothing reconciled
 * them. The gallery holds a piece dated 2024-08-05 whose wall label shows
 * no year at all, because the year box beside the date was left empty.
 *
 * The date cannot be the only source, though. `input[type=date]` demands a
 * complete date, and a sketchbook is full of work whose year is known and
 * whose day is not. So the year stays typeable exactly while nothing else
 * is claiming it, which is what makes disagreement impossible rather than
 * merely discouraged.
 *
 * Kept out of the component so that file exports only a component and
 * react-refresh stays happy, the same split `lib/order.ts` was made for.
 */

/*
 * `input[type=date]` yields an RFC 3339 full date whatever the locale
 * displays, so the first four characters are the year. An empty date slices
 * to an empty string rather than needing a branch.
 */
export const yearOf = (createdDate: string) => createdDate.slice(0, 4);

/** The year to store, given both fields. The rule lives here and nowhere else. */
export const effectiveYear = (year: string, createdDate: string) =>
  createdDate ? yearOf(createdDate) : year;
