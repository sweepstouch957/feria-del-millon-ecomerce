export const SectionCard: React.FC<
  React.PropsWithChildren<{ title: string; icon?: React.ReactNode }>
> = ({ title, icon, children }) => (
  <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center gap-2">
      {icon}
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    {children}
  </div>
);