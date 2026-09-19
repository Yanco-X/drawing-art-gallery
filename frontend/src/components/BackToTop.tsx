import { useEffect, useState } from 'react';
import { ChevronDownIcon } from './icons';

const pastFirstScreen = () => window.scrollY > window.innerHeight;

// Sticky, not fixed: at the bottom it rests above the footer, whose last line
// is the keyhole's trigger, instead of covering it.
export const BackToTop = () => {
  const [shown, setShown] = useState(pastFirstScreen);

  useEffect(() => {
    const onScroll = () => setShown(pastFirstScreen());
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toTop = () => {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' });
  };

  return (
    <div className="sticky bottom-4 z-[4] h-0">
      <button
        type="button"
        onClick={toTop}
        aria-label="Back to top"
        title="Back to top"
        className={`absolute right-gutter bottom-0 flex size-11 cursor-pointer items-center justify-center border border-line bg-bg-translucent text-muted backdrop-blur-[12px] transition-[opacity,translate,visibility,color,border-color] duration-300 ease-reflow hover:border-accent hover:text-accent active:border-accent active:text-accent motion-reduce:transition-none ${
          shown ? '' : 'invisible translate-y-2 opacity-0'
        }`}
      >
        <span className="flex rotate-180">
          <ChevronDownIcon />
        </span>
      </button>
    </div>
  );
};
