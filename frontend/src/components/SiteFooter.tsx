/*
 * The footer is unselectable as a whole rather than one span of it. A
 * single element styled unlike everything around it is a tell, and the
 * mark that carries the trigger should not be the only thing here that
 * behaves oddly under a rapid click.
 */
export const SiteFooter = ({ onMark }: { onMark?: () => void }) => (
  <footer className="mt-auto touch-manipulation border-t border-line select-none">
    <div className="mx-auto flex w-full max-w-content flex-wrap items-center justify-between gap-4 px-gutter py-7">
      <span className="text-[12px] uppercase tracking-btn text-faint">
        SketchyArt Gallery — the silent curator
      </span>
      <span className="text-[12px] text-faint" onClick={onMark}>
        © 2026
      </span>
    </div>
  </footer>
);
