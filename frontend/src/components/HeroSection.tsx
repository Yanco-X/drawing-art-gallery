import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <section className="flex flex-col items-center justify-center pt-24 pb-16 px-8 text-center">
      <span className="text-sm font-semibold tracking-widest text-on-surface-variant uppercase mb-4">
        Featured
      </span>
      <h1 className="text-5xl md:text-7xl font-bold text-primary tracking-tight mb-6">
        Curated Visions
      </h1>
      <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-12">
        A minimalist space to explore structural serenity, chromatic bursts, and fluidity in motion. 
      </p>
    </section>
  );
};

export default HeroSection;
