import type { Collection, Piece, Tag } from '../types';

/*
 * Stand-in data until the backend serves real records.
 *
 * The images and their `aspectRatio` values are real — measured from the
 * files in backend/uploads. Everything else marked PLACEHOLDER below is
 * invented so the UI renders sensibly and must be replaced with the real
 * metadata before this ships:
 *   - titles for pieces whose source filename carried no title
 *   - every `medium` and `year`
 *   - collection groupings and descriptions
 *
 * `description` is intentionally empty rather than filled with invented
 * copy. The piece page omits the block when it is blank, so adding real
 * text is all that is needed to bring it back.
 */

import img1 from '../../../backend/uploads/1000013215.jpg';
import img2 from '../../../backend/uploads/315103087_125180233707486_1256388644997043580_n.jpg';
import img3 from '../../../backend/uploads/315426887_868792797489974_1363516252347202476_n.jpg';
import img4 from '../../../backend/uploads/342698002_1863669474043644_6693166192317816926_n.jpeg';
import img5 from '../../../backend/uploads/61886.jpg';
import img6 from '../../../backend/uploads/97102090_1443010762567889_5427720541029095188_n.jpg';
import img7 from '../../../backend/uploads/IMG_20230116_111637~2.jpg';
import img8 from '../../../backend/uploads/IMG_20231016_171622.jpg.png';
import img9 from '../../../backend/uploads/Night Calls V.jpg';
import img10 from '../../../backend/uploads/Night_Calls_IX.jpeg';
import img11 from '../../../backend/uploads/savy.jpeg';

export const MOCK_TAGS: Tag[] = [
  { id: 't1', name: 'Charcoal', slug: 'charcoal' },
  { id: 't2', name: 'Digital', slug: 'digital' },
  { id: 't3', name: 'Sketch', slug: 'sketch' },
  { id: 't4', name: 'Portrait', slug: 'portrait' },
];

const [charcoal, digital, sketch, portrait] = MOCK_TAGS;

const TODAY = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

export const MOCK_PIECES: Piece[] = [
  {
    id: 'p1',
    title: 'Yankito Night Calls',
    description: '',
    imageUrl: img1,
    medium: 'Mixed media', // PLACEHOLDER
    year: 2026, // PLACEHOLDER
    aspectRatio: 4999 / 5001,
    createdDate: TODAY,
    tags: [charcoal],
  },
  {
    id: 'p2',
    title: 'Untitled Study I', // PLACEHOLDER
    description: '',
    imageUrl: img2,
    medium: 'Charcoal', // PLACEHOLDER
    year: 2025, // PLACEHOLDER
    aspectRatio: 1,
    createdDate: TODAY,
    tags: [charcoal, sketch],
  },
  {
    id: 'p3',
    title: 'Untitled Study II', // PLACEHOLDER
    description: '',
    imageUrl: img3,
    medium: 'Charcoal', // PLACEHOLDER
    year: 2025, // PLACEHOLDER
    aspectRatio: 1,
    createdDate: TODAY,
    tags: [charcoal],
  },
  {
    id: 'p4',
    title: 'Untitled Study III', // PLACEHOLDER
    description: '',
    imageUrl: img4,
    medium: 'Graphite', // PLACEHOLDER
    year: 2024, // PLACEHOLDER
    aspectRatio: 1,
    createdDate: TODAY,
    tags: [sketch],
  },
  {
    id: 'p5',
    title: 'Untitled Study IV', // PLACEHOLDER
    description: '',
    imageUrl: img5,
    medium: 'Ink', // PLACEHOLDER
    year: 2024, // PLACEHOLDER
    aspectRatio: 3072 / 4096,
    createdDate: TODAY,
    tags: [sketch],
  },
  {
    id: 'p6',
    title: 'Untitled Study V', // PLACEHOLDER
    description: '',
    imageUrl: img6,
    medium: 'Digital', // PLACEHOLDER
    year: 2023, // PLACEHOLDER
    aspectRatio: 1,
    createdDate: TODAY,
    tags: [digital],
  },
  {
    id: 'p7',
    title: 'Untitled Study VI', // PLACEHOLDER
    description: '',
    imageUrl: img7,
    medium: 'Graphite', // PLACEHOLDER
    year: 2023, // PLACEHOLDER
    aspectRatio: 1,
    createdDate: TODAY,
    tags: [sketch, portrait],
  },
  {
    id: 'p8',
    title: 'Untitled Study VII', // PLACEHOLDER
    description: '',
    imageUrl: img8,
    medium: 'Digital', // PLACEHOLDER
    year: 2023, // PLACEHOLDER
    aspectRatio: 1,
    createdDate: TODAY,
    tags: [digital],
  },
  {
    id: 'p9',
    title: 'Night Calls V',
    description: '',
    imageUrl: img9,
    medium: 'Charcoal', // PLACEHOLDER
    year: 2026, // PLACEHOLDER
    aspectRatio: 1,
    createdDate: TODAY,
    tags: [charcoal, portrait],
  },
  {
    id: 'p10',
    title: 'Night Calls IX',
    description: '',
    imageUrl: img10,
    medium: 'Charcoal', // PLACEHOLDER
    year: 2026, // PLACEHOLDER
    aspectRatio: 1,
    createdDate: TODAY,
    tags: [charcoal, portrait],
  },
  {
    id: 'p11',
    title: 'Savy', // PLACEHOLDER
    description: '',
    imageUrl: img11,
    medium: 'Digital', // PLACEHOLDER
    year: 2023, // PLACEHOLDER
    aspectRatio: 1,
    createdDate: TODAY,
    tags: [digital],
  },
];

const byId = (id: string): Piece => {
  const piece = MOCK_PIECES.find((p) => p.id === id);
  if (!piece) throw new Error(`mock-data: no piece with id "${id}"`);
  return piece;
};

const collection = (
  id: string,
  name: string,
  slug: string,
  description: string,
  pieceIds: string[],
): Collection => {
  const pieces = pieceIds.map(byId);
  return {
    id,
    name,
    slug,
    description,
    pieceCount: pieces.length,
    coverImageUrl: pieces[0]?.imageUrl ?? null,
    pieces,
  };
};

export const MOCK_COLLECTIONS: Collection[] = [
  collection('c1', 'Night Calls', 'night-calls', 'The ongoing series.', [
    'p1',
    'p9',
    'p10',
  ]),
  collection(
    'c2',
    'Charcoal Portraits',
    'charcoal-portraits',
    'Faces in charcoal.', // PLACEHOLDER
    ['p2', 'p3', 'p7'],
  ),
  collection(
    'c3',
    'Sketches & Studies',
    'sketches-and-studies',
    'Rough drafts and daily practice.', // PLACEHOLDER
    ['p4', 'p5'],
  ),
  collection(
    'c4',
    'Digital Work',
    'digital-work',
    'Drawn on screen.', // PLACEHOLDER
    ['p6', 'p8'],
  ),
];

/*
 * Queries. These move to services/ once a real API exists — the piece page
 * should not have to know whether the data came from a module or a fetch.
 */

export const getPieceById = (id: string): Piece | undefined =>
  MOCK_PIECES.find((piece) => piece.id === id);

export const getCollectionsForPiece = (id: string): Collection[] =>
  MOCK_COLLECTIONS.filter((c) => c.pieces.some((piece) => piece.id === id));

/** Neighbours in gallery order. Ends are open rather than wrapping. */
export const getAdjacentPieces = (
  id: string,
): { previous?: Piece; next?: Piece } => {
  const index = MOCK_PIECES.findIndex((piece) => piece.id === id);
  if (index === -1) return {};
  return {
    previous: index > 0 ? MOCK_PIECES[index - 1] : undefined,
    next: index < MOCK_PIECES.length - 1 ? MOCK_PIECES[index + 1] : undefined,
  };
};
