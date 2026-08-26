import { Link } from 'react-router-dom';
import { MOCK_PIECES } from '../../../src/lib/mock-data';

const Header = () => (
  <header className="sticky top-0 z-10 bg-surface/90 backdrop-blur-md border-b border-surface-container-high px-8 py-4 flex items-center justify-between">
    <div className="flex items-center space-x-8">
      <h1 className="text-xl font-medium tracking-wide">SketchyArt</h1>
      <nav className="hidden md:flex space-x-6">
        <Link to="/" className="text-on-surface font-medium border-b-2 border-on-surface py-1">All Works</Link>
        <Link to="/collections" className="text-on-surface-variant hover:text-on-surface py-1 transition-colors">Collections</Link>
        <Link to="/about" className="text-on-surface-variant hover:text-on-surface py-1 transition-colors">About Me</Link>
      </nav>
    </div>
    <div className="flex items-center space-x-4">
      <div className="relative max-w-md w-full hidden sm:block">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search pieces..."
          className="w-full bg-surface-container border border-outline-variant rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-on-surface focus:ring-1 focus:ring-on-surface transition-colors placeholder:text-on-surface-variant"
        />
      </div>
      <button className="flex items-center space-x-2 bg-primary text-on-primary hover:bg-primary-container px-4 py-2 rounded-full font-medium text-sm transition-colors cursor-pointer shrink-0">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="hidden sm:inline">New Piece</span>
      </button>
    </div>
  </header>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      <Header />

      <main className="flex-1 w-full px-8 py-8 md:px-12 md:py-12">
        {/* Content Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif italic text-white leading-none mb-4">All Works</h1>
          </div>
          <div className="flex items-center space-x-3">
            {/* Filter by Tag */}
            <div className="relative">
              <select className="bg-surface-container border border-outline-variant text-on-surface rounded-lg pl-4 pr-10 py-2 text-sm focus:outline-none focus:border-on-surface transition-colors appearance-none cursor-pointer">
                <option>All Tags</option>
                <option>Charcoal</option>
                <option>Digital</option>
                <option>Sketch</option>
                <option>Portrait</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-on-surface-variant">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Sort by */}
            <div className="relative">
              <select className="bg-surface-container border border-outline-variant text-on-surface rounded-lg pl-4 pr-10 py-2 text-sm focus:outline-none focus:border-on-surface transition-colors appearance-none cursor-pointer">
                <option>Newest First</option>
                <option>Oldest First</option>
                <option>A-Z</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-on-surface-variant">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* All Pieces Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {MOCK_PIECES.map((piece) => (
            <Link
              key={piece.id}
              to={`/piece/${piece.id}`}
              className="group block aspect-square bg-surface-container-low rounded-xl overflow-hidden border border-surface-container hover:border-outline transition-colors relative"
            >
              <img
                src={piece.imageUrl}
                alt={piece.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              {/* Overlay for metadata on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-surface/90 via-surface/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <h3 className="text-on-surface font-medium truncate text-sm">{piece.title}</h3>
                <p className="text-xs text-on-surface-variant mt-1">{piece.createdDate}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
