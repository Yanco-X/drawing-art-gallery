import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SITE_OWNER } from '../lib/siteOwner';
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
        : 'Visits are counted with a random ID, and stay on this site.'}{' '}
      <button
        type="button"
        onClick={toggle}
        className={`${SUBTLE_ACTION} underline underline-offset-2`}
      >
        {off ? 'Count mine' : "Don't count mine"}
      </button>{' '}
      ·{' '}
      <Link to="/privacy" className={`${SUBTLE_ACTION} underline underline-offset-2`}>
        Privacy
      </Link>
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
          YanCurations — Curations made by Yanco
        </span>
        <span className="text-[12px] text-faint">
          <CountingNotice />
        </span>
      </div>
      <span className="text-[12px] text-faint" onClick={onMark}>
        © 2026 {SITE_OWNER.legalName}
      </span>
    </div>
  </footer>
);
