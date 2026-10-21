export const StatTile = ({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) => (
  <div className="flex flex-col gap-1.5 border-t border-line pt-4">
    <p className="text-[12px] uppercase tracking-eyebrow text-faint">{label}</p>
    <p className="font-sans text-[32px] leading-none font-semibold text-text">
      {value}
    </p>
    <p className="text-[12px] text-muted">{note}</p>
  </div>
);
