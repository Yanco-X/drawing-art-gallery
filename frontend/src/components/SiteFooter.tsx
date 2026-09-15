import { useState } from 'react';
import { countingOff, setCountingOff } from '../lib/visitorId';
import { SUBTLE_ACTION } from './form-styles';

const CountingNotice = () => {
  const [off, setOff] = useState(countingOff);

  const toggle = () => {
    setCountingOff(!off);
    setOff(countingOff());
  };

  return (
    <>
      {off
        ? 'Your visits are not counted.'
        : 'Anonymous visits are counted, and stay on this site.'}{' '}
      <button
        type="button"
        onClick={toggle}
        className={`${SUBTLE_ACTION} underline underline-offset-2`}
      >
        {off ? 'Count mine' : "Don't count mine"}
      </button>
    </>
  );
};

/*
 * Unselectable as a whole rather than one span of it: a single element styled
 * unlike everything around it is a tell.
 */
export const SiteFooter = ({ onMark }: { onMark?: () => void }) => (
  <footer className="mt-auto touch-manipulation border-t border-line select-none">
    <div className="mx-auto flex w-full max-w-content flex-wrap items-center justify-between gap-4 px-gutter py-7">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
        <span className="text-[12px] uppercase tracking-btn text-faint">
          SketchyArt Gallery — the silent curator
        </span>
        <span className="text-[12px] text-faint">
          <CountingNotice />
        </span>
      </div>
      <span className="text-[12px] text-faint" onClick={onMark}>
        © 2026
      </span>
    </div>
  </footer>
);
