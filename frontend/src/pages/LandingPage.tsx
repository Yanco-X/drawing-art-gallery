import React from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import ArtworkCard from '../components/ArtworkCard';
import Footer from '../components/Footer';

const MOCK_ARTWORKS = [
  { id: 1, title: 'Fluidity in Motion', artist: 'Elena Rostova', imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?q=80&w=800&auto=format&fit=crop' },
  { id: 2, title: 'Eclipse Echoes', artist: 'Elena Rostova', imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800&auto=format&fit=crop' },
  { id: 3, title: 'Morning Mist', artist: 'David Chen', imageUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c02614d?q=80&w=800&auto=format&fit=crop' },
  { id: 4, title: 'Wisdom Etched', artist: 'Sarah Jenkins', imageUrl: 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=80&w=800&auto=format&fit=crop' },
  { id: 5, title: 'Structural Serenity', artist: 'Marcus Vane', imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800&auto=format&fit=crop' },
  { id: 6, title: 'Chromatic Burst', artist: 'Aria Vance', imageUrl: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=800&auto=format&fit=crop' },
];

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center">
        <HeroSection />
        
        {/* Gallery Grid */}
        <section className="w-full max-w-7xl px-8 md:px-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {MOCK_ARTWORKS.map((art) => (
            <ArtworkCard 
              key={art.id}
              title={art.title}
              artist={art.artist}
              imageUrl={art.imageUrl}
            />
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
