/** The gutter has to live on the wrapper: a mask paints across padding, so
    padding on the stroke itself would not inset it. The negative top margin
    keeps the rule inside the gap two sections already leave. */
export const SectionRule = ({ className = '' }: { className?: string }) => (
  <div className="mx-auto -mt-rule-gap mb-rule-gap w-full max-w-content px-gutter">
    <div
      aria-hidden="true"
      className={`pencil-stroke h-1.5 opacity-70 ${className}`}
    />
  </div>
);
