import React from 'react';

const Navbar: React.FC = () => {
  return (
    <nav className="w-full flex justify-between items-center py-6 px-8 md:px-16 border-b border-surface-container">
      <div className="text-xl font-bold tracking-tight text-primary">
        SketchyArt Gallery
      </div>
      <ul className="hidden md:flex space-x-8 text-on-surface-variant text-sm font-semibold tracking-wide">
        <li><a href="#" className="hover:text-primary transition-colors">Gallery</a></li>
        <li><a href="#" className="hover:text-primary transition-colors">Collections</a></li>
        <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
      </ul>
      <div className="md:hidden">
        {/* Mobile menu icon can go here */}
        <span className="text-on-surface-variant">Menu</span>
      </div>
    </nav>
  );
};

export default Navbar;
