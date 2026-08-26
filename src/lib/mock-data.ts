export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Piece {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdDate: string;
  tags: Tag[];
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  pieces: Piece[];
}

export const MOCK_TAGS: Tag[] = [
  { id: 't1', name: 'Charcoal', slug: 'charcoal' },
  { id: 't2', name: 'Digital', slug: 'digital' },
  { id: 't3', name: 'Sketch', slug: 'sketch' },
  { id: 't4', name: 'Portrait', slug: 'portrait' },
];

import img1 from '../../backend/uploads/1000013215.jpg';
import img2 from '../../backend/uploads/315103087_125180233707486_1256388644997043580_n.jpg';
import img3 from '../../backend/uploads/315426887_868792797489974_1363516252347202476_n.jpg';
import img4 from '../../backend/uploads/342698002_1863669474043644_6693166192317816926_n.jpeg';
import img5 from '../../backend/uploads/61886.jpg';
import img6 from '../../backend/uploads/97102090_1443010762567889_5427720541029095188_n.jpg';
import img7 from '../../backend/uploads/IMG_20230116_111637~2.jpg';
import img8 from '../../backend/uploads/IMG_20231016_171622.jpg.png';
import img9 from '../../backend/uploads/Night Calls V.jpg';
import img10 from '../../backend/uploads/Night_Calls_IX.jpeg';

const TODAY = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

export const MOCK_PIECES: Piece[] = [
  {
    id: 'p1',
    title: 'Yankito Night Calls',
    description: 'Yankito Night Calls',
    imageUrl: img1,
    createdDate: TODAY,
    tags: [MOCK_TAGS[0]],
  },
  {
    id: 'p2',
    title: '315103087_125180233707486_1256388644997043580_n',
    description: '315103087_125180233707486_1256388644997043580_n',
    imageUrl: img2,
    createdDate: TODAY,
    tags: [MOCK_TAGS[0]],
  },
  {
    id: 'p3',
    title: '315426887_868792797489974_1363516252347202476_n',
    description: '315426887_868792797489974_1363516252347202476_n',
    imageUrl: img3,
    createdDate: TODAY,
    tags: [MOCK_TAGS[0]],
  },
  {
    id: 'p4',
    title: '342698002_1863669474043644_6693166192317816926_n',
    description: '342698002_1863669474043644_6693166192317816926_n',
    imageUrl: img4,
    createdDate: TODAY,
    tags: [MOCK_TAGS[0]],
  },
  {
    id: 'p5',
    title: '61886',
    description: '61886',
    imageUrl: img5,
    createdDate: TODAY,
    tags: [MOCK_TAGS[0]],
  },
  {
    id: 'p6',
    title: '97102090_1443010762567889_5427720541029095188_n',
    description: '97102090_1443010762567889_5427720541029095188_n',
    imageUrl: img6,
    createdDate: TODAY,
    tags: [MOCK_TAGS[0]],
  },
  {
    id: 'p7',
    title: 'IMG_20230116_111637~2',
    description: 'IMG_20230116_111637~2',
    imageUrl: img7,
    createdDate: TODAY,
    tags: [MOCK_TAGS[0]],
  },
  {
    id: 'p8',
    title: 'IMG_20231016_171622',
    description: 'IMG_20231016_171622',
    imageUrl: img8,
    createdDate: TODAY,
    tags: [MOCK_TAGS[0]],
  },
  {
    id: 'p9',
    title: 'Night Calls V',
    description: 'Night Calls V',
    imageUrl: img9,
    createdDate: TODAY,
    tags: [MOCK_TAGS[0]],
  },
  {
    id: 'p10',
    title: 'Night_Calls_IX',
    description: 'Night_Calls_IX',
    imageUrl: img10,
    createdDate: TODAY,
    tags: [MOCK_TAGS[0]],
  },
];

export const MOCK_COLLECTIONS: Collection[] = [
  {
    id: 'c1',
    name: 'Featured Work',
    slug: 'featured-work',
    description: 'A curated selection of my best pieces.',
    pieces: [MOCK_PIECES[0], MOCK_PIECES[8], MOCK_PIECES[9]],
  },
  {
    id: 'c2',
    name: 'Sketches & Studies',
    slug: 'sketches-and-studies',
    description: 'Rough drafts and daily practice sketches.',
    pieces: [MOCK_PIECES[4], MOCK_PIECES[6]],
  },
];
