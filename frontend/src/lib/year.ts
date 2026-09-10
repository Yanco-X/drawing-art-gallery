// `input[type=date]` yields an RFC 3339 full date whatever the locale
// displays, so the first four characters are the year.
export const yearOf = (createdDate: string) => createdDate.slice(0, 4);

export const effectiveYear = (year: string, createdDate: string) =>
  createdDate ? yearOf(createdDate) : year;
