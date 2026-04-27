import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-12 px-8 mt-24 border-t border-surface-container flex flex-col md:flex-row justify-between items-center text-sm text-on-surface-variant">
      <div className="mb-4 md:mb-0">
        &copy; {new Date().getFullYear()} SketchyArt Gallery. All rights reserved.
      </div>
      <ul className="flex space-x-6">
        <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
        <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
        <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
        <li><a href="#" className="hover:text-primary transition-colors">Instagram</a></li>
        <li><a href="#" className="hover:text-primary transition-colors">Twitter</a></li>
      </ul>
    </footer>
  );
};

export default Footer;
