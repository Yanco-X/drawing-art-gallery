import React from 'react';

interface ArtworkCardProps {
  title: string;
  artist: string;
  imageUrl: string;
}

const ArtworkCard: React.FC<ArtworkCardProps> = ({ title, artist, imageUrl }) => {
  return (
    <div className="group cursor-pointer rounded-lg overflow-hidden bg-surface-container transition-all duration-300 hover:bg-surface-container-high hover:shadow-[0_0_20px_rgba(202,198,187,0.05)]">
      <div className="aspect-[4/5] w-full overflow-hidden bg-surface-container-highest">
        {/* Placeholder for the image. We'll replace with real img tags later */}
        <div 
          className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      </div>
      <div className="p-4 md:p-6 flex flex-col items-start">
        <h3 className="text-lg font-semibold text-primary mb-1">{title}</h3>
        <p className="text-sm text-on-surface-variant">{artist}</p>
      </div>
    </div>
  );
};

export default ArtworkCard;
